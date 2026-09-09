import nodemailer, { type Transporter } from "nodemailer";

/**
 * Gmail SMTP sender (server-only). Reuses the same account/App Password that
 * powers Supabase Auth email and the radar digest. Never import into a Client
 * Component.
 */
let cached: Transporter | null = null;

function transport(): Transporter {
  if (cached) return cached;
  cached = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER!,
      pass: process.env.GMAIL_APP_PASSWORD!,
    },
  });
  return cached;
}

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export interface OnboardingSubmission {
  userId: string;
  fullName: string;
  email: string;
  roles: string[];
  languages: string[];
  cv: { filename: string; content: Buffer; contentType: string };
}

/**
 * Emails the admin a new onboarding submission with the CV attached — the
 * plan's §10 admin notification. The CV's canonical copy lives in the private
 * `cv` Storage bucket; this attachment is a convenience inbox copy.
 */
export async function sendOnboardingEmail(s: OnboardingSubmission): Promise<void> {
  const to = process.env.ADMIN_EMAIL || process.env.GMAIL_USER!;
  const from = `Job Radar <${process.env.GMAIL_USER!}>`;

  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 14px 4px 0;color:#8a93a1;font-size:13px;">${label}</td>` +
    `<td style="padding:4px 0;color:#182231;font-size:14px;">${value || "&mdash;"}</td></tr>`;

  const html = `
    <div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:560px;">
      <p style="font-size:16px;color:#182231;margin:0 0 4px;"><b>New Job Radar application</b></p>
      <p style="font-size:13px;color:#8a93a1;margin:0 0 16px;">Review the CV and, to approve, write this user's <code>search_prefs</code>.</p>
      <table cellpadding="0" cellspacing="0">
        ${row("Name", esc(s.fullName))}
        ${row("Email", esc(s.email))}
        ${row("Roles", esc(s.roles.join(", ")))}
        ${row("Languages", esc(s.languages.join(", ")))}
        ${row("User ID", `<code>${esc(s.userId)}</code>`)}
      </table>
      <p style="font-size:12px;color:#9aa2ac;margin:16px 0 0;">CV attached · Job Radar</p>
    </div>`;

  const text =
    `New Job Radar application\n\n` +
    `Name: ${s.fullName}\nEmail: ${s.email}\n` +
    `Roles: ${s.roles.join(", ")}\nLanguages: ${s.languages.join(", ")}\n` +
    `User ID: ${s.userId}\n\nTo approve, write this user's search_prefs. CV attached.`;

  await transport().sendMail({
    from,
    to,
    replyTo: s.email,
    subject: `New Job Radar application — ${s.fullName}`,
    html,
    text,
    attachments: [
      { filename: s.cv.filename, content: s.cv.content, contentType: s.cv.contentType },
    ],
  });
}

export interface ApprovalRecipient {
  to: string;
  fullName: string | null;
}

/**
 * Tells a user their radar is live — sent when the admin writes their
 * `search_prefs` (plan §10, the only user-facing notification). Email-safe
 * HTML: table layout, inline styles, ◎ as Unicode. Links to the dashboard
 * when NEXT_PUBLIC_APP_URL is set, otherwise just asks them to log in.
 */
export async function sendApprovalEmail(r: ApprovalRecipient): Promise<void> {
  const from = `Job Radar <${process.env.GMAIL_USER!}>`;
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  const dashboard = base ? `${base}/dashboard` : "";
  const name = r.fullName?.trim().split(/\s+/)[0];
  const greeting = name ? `Hi ${esc(name)},` : "Hi,";

  const cta = dashboard
    ? `<tr><td style="padding:8px 0 4px;">
         <a href="${dashboard}" style="display:inline-block;background:#177e79;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 22px;border-radius:10px;">Open your dashboard →</a>
       </td></tr>`
    : `<tr><td style="padding:8px 0 4px;color:#182231;font-size:14px;">Log in to Job Radar to see your dashboard.</td></tr>`;

  const html = `
    <div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:560px;">
      <p style="font-size:15px;color:#177e79;margin:0 0 18px;font-weight:700;">◎ Job Radar</p>
      <p style="font-size:20px;color:#182231;margin:0 0 12px;font-weight:700;">Your radar is live</p>
      <p style="font-size:14px;color:#182231;margin:0 0 10px;">${greeting}</p>
      <p style="font-size:14px;color:#3a4656;line-height:1.5;margin:0 0 18px;">
        Good news — we've reviewed your details and switched your radar on. It's now
        scanning for roles that match your background, and matches will land on your
        dashboard from here on.
      </p>
      <table cellpadding="0" cellspacing="0">${cta}</table>
      <p style="font-size:12px;color:#9aa2ac;margin:22px 0 0;">Happy hunting · Job Radar</p>
    </div>`;

  const text =
    `Your radar is live\n\n${name ? `Hi ${name},` : "Hi,"}\n\n` +
    `We've reviewed your details and switched your radar on. Matches will land on your dashboard from here on.\n\n` +
    (dashboard ? `Open your dashboard: ${dashboard}\n` : `Log in to Job Radar to see your dashboard.\n`) +
    `\n— Job Radar`;

  await transport().sendMail({
    from,
    to: r.to,
    subject: "Your Job Radar is live",
    html,
    text,
  });
}
