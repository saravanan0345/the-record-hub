import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type LocalRequest = {
  id: string;
  full_name: string;
  phone: string;
  college: string;
  email: string;
  service: string;
  message: string | null;
  status: string;
  created_at: string;
};

export type LocalReview = {
  id: string;
  full_name: string;
  email: string;
  rating: number;
  review: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
};

export type LocalNotification = {
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

type LocalStore = {
  requests: LocalRequest[];
  reviews: LocalReview[];
  notifications: LocalNotification[];
};

const storePath = join(process.cwd(), ".local-data", "record-hub.json");
let writeQueue: Promise<void> = Promise.resolve();

export function usesLocalStore() {
  return (
    process.env["NODE_ENV"] !== "production" && !process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim()
  );
}

async function readStore(): Promise<LocalStore> {
  await mkdir(dirname(storePath), { recursive: true });
  try {
    return JSON.parse(await readFile(storePath, "utf8")) as LocalStore;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return { requests: [], reviews: [], notifications: [] };
    }
    throw error;
  }
}

function mutateStore<T>(mutate: (store: LocalStore) => T): Promise<T> {
  const operation = writeQueue.then(async () => {
    const store = await readStore();
    const result = mutate(store);
    const temporaryPath = `${storePath}.${randomUUID()}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(store, null, 2), "utf8");
    await rename(temporaryPath, storePath);
    return result;
  });
  writeQueue = operation.then(
    () => undefined,
    () => undefined,
  );
  return operation;
}

export async function listLocalRequests() {
  return (await readStore()).requests.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function createLocalRequest(input: Omit<LocalRequest, "id" | "status" | "created_at">) {
  return mutateStore((store) => {
    const request: LocalRequest = {
      ...input,
      id: randomUUID(),
      status: "new",
      created_at: new Date().toISOString(),
    };
    store.requests.unshift(request);
    return request;
  });
}

export async function listLocalApprovedReviews() {
  return (await readStore()).reviews
    .filter((review) => review.status === "approved")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(({ id, full_name, rating, review, created_at }) => ({
      id,
      full_name,
      rating,
      review,
      created_at,
    }));
}

export async function listLocalReviews() {
  return (await readStore()).reviews.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function createLocalReview(
  input: Omit<LocalReview, "id" | "status" | "created_at" | "updated_at">,
) {
  return mutateStore((store) => {
    const createdAt = new Date().toISOString();
    const review: LocalReview = {
      ...input,
      id: randomUUID(),
      status: "pending",
      created_at: createdAt,
      updated_at: createdAt,
    };
    store.reviews.unshift(review);
    return review;
  });
}

export function setLocalReviewStatus(id: string, status: LocalReview["status"]) {
  return mutateStore((store) => {
    const review = store.reviews.find((item) => item.id === id);
    if (!review) return false;
    review.status = status;
    review.updated_at = new Date().toISOString();
    return true;
  });
}

export function deleteLocalReview(id: string) {
  return mutateStore((store) => {
    const initialLength = store.reviews.length;
    store.reviews = store.reviews.filter((review) => review.id !== id);
    return store.reviews.length !== initialLength;
  });
}

export async function listLocalNotifications() {
  return (await readStore()).notifications
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 200);
}

export function createLocalNotification(input: Omit<LocalNotification, "id" | "created_at">) {
  return mutateStore((store) => {
    const notification: LocalNotification = {
      ...input,
      id: randomUUID(),
      created_at: new Date().toISOString(),
    };
    store.notifications.unshift(notification);
    return notification;
  });
}
