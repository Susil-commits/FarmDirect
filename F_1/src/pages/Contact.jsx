import React, { useState, useRef } from 'react';
import { useRouter } from '../context/RouterContext';
import PageTransition from '../components/common/PageTransition.jsx';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ScrollAnimation from '../components/common/ScrollAnimation';
import { Mail, Phone, MapPin, Globe, MessageSquare, Send, CheckCircle, AlertCircle } from 'lucide-react';
import contactService from '../services/contactService';

export default function Contact() {
  // Navigation handled by context
  const { navigate } = useRouter();
  const faqRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    inquiryType: 'General',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form data
      if (!formData.name.trim()) {
        setError('Please enter your full name');
        setLoading(false);
        return;
      }
      if (!formData.email.trim()) {
        setError('Please enter your email address');
        setLoading(false);
        return;
      }
      if (!formData.message.trim()) {
        setError('Please enter your message');
        setLoading(false);
        return;
      }
      if (formData.message.trim().length < 10) {
        setError('Message must be at least 10 characters long');
        setLoading(false);
        return;
      }

      // Submit to backend
      const response = await contactService.submitQuery({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || '',
        inquiryType: formData.inquiryType,
        message: formData.message.trim()
      });

      if (response.success) {
        setSubmitted(true);
        // Reset form after 3 seconds
        setTimeout(() => {
          setFormData({ name: '', email: '', phone: '', inquiryType: 'General', message: '' });
          setSubmitted(false);
        }, 3000);
      } else {
        setError(response.message || 'Error submitting form. Please try again.');
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err.message || 'Error submitting form. Please try again.');
    } finally {
      setLoading(false);
    }
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
      a: 'Browse the marketplace, select your crops, add to cart, and proceed to checkout. You can pay using UPI, credit/debit card, or wallet.',
      category: 'Order Issues'
    },
    {
      q: 'How long does delivery take?',
      a: 'Standard delivery takes 3-5 days from the date of order. Express delivery is available in selected areas.',
      category: 'Order Issues'
    },
    {
      q: 'How can I become a farmer partner?',
      a: 'Fill out the "Become a Farmer Partner" form at the bottom of this page or contact our farmer relations team at farmers@farmdirect.io',
      category: 'Farmer Support'
    },
    {
      q: 'What if I receive damaged crops?',
      a: 'Report within 24 hours with photo evidence, and we will refund or replace your order at no cost.',
      category: 'Order Issues'
    },
    {
      q: 'Are crops certified organic?',
      a: 'All crops are verified for quality and freshness. Some farmers are certified organic; this is indicated on their profile.',
      category: 'Farmer Support'
    },
    {
      q: 'How can I track my order?',
      a: 'Track real-time updates via SMS and the app. You\'ll receive updates at each stage: confirmed, packed, shipped, and delivered.',
      category: 'Order Issues'
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-white">
        {/* Back Button */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-6xl mx-auto">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold transition-colors cursor-pointer"
            >
              ← Back to Home
            </button>
          </div>
        </div>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      We've received your message and will respond within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-red-700">{error}</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 bg-white text-gray-900 placeholder-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                        disabled={loading}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 bg-white text-gray-900 placeholder-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                        disabled={loading}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 bg-white text-gray-900 placeholder-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="+91 98765 43210"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Inquiry Type *</label>
                      <select
                        name="inquiryType"
                        value={formData.inquiryType}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="General">General Inquiry</option>
                        <option value="Support">Customer Support</option>
                        <option value="Partnership">Partnership</option>
                        <option value="Farmer Partnership">Farmer Partnership</option>
                        <option value="Feedback">Feedback</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Message *</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        disabled={loading}
                        rows="5"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 resize-none bg-white text-gray-900 placeholder-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Tell us how we can help... (minimum 10 characters)"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          Send Message
                        </>
                      )}
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
                    <button
                      key={idx}
                      onClick={() => {
                        const newCategory = activeCategory === cat.title ? null : cat.title;
                        setActiveCategory(newCategory);
                        if (newCategory) {
                          faqRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      className={`w-full text-left p-4 rounded-lg transition cursor-pointer ${
                        activeCategory === cat.title ? 'bg-green-100 border border-green-300' : 'bg-gray-50 hover:bg-green-50'
                      }`}
                    >
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
            <h2 ref={faqRef} className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
              {activeCategory && (
                <span className="block text-lg font-normal text-green-600 mt-2">
                  Showing: {activeCategory}
                  <button
                    onClick={() => setActiveCategory(null)}
                    className="ml-2 text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    Show All
                  </button>
                </span>
              )}
            </h2>
            <div className="space-y-4">
              {faqItems
                .filter(item => !activeCategory || item.category === activeCategory)
                .map((item, idx) => (
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
            {activeCategory && faqItems.filter(item => item.category === activeCategory).length === 0 && (
              <p className="text-center text-gray-500 mt-8">No FAQs found for this category.</p>
            )}
          </ScrollAnimation>

          {/* Footer */}
          <ScrollAnimation className="scroll-slide mt-16 pt-8 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold transition-colors cursor-pointer"
              >
                ← Back to Home
              </button>
              <div className="flex gap-6 text-sm">
                <button onClick={() => navigate('/about')} className="text-gray-600 hover:text-gray-900 transition">About</button>
                <button onClick={() => navigate('/support')} className="text-gray-600 hover:text-gray-900 transition">Support</button>
                <button onClick={() => navigate('/privacy')} className="text-gray-600 hover:text-gray-900 transition">Privacy</button>
              </div>
            </div>
          </ScrollAnimation>

        </div>
      </div>
    </PageTransition>
  );
}

