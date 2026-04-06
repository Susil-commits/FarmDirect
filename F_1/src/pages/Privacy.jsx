import React from 'react';
import PageTransition from '../components/common/PageTransition';

export default function Privacy() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
            
            <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Information We Collect</h2>
                <p>
                  FarmDirect collects information you provide directly to us, including personal identification information, 
                  contact details, farm information, and transaction history.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">2. How We Use Your Information</h2>
                <p>
                  We use the information we collect to provide, maintain, and improve our services, process transactions, 
                  send transactional and promotional communications, and comply with legal obligations.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">3. Information Sharing</h2>
                <p>
                  We do not sell or rent your personal information to third parties. We may share information with 
                  trusted partners who assist us in operating our platform under confidentiality agreements.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Security</h2>
                <p>
                  We implement appropriate technical and organizational measures to protect your personal information 
                  against unauthorized access, alteration, disclosure, or destruction.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">5. Cookies</h2>
                <p>
                  We use cookies and similar technologies to understand how you use our platform and to improve 
                  your experience. You can control cookie settings through your browser.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">6. Your Rights</h2>
                <p>
                  You have the right to access, correct, or delete your personal information. Please contact us 
                  at privacy@farmdirect.com to exercise these rights.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">7. Contact Us</h2>
                <p>
                  If you have questions about this Privacy Policy or our privacy practices, please contact us at 
                  <strong> privacy@farmdirect.com</strong> or call <strong>+91-XXXX-XXXX</strong>.
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
