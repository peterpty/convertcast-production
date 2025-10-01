'use client';

import { ViewerProfile } from '../ai/scoringEngine';
import { addDays, format } from 'date-fns';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  sendAt: {
    days?: number;
    hours?: number;
    minutes?: number;
  };
  triggers: {
    registrationStatus: 'registered' | 'abandoned' | 'any';
    minEngagementScore?: number;
    maxEngagementScore?: number;
    hasOpenedPrevious?: boolean;
  };
  incentives?: {
    discount?: number;
    bonusContent?: string[];
    exclusiveAccess?: boolean;
  };
}

export interface EventDetails {
  title: string;
  date: Date;
  time: string;
  duration: string;
  presenters: string[];
  topics: string[];
  registrationUrl: string;
  value: string;
  bonuses: string[];
}

/**
 * ShowUp Surge™ 9-Stage Email Campaign Templates
 * Optimized for maximum attendance and engagement
 */
export class EmailTemplateEngine {
  private templates: EmailTemplate[] = [
    // Stage 1: Instant Confirmation (0 minutes)
    {
      id: 'confirmation',
      name: 'Instant Confirmation',
      subject: '🎉 You\'re IN! {{eventTitle}} - Confirmation & Next Steps',
      htmlContent: this.generateConfirmationHTML(),
      textContent: this.generateConfirmationText(),
      sendAt: { minutes: 0 },
      triggers: {
        registrationStatus: 'registered'
      }
    },

    // Stage 2: Welcome Sequence (2 hours)
    {
      id: 'welcome-sequence',
      name: 'Welcome & Preparation',
      subject: '🚀 Get Ready: What to Expect at {{eventTitle}}',
      htmlContent: this.generateWelcomeHTML(),
      textContent: this.generateWelcomeText(),
      sendAt: { hours: 2 },
      triggers: {
        registrationStatus: 'registered'
      }
    },

    // Stage 3: Value Reinforcement (1 day)
    {
      id: 'value-reinforcement',
      name: 'Value Reinforcement',
      subject: '💰 {{presenterName}} Just Revealed the {{eventTitle}} Agenda',
      htmlContent: this.generateValueHTML(),
      textContent: this.generateValueText(),
      sendAt: { days: 1 },
      triggers: {
        registrationStatus: 'registered',
        hasOpenedPrevious: true
      }
    },

    // Stage 4: Social Proof (3 days)
    {
      id: 'social-proof',
      name: 'Social Proof',
      subject: '🔥 {{registrationCount}}+ Already Registered for {{eventTitle}}',
      htmlContent: this.generateSocialProofHTML(),
      textContent: this.generateSocialProofText(),
      sendAt: { days: 3 },
      triggers: {
        registrationStatus: 'registered'
      }
    },

    // Stage 5: Pre-Event Preparation (1 day before)
    {
      id: 'pre-event-prep',
      name: 'Pre-Event Preparation',
      subject: '⏰ Tomorrow: {{eventTitle}} - Your Preparation Checklist',
      htmlContent: this.generatePreEventHTML(),
      textContent: this.generatePreEventText(),
      sendAt: { days: -1 },
      triggers: {
        registrationStatus: 'registered'
      }
    },

    // Stage 6: Day-Of Reminder (2 hours before)
    {
      id: 'day-of-reminder',
      name: 'Day-Of Reminder',
      subject: '🚨 STARTING IN 2 HOURS: {{eventTitle}} - Join Link Inside',
      htmlContent: this.generateDayOfHTML(),
      textContent: this.generateDayOfText(),
      sendAt: { hours: -2 },
      triggers: {
        registrationStatus: 'registered'
      },
      incentives: {
        bonusContent: ['Early-bird bonus materials', 'Exclusive Q&A session']
      }
    },

    // Stage 7: Final Call (30 minutes before)
    {
      id: 'final-call',
      name: 'Final Call',
      subject: '⚡ FINAL CALL: {{eventTitle}} Starts in 30 Minutes!',
      htmlContent: this.generateFinalCallHTML(),
      textContent: this.generateFinalCallText(),
      sendAt: { minutes: -30 },
      triggers: {
        registrationStatus: 'registered'
      },
      incentives: {
        exclusiveAccess: true
      }
    },

    // Stage 8: Last Minute Incentive (5 minutes before)
    {
      id: 'last-minute',
      name: 'Last Minute Push',
      subject: '🎁 BONUS UNLOCKED: Join {{eventTitle}} in 5 Minutes!',
      htmlContent: this.generateLastMinuteHTML(),
      textContent: this.generateLastMinuteText(),
      sendAt: { minutes: -5 },
      triggers: {
        registrationStatus: 'registered',
        minEngagementScore: 70
      },
      incentives: {
        discount: 50,
        bonusContent: ['Exclusive recording access', 'Implementation templates']
      }
    },

    // Stage 9: Missed Event Recovery (1 hour after)
    {
      id: 'missed-recovery',
      name: 'Missed Event Recovery',
      subject: '😔 You Missed {{eventTitle}} - But Here\'s Your Second Chance',
      htmlContent: this.generateMissedEventHTML(),
      textContent: this.generateMissedEventText(),
      sendAt: { hours: 1 },
      triggers: {
        registrationStatus: 'registered'
      },
      incentives: {
        discount: 30,
        bonusContent: ['Full event recording', 'Bonus implementation session']
      }
    }
  ];

  /**
   * Get all email templates
   */
  getTemplates(): EmailTemplate[] {
    return this.templates;
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): EmailTemplate | undefined {
    return this.templates.find(template => template.id === id);
  }

  /**
   * Generate personalized email content
   */
  generatePersonalizedEmail(
    template: EmailTemplate,
    viewer: ViewerProfile,
    event: EventDetails,
    customData: Record<string, any> = {}
  ) {
    const personalizedSubject = this.personalizeContent(template.subject, viewer, event, customData);
    const personalizedHTML = this.personalizeContent(template.htmlContent, viewer, event, customData);
    const personalizedText = this.personalizeContent(template.textContent, viewer, event, customData);

    return {
      subject: personalizedSubject,
      html: personalizedHTML,
      text: personalizedText,
      incentives: template.incentives
    };
  }

  /**
   * Personalize content with viewer and event data
   */
  private personalizeContent(
    content: string,
    viewer: ViewerProfile,
    event: EventDetails,
    customData: Record<string, any>
  ): string {
    let personalized = content;

    // Replace viewer placeholders
    personalized = personalized.replace(/{{firstName}}/g, viewer.name.split(' ')[0]);
    personalized = personalized.replace(/{{fullName}}/g, viewer.name);
    personalized = personalized.replace(/{{email}}/g, viewer.email);

    // Replace event placeholders
    personalized = personalized.replace(/{{eventTitle}}/g, event.title);
    personalized = personalized.replace(/{{eventDate}}/g, format(event.date, 'MMMM do, yyyy'));
    personalized = personalized.replace(/{{eventTime}}/g, event.time);
    personalized = personalized.replace(/{{duration}}/g, event.duration);
    personalized = personalized.replace(/{{registrationUrl}}/g, event.registrationUrl);
    personalized = personalized.replace(/{{presenterName}}/g, event.presenters[0] || 'Our Expert');

    // Replace custom data
    Object.entries(customData).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      personalized = personalized.replace(placeholder, String(value));
    });

    return personalized;
  }

  // Template Generation Methods
  private generateConfirmationHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8B5CF6, #3B82F6); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { color: white; font-size: 28px; margin: 0; }
        .content { background: white; padding: 40px; border: 1px solid #e2e8f0; }
        .highlight { background: linear-gradient(135deg, #F3F4F6, #E5E7EB); padding: 20px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #8B5CF6, #3B82F6); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 0; }
        .footer { background: #F8FAFC; padding: 20px; text-align: center; font-size: 14px; color: #64748B; border-radius: 0 0 12px 12px; }
        .checklist { background: #FEF3C7; border: 2px solid #F59E0B; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .checklist h3 { color: #92400E; margin-top: 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 You're Officially IN!</h1>
            <p style="color: white; font-size: 18px; margin: 10px 0;">{{eventTitle}} Confirmed</p>
        </div>

        <div class="content">
            <h2>Welcome {{firstName}}! 👋</h2>

            <p>Congratulations! Your spot is secured for <strong>{{eventTitle}}</strong>.</p>

            <div class="highlight">
                <h3>📅 Event Details</h3>
                <p><strong>Date:</strong> {{eventDate}}</p>
                <p><strong>Time:</strong> {{eventTime}}</p>
                <p><strong>Duration:</strong> {{duration}}</p>
                <p><strong>Format:</strong> Live Interactive Training</p>
            </div>

            <div class="checklist">
                <h3>✅ What Happens Next?</h3>
                <ul>
                    <li>📧 You'll receive preparation materials in 2 hours</li>
                    <li>📱 Add this event to your calendar (link below)</li>
                    <li>🔔 Set phone notifications for event day</li>
                    <li>🎯 Join 15 minutes early for bonus content</li>
                </ul>
            </div>

            <p>We'll be sending you everything you need to get the most out of this training, including:</p>

            <ul>
                <li>✨ Pre-event preparation guide</li>
                <li>📋 Implementation worksheets</li>
                <li>🎁 Bonus resources worth $497</li>
                <li>🔥 Exclusive live Q&A access</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{registrationUrl}}/calendar" class="button">📅 Add to Calendar</a>
                <br><br>
                <a href="{{registrationUrl}}/join" class="button">🚀 Join Event</a>
            </div>

            <p><strong>Important:</strong> Keep this email handy - it contains your unique join link!</p>
        </div>

        <div class="footer">
            <p>ConvertCast • The Future of Live Streaming</p>
            <p>Questions? Reply to this email or visit our <a href="{{registrationUrl}}/help">Help Center</a></p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateConfirmationText(): string {
    return `
🎉 You're Officially IN! - {{eventTitle}} Confirmed

Welcome {{firstName}}!

Congratulations! Your spot is secured for {{eventTitle}}.

EVENT DETAILS:
📅 Date: {{eventDate}}
⏰ Time: {{eventTime}}
⏱️ Duration: {{duration}}
🎯 Format: Live Interactive Training

WHAT HAPPENS NEXT:
✅ You'll receive preparation materials in 2 hours
✅ Add this event to your calendar
✅ Set phone notifications for event day
✅ Join 15 minutes early for bonus content

INCLUDED WITH YOUR REGISTRATION:
• Pre-event preparation guide
• Implementation worksheets
• Bonus resources worth $497
• Exclusive live Q&A access

IMPORTANT LINKS:
📅 Add to Calendar: {{registrationUrl}}/calendar
🚀 Join Event: {{registrationUrl}}/join

Keep this email handy - it contains your unique join link!

Questions? Reply to this email or visit: {{registrationUrl}}/help

ConvertCast - The Future of Live Streaming
    `;
  }

  private generateWelcomeHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10B981, #06B6D4); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: white; padding: 40px; border: 1px solid #e2e8f0; }
        .prep-box { background: #EFF6FF; border: 2px solid #3B82F6; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #10B981, #06B6D4); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: white; margin: 0;">🚀 Get Ready!</h1>
            <p style="color: white; font-size: 18px;">{{eventTitle}} Preparation Guide</p>
        </div>

        <div class="content">
            <h2>Hi {{firstName}}, let's get you prepared! 🎯</h2>

            <p>You're registered for <strong>{{eventTitle}}</strong> and I want to make sure you get maximum value from our time together.</p>

            <div class="prep-box">
                <h3>🎯 What You'll Learn</h3>
                <ul>
                    <li>Advanced conversion strategies that increase sales by 200-400%</li>
                    <li>The "ShowUp Surge" method for maximizing event attendance</li>
                    <li>AI-powered audience insights for better targeting</li>
                    <li>Live implementation of tools worth $2,497</li>
                </ul>
            </div>

            <h3>📋 Pre-Event Checklist</h3>
            <ul>
                <li>✅ Download the preparation worksheet (attached)</li>
                <li>✅ Think about your biggest challenge with conversions</li>
                <li>✅ Prepare 2-3 questions for the live Q&A</li>
                <li>✅ Clear your schedule - this will be intensive!</li>
            </ul>

            <p><strong>Pro Tip:</strong> Attendees who complete the pre-work see 3x better results!</p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{registrationUrl}}/resources" class="button">📥 Get Preparation Materials</a>
            </div>

            <p>Looking forward to seeing you at {{eventTime}} on {{eventDate}}!</p>
        </div>

        <div style="background: #F8FAFC; padding: 20px; text-align: center; font-size: 14px; color: #64748B; border-radius: 0 0 12px 12px;">
            <p>Questions? Hit reply - I read every email personally!</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateWelcomeText(): string {
    return `
🚀 Get Ready! - {{eventTitle}} Preparation Guide

Hi {{firstName}}, let's get you prepared!

You're registered for {{eventTitle}} and I want to make sure you get maximum value from our time together.

WHAT YOU'LL LEARN:
🎯 Advanced conversion strategies that increase sales by 200-400%
🎯 The "ShowUp Surge" method for maximizing event attendance
🎯 AI-powered audience insights for better targeting
🎯 Live implementation of tools worth $2,497

PRE-EVENT CHECKLIST:
✅ Download the preparation worksheet
✅ Think about your biggest challenge with conversions
✅ Prepare 2-3 questions for the live Q&A
✅ Clear your schedule - this will be intensive!

Pro Tip: Attendees who complete the pre-work see 3x better results!

Get Preparation Materials: {{registrationUrl}}/resources

Looking forward to seeing you at {{eventTime}} on {{eventDate}}!

Questions? Hit reply - I read every email personally!
    `;
  }

  private generateValueHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #F59E0B, #EF4444); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: white; padding: 40px; border: 1px solid #e2e8f0; }
        .value-box { background: #FEF3C7; border: 2px solid #F59E0B; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .agenda-item { background: #F8FAFC; border-left: 4px solid #8B5CF6; padding: 15px; margin: 10px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #F59E0B, #EF4444); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: white; margin: 0;">💰 The Full Agenda Revealed</h1>
            <p style="color: white; font-size: 18px;">{{eventTitle}} - {{eventDate}}</p>
        </div>

        <div class="content">
            <h2>{{firstName}}, here's what's coming... 🔥</h2>

            <p>I just finalized the agenda for {{eventTitle}}, and honestly, I'm excited about what we're going to cover.</p>

            <div class="value-box">
                <h3>💎 Total Value: $2,497</h3>
                <p><strong>Your Investment: $0</strong></p>
                <p>This is normally what I charge for private consulting, but you're getting it free as a registered attendee.</p>
            </div>

            <h3>📋 Complete Session Agenda</h3>

            <div class="agenda-item">
                <h4>🎯 Module 1: The Conversion Psychology Framework (Worth: $497)</h4>
                <p>The 7 psychological triggers that turn browsers into buyers - with live examples.</p>
            </div>

            <div class="agenda-item">
                <h4>⚡ Module 2: ShowUp Surge Implementation (Worth: $797)</h4>
                <p>My proprietary system for 50-70% higher event attendance - complete blueprint.</p>
            </div>

            <div class="agenda-item">
                <h4>🤖 Module 3: AI Audience Insights Mastery (Worth: $697)</h4>
                <p>How to use AI to predict buyer behavior and optimize your entire funnel.</p>
            </div>

            <div class="agenda-item">
                <h4>🚀 Module 4: Live Implementation Session (Worth: $506)</h4>
                <p>I'll build a complete system live with a volunteer from the audience.</p>
            </div>

            <p><strong>Plus Exclusive Q&A:</strong> I'll answer your specific questions about scaling your business.</p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{registrationUrl}}/join" class="button">🎯 Secure Your Spot</a>
            </div>

            <p>This is going to be the most valuable {{duration}} you'll spend this month.</p>

            <p>See you {{eventTime}} on {{eventDate}}!</p>
        </div>

        <div style="background: #F8FAFC; padding: 20px; text-align: center; font-size: 14px; color: #64748B; border-radius: 0 0 12px 12px;">
            <p>Can't wait to share this with you personally!</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateValueText(): string {
    return `
💰 The Full Agenda Revealed - {{eventTitle}}

{{firstName}}, here's what's coming...

I just finalized the agenda for {{eventTitle}}, and honestly, I'm excited about what we're going to cover.

TOTAL VALUE: $2,497
Your Investment: $0

This is normally what I charge for private consulting, but you're getting it free as a registered attendee.

COMPLETE SESSION AGENDA:

🎯 Module 1: The Conversion Psychology Framework (Worth: $497)
The 7 psychological triggers that turn browsers into buyers - with live examples.

⚡ Module 2: ShowUp Surge Implementation (Worth: $797)
My proprietary system for 50-70% higher event attendance - complete blueprint.

🤖 Module 3: AI Audience Insights Mastery (Worth: $697)
How to use AI to predict buyer behavior and optimize your entire funnel.

🚀 Module 4: Live Implementation Session (Worth: $506)
I'll build a complete system live with a volunteer from the audience.

Plus Exclusive Q&A: I'll answer your specific questions about scaling your business.

This is going to be the most valuable {{duration}} you'll spend this month.

Secure Your Spot: {{registrationUrl}}/join

See you {{eventTime}} on {{eventDate}}!

Can't wait to share this with you personally!
    `;
  }

  private generateSocialProofHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #EF4444, #F97316); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: white; padding: 40px; border: 1px solid #e2e8f0; }
        .testimonial { background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .stats-box { background: #FEF2F2; border: 2px solid #EF4444; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
        .button { display: inline-block; background: linear-gradient(135deg, #EF4444, #F97316); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: white; margin: 0;">🔥 {{registrationCount}}+ Registered!</h1>
            <p style="color: white; font-size: 18px;">{{eventTitle}} is filling up fast...</p>
        </div>

        <div class="content">
            <h2>{{firstName}}, the momentum is building! 📈</h2>

            <p>We're just {{daysUntilEvent}} days away from {{eventTitle}}, and the registration numbers are incredible...</p>

            <div class="stats-box">
                <h3 style="color: #EF4444; margin-top: 0;">🚀 LIVE STATS</h3>
                <p><strong>{{registrationCount}}+ People Registered</strong></p>
                <p><strong>{{countriesCount}} Countries Represented</strong></p>
                <p><strong>92% Plan to Implement Immediately</strong></p>
            </div>

            <p>Here's what some early registrants are saying:</p>

            <div class="testimonial">
                <p>"I've been struggling with low webinar attendance for months. If this ShowUp Surge system delivers what it promises, it'll change everything for my business."</p>
                <p><strong>- Sarah M., Online Course Creator</strong></p>
            </div>

            <div class="testimonial">
                <p>"Finally, someone who understands that getting people to show up is harder than getting them to register. Can't wait to learn the psychology behind it."</p>
                <p><strong>- Marcus T., Digital Marketing Agency Owner</strong></p>
            </div>

            <div class="testimonial">
                <p>"The AI optimization angle is exactly what I need. My current email sequences are getting 12% open rates. Time for an upgrade!"</p>
                <p><strong>- Jennifer L., SaaS Founder</strong></p>
            </div>

            <p><strong>Why are so many people excited?</strong></p>
            <p>Because they know that most events get 30-40% attendance rates, but the ones using advanced systems like ShowUp Surge see 70-80% attendance consistently.</p>

            <p>That's the difference between a failed launch and a $100K month.</p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{registrationUrl}}/join" class="button">🎯 Join {{registrationCount}}+ Others</a>
            </div>

            <p>See you {{eventTime}} on {{eventDate}}!</p>
        </div>

        <div style="background: #F8FAFC; padding: 20px; text-align: center; font-size: 14px; color: #64748B; border-radius: 0 0 12px 12px;">
            <p>The energy is building - I can feel it! 🔥</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateSocialProofText(): string {
    return `
🔥 {{registrationCount}}+ Registered! - {{eventTitle}} is filling up fast...

{{firstName}}, the momentum is building!

We're just {{daysUntilEvent}} days away from {{eventTitle}}, and the registration numbers are incredible...

🚀 LIVE STATS:
• {{registrationCount}}+ People Registered
• {{countriesCount}} Countries Represented
• 92% Plan to Implement Immediately

WHAT REGISTRANTS ARE SAYING:

"I've been struggling with low webinar attendance for months. If this ShowUp Surge system delivers what it promises, it'll change everything for my business."
- Sarah M., Online Course Creator

"Finally, someone who understands that getting people to show up is harder than getting them to register. Can't wait to learn the psychology behind it."
- Marcus T., Digital Marketing Agency Owner

"The AI optimization angle is exactly what I need. My current email sequences are getting 12% open rates. Time for an upgrade!"
- Jennifer L., SaaS Founder

Why are so many people excited?

Because they know that most events get 30-40% attendance rates, but the ones using advanced systems like ShowUp Surge see 70-80% attendance consistently.

That's the difference between a failed launch and a $100K month.

Join {{registrationCount}}+ Others: {{registrationUrl}}/join

See you {{eventTime}} on {{eventDate}}!

The energy is building - I can feel it! 🔥
    `;
  }

  private generatePreEventHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8B5CF6, #EC4899); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: white; padding: 40px; border: 1px solid #e2e8f0; }
        .checklist-box { background: #EFF6FF; border: 2px solid #3B82F6; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .urgent-box { background: #FEF3C7; border: 2px solid #F59E0B; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: white; margin: 0;">⏰ Tomorrow!</h1>
            <p style="color: white; font-size: 18px;">{{eventTitle}} Final Preparation</p>
        </div>

        <div class="content">
            <h2>{{firstName}}, we're 24 hours away! 🚀</h2>

            <p>Tomorrow at {{eventTime}}, we're going live with {{eventTitle}}.</p>

            <p>This is your final preparation email to ensure you get maximum value from our time together.</p>

            <div class="checklist-box">
                <h3>✅ Final 24-Hour Checklist</h3>
                <ul>
                    <li>📅 <strong>Add event to calendar</strong> (if you haven't already)</li>
                    <li>📱 <strong>Set phone reminders</strong> for 2 hours and 30 minutes before</li>
                    <li>🎧 <strong>Test your audio/video</strong> setup</li>
                    <li>📝 <strong>Prepare your questions</strong> for the live Q&A</li>
                    <li>☕ <strong>Clear your schedule</strong> - block {{duration}} without interruptions</li>
                    <li>📊 <strong>Have your current metrics ready</strong> (conversion rates, email stats, etc.)</li>
                </ul>
            </div>

            <div class="urgent-box">
                <h3>⚡ IMPORTANT: Join Early for Bonuses</h3>
                <p>Join 15 minutes early ({{earlyJoinTime}}) to get:</p>
                <ul>
                    <li>🎁 Exclusive bonus materials (worth $297)</li>
                    <li>💬 Pre-event networking with other attendees</li>
                    <li>🎯 Advanced tips that won't be covered in the main session</li>
                </ul>
            </div>

            <h3>🎯 Quick Reminder: What You're Getting</h3>
            <ul>
                <li>Complete ShowUp Surge system for 50-70% higher attendance</li>
                <li>AI optimization strategies for personalized campaigns</li>
                <li>Live implementation session worth $500</li>
                <li>Exclusive Q&A with personalized advice</li>
            </ul>

            <p><strong>Pro Tip:</strong> Come with specific questions about your business. I'll be doing live implementations and want to help solve your exact challenges.</p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{registrationUrl}}/join" class="button">🎯 JOIN TOMORROW</a>
                <br><br>
                <a href="{{registrationUrl}}/calendar" class="button">📅 Add to Calendar</a>
            </div>

            <p>I'm genuinely excited about tomorrow. This is going to be special.</p>

            <p>See you at {{eventTime}}!</p>
        </div>

        <div style="background: #F8FAFC; padding: 20px; text-align: center; font-size: 14px; color: #64748B; border-radius: 0 0 12px 12px;">
            <p>Less than 24 hours to go! 🔥</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generatePreEventText(): string {
    return `
⏰ Tomorrow! - {{eventTitle}} Final Preparation

{{firstName}}, we're 24 hours away!

Tomorrow at {{eventTime}}, we're going live with {{eventTitle}}.

This is your final preparation email to ensure you get maximum value from our time together.

✅ FINAL 24-HOUR CHECKLIST:
📅 Add event to calendar (if you haven't already)
📱 Set phone reminders for 2 hours and 30 minutes before
🎧 Test your audio/video setup
📝 Prepare your questions for the live Q&A
☕ Clear your schedule - block {{duration}} without interruptions
📊 Have your current metrics ready (conversion rates, email stats, etc.)

⚡ IMPORTANT: Join Early for Bonuses

Join 15 minutes early ({{earlyJoinTime}}) to get:
🎁 Exclusive bonus materials (worth $297)
💬 Pre-event networking with other attendees
🎯 Advanced tips that won't be covered in the main session

QUICK REMINDER: What You're Getting
• Complete ShowUp Surge system for 50-70% higher attendance
• AI optimization strategies for personalized campaigns
• Live implementation session worth $500
• Exclusive Q&A with personalized advice

Pro Tip: Come with specific questions about your business. I'll be doing live implementations and want to help solve your exact challenges.

JOIN TOMORROW: {{registrationUrl}}/join
Add to Calendar: {{registrationUrl}}/calendar

I'm genuinely excited about tomorrow. This is going to be special.

See you at {{eventTime}}!

Less than 24 hours to go! 🔥
    `;
  }

  private generateDayOfHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #DC2626, #B91C1C); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: white; padding: 40px; border: 1px solid #e2e8f0; }
        .countdown-box { background: #FEE2E2; border: 3px solid #DC2626; border-radius: 8px; padding: 30px; margin: 20px 0; text-align: center; }
        .join-button { display: inline-block; background: linear-gradient(135deg, #DC2626, #B91C1C); color: white; padding: 20px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; margin: 20px 0; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
        .bonus-box { background: #FBBF24; color: #92400E; border-radius: 8px; padding: 20px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: white; margin: 0; font-size: 32px;">🚨 STARTING IN 2 HOURS!</h1>
            <p style="color: white; font-size: 20px;">{{eventTitle}} - Today!</p>
        </div>

        <div class="content">
            <h2>{{firstName}}, it's TODAY! ⚡</h2>

            <div class="countdown-box">
                <h3 style="color: #DC2626; font-size: 24px; margin: 0;">⏰ 2 HOURS TO GO!</h3>
                <p style="font-size: 18px; margin: 10px 0;"><strong>{{eventTime}} Today</strong></p>
            </div>

            <p><strong>Your join link is ready:</strong></p>

            <div style="text-align: center;">
                <a href="{{registrationUrl}}/join" class="join-button">🚀 JOIN NOW</a>
            </div>

            <div class="bonus-box">
                <h3>🎁 EARLY-BIRD BONUSES (Join 15 Min Early)</h3>
                <ul>
                    <li>$297 Conversion Psychology Cheat Sheet</li>
                    <li>Pre-event networking session</li>
                    <li>Exclusive implementation templates</li>
                </ul>
                <p><strong>Early access starts at: {{earlyJoinTime}}</strong></p>
            </div>

            <h3>🎯 Final Reminders:</h3>
            <ul>
                <li>✅ Close all other apps/browser tabs</li>
                <li>✅ Use headphones for best audio quality</li>
                <li>✅ Have pen and paper ready for notes</li>
                <li>✅ Prepare your questions for live Q&A</li>
                <li>✅ Clear distractions for full {{duration}}</li>
            </ul>

            <p><strong>What happens if you can't make it?</strong></p>
            <p>Don't worry - this session is being recorded and you'll get the replay. But honestly, the live experience is 10x more valuable because of the real-time Q&A and implementation.</p>

            <p><strong>This is going to be incredible.</strong> I've spent weeks preparing and I can't wait to share everything with you.</p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{registrationUrl}}/join" class="join-button">🎯 SEE YOU IN 2 HOURS!</a>
            </div>

            <p style="text-align: center; font-size: 18px; color: #DC2626;"><strong>Save this email - you'll need the join link!</strong></p>
        </div>

        <div style="background: #F8FAFC; padding: 20px; text-align: center; font-size: 14px; color: #64748B; border-radius: 0 0 12px 12px;">
            <p>The moment we've all been waiting for! 🔥</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateDayOfText(): string {
    return `
🚨 STARTING IN 2 HOURS! - {{eventTitle}} TODAY!

{{firstName}}, it's TODAY!

⏰ 2 HOURS TO GO!
{{eventTime}} Today

YOUR JOIN LINK IS READY:
{{registrationUrl}}/join

🎁 EARLY-BIRD BONUSES (Join 15 Min Early)
• $297 Conversion Psychology Cheat Sheet
• Pre-event networking session
• Exclusive implementation templates

Early access starts at: {{earlyJoinTime}}

🎯 FINAL REMINDERS:
✅ Close all other apps/browser tabs
✅ Use headphones for best audio quality
✅ Have pen and paper ready for notes
✅ Prepare your questions for live Q&A
✅ Clear distractions for full {{duration}}

What happens if you can't make it?

Don't worry - this session is being recorded and you'll get the replay. But honestly, the live experience is 10x more valuable because of the real-time Q&A and implementation.

This is going to be incredible. I've spent weeks preparing and I can't wait to share everything with you.

🎯 SEE YOU IN 2 HOURS: {{registrationUrl}}/join

Save this email - you'll need the join link!

The moment we've all been waiting for! 🔥
    `;
  }

  private generateFinalCallHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #B91C1C, #7C2D12); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; animation: urgentGlow 1s ease-in-out infinite alternate; }
        @keyframes urgentGlow { 0% { box-shadow: 0 0 5px #B91C1C; } 100% { box-shadow: 0 0 20px #B91C1C; } }
        .content { background: white; padding: 40px; border: 1px solid #e2e8f0; }
        .final-countdown { background: #FEE2E2; border: 4px solid #DC2626; border-radius: 12px; padding: 30px; margin: 20px 0; text-align: center; animation: shake 0.5s ease-in-out infinite; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .mega-button { display: inline-block; background: linear-gradient(135deg, #DC2626, #7C2D12); color: white; padding: 25px 50px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 20px; animation: pulse 1.5s infinite; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: white; margin: 0; font-size: 36px;">⚡ FINAL CALL!</h1>
            <p style="color: white; font-size: 24px;">30 MINUTES TO GO!</p>
        </div>

        <div class="content">
            <h2>{{firstName}}, this is it! 🚨</h2>

            <div class="final-countdown">
                <h3 style="color: #DC2626; font-size: 28px; margin: 0;">⏰ 30 MINUTES!</h3>
                <p style="font-size: 20px; margin: 10px 0;"><strong>{{eventTitle}} starts NOW</strong></p>
            </div>

            <p><strong>Don't miss out on what hundreds of others are about to experience...</strong></p>

            <ul style="font-size: 18px;">
                <li>🎯 The ShowUp Surge system that boosts attendance 50-70%</li>
                <li>⚡ AI optimization secrets worth $2,497</li>
                <li>🚀 Live implementation session</li>
                <li>💬 Personal Q&A with your specific questions</li>
            </ul>

            <p style="font-size: 18px; color: #DC2626;"><strong>This is your last chance to join live.</strong></p>

            <div style="text-align: center; margin: 40px 0;">
                <a href="{{registrationUrl}}/join" class="mega-button">🔥 JOIN RIGHT NOW!</a>
            </div>

            <p style="text-align: center; font-size: 16px;"><strong>Click the link above and I'll see you in 30 minutes!</strong></p>

            <p style="text-align: center; font-size: 14px; color: #666;">Missing this would be the biggest mistake you make this month.</p>
        </div>

        <div style="background: #DC2626; color: white; padding: 20px; text-align: center; font-size: 16px; border-radius: 0 0 12px 12px;">
            <p style="margin: 0;"><strong>⏰ 30 MINUTES LEFT! ⏰</strong></p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateFinalCallText(): string {
    return `
⚡ FINAL CALL! - 30 MINUTES TO GO!

{{firstName}}, this is it!

⏰ 30 MINUTES!
{{eventTitle}} starts NOW

Don't miss out on what hundreds of others are about to experience...

🎯 The ShowUp Surge system that boosts attendance 50-70%
⚡ AI optimization secrets worth $2,497
🚀 Live implementation session
💬 Personal Q&A with your specific questions

This is your last chance to join live.

🔥 JOIN RIGHT NOW: {{registrationUrl}}/join

Click the link above and I'll see you in 30 minutes!

Missing this would be the biggest mistake you make this month.

⏰ 30 MINUTES LEFT! ⏰
    `;
  }

  private generateLastMinuteHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(45deg, #DC2626, #F59E0B, #DC2626); background-size: 300% 300%; animation: gradientShift 2s ease infinite; padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
        @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .content { background: white; padding: 40px; border: 1px solid #e2e8f0; }
        .urgent-timer { background: #FEE2E2; border: 4px solid #DC2626; border-radius: 12px; padding: 30px; margin: 20px 0; text-align: center; }
        .bonus-unlock { background: #FBBF24; color: #92400E; border-radius: 12px; padding: 25px; margin: 20px 0; border: 3px solid #F59E0B; }
        .emergency-button { display: inline-block; background: linear-gradient(135deg, #DC2626, #F59E0B); color: white; padding: 25px 50px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 22px; animation: emergency 1s infinite; }
        @keyframes emergency { 0%, 100% { transform: scale(1) rotate(0deg); } 50% { transform: scale(1.1) rotate(1deg); } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: white; margin: 0; font-size: 40px;">🎁 BONUS UNLOCKED!</h1>
            <p style="color: white; font-size: 26px;">5 MINUTES TO GO!</p>
        </div>

        <div class="content">
            <h2>{{firstName}}, EMERGENCY BONUS ACTIVATED! ⚡</h2>

            <div class="urgent-timer">
                <h3 style="color: #DC2626; font-size: 32px; margin: 0;">⏰ 5 MINUTES!</h3>
                <p style="font-size: 22px; margin: 10px 0;"><strong>Last chance to join!</strong></p>
            </div>

            <div class="bonus-unlock">
                <h3 style="margin-top: 0;">🚨 EMERGENCY BONUS UNLOCKED!</h3>
                <p><strong>Because you're a committed action-taker, you just unlocked:</strong></p>
                <ul>
                    <li>🎯 50% OFF my next premium course ($497 value)</li>
                    <li>📹 Exclusive recording access (even if you miss live)</li>
                    <li>📋 Done-for-you implementation templates</li>
                    <li>💬 Priority access to my private mastermind</li>
                </ul>
                <p style="color: #DC2626;"><strong>This bonus expires when the session starts!</strong></p>
            </div>

            <p style="font-size: 20px; color: #DC2626; text-align: center;"><strong>The session is starting RIGHT NOW!</strong></p>

            <div style="text-align: center; margin: 40px 0;">
                <a href="{{registrationUrl}}/join" class="emergency-button">🚀 GRAB BONUS & JOIN!</a>
            </div>

            <p style="text-align: center; font-size: 18px;"><strong>Don't let this opportunity slip away!</strong></p>

            <p style="text-align: center; font-size: 16px; color: #666;">I'm literally starting in 5 minutes. This is your final moment.</p>
        </div>

        <div style="background: linear-gradient(45deg, #DC2626, #F59E0B); color: white; padding: 20px; text-align: center; font-size: 18px; border-radius: 0 0 12px 12px;">
            <p style="margin: 0;"><strong>🚨 BONUS EXPIRES IN 5 MINUTES! 🚨</strong></p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateLastMinuteText(): string {
    return `
🎁 BONUS UNLOCKED! - 5 MINUTES TO GO!

{{firstName}}, EMERGENCY BONUS ACTIVATED!

⏰ 5 MINUTES!
Last chance to join!

🚨 EMERGENCY BONUS UNLOCKED!

Because you're a committed action-taker, you just unlocked:

🎯 50% OFF my next premium course ($497 value)
📹 Exclusive recording access (even if you miss live)
📋 Done-for-you implementation templates
💬 Priority access to my private mastermind

This bonus expires when the session starts!

The session is starting RIGHT NOW!

🚀 GRAB BONUS & JOIN: {{registrationUrl}}/join

Don't let this opportunity slip away!

I'm literally starting in 5 minutes. This is your final moment.

🚨 BONUS EXPIRES IN 5 MINUTES! 🚨
    `;
  }

  private generateMissedEventHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6B7280, #374151); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: white; padding: 40px; border: 1px solid #e2e8f0; }
        .recovery-box { background: #FBBF24; color: #92400E; border-radius: 8px; padding: 20px; margin: 20px 0; border: 2px solid #F59E0B; }
        .recording-box { background: #EFF6FF; border: 2px solid #3B82F6; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #F59E0B, #EF4444); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: white; margin: 0;">😔 You Missed It...</h1>
            <p style="color: white; font-size: 18px;">But here's your second chance!</p>
        </div>

        <div class="content">
            <h2>{{firstName}}, don't worry - I've got you covered! 🎯</h2>

            <p>I know life happens. Maybe something urgent came up, or you simply forgot.</p>

            <p><strong>The good news?</strong> The {{eventTitle}} session was incredible, and I made sure to record everything for people just like you.</p>

            <div class="recovery-box">
                <h3>🎁 MISSED EVENT RECOVERY PACKAGE</h3>
                <p><strong>Normally $297, but FREE for registered attendees:</strong></p>
                <ul>
                    <li>📹 Complete session recording ({{duration}} of pure value)</li>
                    <li>📋 All presentation slides and worksheets</li>
                    <li>🎯 Bonus implementation session (30 min private video)</li>
                    <li>📧 Email templates used by attendees</li>
                </ul>
            </div>

            <div class="recording-box">
                <h3>📹 What You Missed (And Will Now Get)</h3>
                <ul>
                    <li>The complete ShowUp Surge system that increases attendance by 50-70%</li>
                    <li>AI optimization strategies for personalized campaigns</li>
                    <li>Live case study implementation (worth $500)</li>
                    <li>Q&A session with solutions to common challenges</li>
                </ul>
            </div>

            <p><strong>Plus, since you missed the live session, I'm adding a special bonus:</strong></p>

            <ul>
                <li>🎯 30% discount on my premium ShowUp Surge course</li>
                <li>📱 Text message templates for SMS campaigns</li>
                <li>🤖 AI prompt library for content creation</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{registrationUrl}}/recording" class="button">📹 GET RECORDING + BONUSES</a>
            </div>

            <p><strong>Available for 48 hours only.</strong></p>

            <p>Look, I understand that missing the live session might feel like a setback, but many of my most successful students actually got their breakthrough from watching the recording because they could pause, rewind, and really implement each step.</p>

            <p>Don't let this be the end of your journey. Get the recording and start implementing today.</p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{registrationUrl}}/recording" class="button">🚀 START MY COMEBACK</a>
            </div>
        </div>

        <div style="background: #F8FAFC; padding: 20px; text-align: center; font-size: 14px; color: #64748B; border-radius: 0 0 12px 12px;">
            <p>Your success story starts with the next action you take.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateMissedEventText(): string {
    return `
😔 You Missed It... But here's your second chance!

{{firstName}}, don't worry - I've got you covered!

I know life happens. Maybe something urgent came up, or you simply forgot.

The good news? The {{eventTitle}} session was incredible, and I made sure to record everything for people just like you.

🎁 MISSED EVENT RECOVERY PACKAGE

Normally $297, but FREE for registered attendees:

📹 Complete session recording ({{duration}} of pure value)
📋 All presentation slides and worksheets
🎯 Bonus implementation session (30 min private video)
📧 Email templates used by attendees

WHAT YOU MISSED (And Will Now Get):
• The complete ShowUp Surge system that increases attendance by 50-70%
• AI optimization strategies for personalized campaigns
• Live case study implementation (worth $500)
• Q&A session with solutions to common challenges

Plus, since you missed the live session, I'm adding a special bonus:

🎯 30% discount on my premium ShowUp Surge course
📱 Text message templates for SMS campaigns
🤖 AI prompt library for content creation

GET RECORDING + BONUSES: {{registrationUrl}}/recording

Available for 48 hours only.

Look, I understand that missing the live session might feel like a setback, but many of my most successful students actually got their breakthrough from watching the recording because they could pause, rewind, and really implement each step.

Don't let this be the end of your journey. Get the recording and start implementing today.

🚀 START MY COMEBACK: {{registrationUrl}}/recording

Your success story starts with the next action you take.
    `;
  }
}

// Export singleton instance
export const emailTemplateEngine = new EmailTemplateEngine();