import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { submitRequest } from "@/lib/hub.functions";
import { SERVICE_NAMES } from "@/lib/services";

type Fields = {
  full_name: string;
  phone: string;
  college: string;
  email: string;
  service: string;
  message: string;
};

const EMPTY: Fields = {
  full_name: "",
  phone: "",
  college: "",
  email: "",
  service: "",
  message: "",
};

function validate(v: Fields) {
  const errors: Partial<Record<keyof Fields, string>> = {};
  if (v.full_name.trim().length < 2) errors.full_name = "Please enter your full name.";
  if (!/^[6-9]\d{9}$/.test(v.phone)) errors.phone = "Enter a valid 10-digit Indian mobile number.";
  if (v.college.trim().length < 2) errors.college = "Please enter your college name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim()))
    errors.email = "Enter a valid email address.";
  if (!v.service) errors.service = "Please select a service.";
  return errors;
}

const inputClass =
  "w-full rounded-xl border border-input bg-background/60 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/40";

export function RequestForm() {
  const send = useServerFn(submitRequest);
  const [values, setValues] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState("");

  const set = (key: keyof Fields) => (e: { target: { value: string } }) => {
    setValues((p) => ({ ...p, [key]: e.target.value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const setPhone = (e: { target: { value: string } }) => {
    const digits = e.target.value.replace(/\D/g, "");
    const mobile = digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits;
    setValues((p) => ({ ...p, phone: mobile.slice(0, 10) }));
    setErrors((p) => ({ ...p, phone: undefined }));
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
          ...values,
          phone: `+91${values.phone}`,
        },
      });
      setDone(true);
      setValues(EMPTY);
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
      <div className="animate-rise mx-auto max-w-xl rounded-3xl border border-border bg-card p-10 text-center shadow-elegant">
        <CheckCircle2 className="mx-auto size-16 text-accent" />
        <h3 className="mt-5 text-2xl font-bold">Request Submitted Successfully! 🎉</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Thank you for contacting The Record Hub. We have received your request and will contact
          you within 1 hour.
        </p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-7 rounded-full border border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-10"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="full_name" className="mb-2 block text-sm font-medium">
            Full Name *
          </label>
          <input
            id="full_name"
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
          <label htmlFor="phone" className="mb-2 block text-sm font-medium">
            Phone Number *
          </label>
          <div className="flex items-stretch gap-2">
            <span className="flex items-center rounded-xl border border-input bg-secondary px-3 text-sm font-medium">
              +91
            </span>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              maxLength={16}
              className={inputClass}
              placeholder="98765 43210"
              value={values.phone}
              onChange={setPhone}
              aria-invalid={!!errors.phone}
            />
          </div>
          {errors.phone && <p className="mt-1.5 text-xs text-destructive">{errors.phone}</p>}
        </div>

        <div>
          <label htmlFor="college" className="mb-2 block text-sm font-medium">
            College Name *
          </label>
          <input
            id="college"
            className={inputClass}
            placeholder="Enter your college name"
            value={values.college}
            onChange={set("college")}
            aria-invalid={!!errors.college}
          />
          {errors.college && <p className="mt-1.5 text-xs text-destructive">{errors.college}</p>}
        </div>

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium">
            Email Address *
          </label>
          <input
            id="email"
            type="email"
            className={inputClass}
            placeholder="Enter your Gmail address"
            value={values.email}
            onChange={set("email")}
            aria-invalid={!!errors.email}
          />
          {errors.email && <p className="mt-1.5 text-xs text-destructive">{errors.email}</p>}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="service" className="mb-2 block text-sm font-medium">
            Select the Service You Need *
          </label>
          <div className="relative">
            <select
              id="service"
              className={`${inputClass} appearance-none pr-11`}
              value={values.service}
              onChange={set("service")}
              aria-invalid={!!errors.service}
            >
              <option value="">Choose a service...</option>
              {SERVICE_NAMES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-accent" />
          </div>
          {errors.service && <p className="mt-1.5 text-xs text-destructive">{errors.service}</p>}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="message" className="mb-2 block text-sm font-medium">
            Additional Requirements / Message
          </label>
          <textarea
            id="message"
            rows={5}
            className={`${inputClass} resize-y`}
            placeholder="Tell us what you need..."
            value={values.message}
            onChange={set("message")}
          />
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
        {loading ? "Submitting..." : "Submit Request"}
      </button>
    </form>
  );
}
