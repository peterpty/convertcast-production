'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { autoOfferPaymentEngine, PaymentOffer, PaymentSession } from '@/lib/payment/paymentEngine';
import { ViewerProfile } from '@/lib/ai/scoringEngine';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51234567890abcdef');

interface InStreamCheckoutProps {
  viewer: ViewerProfile;
  offer: PaymentOffer;
  onClose: () => void;
  onSuccess: (session: PaymentSession) => void;
  onError: (error: string) => void;
}

interface CountdownTimerProps {
  timeLeft: number;
  onExpired: () => void;
}

const CountdownTimer = ({ timeLeft, onExpired }: CountdownTimerProps) => {
  const [seconds, setSeconds] = useState(timeLeft);

  useEffect(() => {
    if (seconds <= 0) {
      onExpired();
      return;
    }

    const interval = setInterval(() => {
      setSeconds(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, onExpired]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const urgencyColor = seconds < 300 ? 'text-red-400' : seconds < 900 ? 'text-orange-400' : 'text-yellow-400';

  return (
    <div className="flex items-center justify-center space-x-2 animate-pulse">
      <span className="text-white text-sm">⏰</span>
      <span className={`font-mono text-lg font-bold ${urgencyColor}`}>
        {formatTime(seconds)}
      </span>
      <span className="text-gray-400 text-sm">left</span>
    </div>
  );
};

interface PaymentFormProps {
  offer: PaymentOffer;
  viewer: ViewerProfile;
  onSuccess: (session: PaymentSession) => void;
  onError: (error: string) => void;
}

const StripePaymentForm = ({ offer, viewer, onSuccess, onError }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [email, setEmail] = useState(viewer.email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError('Stripe not loaded');
      return;
    }

    setProcessing(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError('Card element not found');
      setProcessing(false);
      return;
    }

    try {
      // Create payment session
      const session = autoOfferPaymentEngine.createPaymentSession(
        viewer,
        offer,
        'stripe'
      );

      // Create payment intent on server (mocked for demo)
      const response = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(offer.finalPrice * 100), // Convert to cents
          currency: offer.currency.toLowerCase(),
          sessionId: session.id,
          customerEmail: email
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret, paymentIntentId } = await response.json();

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: email,
            name: viewer.name,
          },
        },
      });

      if (error) {
        onError(error.message || 'Payment failed');
        autoOfferPaymentEngine.updateSessionStatus(session.id, 'failed');
      } else if (paymentIntent?.status === 'succeeded') {
        autoOfferPaymentEngine.updateSessionStatus(session.id, 'completed', paymentIntent.id);
        onSuccess(session);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-white text-sm mb-2">Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-400 focus:outline-none"
          required
        />
      </div>

      <div>
        <label className="block text-white text-sm mb-2">Card Details</label>
        <div className="bg-gray-800 p-3 rounded border border-gray-600">
          <CardElement
            options={{
              style: {
                base: {
                  color: '#ffffff',
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: '16px',
                  '::placeholder': {
                    color: '#9ca3af',
                  },
                },
              },
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            <span>Processing...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <span>💳</span>
            <span>Secure Checkout - {autoOfferPaymentEngine.formatPrice(offer.finalPrice, offer.currency)}</span>
          </div>
        )}
      </button>

      <div className="flex items-center justify-center space-x-2 text-gray-400 text-xs">
        <span>🔒</span>
        <span>Secured by Stripe • SSL Encrypted</span>
      </div>
    </form>
  );
};

const PayPalPaymentForm = ({ offer, viewer, onSuccess, onError }: PaymentFormProps) => {
  const createOrder = async () => {
    const session = autoOfferPaymentEngine.createPaymentSession(
      viewer,
      offer,
      'paypal'
    );

    try {
      const response = await fetch('/api/payment/create-paypal-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: offer.finalPrice,
          currency: offer.currency,
          sessionId: session.id,
        }),
      });

      const { orderID } = await response.json();
      return orderID;
    } catch (error) {
      onError('Failed to create PayPal order');
      throw error;
    }
  };

  const onApprove = async (data: any) => {
    try {
      const response = await fetch('/api/payment/capture-paypal-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderID: data.orderID,
        }),
      });

      const captureData = await response.json();

      if (captureData.status === 'COMPLETED') {
        const sessions = Array.from((autoOfferPaymentEngine as any).activeSessions.values())
          .find((s: PaymentSession) => s.paypalOrderId === data.orderID);

        if (sessions) {
          autoOfferPaymentEngine.updateSessionStatus(sessions.id, 'completed', data.orderID);
          onSuccess(sessions);
        }
      }
    } catch (error) {
      onError('PayPal payment capture failed');
    }
  };

  return (
    <div className="space-y-4">
      <PayPalButtons
        createOrder={createOrder}
        onApprove={onApprove}
        onError={(err) => onError('PayPal payment failed')}
        style={{
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'checkout',
          height: 50
        }}
      />

      <div className="flex items-center justify-center space-x-2 text-gray-400 text-xs">
        <span>🔒</span>
        <span>Secured by PayPal • Buyer Protection</span>
      </div>
    </div>
  );
};

export function InStreamCheckout({ viewer, offer, onClose, onSuccess, onError }: InStreamCheckoutProps) {
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');
  const [offerExpired, setOfferExpired] = useState(false);

  const handleOfferExpired = () => {
    setOfferExpired(true);
    setTimeout(() => {
      onClose();
    }, 3000);
  };

  if (offerExpired) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border-2 border-red-500 text-center">
          <div className="text-6xl mb-4">⏰</div>
          <h2 className="text-white text-2xl font-bold mb-4">Offer Expired</h2>
          <p className="text-gray-400 mb-6">This special offer has expired. Don't miss out next time!</p>
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-purple-500 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white text-2xl font-bold">{offer.name}</h2>
              <p className="text-purple-200 text-sm mt-1">Exclusive In-Stream Offer</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Urgency Timer */}
          {offer.urgency.enabled && offer.urgency.timeLeft && (
            <div className="bg-gradient-to-r from-red-900/50 to-orange-900/50 border border-red-500 rounded-xl p-4 text-center">
              <div className="text-red-400 font-bold text-sm mb-2 animate-pulse">
                🚨 {offer.urgency.message}
              </div>
              <CountdownTimer
                timeLeft={offer.urgency.timeLeft}
                onExpired={handleOfferExpired}
              />
            </div>
          )}

          {/* Pricing Display */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="text-center">
              {offer.discountPercentage && offer.discountPercentage > 0 && (
                <div className="mb-2">
                  <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                    {offer.discountPercentage}% OFF
                  </span>
                </div>
              )}

              <div className="flex items-center justify-center space-x-3">
                {offer.discountPercentage && offer.discountPercentage > 0 && (
                  <span className="text-gray-400 line-through text-xl">
                    {autoOfferPaymentEngine.formatPrice(offer.basePrice, offer.currency)}
                  </span>
                )}
                <span className="text-white text-4xl font-bold">
                  {autoOfferPaymentEngine.formatPrice(offer.finalPrice, offer.currency)}
                </span>
              </div>

              {offer.discountPercentage && offer.discountPercentage > 0 && (
                <p className="text-green-400 text-sm mt-2 font-medium">
                  You save {autoOfferPaymentEngine.formatPrice(offer.basePrice - offer.finalPrice, offer.currency)}!
                </p>
              )}
            </div>
          </div>

          {/* Scarcity Messaging */}
          {offer.scarcity.enabled && (
            <div className="bg-yellow-900/30 border border-yellow-500 rounded-xl p-4 text-center">
              <div className="text-yellow-400 font-bold text-sm animate-pulse">
                🔥 {offer.scarcity.message}
              </div>
            </div>
          )}

          {/* Features List */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-white font-bold text-lg mb-4">What's Included:</h3>
            <div className="space-y-3">
              {offer.features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="text-green-400 mt-1 flex-shrink-0">✓</div>
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setPaymentMethod('stripe')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  paymentMethod === 'stripe'
                    ? 'border-blue-500 bg-blue-900/30 text-white'
                    : 'border-gray-600 bg-gray-800 text-gray-400'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>💳</span>
                  <span className="font-medium">Credit Card</span>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('paypal')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  paymentMethod === 'paypal'
                    ? 'border-blue-500 bg-blue-900/30 text-white'
                    : 'border-gray-600 bg-gray-800 text-gray-400'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>🅿️</span>
                  <span className="font-medium">PayPal</span>
                </div>
              </button>
            </div>

            {/* Payment Forms */}
            {paymentMethod === 'stripe' && (
              <Elements stripe={stripePromise}>
                <StripePaymentForm
                  offer={offer}
                  viewer={viewer}
                  onSuccess={onSuccess}
                  onError={onError}
                />
              </Elements>
            )}

            {paymentMethod === 'paypal' && (
              <PayPalScriptProvider
                options={{
                  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sandbox-client-id',
                  currency: offer.currency
                }}
              >
                <PayPalPaymentForm
                  offer={offer}
                  viewer={viewer}
                  onSuccess={onSuccess}
                  onError={onError}
                />
              </PayPalScriptProvider>
            )}
          </div>

          {/* Trust Badges */}
          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-center justify-center space-x-6 text-gray-400 text-sm">
              <div className="flex items-center space-x-2">
                <span>🔒</span>
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🛡️</span>
                <span>Money Back Guarantee</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>⚡</span>
                <span>Instant Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}