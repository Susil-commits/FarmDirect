import React from 'react';
import PageTransition from '../components/common/PageTransition';

export default function Terms() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms & Conditions</h1>
            
            <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">1. User Accounts</h2>
                <p>
                  Users must be at least 18 years old to create an account. You are responsible for maintaining 
                  the confidentiality of your account credentials and for all activities that occur under your account.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">2. Acceptable Use</h2>
                <p>
                  You agree not to engage in any form of fraud, misrepresentation, or illegal activity on our platform. 
                  You will not post content that is defamatory, obscene, or harmful to others.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">3. Payment Terms</h2>
                <p>
                  All transactions must be completed through our secure payment gate way. FarmDirect is not responsible 
                  for payment failures or delays caused by financial institutions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Crop Listings</h2>
                <p>
                  Farmers must provide accurate information about their crops. FarmDirect reserves the right to remove 
                  listings that violate our guidelines or contain false information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">5. Limitation of Liability</h2>
                <p>
                  FarmDirect shall not be liable for any indirect, incidental, special, or consequential damages arising 
                  from your use of our platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">6. Dispute Resolution</h2>
                <p>
                  In case of disputes between buyers and sellers, FarmDirect will provide a neutral mediation platform. 
                  Both parties must agree to binding arbitration.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">7. Modifications to Terms</h2>
                <p>
                  FarmDirect reserves the right to modify these terms at any time. Changes will be effective when posted 
                  to the platform. Continued use constitutes acceptance of modified terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">8. Contact</h2>
                <p>
                  For questions about these Terms & Conditions, contact us at <strong>support@farmdirect.com</strong>.
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
