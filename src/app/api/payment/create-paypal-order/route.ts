import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const {
      amount,
      currency,
      sessionId
    } = await req.json();

    // Validate input
    if (!amount || !currency || !sessionId) {
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

    // Create PayPal order
    const orderResponse = await fetch(`${config.baseURL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': sessionId
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: sessionId,
            amount: {
              currency_code: currency.toUpperCase(),
              value: amount.toFixed(2)
            },
            description: 'ConvertCast Premium Training Program'
          }
        ],
        application_context: {
          brand_name: 'ConvertCast',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${req.nextUrl.origin}/payment/success`,
          cancel_url: `${req.nextUrl.origin}/payment/cancelled`
        }
      })
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.text();
      console.error('PayPal order creation failed:', errorData);
      throw new Error('PayPal order creation failed');
    }

    const orderData = await orderResponse.json();

    return NextResponse.json({
      orderID: orderData.id
    });

  } catch (error) {
    console.error('Create PayPal order error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}