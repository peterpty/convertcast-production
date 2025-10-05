import { NextRequest, NextResponse } from 'next/server';
import { areServicesConfigured, sendEmail, sendSms } from '@/lib/notifications/notificationService';

/**
 * Test endpoint for notification services
 * GET /api/test-notifications
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing notification services...');

    // Check if services are configured
    const configured = areServicesConfigured();

    const results = {
      configured,
      tests: {
        email: null as any,
        sms: null as any,
      },
      timestamp: new Date().toISOString(),
    };

    // Test email if configured
    if (configured.email) {
      console.log('📧 Testing Mailgun email...');
      try {
        const emailResult = await sendEmail({
          to: 'test@example.com', // Won't actually send to invalid domain
          subject: 'ConvertCast Test Email',
          html: '<h1>Test Email</h1><p>If you see this, Mailgun is configured correctly!</p>',
          text: 'Test Email - Mailgun is configured correctly!',
          tags: ['test'],
        });

        results.tests.email = emailResult;
      } catch (error) {
        results.tests.email = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          service: 'email',
        };
      }
    } else {
      results.tests.email = {
        success: false,
        error: 'Mailgun not configured - missing MAILGUN_API_KEY or MAILGUN_DOMAIN',
        service: 'email',
      };
    }

    // Test SMS if configured
    if (configured.sms) {
      console.log('📱 Testing Twilio SMS...');
      try {
        // Use a test number that won't actually send
        const smsResult = await sendSms({
          to: '+15005550006', // Twilio magic test number
          body: 'ConvertCast test message - SMS is working!',
        });

        results.tests.sms = smsResult;
      } catch (error) {
        results.tests.sms = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          service: 'sms',
        };
      }
    } else {
      results.tests.sms = {
        success: false,
        error: 'Twilio not configured - missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER',
        service: 'sms',
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Notification service test completed',
      results,
    });
  } catch (error) {
    console.error('❌ Test notification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
