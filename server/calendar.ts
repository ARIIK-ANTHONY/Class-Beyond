import { google } from 'googleapis';
import type { User } from '@shared/schema';

// Google Calendar configuration
const GOOGLE_CALENDAR_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback',
};

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CALENDAR_CONFIG.clientId,
  GOOGLE_CALENDAR_CONFIG.clientSecret,
  GOOGLE_CALENDAR_CONFIG.redirectUri
);

// Service account for server-side calendar operations (optional)
// You can use this if you have a service account
export function initServiceAccount() {
  try {
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      const serviceAuth = new google.auth.GoogleAuth({
        credentials: serviceAccount,
        scopes: ['https://www.googleapis.com/auth/calendar'],
      });
      return serviceAuth;
    }
  } catch (error) {
    console.error('Failed to initialize service account:', error);
  }
  return null;
}

// Generate OAuth URL for user to grant calendar access
export function getAuthUrl(userId: string): string {
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: userId, // Pass user ID to identify them after OAuth
    prompt: 'consent',
  });
}

// Exchange authorization code for tokens
export async function getTokensFromCode(code: string) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (error) {
    console.error('Error getting tokens:', error);
    throw new Error('Failed to exchange code for tokens');
  }
}

// Set credentials for a user
export function setUserCredentials(accessToken: string, refreshToken?: string) {
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return oauth2Client;
}

// Create a calendar event for mentorship session
interface MentorshipEventData {
  studentName: string;
  studentEmail: string;
  mentorName: string;
  mentorEmail: string;
  subject: string;
  description: string;
  startTime: Date;
  duration: number; // in minutes
  meetingLink?: string;
}

export async function createMentorshipEvent(
  data: MentorshipEventData,
  mentorAccessToken?: string
): Promise<string> {
  try {
    // If mentor has provided their access token, use it
    let auth = oauth2Client;
    if (mentorAccessToken) {
      auth = setUserCredentials(mentorAccessToken);
    }

    const calendar = google.calendar({ version: 'v3', auth });

    const endTime = new Date(data.startTime.getTime() + data.duration * 60000);

    const event = {
      summary: `Mentorship Session: ${data.subject}`,
      description: `${data.description}\n\nStudent: ${data.studentName}\nMentor: ${data.mentorName}${
        data.meetingLink ? `\n\nJoin Meeting: ${data.meetingLink}` : ''
      }`,
      start: {
        dateTime: data.startTime.toISOString(),
        timeZone: 'UTC', // You can make this dynamic based on user timezone
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'UTC',
      },
      attendees: [
        { email: data.studentEmail, displayName: data.studentName },
        { email: data.mentorEmail, displayName: data.mentorName },
      ],
      conferenceData: data.meetingLink
        ? undefined
        : {
            createRequest: {
              requestId: `mentorship-${Date.now()}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
          { method: 'popup', minutes: 10 }, // 10 minutes before
        ],
      },
      guestsCanModify: false,
      guestsCanInviteOthers: false,
      guestsCanSeeOtherGuests: true,
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: data.meetingLink ? 0 : 1,
      sendUpdates: 'all', // Send email invites to all attendees
    });

    return response.data.id || '';
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw new Error('Failed to create calendar event');
  }
}

// Update a calendar event
export async function updateMentorshipEvent(
  eventId: string,
  updates: Partial<MentorshipEventData>,
  mentorAccessToken?: string
): Promise<void> {
  try {
    let auth = oauth2Client;
    if (mentorAccessToken) {
      auth = setUserCredentials(mentorAccessToken);
    }

    const calendar = google.calendar({ version: 'v3', auth });

    const updateData: any = {};

    if (updates.startTime && updates.duration) {
      const endTime = new Date(updates.startTime.getTime() + updates.duration * 60000);
      updateData.start = {
        dateTime: updates.startTime.toISOString(),
        timeZone: 'UTC',
      };
      updateData.end = {
        dateTime: endTime.toISOString(),
        timeZone: 'UTC',
      };
    }

    if (updates.description) {
      updateData.description = updates.description;
    }

    await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      requestBody: updateData,
      sendUpdates: 'all',
    });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw new Error('Failed to update calendar event');
  }
}

// Cancel/delete a calendar event
export async function cancelMentorshipEvent(
  eventId: string,
  mentorAccessToken?: string
): Promise<void> {
  try {
    let auth = oauth2Client;
    if (mentorAccessToken) {
      auth = setUserCredentials(mentorAccessToken);
    }

    const calendar = google.calendar({ version: 'v3', auth });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
      sendUpdates: 'all', // Notify all attendees
    });
  } catch (error) {
    console.error('Error canceling calendar event:', error);
    throw new Error('Failed to cancel calendar event');
  }
}

// Simple calendar event creation without OAuth (using service account or API key)
// This is useful if you want to create events on behalf of users without them granting OAuth
export async function createSimpleCalendarEvent(
  summary: string,
  description: string,
  startTime: Date,
  endTime: Date,
  attendeeEmails: string[]
): Promise<{ htmlLink: string; id: string } | null> {
  try {
    // This requires a service account or API key
    const serviceAuth = initServiceAccount();
    if (!serviceAuth) {
      console.log('No service account configured, skipping calendar creation');
      return null;
    }

    const calendar = google.calendar({ version: 'v3', auth: serviceAuth });

    const event = {
      summary,
      description,
      start: { dateTime: startTime.toISOString(), timeZone: 'UTC' },
      end: { dateTime: endTime.toISOString(), timeZone: 'UTC' },
      attendees: attendeeEmails.map(email => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 10 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      sendUpdates: 'all',
    });

    return {
      htmlLink: response.data.htmlLink || '',
      id: response.data.id || '',
    };
  } catch (error) {
    console.error('Error creating simple calendar event:', error);
    return null;
  }
}

// Get upcoming calendar events for a user
export async function getUpcomingEvents(
  accessToken: string,
  maxResults: number = 10
): Promise<any[]> {
  try {
    const auth = setUserCredentials(accessToken);
    const calendar = google.calendar({ version: 'v3', auth });

    const now = new Date();
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items || [];
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }
}

export default {
  getAuthUrl,
  getTokensFromCode,
  setUserCredentials,
  createMentorshipEvent,
  updateMentorshipEvent,
  cancelMentorshipEvent,
  createSimpleCalendarEvent,
  getUpcomingEvents,
};
