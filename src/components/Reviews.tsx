import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Loader2,
  MessageSquareText,
  PenLine,
  Star,
  X,
} from "lucide-react";
import { listApprovedReviews, submitReview, type PublicReview } from "@/lib/hub.functions";

export const reviewsQueryKey = ["approved-reviews"] as const;

type Fields = { full_name: string; email: string; rating: number; review: string };
const EMPTY: Fields = { full_name: "", email: "", rating: 0, review: "" };

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

const inputClass =
  "w-full rounded-xl border border-input bg-background/60 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/40";

function validate(v: Fields) {
  const errors: Partial<Record<keyof Fields, string | undefined>> = {};
  if (v.full_name.trim().length < 2) errors.full_name = "Please enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim()))
    errors.email = "Enter a valid email address.";
  if (v.rating < 1 || v.rating > 5) errors.rating = "Please select a star rating.";
  if (v.review.trim().length < 5) errors.review = "Please write a few words about your experience.";
  return errors;
}

export function Stars({ value, size = "size-4" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${size} ${n <= value ? "fill-accent text-accent" : "text-border"}`}
        />
      ))}
    </span>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ReviewCard({ r }: { r: PublicReview }) {
  return (
    <article className="card-hover flex h-full flex-col rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between gap-3">
        <Stars value={r.rating} />
        <time dateTime={r.created_at} className="text-xs text-muted-foreground">
          {formatDate(r.created_at)}
        </time>
      </div>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90">
        &ldquo;{r.review}&rdquo;
      </p>
      <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
        <span className="bg-brand-gradient flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-primary-foreground">
          {initials(r.full_name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">— {r.full_name}</p>
          <p className="text-xs text-muted-foreground">Verified student review</p>
        </div>
      </div>
    </article>
  );
}

function usePerView() {
  const [perView, setPerView] = useState(3);
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      setPerView(w < 640 ? 1 : w < 1024 ? 2 : 3);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);
  return perView;
}

function ReviewSlider({ reviews }: { reviews: PublicReview[] }) {
  const perView = usePerView();
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(0);
  const startX = useRef<number | null>(null);
  const widthRef = useRef(0);
  const viewportRef = useRef<HTMLDivElement>(null);

  const maxIndex = Math.max(0, reviews.length - perView);
  const safeIndex = Math.min(index, maxIndex);
  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  const go = (dir: number) => setIndex((i) => Math.min(maxIndex, Math.max(0, i + dir)));

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
    widthRef.current = (viewportRef.current?.clientWidth ?? 1) / perView;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (startX.current === null) return;
    setDrag(e.clientX - startX.current);
  }
  function onPointerUp() {
    if (startX.current === null) return;
    const threshold = Math.max(50, widthRef.current * 0.25);
    if (drag <= -threshold) go(1);
    else if (drag >= threshold) go(-1);
    startX.current = null;
    setDrag(0);
  }

  const dragging = startX.current !== null;

  return (
    <div className="mt-12">
      <div
        ref={viewportRef}
        className="overflow-hidden px-1 py-1 select-none"
        style={{ touchAction: "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className={`flex ${dragging ? "" : "transition-transform duration-500 ease-out"}`}
          style={{
            transform: `translate3d(calc(${-safeIndex * (100 / perView)}% + ${drag}px), 0, 0)`,
          }}
        >
          {reviews.map((r) => (
            <div
              key={r.id}
              className="shrink-0 px-2.5"
              style={{ width: `${100 / perView}%` }}
              aria-roledescription="slide"
            >
              <ReviewCard r={r} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={safeIndex === 0}
          aria-label="Previous reviews"
          className="rounded-full border border-border bg-card p-3 text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
        >
          <ChevronLeft className="size-5" />
        </button>
        <span className="text-xs text-muted-foreground">
          {Math.min(safeIndex + perView, reviews.length)} / {reviews.length}
        </span>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={safeIndex >= maxIndex}
          aria-label="Next reviews"
          className="rounded-full border border-border bg-card p-3 text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  );
}

function StarPicker({
  value,
  onChange,
  invalid,
}: {
  value: number;
  onChange: (n: number) => void;
  invalid?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        role="radiogroup"
        aria-label="Star rating"
        aria-invalid={invalid}
        className="flex items-center gap-1"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            onClick={() => onChange(n)}
            className="rounded-md p-1 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Star
              className={`size-8 transition-colors ${
                n <= shown ? "fill-accent text-accent" : "text-border"
              }`}
            />
          </button>
        ))}
      </div>
      <span className="text-sm text-muted-foreground">
        {shown ? `${shown} Star${shown > 1 ? "s" : ""} · ${RATING_LABELS[shown]}` : "Tap to rate"}
      </span>
    </div>
  );
}

function ReviewForm({ onClose }: { onClose: () => void }) {
  const send = useServerFn(submitReview);
  const [values, setValues] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string | undefined>>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState("");

  const set = (key: keyof Fields) => (e: { target: { value: string } }) => {
    setValues((p) => ({ ...p, [key]: e.target.value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setLoading(true);
    try {
      await send({
        data: {
          full_name: values.full_name.trim(),
          email: values.email.trim(),
          rating: values.rating,
          review: values.review.trim(),
        },
      });
      setDone(true);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="animate-rise mx-auto mt-10 max-w-xl rounded-3xl border border-border bg-card p-10 text-center shadow-elegant">
        <Heart className="mx-auto size-14 fill-primary text-primary" />
        <h3 className="mt-5 text-2xl font-bold">Thank you for your feedback! ❤️</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Your review has been received and will appear here once it is approved by The Record Hub
          team.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-7 rounded-full border border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="animate-rise mx-auto mt-10 max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-10"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">Write a Review</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Share your experience to help other students.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close review form"
          className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="review_name" className="mb-2 block text-sm font-medium">
            Full Name *
          </label>
          <input
            id="review_name"
            className={inputClass}
            placeholder="Enter your full name"
            value={values.full_name}
            onChange={set("full_name")}
            aria-invalid={!!errors.full_name}
          />
          {errors.full_name && (
            <p className="mt-1.5 text-xs text-destructive">{errors.full_name}</p>
          )}
        </div>
        <div>
          <label htmlFor="review_email" className="mb-2 block text-sm font-medium">
            Email Address *
          </label>
          <input
            id="review_email"
            type="email"
            className={inputClass}
            placeholder="Enter your email address"
            value={values.email}
            onChange={set("email")}
            aria-invalid={!!errors.email}
          />
          {errors.email && <p className="mt-1.5 text-xs text-destructive">{errors.email}</p>}
        </div>
        <div className="sm:col-span-2">
          <p className="mb-2 block text-sm font-medium">Star Rating *</p>
          <StarPicker
            value={values.rating}
            invalid={!!errors.rating}
            onChange={(n) => {
              setValues((p) => ({ ...p, rating: n }));
              setErrors((p) => ({ ...p, rating: undefined }));
            }}
          />
          {errors.rating && <p className="mt-1.5 text-xs text-destructive">{errors.rating}</p>}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="review_text" className="mb-2 block text-sm font-medium">
            Review / Feedback *
          </label>
          <textarea
            id="review_text"
            rows={5}
            maxLength={1500}
            className={`${inputClass} resize-y`}
            placeholder="Tell us about your experience with The Record Hub..."
            value={values.review}
            onChange={set("review")}
            aria-invalid={!!errors.review}
          />
          {errors.review && <p className="mt-1.5 text-xs text-destructive">{errors.review}</p>}
        </div>
      </div>

      {serverError && (
        <p className="mt-5 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-brand-gradient mt-7 flex w-full items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-primary-foreground shadow-elegant transition-transform hover:scale-[1.01] disabled:opacity-70"
      >
        {loading && <Loader2 className="size-5 animate-spin" />}
        {loading ? "Submitting..." : "Submit Review"}
      </button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Reviews are checked by our team before they are published.
      </p>
    </form>
  );
}

export function Reviews() {
  const fetchReviews = useServerFn(listApprovedReviews);
  const qc = useQueryClient();
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: reviewsQueryKey,
    queryFn: async () => {
      const localReviews = await fetchReviews();
      const url = import.meta.env["VITE_SUPABASE_URL"];
      const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
      if (!url || !key) return localReviews;

      try {
        const endpoint = new URL("/rest/v1/reviews", url);
        endpoint.searchParams.set("select", "id,full_name,rating,review,created_at");
        endpoint.searchParams.set("status", "eq.approved");
        endpoint.searchParams.set("order", "created_at.desc");
        endpoint.searchParams.set("limit", "500");
        const response = await fetch(endpoint, { headers: { apikey: key } });
        if (!response.ok) return localReviews;
        const data = (await response.json()) as PublicReview[];

        const reviewsById = new Map<string, PublicReview>();
        for (const review of data) reviewsById.set(review.id, review);
        for (const review of localReviews) reviewsById.set(review.id, review);
        return [...reviewsById.values()]
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
          .slice(0, 500);
      } catch {
        return localReviews;
      }
    },
    staleTime: 60_000,
  });
  const [writing, setWriting] = useState(false);

  const count = reviews.length;
  const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;

  return (
    <section id="reviews" className="border-t border-border py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">Customer Reviews</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          Real feedback from students who trusted The Record Hub.
        </p>

        {count > 0 && (
          <div className="mx-auto mt-8 flex max-w-md flex-col items-center gap-3 rounded-2xl border border-border bg-card/60 px-6 py-5 text-center sm:flex-row sm:justify-center sm:gap-5 sm:text-left">
            <span className="font-display text-5xl font-extrabold text-accent">
              {average.toFixed(1)}
            </span>
            <div>
              <Stars value={Math.round(average)} size="size-5" />
              <p className="mt-1 text-sm text-muted-foreground">
                {count} Review{count > 1 ? "s" : ""} from students
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-52 animate-pulse rounded-2xl border border-border bg-card/60"
              />
            ))}
          </div>
        ) : count === 0 ? (
          <div className="mx-auto mt-12 max-w-xl rounded-3xl border border-dashed border-border bg-card/40 p-10 text-center">
            <MessageSquareText className="mx-auto size-10 text-accent" />
            <p className="mt-4 font-semibold">No reviews published yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Used our services? Be the first to share your experience with other students.
            </p>
          </div>
        ) : (
          <ReviewSlider reviews={reviews} />
        )}

        {!writing && (
          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => setWriting(true)}
              className="bg-brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-primary-foreground shadow-elegant transition-transform hover:scale-105"
            >
              <PenLine className="size-5" /> Write a Review
            </button>
          </div>
        )}

        {writing && (
          <ReviewForm
            onClose={() => {
              setWriting(false);
              qc.invalidateQueries({ queryKey: reviewsQueryKey });
            }}
          />
        )}
      </div>
    </section>
  );
}
