// HTML/plaintext template library for transactional email.
// Mirrors sender-domain and subject patterns observed on live Luma:
//   - support@luma.com                 → sign-in codes, security
//   - usr-XXXX@user.luma-mail.com      → host-triggered transactional
//   - cal-XXXX@calendar.luma-mail.com  → calendar-triggered
//   - noreply@luma-mail.com            → platform-generated content
// In dev we just annotate; a real build wires these up via your ESP.

import type { Mail } from "./email";

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c] as string));
}

function shell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#0d0f14;color:#f6f6f7;font-family:ui-sans-serif,system-ui,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="font-size:14px;color:#ef4444;font-weight:700;letter-spacing:.02em;margin-bottom:16px">Luma</div>
    <h1 style="font-size:20px;margin:0 0 16px">${escape(title)}</h1>
    ${bodyHtml}
    <div style="margin-top:32px;font-size:12px;color:#797f8e">
      Sent by Luma. You received this because of activity on your account.
    </div>
  </div>
</body></html>`;
}

export function signinCode(params: { to: string; code: string }): Mail {
  const body = `
    <p style="font-size:15px">Use the one-time code below to sign in. It expires in 15 minutes.</p>
    <div style="font-size:28px;letter-spacing:.5em;background:#1a1d26;padding:16px;border-radius:8px;text-align:center;margin:16px 0">
      ${escape(params.code)}
    </div>
    <p style="font-size:13px;color:#a9adb8">If you didn't request this, you can ignore this email.</p>`;
  return {
    to: params.to,
    from: "support@luma.local",
    subject: `${params.code} is your Luma sign-in code`,
    text: `Your Luma sign-in code is ${params.code}. It expires in 15 minutes.`,
    html: shell("Your sign-in code", body),
  };
}

export function registrationConfirmed(params: {
  to: string;
  name: string;
  eventTitle: string;
  eventUrl: string;
  when: string;
  where: string;
  hostEmailAlias?: string;
}): Mail {
  const body = `
    <p style="font-size:15px">Hi ${escape(params.name)},</p>
    <p style="font-size:15px">You're registered. See you at <strong>${escape(params.eventTitle)}</strong>.</p>
    <div style="background:#1a1d26;padding:16px;border-radius:8px;margin:16px 0">
      <div style="font-size:13px;color:#a9adb8">When</div>
      <div style="font-size:15px;margin-bottom:8px">${escape(params.when)}</div>
      <div style="font-size:13px;color:#a9adb8">Where</div>
      <div style="font-size:15px">${escape(params.where)}</div>
    </div>
    <p><a href="${escape(params.eventUrl)}" style="background:#ef4444;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block">View event</a></p>`;
  return {
    to: params.to,
    from: params.hostEmailAlias ?? "usr-0001@user.luma-mail.local",
    subject: `Registration confirmed for ${params.eventTitle}`,
    text: `Hi ${params.name}, you're registered for ${params.eventTitle} — ${params.when} at ${params.where}.\n\nView: ${params.eventUrl}`,
    html: shell("You're in", body),
  };
}

export function registrationApproved(params: {
  to: string;
  eventTitle: string;
  eventUrl: string;
  calendarAlias?: string;
}): Mail {
  const body = `
    <p style="font-size:15px">Good news — you've been approved for <strong>${escape(params.eventTitle)}</strong>.</p>
    <p><a href="${escape(params.eventUrl)}" style="background:#ef4444;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block">Open event</a></p>`;
  return {
    to: params.to,
    from: params.calendarAlias ?? "cal-0001@calendar.luma-mail.local",
    subject: `Registration approved for ${params.eventTitle}`,
    text: `You've been approved for ${params.eventTitle}. ${params.eventUrl}`,
    html: shell("Approved", body),
  };
}

export function waitlisted(params: { to: string; eventTitle: string; eventUrl: string }): Mail {
  const body = `
    <p style="font-size:15px">The event is at capacity. You're on the waitlist for <strong>${escape(params.eventTitle)}</strong>. We'll email if a spot opens.</p>
    <p><a href="${escape(params.eventUrl)}" style="color:#ef4444">View event</a></p>`;
  return {
    to: params.to,
    subject: `You're on the waitlist for ${params.eventTitle}`,
    text: `Waitlisted for ${params.eventTitle}. We'll email if a spot opens. ${params.eventUrl}`,
    html: shell("Waitlisted", body),
  };
}

export function pendingApproval(params: { to: string; eventTitle: string; eventUrl: string }): Mail {
  const body = `
    <p style="font-size:15px">We received your request to join <strong>${escape(params.eventTitle)}</strong>. The host will review shortly.</p>
    <p><a href="${escape(params.eventUrl)}" style="color:#ef4444">View event</a></p>`;
  return {
    to: params.to,
    subject: `Registration request received: ${params.eventTitle}`,
    text: `Request received for ${params.eventTitle}. Awaiting host approval. ${params.eventUrl}`,
    html: shell("Request received", body),
  };
}

export function inviteGuest(params: {
  to: string;
  eventTitle: string;
  eventUrl: string;
  hostEmailAlias?: string;
}): Mail {
  const body = `
    <p style="font-size:15px">You've been invited to <strong>${escape(params.eventTitle)}</strong>.</p>
    <p><a href="${escape(params.eventUrl)}" style="background:#ef4444;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block">RSVP</a></p>`;
  return {
    to: params.to,
    from: params.hostEmailAlias ?? "usr-0001@user.luma-mail.local",
    subject: `You're invited to ${params.eventTitle}`,
    text: `You've been invited to ${params.eventTitle}. RSVP at ${params.eventUrl}`,
    html: shell("You're invited", body),
  };
}

export function weeklyDigest(params: {
  to: string;
  city: string;
  events: { title: string; url: string; when: string }[];
}): Mail {
  const items = params.events
    .map(
      (e) => `
      <div style="padding:12px 0;border-bottom:1px solid #262a34">
        <div style="font-size:15px"><a href="${escape(e.url)}" style="color:#f6f6f7;text-decoration:none">${escape(e.title)}</a></div>
        <div style="font-size:13px;color:#a9adb8">${escape(e.when)}</div>
      </div>`
    )
    .join("");
  return {
    to: params.to,
    from: "noreply@luma-mail.local",
    subject: `What's happening in ${params.city} this week`,
    text: `This week in ${params.city}:\n\n` + params.events.map((e) => `• ${e.title} — ${e.when} — ${e.url}`).join("\n"),
    html: shell(`This week in ${params.city}`, items),
  };
}
