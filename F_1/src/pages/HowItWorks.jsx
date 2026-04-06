import React from 'react';
import { CheckCircle, Users, TrendingUp, Award, Zap, Shield } from 'lucide-react';
import PageTransition from '../components/common/PageTransition';

export default function HowItWorks() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">How FarmDirect Works</h1>
            <p className="text-xl text-gray-600">Connecting farmers and buyers directly for fresh, fair-price produce</p>
          </div>

          {/* For Farmers Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">For Farmers</h2>
            
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              {[
                { step: 1, title: 'Register & Verify', icon: Users, desc: 'Create account, verify identity with KYC' },
                { step: 2, title: 'Add Your Crops', icon: TrendingUp, desc: 'List your crops with photos and details' },
                { step: 3, title: 'Get Orders', icon: Zap, desc: 'Buyers see your listings and place orders' },
                { step: 4, title: 'Earn & Grow', icon: Award, desc: 'Get paid directly, expand your business' }
              ].map((item, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
                  <div className="bg-green-100 rounded-lg p-4 mb-4 inline-block">
                    <item.icon size={32} className="text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    <span className="text-green-600 font-bold text-2xl">{item.step}. </span>
                    {item.title}
                  </h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-green-50 rounded-lg p-8 border-2 border-green-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Benefits for Farmers</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  'Direct access to buyers - eliminate middlemen',
                  'Fair pricing - set your own rates',
                  'Real-time analytics - track your sales',
                  'Payment within 24 hours',
                  'Free marketing tools - reach more buyers',
                  'Bulk upload - save time listing crops'
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle size={24} className="text-green-600 shrink-0 mt-1" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* For Buyers Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">For Buyers</h2>
            
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              {[
                { step: 1, title: 'Browse', icon: Users, desc: 'Explore fresh crops from verified farmers' },
                { step: 2, title: 'Order', icon: TrendingUp, desc: 'Select quantity and place your order' },
                { step: 3, title: 'Receive', icon: Zap, desc: 'Get fresh produce within 1-3 days' },
                { step: 4, title: 'Review', icon: Award, desc: 'Share feedback and build trust' }
              ].map((item, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
                  <div className="bg-blue-100 rounded-lg p-4 mb-4 inline-block">
                    <item.icon size={32} className="text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    <span className="text-blue-600 font-bold text-2xl">{item.step}. </span>
                    {item.title}
                  </h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-lg p-8 border-2 border-blue-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Benefits for Buyers</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  'Farm-fresh produce guaranteed',
                  'Better prices - no middlemen markup',
                  'Know your farmer - transparency',
                  'Track your order in real-time',
                  'Secure payment & buyer protection',
                  'Quality assurance - money-back guarantee'
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle size={24} className="text-blue-600 shrink-0 mt-1" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trust & Security */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Your Trust & Safety</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Shield,
                  title: 'Secure Payments',
                  desc: 'All transactions are encrypted and processed through trusted payment gateways'
                },
                {
                  icon: Users,
                  title: 'Verified Users',
                  desc: 'KYC verification ensures all farmers and buyers are legitimate'
                },
                {
                  icon: Award,
                  title: 'Dispute Resolution',
                  desc: 'We mediate disputes fairly and ensure customer satisfaction'
                }
              ].map((item, idx) => (
                <div key={idx} className="text-center">
                  <div className="bg-linear-to-br from-green-100 to-emerald-100 rounded-lg p-6 mb-4 inline-block">
                    <item.icon size={48} className="text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
