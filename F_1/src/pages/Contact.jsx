import React, { useState } from 'react';
import { useRouter } from '../hooks/useRouter';
import PageTransition from '../components/common/PageTransition.jsx';
import { Mail, Phone, MapPin, Send, Sparkles, CheckCircle2 } from 'lucide-react';

import { motion } from 'framer-motion';

export default function Contact() {
  const { navigate } = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '', role: 'Buyer' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#FBF8F3] text-[#132E20] font-sans-body">
        <section className="pt-32 pb-20 px-4 md:px-8 max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="font-sans-body text-xs font-bold uppercase tracking-widest text-[#132E20]/60 bg-[#F4EFE6] px-3.5 py-1.5 rounded-full border border-[#132E20]/10">
              DIRECT SUPPORT & INQUIRIES
            </span>
            <h1 className="font-serif-display text-5xl sm:text-6xl md:text-7xl font-normal mt-4 leading-tight">
              Get in touch with <span className="italic text-[#D97736]">our team.</span>
            </h1>
            <p className="font-sans-body text-base text-[#132E20]/75 mt-3">
              Have questions about direct farmer contracts, bulk restaurant orders, or soil testing? We're here to help.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Contact Info Card */}
            <div className="lg:col-span-5 bg-[#132E20] text-[#FBF8F3] rounded-3xl p-8 shadow-2xl border border-white/10 space-y-6">
              <h3 className="font-serif-display text-3xl font-bold text-[#FBF8F3]">
                Origin Headquarters
              </h3>
              <p className="font-sans-body text-xs text-[#FBF8F3]/75 leading-relaxed">
                Connect directly with our agricultural coordinators and regional hub logistics leads.
              </p>

              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-start gap-3 text-xs">
                  <MapPin className="w-5 h-5 text-[#D97736] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-[#FBF8F3]">Nashik Agritech Hub</span>
                    <span className="text-[#FBF8F3]/70">Plot 45, Valley Agro Zone, Nashik, Maharashtra 422003</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <Mail className="w-5 h-5 text-[#D97736] flex-shrink-0" />
                  <div>
                    <span className="font-bold block text-[#FBF8F3]">Direct Support Email</span>
                    <span className="text-[#FBF8F3]/70">support@farmdirect.org</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <Phone className="w-5 h-5 text-[#D97736] flex-shrink-0" />
                  <div>
                    <span className="font-bold block text-[#FBF8F3]">Farmer Support Line</span>
                    <span className="text-[#FBF8F3]/70">+91 1800-FARM-DIRECT</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Card */}
            <div className="lg:col-span-7 bg-white/90 border border-[#132E20]/12 rounded-3xl p-8 shadow-xl">
              {submitted ? (
                <div className="text-center py-12 space-y-4">
                  <CheckCircle2 className="w-16 h-16 text-[#D97736] mx-auto" />
                  <h3 className="font-serif-display text-3xl font-bold text-[#132E20]">
                    Message Received!
                  </h3>
                  <p className="font-sans-body text-sm text-[#132E20]/75">
                    Our regional team will respond to your inquiry within 2 business hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="font-serif-display text-2xl font-bold text-[#132E20] mb-2">
                    Send us a message
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-sans-body text-xs font-bold uppercase text-[#132E20]/60 block mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ramesh Kumar"
                        className="w-full px-4 py-2.5 bg-[#FBF8F3] border border-[#132E20]/15 rounded-xl text-sm focus:outline-none focus:border-[#D97736]"
                      />
                    </div>
                    <div>
                      <label className="font-sans-body text-xs font-bold uppercase text-[#132E20]/60 block mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="ramesh@example.com"
                        className="w-full px-4 py-2.5 bg-[#FBF8F3] border border-[#132E20]/15 rounded-xl text-sm focus:outline-none focus:border-[#D97736]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-sans-body text-xs font-bold uppercase text-[#132E20]/60 block mb-1">
                      Message
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="How can we assist your farm or procurement..."
                      className="w-full px-4 py-2.5 bg-[#FBF8F3] border border-[#132E20]/15 rounded-xl text-sm focus:outline-none focus:border-[#D97736]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#132E20] hover:bg-[#1B3B2B] text-[#FBF8F3] font-sans-body text-xs font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Send Message</span>
                    <Send className="w-4 h-4 text-[#D97736]" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
