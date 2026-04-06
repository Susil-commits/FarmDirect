import React, { useState } from 'react';
import { Mail, Phone, MessageSquare, Clock, MapPin } from 'lucide-react';
import PageTransition from '../components/common/PageTransition';

export default function Support() {
  const [activeCategory, setActiveCategory] = useState('general');

  const faqs = {
    general: [
      { q: 'How do I create an account?', a: 'Visit our registration page and fill in your details. Verify your email and complete KYC for full access.' },
      { q: 'Is it safe to trade on FarmDirect?', a: 'Yes, we use encryption and secure payment gateways. All transactions are protected.' },
      { q: 'How do I contact a seller?', a: 'You can message directly through the crop listing page.' }
    ],
    farmers: [
      { q: 'What documents do I need for verification?', a: 'Land ownership proof, ID proof, and bank details are required for farmer verification.' },
      { q: 'How do I list my crops?', a: 'Go to your dashboard, click "Add Crop", fill details, upload photos, and publish.' },
      { q: 'What are the commission rates?', a: 'FarmDirect charges 5-10% commission per sale depending on crop type.' }
    ],
    buyers: [
      { q: 'How do I place an order?', a: 'Browse the marketplace, select a product, choose quantity, and complete payment.' },
      { q: 'What is the delivery time?', a: 'Delivery typically takes 1-3 days depending on your location and farmer availability.' },
      { q: 'Can I cancel my order?', a: 'Yes, orders can be cancelled within 1 hour of placement if not confirmed by the seller.' }
    ]
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">How Can We Help?</h1>
            <p className="text-xl text-gray-600">Get support from our dedicated team</p>
          </div>

          {/* Contact Methods */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center hover:shadow-xl transition">
              <Mail size={48} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-600 mb-4">Response time: 24 hours</p>
              <p className="text-green-600 font-semibold">support@farmdirect.com</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 text-center hover:shadow-xl transition">
              <Phone size={48} className="text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Phone Support</h3>
              <p className="text-gray-600 mb-4">Mon-Sat: 9 AM - 6 PM</p>
              <p className="text-blue-600 font-semibold">+91-XXXX-XXXX</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 text-center hover:shadow-xl transition">
              <MessageSquare size={48} className="text-purple-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Live Chat</h3>
              <p className="text-gray-600 mb-4">Response time: 30 minutes</p>
              <p className="text-purple-600 font-semibold">Available 24/7</p>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>

            {/* Category Tabs */}
            <div className="flex gap-4 mb-8 border-b">
              {Object.keys(faqs).map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-3 font-semibold capitalize border-b-2 transition ${
                    activeCategory === category
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {category === 'general' ? 'General' : category === 'farmers' ? 'For Farmers' : 'For Buyers'}
                </button>
              ))}
            </div>

            {/* FAQ Items */}
            <div className="space-y-6">
              {faqs[activeCategory].map((faq, idx) => (
                <div key={idx} className="border-b pb-6 last:border-b-0">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-gray-700">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
