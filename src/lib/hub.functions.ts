import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { SERVICE_NAMES } from "./services";

const requestSchema = z.object({
  full_name: z.string().trim().min(2, "Please enter your full name").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  college: z.string().trim().min(2, "Please enter your college name").max(150),
  email: z.string().trim().email("Enter a valid email address").max(255),
  service: z.enum(SERVICE_NAMES as unknown as [string, ...string[]]),
  message: z.string().trim().max(1500).optional().default(""),
});

export type RequestInput = z.input<typeof requestSchema>;

const isProduction = () => import.meta.env.PROD;
const usesLocalStore = () => !isProduction() && !process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim();
const localSessionSecret = randomBytes(32).toString("base64url");

function sessionConfig() {
  const secret =
    process.env["SESSION_SECRET"] || (!isProduction() ? localSessionSecret : undefined);
  if (!secret) throw new Error("Admin session is not configured. Set SESSION_SECRET in .env.");

  return {
    password: secret,
    name: "trh-admin",
    maxAge: 60 * 60 * 8,
    cookie: {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

type AdminSession = { admin?: boolean };

function adminCredentials() {
  const username = process.env["ADMIN_USERNAME"];
  const password = process.env["ADMIN_PASSWORD"];
  if (!username || !password)
    throw new Error("Admin credentials are not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD.");
  return { username, password };
}

function matches(input: string, expected: string) {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export const submitRequest = createServerFn({ method: "POST" })
  .inputValidator((data: RequestInput) => requestSchema.parse(data))
  .handler(async ({ data }) => {
    const phone = data.phone.startsWith("+91") ? data.phone : `+91${data.phone.replace(/\D/g, "")}`;
    let id: string;
    let createdAt: string;

    if (usesLocalStore()) {
      const { createLocalRequest } = await import("./local-store.server");
      const row = await createLocalRequest({
        full_name: data.full_name,
        phone,
        college: data.college,
        email: data.email,
        service: data.service,
        message: data.message || null,
      });
      id = row.id;
      createdAt = row.created_at;
    } else {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: row, error } = await supabaseAdmin
        .from("service_requests")
        .insert({
          full_name: data.full_name,
          phone,
          college: data.college,
          email: data.email,
          service: data.service,
          message: data.message || null,
        })
        .select("id, created_at")
        .single();

      if (error) {
        console.error("submitRequest insert failed", error.message);
        throw new Error("We couldn't save your request. Please try again.");
      }
      id = row.id;
      createdAt = row.created_at;
    }

    // Only after the request is safely stored do we notify the owner.
    const { notifyOwner, sendCustomerConfirmation, formatIndiaTime } =
      await import("./notify.server");
    const when = formatIndiaTime(new Date(createdAt));
    await notifyOwner(
      "service_request",
      "🔔 NEW SERVICE REQUEST — THE RECORD HUB",
      [
        ["👤 Name", data.full_name],
        ["📱 Phone", phone],
        ["🎓 College", data.college],
        ["📧 Email", data.email],
        ["🛠️ Service", data.service],
        ["📝 Requirements", data.message || "—"],
        ["⏰ Date & Time", when],
      ],
      {
        subject: "🔔 New Service Request — The Record Hub",
        intro:
          "Someone has submitted a new request. Please contact the customer as soon as possible.",
      },
    );
    await sendCustomerConfirmation(data.email, "We received your request – The Record Hub", [
      ["Hi", data.full_name],
      ["Service", data.service],
      ["Status", "Received — we will contact you within 1 hour."],
      ["Submitted", when],
    ]);

    return { ok: true as const, id };
  });

/* ------------------------------------------------------------------ */
/* Reviews                                                             */
/* ------------------------------------------------------------------ */

const reviewSchema = z.object({
  full_name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  rating: z.number().int().min(1, "Please select a star rating").max(5),
  review: z.string().trim().min(5, "Please write your review").max(1500),
});

export type ReviewInput = z.input<typeof reviewSchema>;

export type PublicReview = {
  id: string;
  full_name: string;
  rating: number;
  review: string;
  created_at: string;
};

export const listApprovedReviews = createServerFn({ method: "GET" }).handler(async () => {
  let localReviews: PublicReview[] = [];
  if (usesLocalStore()) {
    const { listLocalApprovedReviews } = await import("./local-store.server");
    localReviews = (await listLocalApprovedReviews()) as PublicReview[];
  }
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] || import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  const url = process.env["SUPABASE_URL"] || import.meta.env["VITE_SUPABASE_URL"];
  if (!key || !url) return localReviews;

  const endpoint = new URL("/rest/v1/reviews", url);
  endpoint.searchParams.set("select", "id,full_name,rating,review,created_at");
  endpoint.searchParams.set("status", "eq.approved");
  endpoint.searchParams.set("order", "created_at.desc");
  endpoint.searchParams.set("limit", "500");

  try {
    const response = await fetch(endpoint, { headers: { apikey: key } });
    if (!response.ok) {
      console.error("listApprovedReviews failed", response.status);
      return localReviews;
    }
    const data = (await response.json()) as PublicReview[];
    const reviewsById = new Map<string, PublicReview>();
    for (const review of data) reviewsById.set(review.id, review);
    for (const review of localReviews) reviewsById.set(review.id, review);
    return [...reviewsById.values()]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 500);
  } catch (error) {
    console.error("listApprovedReviews failed", error);
    return localReviews;
  }
});

export const submitReview = createServerFn({ method: "POST" })
  .inputValidator((data: ReviewInput) => reviewSchema.parse(data))
  .handler(async ({ data }) => {
    let id: string;
    let createdAt: string;

    if (usesLocalStore()) {
      const { createLocalReview } = await import("./local-store.server");
      const row = await createLocalReview({
        full_name: data.full_name,
        email: data.email,
        rating: data.rating,
        review: data.review,
      });
      id = row.id;
      createdAt = row.created_at;
    } else {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: row, error } = await supabaseAdmin
        .from("reviews")
        .insert({
          full_name: data.full_name,
          email: data.email,
          rating: data.rating,
          review: data.review,
          status: "pending",
        })
        .select("id, created_at")
        .single();

      if (error) {
        console.error("submitReview insert failed", error.message);
        throw new Error("We couldn't save your review. Please try again.");
      }
      id = row.id;
      createdAt = row.created_at;
    }

    const { notifyOwner, formatIndiaTime } = await import("./notify.server");
    await notifyOwner("review", "🔔 NEW CUSTOMER REVIEW – THE RECORD HUB", [
      ["Customer Name", data.full_name],
      ["Email", data.email],
      [
        "Star Rating",
        `${"★".repeat(data.rating)}${"☆".repeat(5 - data.rating)} (${data.rating}/5)`,
      ],
      ["Review", data.review],
      ["Date & Time", formatIndiaTime(new Date(createdAt))],
      ["Status", "Pending approval — open the admin dashboard to approve or reject."],
    ]);

    return { ok: true as const, id };
  });

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

async function requireAdmin() {
  // eslint-disable-next-line react-hooks/rules-of-hooks -- server-side session helper, not a React hook
  const session = await useSession<AdminSession>(sessionConfig());
  return !!session.data.admin;
}

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: { username: string; password: string }) =>
    z.object({ username: z.string().min(1), password: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { username, password } = adminCredentials();

    if (!matches(data.username, username) || !matches(data.password, password)) {
      return { ok: false as const };
    }
    const session = await useSession<AdminSession>(sessionConfig());
    await session.update({ admin: true });
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<AdminSession>(sessionConfig());
  await session.clear();
  return { ok: true as const };
});

export const listRequests = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await requireAdmin())) return { authed: false as const, requests: [] };
  if (usesLocalStore()) {
    const { listLocalRequests } = await import("./local-store.server");
    return { authed: true as const, requests: await listLocalRequests() };
  }

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("service_requests")
      .select("id, full_name, phone, college, email, service, message, status, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error("listRequests failed", error.message);
      return {
        authed: true as const,
        requests: [],
        error: "Could not load requests. Check Supabase server configuration.",
      };
    }
    return { authed: true as const, requests: data ?? [] };
  } catch (error) {
    console.error("listRequests failed", error);
    return {
      authed: true as const,
      requests: [],
      error: "Add SUPABASE_SERVICE_ROLE_KEY to .env to load requests.",
    };
  }
});

export type AdminReview = {
  id: string;
  full_name: string;
  email: string;
  rating: number;
  review: string;
  status: string;
  created_at: string;
};

export const listAllReviews = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await requireAdmin())) return { authed: false as const, reviews: [] as AdminReview[] };
  if (usesLocalStore()) {
    const { listLocalReviews } = await import("./local-store.server");
    return { authed: true as const, reviews: (await listLocalReviews()) as AdminReview[] };
  }

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("reviews")
      .select("id, full_name, email, rating, review, status, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error("listAllReviews failed", error.message);
      return {
        authed: true as const,
        reviews: [] as AdminReview[],
        error: "Could not load reviews. Check Supabase server configuration.",
      };
    }
    return { authed: true as const, reviews: (data ?? []) as AdminReview[] };
  } catch (error) {
    console.error("listAllReviews failed", error);
    return {
      authed: true as const,
      reviews: [] as AdminReview[],
      error: "Add SUPABASE_SERVICE_ROLE_KEY to .env to load reviews.",
    };
  }
});

export const setReviewStatus = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; status: "approved" | "rejected" | "pending" }) =>
    z
      .object({ id: z.string().uuid(), status: z.enum(["approved", "rejected", "pending"]) })
      .parse(data),
  )
  .handler(async ({ data }) => {
    if (!(await requireAdmin())) throw new Error("Unauthorized");
    if (usesLocalStore()) {
      const { setLocalReviewStatus } = await import("./local-store.server");
      if (!(await setLocalReviewStatus(data.id, data.status))) throw new Error("Review not found.");
      return { ok: true as const };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("reviews")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) {
      console.error("setReviewStatus failed", error.message);
      throw new Error("Could not update review.");
    }
    return { ok: true as const };
  });

export const deleteReview = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    if (!(await requireAdmin())) throw new Error("Unauthorized");
    if (usesLocalStore()) {
      const { deleteLocalReview } = await import("./local-store.server");
      if (!(await deleteLocalReview(data.id))) throw new Error("Review not found.");
      return { ok: true as const };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("reviews").delete().eq("id", data.id);
    if (error) {
      console.error("deleteReview failed", error.message);
      throw new Error("Could not delete review.");
    }
    return { ok: true as const };
  });

export type NotificationLog = {
  id: string;
  kind: string;
  subject: string;
  body: string;
  channels: {
    whatsapp?: { status: string; detail?: string };
    email?: { status: string; detail?: string };
  };
  created_at: string;
};

export const listNotifications = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await requireAdmin()))
    return { authed: false as const, notifications: [] as NotificationLog[] };
  if (usesLocalStore()) {
    const { listLocalNotifications } = await import("./local-store.server");
    return {
      authed: true as const,
      notifications: (await listLocalNotifications()) as NotificationLog[],
    };
  }

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("owner_notifications")
      .select("id, kind, subject, body, channels, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("listNotifications failed", error.message);
      return {
        authed: true as const,
        notifications: [] as NotificationLog[],
        error: "Could not load notifications. Check Supabase server configuration.",
      };
    }
    return { authed: true as const, notifications: (data ?? []) as NotificationLog[] };
  } catch (error) {
    console.error("listNotifications failed", error);
    return {
      authed: true as const,
      notifications: [] as NotificationLog[],
      error: "Add SUPABASE_SERVICE_ROLE_KEY to .env to load notifications.",
    };
  }
});
