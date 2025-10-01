import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const {
      orderID,
      sessionId
    } = await req.json();

    // Validate input
    if (!orderID || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // PayPal API configuration
    const paypalConfig = {
      sandbox: {
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET,
        baseURL: 'https://api.sandbox.paypal.com'
      },
      production: {
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET,
        baseURL: 'https://api.paypal.com'
      }
    };

    const isProduction = process.env.NODE_ENV === 'production';
    const config = isProduction ? paypalConfig.production : paypalConfig.sandbox;

    // Get PayPal access token
    const authResponse = await fetch(`${config.baseURL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!authResponse.ok) {
      throw new Error('PayPal authentication failed');
    }

    const { access_token } = await authResponse.json();

    // Capture the payment
    const captureResponse = await fetch(`${config.baseURL}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `${sessionId}-capture`
      }
    });

    if (!captureResponse.ok) {
      const errorData = await captureResponse.text();
      console.error('PayPal capture failed:', errorData);
      throw new Error('PayPal payment capture failed');
    }

    const captureData = await captureResponse.json();

    // Validate capture status
    if (captureData.status !== 'COMPLETED') {
      throw new Error('PayPal payment capture not completed');
    }

    // Extract payment details
    const capture = captureData.purchase_units[0].payments.captures[0];
    const amount = parseFloat(capture.amount.value);
    const currency = capture.amount.currency_code;

    return NextResponse.json({
      success: true,
      paymentId: capture.id,
      amount,
      currency,
      status: 'completed',
      paypalOrderId: orderID,
      captureDetails: {
        id: capture.id,
        status: capture.status,
        amount: capture.amount,
        createTime: capture.create_time,
        updateTime: capture.update_time
      }
    });

  } catch (error) {
    console.error('Capture PayPal payment error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}