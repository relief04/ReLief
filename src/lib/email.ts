import { resend } from '@/lib/resend';

interface MailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

/**
 * Generic function to send emails using Resend.
 */
export const sendEmail = async ({ to, subject, text, html }: MailOptions) => {
  try {
    if (!resend) {
      console.warn("⚠️ Email not sent: RESEND_API_KEY is missing or running on client.");
      return { success: false, error: "Missing API Key" };
    }

    const { data, error } = await resend.emails.send({
      from: 'ReLief Team <onboarding@resend.dev>', // Default Resend testing domain
      to: [to],
      subject: subject,
      text: text,
      html: html,
    });

    if (error) {
      console.error("❌ Error sending email:", error);
      return { success: false, error };
    }

    console.log("Message sent:", data?.id);
    return { success: true, id: data?.id };

  } catch (error) {
    console.error("❌ Unexpected error sending email:", error);
    return { success: false, error };
  }
};

/**
 * Base Dark Mode Premium ReLief Email Template
 */
const getBaseEmailTemplate = (title: string, contentHTML: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0f172a;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #f3f4f6;
      line-height: 1.6;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #0f172a;
      padding: 40px 20px;
      box-sizing: border-box;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #1e293b;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -1px;
      font-family: 'Outfit', sans-serif;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      margin-top: 0;
      color: #34d399;
      font-size: 26px;
      margin-bottom: 20px;
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
    }
    .content p {
      margin-bottom: 20px;
      font-size: 16px;
      color: #e5e7eb;
    }
    .highlight {
      color: #10b981;
      font-weight: 600;
    }
    .button-container {
      text-align: center;
      margin: 35px 0;
    }
    .button {
      background-color: #10b981;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      display: inline-block;
      box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
    }
    .card {
      background-color: rgba(30, 41, 59, 0.8);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      text-align: center;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
    }
    .card-value {
      font-size: 36px;
      font-weight: 800;
      color: #34d399;
      margin: 10px 0;
      font-family: 'Outfit', sans-serif;
    }
    .card-amber {
      border-color: rgba(251, 191, 36, 0.3) !important;
    }
    .text-amber {
      color: #fbbf24 !important;
    }
    .bg-amber {
      background-color: #fbbf24 !important;
      color: #1e293b !important;
    }
    .card-rose {
      border-color: rgba(244, 63, 94, 0.3) !important;
    }
    .text-rose {
      color: #f43f5e !important;
    }
    .bg-rose {
      background-color: #f43f5e !important;
      color: #ffffff !important;
    }
    .text-emerald {
      color: #10b981 !important;
    }
    .bg-emerald {
      background-color: #10b981 !important;
      color: #ffffff !important;
    }
    .border-emerald {
      border-color: #10b981 !important;
    }
    .footer {
      background-color: #0f172a;
      padding: 30px 20px;
      text-align: center;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    .footer p {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #9ca3af;
    }
    .footer-links a {
      color: #10b981;
      text-decoration: none;
      margin: 0 10px;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>ReLief</h1>
      </div>
      <div class="content">
        ${contentHTML}
      </div>
      <div class="footer">
        <p>Make a difference today. 🌍</p>
        <div class="footer-links">
          <a href="#">Dashboard</a>
          <a href="#">Community</a>
          <a href="#">Settings</a>
        </div>
        <p style="margin-top: 20px; font-size: 12px; opacity: 0.5;">&copy; ${new Date().getFullYear()} ReLief Community. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

/**
 * Specific helper for Welcome Emails
 */
export const sendWelcomeEmail = async (email: string, name: string) => {
  const htmlContent = `
        <h2>Welcome to ReLief, ${name}! 🌱</h2>
        <p>We're thrilled to have you join our community of eco-warriors taking real action for the planet.</p>
        
        <div class="card">
            <h3 style="margin-top: 0; color: #f3f4f6;">Your Journey Starts Here</h3>
            <p style="margin-bottom: 0;">Calculate your carbon footprint, join challenges, and make a real impact.</p>
        </div>

        <div class="button-container">
            <a href="https://relief.com/dashboard" class="button">Go to Dashboard</a>
        </div>

        <p>Let's make a difference together!</p>
        <p>Cheers,<br/>The ReLief Team</p>
    `;

  return sendEmail({
    to: email,
    subject: "Welcome to the ReLief Community! 🌍",
    text: `Hi ${name},\n\nWelcome to ReLief! We're thrilled to have you join our community.\n\nStart tracking your carbon footprint and join challenges today!\n\nCheers,\nThe ReLief Team`,
    html: getBaseEmailTemplate("Welcome to ReLief!", htmlContent)
  });
};

/**
 * Specific helper for AI Bill Scanner Instant Impact Confirmation
 */
export const sendBillProcessedEmail = async (email: string, name: string, units: number, carbonValue: number, category: string) => {
  const htmlContent = `
        <h2>Bill Processed Successfully! ⚡</h2>
        <p>Hi ${name},</p>
        <p>Our AI has successfully analyzed your recent <strong>${category}</strong> bill. Here’s your impact summary:</p>
        
        <div class="card">
            <p style="margin: 0; color: #9ca3af; text-transform: uppercase; font-size: 12px; font-weight: 600; letter-spacing: 1px;">Usage Detected</p>
            <div class="card-value" style="font-size: 24px; color: #10b981;">${units} <span style="font-size: 16px; color: #9ca3af;">units</span></div>
            <p style="margin-top: 15px; margin-bottom: 0; color: #9ca3af; text-transform: uppercase; font-size: 12px; font-weight: 600; letter-spacing: 1px;">Carbon Equivalent</p>
            <div class="card-value" style="font-size: 24px; color: #f43f5e;">${carbonValue.toFixed(1)} <span style="font-size: 16px; color: #9ca3af;">kg CO₂</span></div>
        </div>

        <div class="button-container">
            <a href="https://relief.com/dashboard" class="button">View Insights Dashboard</a>
        </div>

        <p><strong>💡 Eco Tip:</strong> Try reducing phantom loads by unplugging counter appliances when not in use. It can cut energy bills by up to 10%!</p>
    `;

  return sendEmail({
    to: email,
    subject: `⚡ Your ${category} bill was processed!`,
    html: getBaseEmailTemplate("Bill Processed", htmlContent)
  });
};

/**
 * specific helper for Badge Unlocked Emails
 */
export const sendBadgeEmail = async (email: string, name: string, badgeName: string, iconUrl?: string) => {
  const htmlContent = `
        <h2>Congratulations, ${name}! 🎉</h2>
        <p>Your dedication to sustainability is paying off. You just unlocked a new badge!</p>
        
        <div class="card">
            ${iconUrl ? `<img src="${iconUrl}" alt="${badgeName}" width="80" style="margin-bottom: 15px;" />` : `<div style="font-size: 60px; margin-bottom: 15px;">🏆</div>`}
            <div class="card-value" style="font-size: 24px;">${badgeName}</div>
            <p style="margin-bottom: 0; color: #9ca3af;">Added to your profile showcase</p>
        </div>

        <div class="button-container">
            <a href="https://relief.com/profile" class="button">View Your Profile</a>
        </div>

        <p>Keep up the great work saving the planet.</p>
    `;

  return sendEmail({
    to: email,
    subject: `🎉 You unlocked the ${badgeName} badge!`,
    html: getBaseEmailTemplate("Badge Unlocked!", htmlContent)
  });
};

/**
 * specific helper for Carbon Budget Alerts
 */
export const sendCarbonAlertEmail = async (email: string, name: string, usedPercentage: number) => {
  const htmlContent = `
        <h2 class="text-amber">Carbon Budget Alert ⚠️</h2>
        <p>Hi ${name},</p>
        <p>You have reached <strong>${usedPercentage}%</strong> of your set monthly carbon budget.</p>
        
        <div class="card card-amber">
            <div class="card-value text-amber">${usedPercentage}% Used</div>
            <p style="margin-bottom: 0; color: #9ca3af;">Time to be mindful of your emissions!</p>
        </div>

        <div class="button-container">
            <a href="https://relief.com/dashboard" class="button bg-amber">View Dashboard</a>
        </div>

        <p>Small changes today make a big difference tomorrow.</p>
    `;

  return sendEmail({
    to: email,
    subject: `⚠️ Carbon Budget Alert: ${usedPercentage}% Reached`,
    html: getBaseEmailTemplate("Carbon Alert", htmlContent)
  });
};

/**
 * specific helper for Monthly Reports
 */
export const sendMonthlyReportEmail = async (email: string, name: string, month: string, emissionsKg: number, budgetKg: number) => {
  const isUnderBudget = emissionsKg <= budgetKg;
  const headerClass = isUnderBudget ? '' : 'text-rose';

  const htmlContent = `
        <h2>Your ${month} Carbon Report 📊</h2>
        <p>Hi ${name}, here is your emission summary for the past month.</p>
        
        <div class="card">
            <p style="margin: 0; color: #9ca3af; text-transform: uppercase; font-size: 12px; font-weight: 600; letter-spacing: 1px;">Total Emissions</p>
            <div class="card-value ${headerClass}">${emissionsKg} <span style="font-size: 18px;">kg CO₂</span></div>
            <p style="margin-bottom: 0; color: #9ca3af;">Your budget was ${budgetKg} kg CO₂</p>
        </div>

        <div class="button-container">
            <a href="https://relief.com/dashboard" class="button">View Full Report</a>
        </div>
    `;

  return sendEmail({
    to: email,
    subject: `Your ${month} Carbon Report is Ready 📊`,
    html: getBaseEmailTemplate(`${month} Report`, htmlContent)
  });
};

/**
 * specific helper for Severe AQI Alerts
 */
export const sendAQIAlertEmail = async (email: string, name: string, location: string, aqi: number) => {
  const htmlContent = `
        <h2 style="color: #ef4444;">Severe AQI Alert 😷</h2>
        <p>Hi ${name},</p>
        <p>We are actively monitoring the air quality in your saved location.</p>
        
        <div class="card card-rose">
            <div class="card-value text-rose">${aqi} AQI</div>
            <p style="margin-bottom: 0; color: #9ca3af;">${location} is currently experiencing Hazardous air quality.</p>
        </div>
        
        <p>Please take necessary precautions such as wearing an N95 mask if you must go outside, and keeping your windows closed.</p>

        <div class="button-container">
            <a href="https://relief.com/aqi" class="button bg-rose">View AQI Map</a>
        </div>
    `;

  return sendEmail({
    to: email,
    subject: `Alert: Air Quality in ${location} is Hazardous (${aqi} AQI)`,
    html: getBaseEmailTemplate("AQI Alert", htmlContent)
  });
};

/**
 * specific helper for Weekly Impact Digests
 */
export const sendWeeklyDigestEmail = async (email: string, name: string, totalEmissions: number, previousEmissions: number, topCityPercentile: number, tip: string) => {
  const percentageChange = previousEmissions > 0
    ? Math.round(((totalEmissions - previousEmissions) / previousEmissions) * 100)
    : 0;

  const isImprovement = percentageChange <= 0;
  const changeClass = isImprovement ? 'text-emerald' : 'text-rose';
  const changeIcon = isImprovement ? '↓' : '↑';

  const htmlContent = `
        <h2>Weekly Impact Digest 🌍</h2>
        <p>Hi ${name}, here's how you changed the world this week.</p>
        
        <div class="card">
            <p style="margin: 0; color: #9ca3af; text-transform: uppercase; font-size: 12px; font-weight: 600; letter-spacing: 1px;">Week's Footprint</p>
            <div class="card-value" style="font-size: 28px; color: #f3f4f6;">${totalEmissions} <span style="font-size: 16px; color: #9ca3af;">kg CO₂</span></div>
            <p style="margin-top: 10px; margin-bottom: 0; font-weight: 500;" class="${changeClass}">
                ${changeIcon} ${Math.abs(percentageChange)}% vs last week
            </p>
        </div>

        <p class="text-emerald" style="margin-top: 20px; font-weight: bold;">
            🏆 You are in the top ${topCityPercentile}% of eco-warriors in your city this week!
        </p>

        <div class="border-emerald" style="background: rgba(255, 255, 255, 0.05); border-left-width: 4px; border-left-style: solid; padding: 15px; margin-top: 20px; border-radius: 4px;">
            <p style="margin: 0; color: #f3f4f6;"><strong>💡 Your Weekly Tip:</strong></p>
            <p style="margin-top: 5px; margin-bottom: 0; color: #9ca3af;">${tip}</p>
        </div>

        <div class="button-container">
            <a href="https://relief.com/dashboard" class="button">View Dashboard Data</a>
        </div>
    `;

  return sendEmail({
    to: email,
    subject: `Your Weekly ReLief Digest: ${totalEmissions} kg CO₂ tracked 📊`,
    html: getBaseEmailTemplate("Weekly Digest", htmlContent)
  });
};

/**
 * specific helper for Community Interactions
 */
export const sendCommunityInteractionEmail = async (email: string, recipientName: string, actorName: string, actionType: 'like' | 'comment' | 'reply', contentPreview: string) => {
  let actionText = '';
  let icon = '';

  switch (actionType) {
    case 'like':
      actionText = 'liked your post';
      icon = '❤️';
      break;
    case 'comment':
      actionText = 'commented on your post';
      icon = '💬';
      break;
    case 'reply':
      actionText = 'replied to you';
      icon = '↩️';
      break;
  }

  const htmlContent = `
        <h2>New Community Activity ${icon}</h2>
        <p>Hi ${recipientName},</p>
        
        <p><strong>${actorName}</strong> just ${actionText}:</p>
        
        <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; margin: 20px 0; border-radius: 8px; font-style: italic; color: #d1d5db; border-left: 2px solid #3b82f6;">
            "${contentPreview.length > 60 ? contentPreview.substring(0, 60) + '...' : contentPreview}"
        </div>

        <div class="button-container">
            <a href="https://relief.com/feed" class="button" style="background-color: #3b82f6;">View in Community</a>
        </div>
    `;

  return sendEmail({
    to: email,
    subject: `${actorName} ${actionText} on ReLief`,
    html: getBaseEmailTemplate("Community Activity", htmlContent)
  });
};

/**
 * specific helper for Event Reminders
 */
export const sendEventReminderEmail = async (email: string, name: string, eventName: string, dateStr: string, location: string) => {
  const htmlContent = `
        <h2>Event Reminder 📅</h2>
        <p>Hi ${name},</p>
        <p>This is a quick reminder that an eco-event you RSVP'd to is happening tomorrow!</p>
        
        <div class="card border-emerald">
            <div class="card-value text-emerald" style="font-size: 20px;">${eventName}</div>
            <p style="margin-top: 15px; margin-bottom: 5px; color: #f3f4f6;"><strong>When:</strong> ${dateStr}</p>
            <p style="margin: 0; color: #f3f4f6;"><strong>Where:</strong> ${location}</p>
        </div>

        <p>Thank you for showing up for your community and the planet.</p>

        <div class="button-container">
            <a href="https://relief.com/feed/events" class="button">View Event Details</a>
        </div>
    `;

  return sendEmail({
    to: email,
    subject: `Reminder: ${eventName} is tomorrow! 📅`,
    html: getBaseEmailTemplate("Event Reminder", htmlContent)
  });
};

/**
 * specific helper for Activity/Commute Logging
 */
export const sendActivityLoggedEmail = async (email: string, name: string, activityName: string, impact: string) => {
  const htmlContent = `
        <h2>Activity Logged 🌱</h2>
        <p>Hi ${name},</p>
        <p>You successfully logged a new activity: <strong>${activityName}</strong>.</p>
        
        <div class="card border-emerald">
            <p style="margin: 0; color: #9ca3af; text-transform: uppercase; font-size: 12px; font-weight: 600; letter-spacing: 1px;">Carbon Impact</p>
            <div class="card-value" style="font-size: 28px; color: #f3f4f6;">${impact}</div>
        </div>

        <p>Every action counts towards a greener future. Keep up the great work!</p>

        <div class="button-container">
            <a href="https://relief.com/dashboard" class="button">View Dashboard</a>
        </div>
    `;

  return sendEmail({
    to: email,
    subject: `Activity Logged: ${activityName} ✅`,
    html: getBaseEmailTemplate("Activity Logged", htmlContent)
  });
};

/**
 * specific helper for New Community Post
 */
export const sendPostPublishedEmail = async (email: string, name: string, contentPreview: string) => {
  const htmlContent = `
        <h2>Post Published 🗣️</h2>
        <p>Hi ${name},</p>
        <p>Your new post is now live in the ReLief Community!</p>
        
        <div class="border-emerald" style="background: rgba(255, 255, 255, 0.05); padding: 15px; margin: 20px 0; border-radius: 8px; font-style: italic; color: #d1d5db; border-left-width: 2px; border-left-style: solid;">
            "${contentPreview.length > 60 ? contentPreview.substring(0, 60) + '...' : contentPreview}"
        </div>

        <div class="button-container">
            <a href="https://relief.com/feed" class="button">View Your Post</a>
        </div>
    `;

  return sendEmail({
    to: email,
    subject: `Your post is live in the Community! 🌍`,
    html: getBaseEmailTemplate("Post Published", htmlContent)
  });
};
