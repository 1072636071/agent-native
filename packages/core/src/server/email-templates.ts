/**
 * Transactional email renderers for the framework's system emails.
 *
 * Each exported function returns `{ subject, html, text }` so callers can pass
 * the result straight to `sendEmail({ to, ...rendered })`. All three share the
 * same visual identity via the generic `renderEmail` helper in
 * `email-template.ts` — dark card, Inter typography, prominent CTA button.
 *
 * If you need to add another system email (e.g. magic-link, change-email
 * confirmation), add it here rather than inlining `renderEmail` at the call
 * site — keeps the transactional look-and-feel consistent.
 */

import { renderEmail, emailStrong } from "./email-template.js";
import { getAppName } from "./app-name.js";

export interface RenderedEmailMessage {
  subject: string;
  html: string;
  text: string;
}

/**
 * Strip CRLF from any field that flows into the Subject line — a malicious
 * org name, inviter, or app name could otherwise inject Bcc/Reply-To headers
 * via "Name\r\nBcc: attacker@...".
 */
function stripCrlf(s: string): string {
  return s.replace(/[\r\n]+/g, " ").trim();
}

function resolveAppName(): string {
  return stripCrlf(getAppName() || "Agent Native");
}

// ---------------------------------------------------------------------------
// Organization invitation
// ---------------------------------------------------------------------------

export interface RenderInviteEmailArgs {
  /** Email address of the person being invited. */
  invitee: string;
  /** Name of the organization they're being invited to. */
  orgName: string;
  /** URL the recipient clicks to accept — usually the app's root URL. */
  acceptUrl: string;
  /** Email (or display name) of the person who sent the invitation. */
  inviter: string;
  /** Language for email content. Defaults to English. */
  language?: "en" | "zh";
}

export function renderInviteEmail(
  args: RenderInviteEmailArgs,
): RenderedEmailMessage {
  const invitee = stripCrlf(args.invitee);
  const orgName = stripCrlf(args.orgName || "your team");
  const inviter = stripCrlf(args.inviter);
  const appName = resolveAppName();
  const onApp = appName ? ` on ${appName}` : "";
  const onAppZh = appName ? ` 上的 ${appName}` : "";

  const isZh = args.language === "zh";
  const t = (zh: string, en: string) => (isZh ? zh : en);

  const { html, text } = renderEmail({
    preheader: t(
      `${inviter} 邀请您加入 ${orgName}${onAppZh}。`,
      `${inviter} invited you to join ${orgName}${onApp}.`,
    ),
    heading: t(
      `加入 ${orgName}`,
      `You're invited to join ${orgName}`,
    ),
    paragraphs: [
      t(
        `${inviter} 邀请您加入 ${orgName}${onAppZh}。`,
        `${emailStrong(inviter)} invited you to join ${emailStrong(orgName)}${
          appName ? ` on ${emailStrong(appName)}` : ""
        }.`,
      ),
      t(
        `使用 ${invitee} 登录以接受邀请。`,
        `Sign in with ${emailStrong(invitee)} to accept the invitation.`,
      ),
    ],
    cta: { label: t("接受邀请", "Accept invitation"), url: args.acceptUrl },
    footer: t(
      `如果您没有请求此邮件，可以安全忽略。`,
      `If you weren't expecting this, you can safely ignore this email.`,
    ),
  });

  return {
    subject: t(
      `${inviter} 邀请您加入 ${orgName}${onAppZh}`,
      `${inviter} invited you to join ${orgName}${onApp}`,
    ),
    html,
    text,
  };
}

// ---------------------------------------------------------------------------
// Signup email verification
// ---------------------------------------------------------------------------

export interface RenderVerifySignupEmailArgs {
  /** The email address being verified. */
  email: string;
  /** The full verification URL from better-auth. */
  verifyUrl: string;
  /** Language for email content. Defaults to English. */
  language?: "en" | "zh";
}

export function renderVerifySignupEmail(
  args: RenderVerifySignupEmailArgs,
): RenderedEmailMessage {
  const email = stripCrlf(args.email);
  const appName = resolveAppName();

  const isZh = args.language === "zh";
  const t = (zh: string, en: string) => (isZh ? zh : en);

  const { html, text } = renderEmail({
    preheader: t(
      `确认 ${email} 以完成您的 ${appName} 账户设置。`,
      `Confirm ${email} to finish setting up your ${appName} account.`,
    ),
    heading: t(
      `验证您的 ${appName} 邮箱`,
      `Verify your email for ${appName}`,
    ),
    paragraphs: [
      t(
        `感谢您注册 ${appName}。请确认 ${email} 是您的邮箱地址。`,
        `Thanks for signing up for ${emailStrong(appName)}. To finish creating your account, confirm that ${emailStrong(email)} is your email address.`,
      ),
      t(`此链接 1 小时后过期。`, `This link expires in 1 hour.`),
    ],
    cta: { label: t("验证邮箱", "Verify email"), url: args.verifyUrl },
    footer: t(
      `如果您没有注册，可以安全忽略此邮件。`,
      `If you didn't sign up, you can safely ignore this email.`,
    ),
  });

  return {
    subject: t(
      `验证您的 ${appName} 邮箱`,
      `Verify your email for ${appName}`,
    ),
    html,
    text,
  };
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export interface RenderResetPasswordEmailArgs {
  /** The account email the reset is for. */
  email: string;
  /** The full reset URL (includes the signed token). */
  resetUrl: string;
  /** Language for email content. Defaults to English. */
  language?: "en" | "zh";
}

export function renderResetPasswordEmail(
  args: RenderResetPasswordEmailArgs,
): RenderedEmailMessage {
  const email = stripCrlf(args.email);
  const appName = resolveAppName();

  const isZh = args.language === "zh";
  const t = (zh: string, en: string) => (isZh ? zh : en);

  const { html, text } = renderEmail({
    preheader: t(
      `重置 ${email} 的密码。此链接 1 小时后过期。`,
      `Reset the password for ${email}. This link expires in 1 hour.`,
    ),
    heading: t(
      `重置您的 ${appName} 密码`,
      `Reset your ${appName} password`,
    ),
    paragraphs: [
      t(
        `有人请求重置 ${email} 的密码。点击下方按钮设置新密码。`,
        `Someone requested a password reset for ${emailStrong(email)}. Click the button below to choose a new password.`,
      ),
      t(`此链接 1 小时后过期。`, `This link expires in 1 hour.`),
    ],
    cta: { label: t("重置密码", "Reset password"), url: args.resetUrl },
    footer: t(
      `如果您没有请求此操作，可以安全忽略此邮件 — 您的密码不会改变。`,
      `If you didn't request this, you can safely ignore this email — your password won't change.`,
    ),
  });

  return {
    subject: t(
      `重置您的 ${appName} 密码`,
      `Reset your ${appName} password`,
    ),
    html,
    text,
  };
}
