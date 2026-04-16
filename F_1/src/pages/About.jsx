import React from 'react';
import { useRouter } from '../context/RouterContext';
import PageTransition from '../components/common/PageTransition.jsx';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ScrollAnimation from '../components/common/ScrollAnimation';
import { Users, Target, Heart, Zap, Globe, Award, TrendingUp, Shield, Code, Layers } from 'lucide-react';

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
      name: 'Susil Kumar Nayak',
      role: 'Full Stack Developer - CSE 2026',
      emoji: '👨‍💻',
      bio: 'Backend & Frontend | Database Design | API Development | Full Stack Architecture',
      batch: 'Passout CSE 2026'
    },
    {
      name: 'Dibesh Ranjan Das',
      role: 'Full Stack Developer - CSE 2026',
      emoji: '👨‍💻',
      bio: 'Frontend & Backend | UI/UX Design | API Integration | Full Stack Development',
      batch: 'Passout CSE 2026'
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
              A Final Year Project by CSE Students<br/>
              <strong>Susil Kumar Nayak & Dibesh Ranjan Das</strong><br/>
              Connecting farmers directly to consumers through an innovative e-commerce platform.
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
                  FarmDirect is a comprehensive Final Year Project developed by Computer Science Engineering (CSE) students Susil Kumar Nayak and Dibesh Ranjan Das. This platform empowers farmers across India by providing a direct-to-consumer marketplace that eliminates middlemen and ensures fair pricing.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Using modern web technologies and best practices in full-stack development, this platform enables consumers to get the freshest produce directly from verified farmers while supporting rural communities and promoting sustainable farming practices.
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
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Meet Our Team</h2>
            <div className="flex flex-col md:flex-row gap-8 max-w-4xl mx-auto items-center justify-center">
              {team.map((member, idx) => (
                <Card key={idx} hover className="text-center p-10 w-full md:w-80 flex flex-col items-center bg-linear-to-br from-green-50 to-white">
                  <div className="text-8xl mb-6 transform hover:scale-110 transition-transform">{member.emoji}</div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{member.name}</h3>
                    <p className="text-green-600 font-semibold mb-4 text-sm">{member.role}</p>
                    <p className="text-gray-700 text-sm leading-relaxed">{member.bio}</p>
                  </div>
                  <div className="mt-6 pt-6 border-t border-green-200 w-full">
                    <p className="text-xs text-green-700 font-bold uppercase tracking-wide">{member.batch}</p>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollAnimation>

          {/* Impact Section */}
          <ScrollAnimation className="scroll-slide mb-16">
            <div className="bg-linear-to-r from-green-600 via-emerald-600 to-teal-600 rounded-xl p-12 text-white">
              <div className="flex items-center gap-4 mb-8">
                <Award size={40} className="text-white" />
                <h2 className="text-3xl font-bold">Project Achievements</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="text-center p-6 bg-white/10 rounded-lg backdrop-blur">
                  <div className="text-5xl font-bold text-white mb-3">10+</div>
                  <p className="text-green-50 font-semibold">Features Implemented</p>
                  <p className="text-sm text-green-100 mt-2">Marketplace, Orders, Wishlist & more</p>
                </div>
                <div className="text-center p-6 bg-white/10 rounded-lg backdrop-blur">
                  <div className="text-5xl font-bold text-white mb-3">4</div>
                  <p className="text-green-50 font-semibold">Tech Stacks</p>
                  <p className="text-sm text-green-100 mt-2">React, Node.js, MongoDB, Vite</p>
                </div>
                <div className="text-center p-6 bg-white/10 rounded-lg backdrop-blur">
                  <div className="text-5xl font-bold text-white mb-3">100%</div>
                  <p className="text-green-50 font-semibold">Responsive Design</p>
                  <p className="text-sm text-green-100 mt-2">Mobile, Tablet & Desktop</p>
                </div>
                <div className="text-center p-6 bg-white/10 rounded-lg backdrop-blur">
                  <div className="text-5xl font-bold text-white mb-3">🏆</div>
                  <p className="text-green-50 font-semibold">Final Year Project</p>
                  <p className="text-sm text-green-100 mt-2">CSE Department, 2024</p>
                </div>
              </div>
            </div>
          </ScrollAnimation>

          {/* Journey Timeline - Horizontal Progress */}
          <ScrollAnimation className="scroll-slide">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Our Project Journey</h2>
            
            {/* Progress Steps */}
            <div className="mb-12 px-4">
              <div className="flex items-center justify-between mb-8 max-w-5xl mx-auto">
                {[
                  { num: 1, label: 'Planning', color: 'bg-blue-500' },
                  { num: 2, label: 'Backend', color: 'bg-green-500' },
                  { num: 3, label: 'Frontend', color: 'bg-purple-500' },
                  { num: 4, label: 'Testing', color: 'bg-yellow-500' },
                  { num: 5, label: 'Launch', color: 'bg-red-500' }
                ].map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-1">
                    <div className={`${step.color} text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg shadow-lg mb-2 transform hover:scale-110 transition-transform`}>
                      {step.num}
                    </div>
                    <p className="text-xs md:text-sm font-semibold text-gray-700 text-center">{step.label}</p>
                    {idx < 4 && <div className="hidden md:block absolute w-20 h-1 bg-linear-to-r from-gray-300 to-gray-300 mt-6"></div>}
                  </div>
                ))}
              </div>
              
              {/* Connecting line */}
              <div className="hidden md:flex h-1 bg-linear-to-r from-blue-500 via-green-500 to-red-500 rounded-full max-w-5xl mx-auto mb-12"></div>
            </div>
            
            {/* Phase Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto px-2">
              {[
                { phase: 'Phase 1', title: 'Planning & Design', timeline: 'Aug - Sep 2024', desc: 'Requirements, architecture, database, UI wireframes, tech stack', icon: '📋', bgColor: 'bg-blue-500', details: ['Requirements', 'Architecture', 'Database', 'Wireframes', 'Tech Stack'] },
                { phase: 'Phase 2', title: 'Backend Dev', timeline: 'Oct - Nov 2024', desc: 'APIs, JWT auth, RBAC, MongoDB, Cloudinary, payments', icon: '⚙️', bgColor: 'bg-green-500', details: ['50+ APIs', 'Authentication', 'RBAC', 'DB Models', 'Upload'] },
                { phase: 'Phase 3', title: 'Frontend Dev', timeline: 'Nov - Dec 2024', desc: 'React, Tailwind CSS, components, marketplace UI, dashboards', icon: '🎨', bgColor: 'bg-purple-500', details: ['React', 'Responsive', 'State Mgmt', 'Components', 'Navigation'] },
                { phase: 'Phase 4', title: 'Integration & Test', timeline: 'Dec 2024 - Jan 2025', desc: 'API integration, testing, performance tuning, security checks', icon: '✅', bgColor: 'bg-yellow-500', details: ['API Tests', 'Unit Tests', 'E2E Tests', 'Optimize', 'Security'] },
                { phase: 'Phase 5', title: 'Deployment', timeline: 'Jan - Feb 2025', desc: 'Production deployment, API docs, guides, documentation, report', icon: '🚀', bgColor: 'bg-red-500', details: ['Deploy', 'API Docs', 'Guides', 'Docs', 'Report'] }
              ].map((milestone, idx) => (
                <div key={idx} className={`${milestone.bgColor} p-6 rounded-xl text-white h-full transform hover:scale-105 transition-all duration-300 shadow-lg`}>
                  <div className="text-4xl mb-3">{milestone.icon}</div>
                  <div className="uppercase text-xs font-bold mb-1 opacity-90 tracking-wider">{milestone.phase}</div>
                  <h3 className="text-sm font-bold mb-2 leading-tight">{milestone.title}</h3>
                  <p className="text-white text-xs mb-3 leading-snug">{milestone.desc}</p>
                  <div className="border-t border-white/40 pt-3">
                    <p className="text-xs font-bold mb-2 opacity-90 uppercase tracking-wide">Tasks:</p>
                    <ul className="text-xs space-y-1">
                      {milestone.details.map((detail, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-white rounded-full"></span>
                          <span className="font-medium">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </ScrollAnimation>

        </div>
      </div>
    </PageTransition>
  );
}
