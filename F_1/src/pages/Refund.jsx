import React from 'react';
import PageTransition from '../components/common/PageTransition';

export default function Refund() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Refund Policy</h1>
            
            <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Refund Eligibility</h2>
                <p>
                  Customers are eligible for refunds within 7 days of purchase if the product quality does not meet 
                  the description provided on the listing. Refund requests must be supported with evidence (photos/videos).
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">2. Non-Refundable Items</h2>
                <p>
                  Refunds cannot be processed for items that are:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Consumed or used</li>
                    <li>Damaged due to mishandling during delivery</li>
                    <li>Not collected within the agreed timeframe</li>
                  </ul>
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">3. Refund Timeline</h2>
                <p>
                  Once a refund is approved, it will be processed within 5-7 business days. The refund amount will be 
                  credited to the original payment method used for the purchase.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Return Process</h2>
                <p>
                  For eligible refunds, customers must arrange return of the product with the farmer. Pickup arrangements 
                  will be coordinated through FarmDirect's support team.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">5. Partial Refunds</h2>
                <p>
                  Partial refunds may be issued if only a portion of the ordered product has quality issues. The refund 
                  amount will be calculated proportionally based on the affected quantity.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">6. Refund for Cancellations</h2>
                <p>
                  Orders can be cancelled before confirmation by the seller. Once confirmed, cancellations are subject 
                  to a 10% administrative fee. Cancellations cannot be processed 1 hour before scheduled delivery.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">7. Dispute Resolution</h2>
                <p>
                  If you disagree with a refund decision, you can raise a formal dispute through FarmDirect's support 
                  team. We will investigate and provide a resolution within 3-5 business days.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">8. Contact</h2>
                <p>
                  For refund-related queries, contact us at <strong>refunds@farmdirect.com</strong> or call 
                  <strong> +91-XXXX-XXXX</strong>.
                </p>
              </section>
            </div>

            <p className="text-gray-600 text-sm mt-8">Last updated: 2026</p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
