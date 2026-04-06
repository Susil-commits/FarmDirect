import React from 'react';
import { Check } from 'lucide-react';
import PageTransition from '../components/common/PageTransition';

export default function Pricing() {
  const plans = [
    {
      name: 'Basic Farmer',
      price: 'Free',
      description: 'Perfect for getting started',
      features: [
        'List up to 5 crops',
        'Basic analytics',
        'Email support',
        'KYC verification required'
      ],
      highlight: false
    },
    {
      name: 'Premium Farmer',
      price: '₹299/month',
      description: 'Grow your farm business',
      features: [
        'Unlimited crop listings',
        'Advanced analytics',
        'Priority support',
        'Bulk upload feature',
        'Marketing tools',
        'Higher visibility'
      ],
      highlight: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large operations',
      features: [
        'All Premium features',
        'Dedicated account manager',
        'Custom API access',
        'Bulk operations',
        'Training & onboarding',
        'Custom integrations'
      ],
      highlight: false
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
            <p className="text-xl text-gray-600">Choose the plan that fits your farm business</p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {plans.map((plan, index) => (
              <div 
                key={index}
                className={`rounded-lg shadow-lg overflow-hidden transition transform hover:scale-105 ${
                  plan.highlight ? 'ring-2 ring-green-500 md:scale-105' : ''
                }`}
              >
                <div className={`p-8 ${plan.highlight ? 'bg-green-50' : 'bg-white'}`}>
                  {plan.highlight && (
                    <div className="bg-green-500 text-white text-sm font-bold px-3 py-1 rounded-full inline-block mb-3">
                      MOST POPULAR
                    </div>
                  )}
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  </div>

                  <button className={`w-full py-3 rounded-lg font-bold mb-6 transition ${
                    plan.highlight
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}>
                    Get Started
                  </button>

                  <div className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <Check size={20} className="text-green-500 shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-lg shadow-lg p-8 mt-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Can I upgrade or downgrade my plan anytime?</h3>
                <p className="text-gray-700">Yes, you can change your plan at any time. Upgrades take effect immediately, and downgrades will be effective at the end of your current billing cycle.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Is there a free trial?</h3>
                <p className="text-gray-700">Yes, the Basic Farmer plan is completely free! Upgrade to Premium whenever you're ready to unlock more features.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Do you charge commission on sales?</h3>
                <p className="text-gray-700">FarmDirect charges a small commission (5-10%) per transaction. This applies to both buyers and sellers for using our platform services.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">How is pricing calculated?</h3>
                <p className="text-gray-700">Monthly subscription fees are billed in advance. Commission is deducted from seller payments at the time of transaction settlement.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
