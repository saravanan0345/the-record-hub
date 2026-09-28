/**
 * Owner notification dispatcher (server-only).
 *
 * Channels are enabled purely through environment variables — nothing here is
 * ever shipped to the browser.
 *
 *  WhatsApp (Meta WhatsApp Cloud API)
 *    WHATSAPP_ACCESS_TOKEN      – permanent system-user access token
 *    WHATSAPP_PHONE_NUMBER_ID   – the "Phone number ID" of the sending number
 *    OWNER_WHATSAPP             – recipient in international format (already set)
 *
 *  Email (Resend HTTP API)
 *    RESEND_API_KEY             – API key from resend.com
 *    NOTIFY_FROM_EMAIL          – optional verified sender, e.g. "The Record Hub <hello@yourdomain.com>"
 *                                 (defaults to Resend's onboarding sender, which can only
 *                                 deliver to the Resend account owner's own address)
 *    OWNER_EMAIL                – recipient (already set)
 *
 * Every attempt is written to the owner_notifications log so the admin
 * dashboard always shows what happened, even when no channel is configured.
 */

export type NotificationKind = "service_request" | "review";

export type ChannelResult = {
  status: "sent" | "failed" | "skipped";
  detail?: string;
};

export type NotificationResult = {
  whatsapp: ChannelResult;
  email: ChannelResult;
};

const TIMEOUT_MS = 8000;

export function formatIndiaTime(date: Date = new Date()) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildMessage(title: string, fields: Array<[string, string]>, intro?: string) {
  const text = [
    title,
    "",
    ...(intro ? [intro, ""] : []),
    ...fields.map(([k, v]) => `${k}: ${v || "—"}`),
  ].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#111">
  <h2 style="margin:0 0 16px;color:#b91c1c">${escapeHtml(title)}</h2>
  ${intro ? `<p style="margin:0 0 16px">${escapeHtml(intro)}</p>` : ""}
  <table cellpadding="6" style="border-collapse:collapse">
    ${fields
      .map(
        ([k, v]) =>
          `<tr><td style="font-weight:bold;color:#555;vertical-align:top;white-space:nowrap">${escapeHtml(k)}</td><td style="white-space:pre-wrap">${escapeHtml(v || "—")}</td></tr>`,
      )
      .join("")}
  </table>
  <p style="margin-top:20px;color:#888;font-size:12px">The Record Hub — Your Work. Our Support. One Hub.</p>
</div>`;
  return { text, html };
}

async function sendWhatsApp(text: string): Promise<ChannelResult> {
  const token = process.env["WHATSAPP_ACCESS_TOKEN"];
  const phoneId = process.env["WHATSAPP_PHONE_NUMBER_ID"];
  const to = (process.env["OWNER_WHATSAPP"] ?? "").replace(/\D/g, "");
  if (!token || !phoneId || !to) {
    return {
      status: "skipped",
      detail: "WhatsApp not configured (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID).",
    };
  }
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text.slice(0, 4000) },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("WhatsApp send failed", res.status, body.slice(0, 300));
      return { status: "failed", detail: `WhatsApp API responded ${res.status}` };
    }
    return { status: "sent" };
  } catch (err) {
    console.error("WhatsApp send error", err);
    return { status: "failed", detail: "WhatsApp request error" };
  }
}

async function sendEmail(
  to: string | undefined,
  subject: string,
  text: string,
  html: string,
): Promise<ChannelResult> {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey || !to) {
    return { status: "skipped", detail: "Set RESEND_API_KEY to enable email notifications." };
  }
  const from = process.env["NOTIFY_FROM_EMAIL"] || "The Record Hub <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, text, html }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("Email send failed", res.status, body.slice(0, 300));
      return { status: "failed", detail: `Email API responded ${res.status}` };
    }
    return { status: "sent" };
  } catch (err) {
    console.error("Email send error", err);
    return { status: "failed", detail: "Email request error" };
  }
}

/**
 * Notify the owner on every configured channel and log the outcome.
 * Never throws — a notification problem must not fail the customer's submission.
 */
export async function notifyOwner(
  kind: NotificationKind,
  title: string,
  fields: Array<[string, string]>,
  options: { subject?: string; intro?: string } = {},
): Promise<NotificationResult> {
  const { text, html } = buildMessage(title, fields, options.intro);
  const ownerEmail = process.env["OWNER_EMAIL"] || "therecordhub00716@gmail.com";
  const subject = options.subject || title;

  const [whatsapp, email] = await Promise.all([
    sendWhatsApp(text),
    sendEmail(ownerEmail, subject, text, html),
  ]);
  const result: NotificationResult = { whatsapp, email };

  try {
    const { usesLocalStore } = await import("./local-store.server");
    if (usesLocalStore()) {
      const { createLocalNotification } = await import("./local-store.server");
      await createLocalNotification({ kind, subject: title, body: text, channels: result });
    } else {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("owner_notifications")
        .insert({ kind, subject: title, body: text, channels: result });
    }
  } catch (err) {
    console.error("Failed to log owner notification", err);
  }

  return result;
}

/**
 * Optional customer confirmation email. Only attempted when a verified sender
 * (NOTIFY_FROM_EMAIL) is configured, since the default sender can't deliver to
 * arbitrary recipients. Never throws.
 */
export async function sendCustomerConfirmation(
  to: string,
  subject: string,
  fields: Array<[string, string]>,
): Promise<ChannelResult> {
  if (!process.env["NOTIFY_FROM_EMAIL"]) {
    return { status: "skipped", detail: "No verified sender configured." };
  }
  const { text, html } = buildMessage(subject, fields);
  return sendEmail(to, subject, text, html);
}
