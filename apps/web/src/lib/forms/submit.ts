// =============================================================================
// SENDING A FORM
// -----------------------------------------------------------------------------
// Today the site has no server, so a form is "sent" by opening WhatsApp (or the
// visitor's email app) with the message already written. submitLead() hides that:
//   - if NEXT_PUBLIC_API_URL is set (the backend exists), it POSTs to /v1/leads;
//   - otherwise, or if the server does not answer, it returns a WhatsApp link.
// When the backend is ready only the environment variable changes; the forms do not.
// =============================================================================

// WhatsApp links break when they are very long. Keep the message under this size.
const MAX_MESSAGE_CHARS = 1400;
const API_TIMEOUT_MS = 8000;

export type LeadKind = "contact" | "free-design" | "referral";

export type LeadPayload = {
  kind: LeadKind;
  locale: string;
  page: string;
  fields: Record<string, string>;
};

export type SubmitResult =
  | { channel: "api" }
  | { channel: "whatsapp"; url: string; emailUrl: string };

/** Cuts a text to a safe length (and says so), so the link still opens. */
export function limitMessage(message: string, max = MAX_MESSAGE_CHARS): string {
  return message.length <= max ? message : `${message.slice(0, max - 1).trimEnd()}…`;
}

export function buildWhatsAppUrl(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(limitMessage(message))}`;
}

export function buildMailtoUrl(email: string, subject: string, message: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(limitMessage(message))}`;
}

export type SubmitContext = {
  whatsappNumber: string;
  email: string;
  subject: string;
  /** The ready-to-send text (already in the visitor's language). */
  message: string;
};

/** True once the backend address is configured (NEXT_PUBLIC_API_URL). */
export const hasApi = Boolean(process.env.NEXT_PUBLIC_API_URL);

/**
 * The WhatsApp way to send, computed at once (no waiting). Forms use it while there
 * is no backend, because browsers only allow window.open() right after a click.
 */
export function whatsappSubmission(context: SubmitContext): SubmitResult {
  return {
    channel: "whatsapp",
    url: buildWhatsAppUrl(context.whatsappNumber, context.message),
    emailUrl: buildMailtoUrl(context.email, context.subject, context.message),
  };
}

export async function submitLead(lead: LeadPayload, context: SubmitContext): Promise<SubmitResult> {
  const api = process.env.NEXT_PUBLIC_API_URL;
  if (api) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
      const response = await fetch(`${api.replace(/\/$/, "")}/v1/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (response.ok) return { channel: "api" };
    } catch {
      // the server did not answer: use WhatsApp, the visitor still reaches us
    }
  }
  return whatsappSubmission(context);
}
