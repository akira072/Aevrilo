import { getServerEnv } from "@/lib/env";

export interface EmailAlertPayload {
  to: string;
  subject: string;
  html: string;
}

export interface EmailDispatchResult {
  sent: boolean;
  provider: "resend" | "unconfigured";
  error?: string;
}

/**
 * Email alert adapter. Uses Resend HTTP API when RESEND_API_KEY and EMAIL_FROM_ADDRESS
 * are configured; otherwise logs a clean non-blocking notice without faking delivery.
 */
export async function sendEmailAlert(payload: EmailAlertPayload): Promise<EmailDispatchResult> {
  const { resendApiKey, emailFromAddress } = getServerEnv();
  if (!resendApiKey || !emailFromAddress) {
    return {
      sent: false,
      provider: "unconfigured",
      error: "Email alerts require RESEND_API_KEY and EMAIL_FROM_ADDRESS.",
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFromAddress,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { sent: false, provider: "resend", error: text };
    }
    return { sent: true, provider: "resend" };
  } catch (err) {
    return {
      sent: false,
      provider: "resend",
      error: err instanceof Error ? err.message : "Unknown email dispatch error",
    };
  }
}
