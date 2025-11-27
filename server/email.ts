import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD, // Use App Password, not regular password
  },
});

// Email templates
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface NotificationEmailData {
  recipientEmail: string;
  recipientName: string;
  type: string;
  message: string;
  relatedId?: string;
}

// Generate email content based on notification type
function generateEmailTemplate(data: NotificationEmailData): EmailTemplate {
  const { type, message, recipientName, relatedId } = data;
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  switch (type) {
    case 'mentorship_request':
      return {
        subject: 'New Mentorship Request - ClassBeyond',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">📚 ClassBeyond</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937;">Hello ${recipientName}! 👋</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">${message}</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${appUrl}/mentor" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Mentorship Requests</a>
              </div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="color: #6b7280; font-size: 14px; text-align: center;">This is an automated notification from ClassBeyond</p>
            </div>
          </div>
        `,
        text: `Hello ${recipientName}!\n\n${message}\n\nView your mentorship requests at: ${appUrl}/mentor\n\nThis is an automated notification from ClassBeyond`,
      };

    case 'mentorship_approved':
      return {
        subject: 'Mentorship Request Approved - ClassBeyond',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">✅ Great News!</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937;">Hello ${recipientName}! 🎉</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">${message}</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${appUrl}/student" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Your Mentorship</a>
              </div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="color: #6b7280; font-size: 14px; text-align: center;">This is an automated notification from ClassBeyond</p>
            </div>
          </div>
        `,
        text: `Hello ${recipientName}!\n\n${message}\n\nView your mentorship at: ${appUrl}/student\n\nThis is an automated notification from ClassBeyond`,
      };

    case 'mentorship_scheduled':
      return {
        subject: 'Mentorship Session Scheduled - ClassBeyond',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">📅 Session Scheduled</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937;">Hello ${recipientName}! 🎓</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">${message}</p>
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #8b5cf6; margin: 20px 0;">
                <p style="color: #4b5563; margin: 0;">💡 <strong>Tip:</strong> You'll also receive a Google Calendar invitation with the meeting link.</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${appUrl}/student" style="background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Session Details</a>
              </div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="color: #6b7280; font-size: 14px; text-align: center;">This is an automated notification from ClassBeyond</p>
            </div>
          </div>
        `,
        text: `Hello ${recipientName}!\n\n${message}\n\nYou'll also receive a Google Calendar invitation with the meeting link.\n\nView session details at: ${appUrl}/student\n\nThis is an automated notification from ClassBeyond`,
      };

    case 'badge_earned':
      return {
        subject: 'Congratulations! You Earned a Badge - ClassBeyond',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">🏆 Achievement Unlocked!</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937;">Amazing work, ${recipientName}! 🌟</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">${message}</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${appUrl}/badges" style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View All Your Badges</a>
              </div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="color: #6b7280; font-size: 14px; text-align: center;">This is an automated notification from ClassBeyond</p>
            </div>
          </div>
        `,
        text: `Amazing work, ${recipientName}!\n\n${message}\n\nView all your badges at: ${appUrl}/badges\n\nThis is an automated notification from ClassBeyond`,
      };

    case 'lesson_available':
      return {
        subject: 'New Lesson Available - ClassBeyond',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">📖 New Lesson!</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937;">Hello ${recipientName}! 📚</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">${message}</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${appUrl}/lessons" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Browse Lessons</a>
              </div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="color: #6b7280; font-size: 14px; text-align: center;">This is an automated notification from ClassBeyond</p>
            </div>
          </div>
        `,
        text: `Hello ${recipientName}!\n\n${message}\n\nBrowse lessons at: ${appUrl}/lessons\n\nThis is an automated notification from ClassBeyond`,
      };

    case 'quiz_reminder':
      return {
        subject: 'Quiz Reminder - ClassBeyond',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">⏰ Quiz Reminder</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937;">Hello ${recipientName}! ✍️</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">${message}</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${appUrl}/quiz/${relatedId}" style="background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Take Quiz Now</a>
              </div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="color: #6b7280; font-size: 14px; text-align: center;">This is an automated notification from ClassBeyond</p>
            </div>
          </div>
        `,
        text: `Hello ${recipientName}!\n\n${message}\n\nTake the quiz at: ${appUrl}/quiz/${relatedId}\n\nThis is an automated notification from ClassBeyond`,
      };

    default:
      return {
        subject: 'New Notification - ClassBeyond',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">📚 ClassBeyond</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937;">Hello ${recipientName}! 👋</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">${message}</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${appUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Go to ClassBeyond</a>
              </div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="color: #6b7280; font-size: 14px; text-align: center;">This is an automated notification from ClassBeyond</p>
            </div>
          </div>
        `,
        text: `Hello ${recipientName}!\n\n${message}\n\nVisit ClassBeyond at: ${appUrl}\n\nThis is an automated notification from ClassBeyond`,
      };
  }
}

// Send notification email
export async function sendNotificationEmail(data: NotificationEmailData): Promise<boolean> {
  // Skip if email is not configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('Email not configured, skipping email notification');
    return false;
  }

  try {
    const template = generateEmailTemplate(data);

    await transporter.sendMail({
      from: `"ClassBeyond" <${process.env.EMAIL_USER}>`,
      to: data.recipientEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    console.log(`Email sent successfully to ${data.recipientEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Send custom email (for other purposes)
export async function sendCustomEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('Email not configured, skipping email');
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"ClassBeyond" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''),
      html,
    });

    console.log(`Custom email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending custom email:', error);
    return false;
  }
}

// Test email configuration
export async function testEmailConnection(): Promise<boolean> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('Email not configured');
    return false;
  }

  try {
    await transporter.verify();
    console.log('Email server connection verified');
    return true;
  } catch (error) {
    console.error('Email server connection failed:', error);
    return false;
  }
}

export default {
  sendNotificationEmail,
  sendCustomEmail,
  testEmailConnection,
};
