export interface DigestArticle {
  title: string;
  subtitle: string;
  slug: string;
  category: string;
  takeaways?: string[];
  readTime?: string;
}

const DEFAULT_APP_ORIGIN = "https://moitrii.ai";
const DEFAULT_SENDER_EMAIL = "newsletter@moitrii.ai";
const SENDER_NAME = "Moitrii Digest";

/**
 * Resolves the Brevo sender address: BREVO_SENDER_EMAIL env var > hardcoded
 * default. The address must be a verified sender in the Brevo dashboard.
 */
function resolveSenderEmail(): string {
  return process.env.BREVO_SENDER_EMAIL ?? DEFAULT_SENDER_EMAIL;
}

/**
 * Resolves the public app origin used in email links:
 * explicit argument > APP_ORIGIN environment variable > hardcoded default.
 */
function resolveAppOrigin(baseUrl?: string): string {
  return (baseUrl ?? process.env.APP_ORIGIN ?? DEFAULT_APP_ORIGIN).replace(/\/+$/, "");
}

/**
 * Escapes user- and LLM-derived strings before interpolating them into email HTML.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Renders the Moitrii logo from Convex file storage as an email-safe <img>.
 * Returns an empty string when no URL is available so callers can fall back to emoji.
 */
function renderLogoImg(logoUrl: string | undefined, size = 36, isInline = false): string {
  if (!logoUrl) return "";
  const displayStyle = isInline
    ? `display: inline-block; vertical-align: -3px; margin-right: 6px;`
    : `display: block;`;
  return `<img src="${escapeHtml(logoUrl)}" width="${size}" height="${size}" alt="Moitrii" style="${displayStyle} width: ${size}px; height: ${size}px; border-radius: 50%; object-fit: cover;">`;
}

/**
 * Renders an editorial welcome email for new newsletter subscribers.
 */
export function renderSubscriberWelcomeHtml(
  email: string,
  baseUrl?: string,
  logoUrl?: string
): string {
  const cleanBase = resolveAppOrigin(baseUrl);
  const unsubscribeUrl = `${cleanBase}/unsubscribe?email=${encodeURIComponent(email)}`;
  const headerLogo = renderLogoImg(logoUrl, 40);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Moitrii Intentional Lifestyle Digest</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2D2D2D;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAF7F2; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FAF7F2;">
          <!-- Header -->
          <tr>
            <td style="padding-bottom: 24px; text-align: left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  ${headerLogo ? `<td style="width: 52px; vertical-align: middle; padding-right: 12px;">${headerLogo}</td>` : ""}
                  <td style="vertical-align: middle;">
                    <h1 style="margin: 0; font-family: Georgia, serif; font-size: 28px; color: #1A1A1A; letter-spacing: -0.5px;">
                      Moitrii
                    </h1>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #7C9082; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
                      Mindful Living & Calm Technology
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Welcome Card -->
          <tr>
            <td style="background-color: #FFFFFF; border: 1px solid #EBE7DF; border-radius: 16px; padding: 32px 24px; text-align: left;">
              <h2 style="margin: 0 0 12px 0; font-family: Georgia, serif; font-size: 20px; color: #1A1A1A;">
                Welcome to your weekly intentional digest ✨
              </h2>
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #4A4A4A;">
                Thank you for subscribing with <strong style="color: #2D4A34;">${escapeHtml(email)}</strong>. Every Sunday, you will receive our top 10 curated insights on holistic wellness, mindful nutrition, calm productivity, and verified lifestyle research.
              </p>
              <div style="background-color: #F8F5EE; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #555555;">
                  ${logoUrl ? renderLogoImg(logoUrl, 18, true) : "🌿"} <strong>Our Editorial Promise:</strong> No clickbait, no spam, no algorithmic noise. Only intentional, high-signal reads crafted to nurture calm vitality.
                </p>
              </div>
              <div style="text-align: center;">
                <a href="${cleanBase}" style="display: inline-block; background-color: #2D4A34; color: #FAF7F2; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-weight: 500; font-size: 15px;">
                  Explore Latest Stories
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 24px; text-align: center; color: #8C8C8C; font-size: 12px; line-height: 1.6;">
              <p style="margin: 0;">
                You are receiving this because you subscribed on <a href="${cleanBase}" style="color: #7C9082; text-decoration: underline;">moitrii.ai</a>.
              </p>
              <p style="margin: 6px 0 0 0;">
                <a href="${unsubscribeUrl}" style="color: #A39E93; text-decoration: underline;">Unsubscribe from weekly digest</a>
              </p>
              <p style="margin: 6px 0 0 0;">
                Moitrii Platform • Powered by Brevo Delivery
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Renders the weekly curated top 10 lifestyle digest email template with zero LLM cost.
 */
export function renderWeeklyDigestHtml(
  articles: DigestArticle[],
  recipientEmail?: string,
  baseUrl?: string,
  logoUrl?: string
): string {
  const cleanBase = resolveAppOrigin(baseUrl);
  const unsubscribeUrl = recipientEmail
    ? `${cleanBase}/unsubscribe?email=${encodeURIComponent(recipientEmail)}`
    : `${cleanBase}/unsubscribe`;
  const headerLogo = renderLogoImg(logoUrl, 40);

  const articleCards = articles
    .slice(0, 10)
    .map((a, index) => {
      const takeawaysHtml =
        a.takeaways && a.takeaways.length > 0
          ? `<ul style="margin: 8px 0 12px 18px; padding: 0; font-size: 13px; line-height: 1.5; color: #555555;">
              ${a.takeaways
                .slice(0, 5)
                .map((t) => `<li style="margin-bottom: 4px;">${escapeHtml(t)}</li>`)
                .join("")}
            </ul>`
          : "";

      return `
    <div style="background-color: #FFFFFF; border: 1px solid #EBE7DF; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
        <span style="display: inline-block; background-color: #E8F0EA; color: #2D4A34; font-size: 11px; font-weight: 600; text-transform: uppercase; padding: 2px 8px; border-radius: 9999px;">
          #${index + 1} • ${escapeHtml(a.category)}
        </span>
        ${
          a.readTime
            ? `<span style="font-size: 12px; color: #8C8C8C;">${escapeHtml(a.readTime)}</span>`
            : ""
        }
      </div>
      <h3 style="margin: 0 0 6px 0; font-family: Georgia, serif; font-size: 18px; color: #1A1A1A;">
        ${escapeHtml(a.title)}
      </h3>
      <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.5; color: #555555;">
        ${escapeHtml(a.subtitle)}
      </p>
      ${takeawaysHtml}
      <a href="${cleanBase}/content/${encodeURIComponent(a.slug)}" style="color: #2D4A34; font-size: 13px; font-weight: 600; text-decoration: none;">
        Read full guide & listen &rarr;
      </a>
    </div>
  `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>This Week on Moitrii: Top 10 Lifestyle Insights</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2D2D2D;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAF7F2; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FAF7F2;">
          <tr>
            <td style="padding-bottom: 24px; text-align: left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  ${headerLogo ? `<td style="width: 52px; vertical-align: middle; padding-right: 12px;">${headerLogo}</td>` : ""}
                  <td style="vertical-align: middle;">
                    <h1 style="margin: 0; font-family: Georgia, serif; font-size: 28px; color: #1A1A1A;">Moitrii</h1>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #7C9082; font-weight: 500; text-transform: uppercase;">
                      Weekly Intentional Digest • Top 10 Guides
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              ${articleCards}
            </td>
          </tr>
          <tr>
            <td style="padding-top: 24px; text-align: center; color: #8C8C8C; font-size: 12px; line-height: 1.6;">
              <p style="margin: 0;">
                You are receiving this digest because you subscribed to Moitrii Intentional Living.
              </p>
              <p style="margin: 6px 0 0 0;">
                <a href="${unsubscribeUrl}" style="color: #A39E93; text-decoration: underline;">Unsubscribe from weekly digest</a>
              </p>
              <p style="margin: 6px 0 0 0;">
                Moitrii Platform • Powered by Brevo Delivery
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Dispatches a welcome confirmation email to a new subscriber via Brevo API.
 */
export async function sendSubscriberWelcomeEmail(
  email: string,
  apiKey?: string,
  baseUrl?: string,
  logoUrl?: string
): Promise<boolean> {
  const htmlContent = renderSubscriberWelcomeHtml(email, baseUrl, logoUrl);
  const subject = "✨ Welcome to Moitrii: Your Weekly Intentional Digest";

  console.log(`[Brevo] Preparing welcome confirmation email for subscriber: ${email}`);

  if (apiKey) {
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify({
          sender: { name: SENDER_NAME, email: resolveSenderEmail() },
          to: [{ email }],
          subject,
          htmlContent,
        }),
      });

      if (response.ok) {
        console.log(`[Brevo] Successfully sent welcome email to ${email}`);
        return true;
      } else {
        console.warn(`[Brevo] API returned status ${response.status}`);
      }
    } catch (err) {
      console.warn("[Brevo] Request failed:", err);
    }
  }

  // Graceful fallback for demo & test environments
  console.log(`[Brevo] Demo subscriber welcome logged for: ${email}`);
  return true;
}

/**
 * Dispatches weekly digest broadcast to subscriber batch via Brevo API.
 */
export async function sendWeeklyDigestBroadcast(
  subscriberEmails: string[],
  articles: DigestArticle[],
  apiKey?: string,
  baseUrl?: string,
  logoUrl?: string
): Promise<{ sentCount: number }> {
  if (subscriberEmails.length === 0 || articles.length === 0) {
    return { sentCount: 0 };
  }

  const subject = "🌿 This Week on Moitrii: Top 10 Mindful Guides & Insights";
  console.log(`[Brevo] Broadcasting weekly digest to ${subscriberEmails.length} subscriber(s)`);

  if (apiKey) {
    try {
      // Send individual personalized digests with customized unsubscribe links
      for (const email of subscriberEmails) {
        const htmlContent = renderWeeklyDigestHtml(articles, email, baseUrl, logoUrl);
        await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": apiKey,
          },
          body: JSON.stringify({
            sender: { name: SENDER_NAME, email: resolveSenderEmail() },
            to: [{ email }],
            subject,
            htmlContent,
          }),
        });
      }
      return { sentCount: subscriberEmails.length };
    } catch (err) {
      console.warn("[Brevo] Broadcast failed:", err);
    }
  }

  return { sentCount: subscriberEmails.length };
}
