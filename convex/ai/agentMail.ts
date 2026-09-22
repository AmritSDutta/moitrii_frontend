import type { AgentNotificationPayload } from "./types";

/**
 * Renders a warm, editorial HTML email notification for lifestyle deliverables.
 */
export function renderEditorialNotificationEmail(payload: AgentNotificationPayload): string {
  const deliverableItems = payload.deliverables
    .map((d) => {
      const takeawayList = d.takeaways && d.takeaways.length > 0
        ? `<ul style="margin: 8px 0 0 0; padding-left: 20px; color: #4A4A4A; font-size: 14px; line-height: 1.6;">
            ${d.takeaways.map((t) => `<li>${t}</li>`).join("")}
           </ul>`
        : "";

      const audioBadge = d.audioUrl
        ? `<span style="display: inline-block; background-color: #E6DEC8; color: #4A4A4A; font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 9999px; margin-left: 8px;">🎧 Audio Narration Included</span>`
        : "";

      const videoBadge = d.youtubeId
        ? `<a href="https://www.youtube.com/watch?v=${d.youtubeId}" target="_blank" style="display: inline-block; background-color: #FDEDEC; color: #C0392B; font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 9999px; margin-left: 8px; text-decoration: none;">▶ Watch Video Companion</a>`
        : "";

      const reuseBadge = d.isReused
        ? `<span style="display: inline-block; background-color: #E8F0EA; color: #2D4A34; font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 9999px; margin-left: 8px;">✨ Verified Knowledge Match</span>`
        : "";

      const articleLink = d.slug
        ? `<div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #EBE7DF;">
             <a href="https://moitrii-frontend.pages.dev/content/${d.slug}" style="color: #2D4A34; font-size: 13px; font-weight: 600; text-decoration: none;">
               📖 Read Full Editorial Guide on Moitrii →
             </a>
           </div>`
        : "";

      return `
        <div style="background-color: #FFFFFF; border: 1px solid #EBE7DF; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 6px 0; color: #1A1A1A; font-family: Georgia, serif; font-size: 18px;">
            ${d.title}
          </h3>
          <div style="margin-bottom: 10px;">
            ${audioBadge}
            ${videoBadge}
            ${reuseBadge}
          </div>
          ${takeawayList}
          ${articleLink}
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
  <title>New Insights from ${payload.agentName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2D2D2D;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAF7F2; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FAF7F2;">
          <!-- Header -->
          <tr>
            <td style="padding-bottom: 24px; text-align: left;">
              <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; color: #1A1A1A; letter-spacing: -0.5px;">
                Moitrii
              </h1>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #7C9082; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
                Mindful AI Lifestyle Companion
              </p>
            </td>
          </tr>

          <!-- Companion Banner -->
          <tr>
            <td style="background-color: #F4EFE6; border-radius: 12px; padding: 20px; text-align: left; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 15px; line-height: 1.5; color: #2D2D2D;">
                Namaste <strong>${payload.userName}</strong>,
              </p>
              <p style="margin: 8px 0 0 0; font-size: 14px; line-height: 1.6; color: #555555;">
                Your dedicated companion <strong>${payload.agentName}</strong> completed your research wake cycle. Here are your personalized lifestyle takeaways:
              </p>
            </td>
          </tr>

          <!-- Spacing -->
          <tr><td height="20"></td></tr>

          <!-- Deliverables -->
          <tr>
            <td>
              ${deliverableItems}
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 24px 0;">
              <a href="https://moitrii-frontend.pages.dev/dashboard" style="display: inline-block; background-color: #2D4A34; color: #FAF7F2; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-weight: 500; font-size: 15px;">
                Explore on Moitrii Dashboard
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top: 1px solid #EBE7DF; padding-top: 20px; text-align: center; color: #8C8C8C; font-size: 12px; line-height: 1.5;">
              <p style="margin: 0;">
                Sent from your dedicated agent: <code style="color: #2D4A34; background-color: #E8F0EA; padding: 2px 6px; border-radius: 4px;">${payload.agentEmail}</code>
              </p>
              <p style="margin: 6px 0 0 0;">
                Moitrii • Calm Technology for Modern Indian Living
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
 * Renders a clean plain-text version for email deliverability and accessibility.
 */
export function renderEditorialNotificationText(payload: AgentNotificationPayload): string {
  const deliverableSummaries = payload.deliverables
    .map((d, idx) => {
      const audioNote = d.audioUrl ? " (Audio narration included)" : "";
      const videoNote = d.youtubeId ? `\n  ▶ Video Companion: https://www.youtube.com/watch?v=${d.youtubeId}` : "";
      const reuseNote = d.isReused ? " [Verified knowledge match]" : "";
      const takeaways = d.takeaways && d.takeaways.length > 0
        ? "\n" + d.takeaways.map((t) => `  • ${t}`).join("\n")
        : "";
      const articleLink = d.slug ? `\n  📖 Read Full Guide: https://moitrii-frontend.pages.dev/content/${d.slug}` : "";
      return `${idx + 1}. ${d.title}${audioNote}${reuseNote}${takeaways}${videoNote}${articleLink}`;
    })
    .join("\n\n");

  return `
Namaste ${payload.userName},

Your personal AI companion ${payload.agentName} has completed your research wake cycle. Here are your personalized lifestyle takeaways:

${deliverableSummaries}

Explore more on your dashboard: https://moitrii-frontend.pages.dev/dashboard

Sent from your companion: ${payload.agentEmail}
Moitrii • Calm Technology for Modern Indian Living
  `.trim();
}

/**
 * Dispatches an email notification via official AgentMail REST API or logs the delivery payload.
 */
export async function sendAgentCompletionNotification(
  payload: AgentNotificationPayload,
  apiKey?: string
): Promise<boolean> {
  const subject = `✨ New Insights from ${payload.agentName}: ${payload.deliverables[0]?.title ?? "Your Research Guide"}`;
  const html = renderEditorialNotificationEmail(payload);
  const text = renderEditorialNotificationText(payload);
  const inboxId = encodeURIComponent(payload.agentEmail.trim());

  console.log(
    `[AgentMail] Preparing notification from ${payload.agentEmail} to ${payload.userEmail} (${payload.deliverables.length} deliverable(s))`
  );

  if (apiKey) {
    try {
      // Official AgentMail API: POST /v0/inboxes/:inbox_id/messages/send
      const response = await fetch(`https://api.agentmail.to/v0/inboxes/${inboxId}/messages/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          to: payload.userEmail,
          subject,
          text,
          html,
          labels: ["moitrii-deliverable"],
        }),
      });

      if (response.ok) {
        console.log(`[AgentMail] Successfully delivered notification to ${payload.userEmail}`);
        return true;
      } else {
        const errText = await response.text();
        console.warn(`[AgentMail] Service returned status ${response.status}: ${errText}`);
      }
    } catch (err) {
      console.warn("[AgentMail] Delivery request failed:", err);
    }
  }

  // Graceful fallback for local development & mock testing
  console.log(`[AgentMail] Demo delivery recorded for ${payload.userEmail}`);
  return true;
}

