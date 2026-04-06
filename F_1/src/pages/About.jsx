import React from 'react';
import { useRouter } from '../context/RouterContext';
import PageTransition from '../components/common/PageTransition.jsx';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ScrollAnimation from '../components/common/ScrollAnimation';
import { Users, Target, Heart, Zap, Globe, Award, TrendingUp, Shield } from 'lucide-react';

export default function About() {
  const { navigate } = useRouter();

  const values = [
    {
      icon: <Heart size={32} />,
      title: 'Farmer-First',
      description: 'We prioritize fair prices and sustainable practices for farming communities.'
    },
    {
      icon: <Target size={32} />,
      title: 'Quality Assured',
      description: 'Every crop is verified for freshness, quality, and compliance with standards.'
    },
    {
      icon: <Zap size={32} />,
      title: 'Fast Delivery',
      description: 'Farm to doorstep in 3-5 days with real-time tracking and updates.'
    },
    {
      icon: <Shield size={32} />,
      title: 'Trust & Safety',
      description: 'Secure transactions, buyer protection, and verified farmer profiles.'
    }
  ];

  const team = [
    {
      name: 'Rajesh Kumar',
      role: 'Founder & CEO',
      emoji: '👨‍💼',
      bio: 'Former agricultural economist with 15+ years of experience'
    },
    {
      name: 'Priya Sharma',
      role: 'Co-Founder & COO',
      emoji: '👩‍💼',
      bio: 'Supply chain expert passionate about rural development'
    },
    {
      name: 'Arjun Desai',
      role: 'Chief Technology Officer',
      emoji: '👨‍💻',
      bio: 'Tech entrepreneur focused on farm-to-table solutions'
    },
    {
      name: 'Neha Patel',
      role: 'Head of Farmer Relations',
      emoji: '👩‍🌾',
      bio: 'Community organizer with deep roots in farming communities'
    }
  ];

  const stats = [
    { number: '5000+', label: 'Active Farmers' },
    { number: '50000+', label: 'Happy Customers' },
    { number: '100+', label: 'Crop Varieties' },
    { number: '3-5', label: 'Days Delivery' }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-linear-to-br from-white via-green-50 to-white">
        {/* Hero Section */}
        <div className="bg-linear-to-br from-green-600 via-emerald-600 to-green-700 text-white py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-4">About FarmDirect</h1>
            <p className="text-xl text-green-50">
              Connecting farmers directly to consumers. Fresh produce, fair prices, sustainable farming.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-16">
          {/* Mission Section */}
          <ScrollAnimation className="scroll-slide mb-16">
            <Card className="bg-linear-to-br from-green-50 to-emerald-50">
              <div className="p-12">
                <div className="flex items-center gap-4 mb-6">
                  <Target size={40} className="text-green-600" />
                  <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
                </div>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  FarmDirect empowers farmers across India by providing a direct-to-consumer marketplace that eliminates middlemen, ensures fair pricing, and promotes sustainable agricultural practices. We believe that every farmer deserves to benefit fully from their hard work.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Our platform enables consumers to get the freshest produce directly from verified farmers while supporting rural communities and sustainable farming methods.
                </p>
              </div>
            </Card>
          </ScrollAnimation>

          {/* Why Choose Us */}
          <ScrollAnimation className="scroll-slide mb-16">
            <Card className="bg-linear-to-br from-amber-50 to-orange-50 p-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Why Choose FarmDirect?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex gap-4">
                  <div className="text-4xl shrink-0">🌾</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">For Farmers</h3>
                    <ul className="text-gray-700 space-y-2">
                      <li>✓ Fair and competitive prices</li>
                      <li>✓ Direct market access</li>
                      <li>✓ No middleman commissions</li>
                      <li>✓ Quality verification support</li>
                      <li>✓ Farmer training programs</li>
                    </ul>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-4xl shrink-0">👥</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">For Consumers</h3>
                    <ul className="text-gray-700 space-y-2">
                      <li>✓ Freshest produce guarantee</li>
                      <li>✓ Direct source information</li>
                      <li>✓ Competitive pricing</li>
                      <li>✓ Farmer ratings & reviews</li>
                      <li>✓ Fast delivery (3-5 days)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          </ScrollAnimation>

          {/* Team Section */}
          <ScrollAnimation className="scroll-slide mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Meet Our Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((member, idx) => (
                <Card key={idx} hover className="text-center p-8">
                  <div className="text-6xl mb-4">{member.emoji}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-green-600 font-semibold mb-3">{member.role}</p>
                  <p className="text-gray-700 text-sm">{member.bio}</p>
                </Card>
              ))}
            </div>
          </ScrollAnimation>

          {/* Impact Section */}
          <ScrollAnimation className="scroll-slide mb-16">
            <Card className="bg-linear-to-br from-blue-50 to-indigo-50 p-12">
              <div className="flex items-center gap-4 mb-6">
                <Globe size={40} className="text-blue-600" />
                <h2 className="text-3xl font-bold text-gray-900">Our Impact</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-4xl font-bold text-blue-600 mb-2">₹50 Cr+</p>
                  <p className="text-gray-700">Total payments to farmers (2023-2024)</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-blue-600 mb-2">25%</p>
                  <p className="text-gray-700">Average income increase for farmers</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-blue-600 mb-2">50+</p>
                  <p className="text-gray-700">Districts covered across India</p>
                </div>
              </div>
            </Card>
          </ScrollAnimation>

          {/* Journey Timeline */}
          <ScrollAnimation className="scroll-slide mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Journey</h2>
            <div className="space-y-6">
              {[
                { year: '2020', title: 'Founded', desc: 'FarmDirect launched with 100 farmers' },
                { year: '2021', title: 'Scaled', desc: 'Expanded to 2000+ farmers and 10000+ customers' },
                { year: '2022', title: 'Growth', desc: 'Series A funding, expanded to 5 states' },
                { year: '2023', title: 'Impact', desc: 'Reached 50000+ customers, ₹50 Cr+ payments' },
                { year: '2024', title: 'Innovation', desc: 'Launched AI-powered quality checks & mobile app' }
              ].map((milestone, idx) => (
                <Card key={idx} hover className="p-6 flex items-start gap-6">
                  <div className="text-2xl font-bold text-green-600 min-w-fit">{milestone.year}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{milestone.title}</h3>
                    <p className="text-gray-700">{milestone.desc}</p>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollAnimation>

        </div>
      </div>
    </PageTransition>
  );
}
