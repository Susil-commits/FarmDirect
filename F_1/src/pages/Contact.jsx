import React, { useState } from 'react';
import { useRouter } from '../context/RouterContext';
import PageTransition from '../components/common/PageTransition.jsx';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ScrollAnimation from '../components/common/ScrollAnimation';
import { Mail, Phone, MapPin, Globe, MessageSquare, Send, CheckCircle } from 'lucide-react';

export default function Contact() {
  // Navigation handled by context
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'inquiry',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would normally send the data to your backend
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', phone: '', type: 'inquiry', message: '' });
      setSubmitted(false);
    }, 3000);
  };

  const contactInfo = [
    {
      icon: <Phone size={32} />,
      title: 'Susil Kumar Nayak',
      details: 'Final Year CSE Student',
      subtext: 'Full Stack Developer'
    },
    {
      icon: <Mail size={32} />,
      title: 'Email Support',
      details: 'nayaksushil298@gmail.com',
      subtext: 'Response within 24 hours'
    },
    {
      icon: <MapPin size={32} />,
      title: 'Dibesh Ranjan Das',
      details: 'Final Year CSE Student',
      subtext: 'Full Stack Developer'
    },
    {
      icon: <Globe size={32} />,
      title: 'Project Type',
      details: 'Final Year Project (CSE)',
      subtext: 'FarmDirect - Farm to Consumer Platform'
    }
  ];

  const faqItems = [
    {
      q: 'How do I place an order?',
      a: 'Browse the marketplace, select your crops, add to cart, and proceed to checkout. You can pay using UPI, credit/debit card, or wallet.'
    },
    {
      q: 'How long does delivery take?',
      a: 'Standard delivery takes 3-5 days from the date of order. Express delivery is available in selected areas.'
    },
    {
      q: 'How can I become a farmer partner?',
      a: 'Fill out the "Become a Farmer Partner" form at the bottom of this page or contact our farmer relations team at farmers@farmdirect.io'
    },
    {
      q: 'What if I receive damaged crops?',
      a: 'Report within 24 hours with photo evidence, and we will refund or replace your order at no cost.'
    },
    {
      q: 'Are crops certified organic?',
      a: 'All crops are verified for quality and freshness. Some farmers are certified organic; this is indicated on their profile.'
    },
    {
      q: 'How can I track my order?',
      a: 'Track real-time updates via SMS and the app. You\'ll receive updates at each stage: confirmed, packed, shipped, and delivered.'
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 text-white py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-4">Get in Touch</h1>
            <p className="text-xl text-green-50">
              Have questions? We're here to help. Reach out anytime!
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-16">
          {/* Contact Info Cards */}
          <ScrollAnimation className="scroll-slide mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {contactInfo.map((info, idx) => (
                <Card key={idx} hover className="p-8 text-center">
                  <div className="text-green-600 mb-4 flex justify-center">{info.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{info.title}</h3>
                  <p className="text-gray-900 font-semibold mb-1">{info.details}</p>
                  <p className="text-gray-600 text-sm">{info.subtext}</p>
                </Card>
              ))}
            </div>
          </ScrollAnimation>

          {/* Main Contact Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Contact Form */}
            <ScrollAnimation className="scroll-slide">
              <Card className="p-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                  <MessageSquare size={32} className="text-green-600" />
                  Send us a Message
                </h2>

                {submitted ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                    <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-green-900 mb-2">Thank You!</h3>
                    <p className="text-green-800">
                      We've received your message and will respond within 2 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 bg-white text-gray-900 placeholder-gray-500"
                        placeholder="Your name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 bg-white text-gray-900 placeholder-gray-500"
                        placeholder="your@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 bg-white text-gray-900 placeholder-gray-500"
                        placeholder="+91 98765 43210"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Inquiry Type *</label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 bg-white text-gray-900"
                      >
                        <option value="inquiry">General Inquiry</option>
                        <option value="support">Customer Support</option>
                        <option value="partnership">Partnership</option>
                        <option value="farmer">Farmer Partnership</option>
                        <option value="feedback">Feedback</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Message *</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows="5"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 resize-none bg-white text-gray-900 placeholder-gray-500"
                        placeholder="Tell us how we can help..."
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Send size={18} />
                      Send Message
                    </Button>
                  </form>
                )}
              </Card>
            </ScrollAnimation>

            {/* Quick Links & Info */}
            <ScrollAnimation className="scroll-slide space-y-6">
              {/* Support Categories */}
              <Card className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">How Can We Help?</h3>
                <div className="space-y-4">
                  {[
                    { emoji: '🛒', title: 'Order Issues', desc: 'Track orders, returns & refunds' },
                    { emoji: '🌾', title: 'Farmer Support', desc: 'List crops, pricing advice' },
                    { emoji: '👥', title: 'Account Help', desc: 'Profile updates, verification' },
                    { emoji: '📱', title: 'Technical', desc: 'App issues, login problems' }
                  ].map((cat, idx) => (
                    <button key={idx} className="w-full text-left p-4 bg-gray-50 hover:bg-green-50 rounded-lg transition cursor-pointer">
                      <div className="text-2xl mb-2">{cat.emoji}</div>
                      <p className="font-bold text-gray-900">{cat.title}</p>
                      <p className="text-sm text-gray-600">{cat.desc}</p>
                    </button>
                  ))}
                </div>
              </Card>


            </ScrollAnimation>
          </div>

          {/* FAQs Section */}
          <ScrollAnimation className="scroll-slide mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqItems.map((item, idx) => (
                <Card key={idx} hover className="p-6">
                  <details className="cursor-pointer">
                    <summary className="font-bold text-gray-900 text-lg flex justify-between items-center cursor-pointer">
                      <span>{item.q}</span>
                      <span className="text-green-600">+</span>
                    </summary>
                    <p className="text-gray-700 mt-4">{item.a}</p>
                  </details>
                </Card>
              ))}
            </div>
          </ScrollAnimation>


        </div>
      </div>
    </PageTransition>
  );
}

