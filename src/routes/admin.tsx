import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Bell,
  Check,
  Inbox,
  Loader2,
  LogOut,
  MessageCircle,
  RefreshCw,
  Star,
  Trash2,
  X,
} from "lucide-react";
import {
  adminLogin,
  adminLogout,
  deleteReview,
  listAllReviews,
  listNotifications,
  listRequests,
  setReviewStatus,
  type AdminReview,
  type NotificationLog,
} from "@/lib/hub.functions";
import { OWNER } from "@/lib/services";
import logo from "@/assets/record-hub-logo.png";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard | The Record Hub" },
      { name: "description", content: "Private admin dashboard for The Record Hub requests." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Admin Dashboard | The Record Hub" },
      { property: "og:description", content: "Private admin dashboard for The Record Hub." },
    ],
  }),
  component: AdminPage,
});

const inputClass =
  "w-full rounded-xl border border-input bg-background/60 px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/40";

function AdminPage() {
  const fetchRequests = useServerFn(listRequests);
  const fetchReviews = useServerFn(listAllReviews);
  const login = useServerFn(adminLogin);
  const logout = useServerFn(adminLogout);
  const qc = useQueryClient();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"requests" | "reviews" | "notifications">("requests");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "requests"],
    queryFn: () => fetchRequests(),
  });
  const { data: reviewData } = useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: () => fetchReviews(),
    enabled: !!data?.authed,
  });
  const pendingCount = (reviewData?.reviews ?? []).filter((r) => r.status === "pending").length;

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await login({ data: { username, password } });
      if (!res.ok) setError("Invalid username or password.");
      else await qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data?.authed) {
    return (
      <div className="surface-glow flex min-h-screen items-center justify-center px-4">
        <form
          onSubmit={onLogin}
          className="w-full max-w-sm rounded-3xl border border-border bg-card p-8 shadow-elegant"
        >
          <img src={logo} alt="" className="mx-auto h-16 w-16 object-contain" />
          <h1 className="mt-5 text-center text-xl font-bold">Admin Login</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">The Record Hub</p>
          <div className="mt-7 space-y-4">
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-medium">
                Username
              </label>
              <input
                id="username"
                className={inputClass}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>
          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="bg-brand-gradient mt-6 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-70"
          >
            {busy && <Loader2 className="size-4 animate-spin" />} Sign In
          </button>
        </form>
      </div>
    );
  }

  const requests = data.requests;
  const requestError = "error" in data ? data.error : undefined;

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">The Record Hub</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => qc.invalidateQueries({ queryKey: ["admin"] })}
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button
              type="button"
              onClick={async () => {
                await logout();
                await qc.invalidateQueries({ queryKey: ["admin"] });
              }}
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              <LogOut className="size-4" /> Logout
            </button>
          </div>
        </header>

        <nav className="mt-8 flex flex-wrap gap-2" aria-label="Dashboard sections">
          {(
            [
              { id: "requests", label: "Service Requests", icon: Inbox, count: requests.length },
              { id: "reviews", label: "Reviews Management", icon: Star, count: pendingCount },
              { id: "notifications", label: "Notification Log", icon: Bell },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <t.icon className="size-4" /> {t.label}
              {"count" in t && t.count !== undefined && t.count > 0 && (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        {tab === "requests" && <RequestsPanel requests={requests} error={requestError} />}
        {tab === "reviews" && <ReviewsPanel />}
        {tab === "notifications" && <NotificationsPanel />}
      </div>
    </div>
  );
}

type RequestRow = Awaited<ReturnType<typeof listRequests>>["requests"][number];

function RequestsPanel({ requests, error }: { requests: RequestRow[]; error?: string }) {
  return (
    <>
      <p className="mt-6 text-sm text-muted-foreground">{requests.length} total requests</p>
      {error ? (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {error}
        </p>
      ) : requests.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">No requests yet.</p>
      ) : (
        <div className="mt-4 grid gap-4">
          {requests.map((r) => (
            <article key={r.id} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{r.full_name}</h2>
                  <p className="text-sm text-muted-foreground">{r.college}</p>
                </div>
                <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                  {r.service}
                </span>
              </div>
              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd>
                    <a href={`tel:${r.phone}`} className="hover:text-accent">
                      {r.phone}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd>
                    <a href={`mailto:${r.email}`} className="hover:text-accent">
                      {r.email}
                    </a>
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Requirements</dt>
                  <dd className="whitespace-pre-wrap">{r.message || "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Submitted</dt>
                  <dd>{new Date(r.created_at).toLocaleString("en-IN")}</dd>
                </div>
              </dl>
              <a
                href={`https://wa.me/${r.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Hi ${r.full_name}, this is ${OWNER.name} from The Record Hub regarding your ${r.service} request.`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-black"
              >
                <MessageCircle className="size-4" /> WhatsApp student
              </a>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

const STATUS_STYLES: Record<string, string> = {
  pending: "border-accent/40 bg-accent/10 text-accent",
  approved: "border-primary/40 bg-primary/10 text-primary",
  rejected: "border-border bg-secondary text-muted-foreground",
};

function ReviewsPanel() {
  const fetchReviews = useServerFn(listAllReviews);
  const updateStatus = useServerFn(setReviewStatus);
  const remove = useServerFn(deleteReview);
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: () => fetchReviews(),
  });

  const error = data && "error" in data ? data.error : undefined;
  const reviews: AdminReview[] = data?.reviews ?? [];
  const shown = filter === "all" ? reviews : reviews.filter((r) => r.status === filter);
  const counts = {
    pending: reviews.filter((r) => r.status === "pending").length,
    approved: reviews.filter((r) => r.status === "approved").length,
    rejected: reviews.filter((r) => r.status === "rejected").length,
    all: reviews.length,
  };

  async function act(id: string, fn: () => Promise<unknown>) {
    setBusyId(id);
    try {
      await fn();
      await qc.invalidateQueries({ queryKey: ["admin"] });
      await qc.invalidateQueries({ queryKey: ["approved-reviews"] });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
              filter === f
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="mt-16 flex justify-center">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {error}
        </p>
      ) : shown.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">
          {filter === "pending" ? "No reviews waiting for approval." : "No reviews here."}
        </p>
      ) : (
        <div className="mt-4 grid gap-4">
          {shown.map((r) => {
            const busy = busyId === r.id;
            return (
              <article key={r.id} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{r.full_name}</h2>
                    <a
                      href={`mailto:${r.email}`}
                      className="text-sm text-muted-foreground hover:text-accent"
                    >
                      {r.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex items-center gap-0.5"
                      aria-label={`${r.rating} out of 5 stars`}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`size-4 ${n <= r.rating ? "fill-accent text-accent" : "text-border"}`}
                        />
                      ))}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[r.status] ?? ""}`}
                    >
                      {r.status}
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap">{r.review}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Submitted {new Date(r.created_at).toLocaleString("en-IN")}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {r.status !== "approved" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        act(r.id, () => updateStatus({ data: { id: r.id, status: "approved" } }))
                      }
                      className="bg-brand-gradient inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                    >
                      <Check className="size-4" /> Approve
                    </button>
                  )}
                  {r.status !== "rejected" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        act(r.id, () => updateStatus({ data: { id: r.id, status: "rejected" } }))
                      }
                      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
                    >
                      <X className="size-4" /> Reject
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm("Delete this review permanently?"))
                        void act(r.id, () => remove({ data: { id: r.id } }));
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60"
                  >
                    {busy ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}{" "}
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

function ChannelBadge({
  label,
  result,
}: {
  label: string;
  result?: { status: string; detail?: string } | undefined;
}) {
  const status = result?.status ?? "skipped";
  const cls =
    status === "sent"
      ? "border-primary/40 bg-primary/10 text-primary"
      : status === "failed"
        ? "border-destructive/40 bg-destructive/10 text-destructive"
        : "border-border bg-secondary text-muted-foreground";
  return (
    <span
      title={result?.detail}
      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {label}: {status === "skipped" ? "not set up" : status}
    </span>
  );
}

function NotificationsPanel() {
  const fetchNotifications = useServerFn(listNotifications);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: () => fetchNotifications(),
  });
  const error = data && "error" in data ? data.error : undefined;
  const items: NotificationLog[] = data?.notifications ?? [];

  return (
    <>
      <p className="mt-6 text-sm text-muted-foreground">
        Every alert the website tried to send you. WhatsApp and email show &ldquo;not set up&rdquo;
        until their credentials are added.
      </p>
      {isLoading ? (
        <div className="mt-16 flex justify-center">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {error}
        </p>
      ) : items.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">No notifications yet.</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {items.map((n) => (
            <details key={n.id} className="rounded-2xl border border-border bg-card p-5">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3">
                <span className="font-semibold">{n.subject}</span>
                <span className="flex flex-wrap items-center gap-2">
                  <ChannelBadge label="WhatsApp" result={n.channels?.whatsapp} />
                  <ChannelBadge label="Email" result={n.channels?.email} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString("en-IN")}
                  </span>
                </span>
              </summary>
              <pre className="mt-4 font-sans text-sm whitespace-pre-wrap text-muted-foreground">
                {n.body}
              </pre>
            </details>
          ))}
        </div>
      )}
    </>
  );
}
