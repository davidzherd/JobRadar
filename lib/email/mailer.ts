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
 * plan's §10 admin notification. This is the only place the CV lives; it is
 * not stored (v1 has no Storage bucket).
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
