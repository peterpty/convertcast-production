'use client';

import { useState, useEffect } from 'react';
import { ViewerProfile } from '@/lib/ai/scoringEngine';
import {
  autoOfferPaymentEngine,
  PaymentOffer,
  PaymentSession
} from '@/lib/payment/paymentEngine';
import { abTestEngine } from '@/lib/payment/abTestEngine';
import { invoiceGenerator } from '@/lib/payment/invoiceGenerator';
import { InStreamCheckout } from './InStreamCheckout';
import { UrgencyOverlay } from './UrgencyOverlay';

interface PaymentManagerProps {
  viewers: ViewerProfile[];
  isActive: boolean;
  onPaymentSuccess: (session: PaymentSession) => void;
  onPaymentError: (error: string) => void;
}

interface ActivePaymentState {
  viewer: ViewerProfile;
  offer: PaymentOffer;
  showCheckout: boolean;
  showUrgencyOverlay: boolean;
  abTestVariant?: string;
  urgencyIntensity: 'low' | 'medium' | 'high' | 'extreme';
}

export function PaymentManager({
  viewers,
  isActive,
  onPaymentSuccess,
  onPaymentError
}: PaymentManagerProps) {
  const [activePayments, setActivePayments] = useState<Map<string, ActivePaymentState>>(new Map());
  const [paymentHistory, setPaymentHistory] = useState<PaymentSession[]>([]);

  // Monitor viewers for optimal payment timing
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      viewers.forEach(viewer => {
        // Skip if already has active payment
        if (activePayments.has(viewer.id)) return;

        // Check optimal timing
        const timing = autoOfferPaymentEngine.getOptimalOfferTiming(viewer);

        if (timing.shouldTrigger && timing.confidence > 0.7) {
          triggerOptimalOffer(viewer, timing.confidence);
        }
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [viewers, isActive, activePayments]);

  const triggerOptimalOffer = (viewer: ViewerProfile, confidence: number) => {
    // Generate optimized offer
    const baseOffer = {
      name: 'Premium Training Program',
      description: 'Complete system to transform your business',
      basePrice: 297,
      features: [
        'Complete training modules',
        'Bonus resources',
        'Private community access',
        'Email support',
        '30-day money-back guarantee'
      ]
    };

    const offer = autoOfferPaymentEngine.generateOptimizedOffer(viewer, baseOffer);

    // Check for A/B test variant
    const abTestId = 'pricing-test-001'; // Use the pricing test we created
    const variant = abTestEngine.getVariantForViewer(abTestId, viewer);

    if (variant) {
      // Apply A/B test variant to offer
      const testOffer = abTestEngine.applyVariantToOffer(offer, variant);

      // Determine urgency intensity based on intent score and confidence
      const urgencyIntensity = getUrgencyIntensity(viewer.intentScore, confidence);

      setActivePayments(prev => new Map(prev.set(viewer.id, {
        viewer,
        offer: testOffer,
        showCheckout: false,
        showUrgencyOverlay: true,
        abTestVariant: variant.id,
        urgencyIntensity
      })));
    } else {
      // No A/B test, use standard offer
      const urgencyIntensity = getUrgencyIntensity(viewer.intentScore, confidence);

      setActivePayments(prev => new Map(prev.set(viewer.id, {
        viewer,
        offer,
        showCheckout: false,
        showUrgencyOverlay: true,
        abTestVariant: undefined,
        urgencyIntensity
      })));
    }

    console.log(`🎯 Triggered optimized offer for ${viewer.name} (Score: ${viewer.intentScore}, Confidence: ${Math.round(confidence * 100)}%)`);
  };

  const getUrgencyIntensity = (intentScore: number, confidence: number): 'low' | 'medium' | 'high' | 'extreme' => {
    if (intentScore >= 90 && confidence > 0.9) return 'extreme';
    if (intentScore >= 80 && confidence > 0.8) return 'high';
    if (intentScore >= 65 && confidence > 0.7) return 'medium';
    return 'low';
  };

  const handleUrgencyOverlayTriggerCheckout = (viewerId: string) => {
    const payment = activePayments.get(viewerId);
    if (!payment) return;

    setActivePayments(prev => new Map(prev.set(viewerId, {
      ...payment,
      showUrgencyOverlay: false,
      showCheckout: true
    })));
  };

  const handleCheckoutSuccess = async (session: PaymentSession) => {
    const payment = activePayments.get(session.viewerId);
    if (!payment) return;

    try {
      // Track A/B test conversion if applicable
      if (payment.abTestVariant) {
        abTestEngine.trackConversion('pricing-test-001', payment.abTestVariant, session.finalPrice);
      }

      // Generate and send invoice
      const invoiceResult = await invoiceGenerator.sendInvoiceEmail(
        session,
        payment.viewer
      );

      if (invoiceResult.success) {
        console.log(`📧 Invoice sent to ${payment.viewer.email}`);
      } else {
        console.warn(`Failed to send invoice: ${invoiceResult.error}`);
      }

      // Add to payment history
      setPaymentHistory(prev => [...prev, session]);

      // Remove from active payments
      setActivePayments(prev => {
        const newMap = new Map(prev);
        newMap.delete(session.viewerId);
        return newMap;
      });

      onPaymentSuccess(session);

      // Show success message
      console.log(`💰 Payment successful: ${session.finalPrice} ${session.currency} from ${payment.viewer.name}`);

    } catch (error) {
      console.error('Error processing payment success:', error);
      onPaymentError('Failed to process payment completion');
    }
  };

  const handleCheckoutError = (viewerId: string, error: string) => {
    const payment = activePayments.get(viewerId);
    if (!payment) return;

    // Track failed conversion for A/B testing
    if (payment.abTestVariant) {
      // In a real implementation, you'd track failed attempts too
      console.log(`❌ Payment failed for A/B test variant ${payment.abTestVariant}`);
    }

    // Remove from active payments
    setActivePayments(prev => {
      const newMap = new Map(prev);
      newMap.delete(viewerId);
      return newMap;
    });

    onPaymentError(`Payment failed: ${error}`);
  };

  const handleCloseCheckout = (viewerId: string) => {
    const payment = activePayments.get(viewerId);
    if (!payment) return;

    // Track abandonment for A/B testing
    if (payment.abTestVariant) {
      console.log(`🚪 Checkout abandoned for A/B test variant ${payment.abTestVariant}`);
    }

    setActivePayments(prev => {
      const newMap = new Map(prev);
      newMap.delete(viewerId);
      return newMap;
    });
  };

  const handleDismissUrgencyOverlay = (viewerId: string) => {
    setActivePayments(prev => {
      const newMap = new Map(prev);
      newMap.delete(viewerId);
      return newMap;
    });
  };

  // Manual payment trigger for testing/admin
  const triggerManualPayment = (viewer: ViewerProfile, offerType: 'standard' | 'premium' | 'vip' = 'standard') => {
    const baseOffers = {
      standard: {
        name: 'Complete Training System',
        basePrice: 197,
        features: ['Core modules', 'Email support', 'Money-back guarantee']
      },
      premium: {
        name: 'Premium Mastery Program',
        basePrice: 497,
        features: ['All modules', 'Priority support', 'Bonus resources', 'Private community']
      },
      vip: {
        name: 'VIP Elite Program',
        basePrice: 997,
        features: ['Everything included', '1-on-1 coaching', 'Done-for-you templates', 'Lifetime access']
      }
    };

    const offer = autoOfferPaymentEngine.generateOptimizedOffer(viewer, baseOffers[offerType]);

    setActivePayments(prev => new Map(prev.set(viewer.id, {
      viewer,
      offer,
      showCheckout: true,
      showUrgencyOverlay: false,
      urgencyIntensity: 'medium'
    })));
  };

  // Get payment analytics
  const getPaymentAnalytics = () => {
    const totalRevenue = paymentHistory.reduce((sum, session) => sum + session.finalPrice, 0);
    const avgOrderValue = paymentHistory.length > 0 ? totalRevenue / paymentHistory.length : 0;
    const conversionRate = viewers.length > 0 ? paymentHistory.length / viewers.length : 0;

    return {
      totalPayments: paymentHistory.length,
      totalRevenue,
      avgOrderValue,
      conversionRate,
      activeOffers: activePayments.size
    };
  };

  return (
    <div className="payment-manager">
      {/* Active Urgency Overlays */}
      {Array.from(activePayments.entries()).map(([viewerId, payment]) =>
        payment.showUrgencyOverlay && (
          <UrgencyOverlay
            key={`urgency-${viewerId}`}
            offer={payment.offer}
            viewer={payment.viewer}
            intensity={payment.urgencyIntensity}
            position="center"
            onTriggerCheckout={() => handleUrgencyOverlayTriggerCheckout(viewerId)}
            onDismiss={() => handleDismissUrgencyOverlay(viewerId)}
          />
        )
      )}

      {/* Active Checkouts */}
      {Array.from(activePayments.entries()).map(([viewerId, payment]) =>
        payment.showCheckout && (
          <InStreamCheckout
            key={`checkout-${viewerId}`}
            viewer={payment.viewer}
            offer={payment.offer}
            onSuccess={handleCheckoutSuccess}
            onError={(error) => handleCheckoutError(viewerId, error)}
            onClose={() => handleCloseCheckout(viewerId)}
          />
        )
      )}

      {/* Debug/Admin Panel (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-600 rounded-lg p-4 text-white max-w-sm">
          <h3 className="font-bold text-sm mb-2">💳 Payment Manager</h3>

          <div className="space-y-2 text-xs">
            <div>Active Offers: {activePayments.size}</div>
            <div>Total Payments: {paymentHistory.length}</div>
            <div>
              Revenue: ${paymentHistory.reduce((sum, s) => sum + s.finalPrice, 0).toFixed(2)}
            </div>

            {viewers.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer hover:text-purple-400">
                  Manual Triggers ({viewers.length} viewers)
                </summary>
                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {viewers.slice(0, 5).map(viewer => (
                    <div key={viewer.id} className="flex items-center justify-between">
                      <span className="truncate text-xs">{viewer.name}</span>
                      <button
                        onClick={() => triggerManualPayment(viewer, 'premium')}
                        disabled={activePayments.has(viewer.id)}
                        className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-2 py-1 rounded text-xs transition-colors"
                      >
                        Offer
                      </button>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {/* A/B Test Status */}
            <details className="mt-2">
              <summary className="cursor-pointer hover:text-blue-400">
                A/B Tests
              </summary>
              <div className="mt-2 text-xs">
                {abTestEngine.getActiveTests().map(test => (
                  <div key={test.id} className="mb-1">
                    <div className="font-medium">{test.name}</div>
                    <div className="text-gray-400">
                      {test.variants.length} variants • {test.trafficSplit}% traffic
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}

// Export analytics function for external use
export const usePaymentAnalytics = (paymentHistory: PaymentSession[], viewers: ViewerProfile[]) => {
  const totalRevenue = paymentHistory.reduce((sum, session) => sum + session.finalPrice, 0);
  const avgOrderValue = paymentHistory.length > 0 ? totalRevenue / paymentHistory.length : 0;
  const conversionRate = viewers.length > 0 ? paymentHistory.length / viewers.length : 0;

  const revenueByDay = paymentHistory.reduce((acc, session) => {
    const date = session.completedAt?.toDateString() || new Date().toDateString();
    acc[date] = (acc[date] || 0) + session.finalPrice;
    return acc;
  }, {} as Record<string, number>);

  const paymentMethods = paymentHistory.reduce((acc, session) => {
    acc[session.paymentMethod] = (acc[session.paymentMethod] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalPayments: paymentHistory.length,
    totalRevenue,
    avgOrderValue,
    conversionRate,
    revenueByDay,
    paymentMethods
  };
};