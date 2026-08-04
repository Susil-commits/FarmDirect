import React from 'react';
import { useRouter } from '../hooks/useRouter';
import PageTransition from '../components/common/PageTransition';
import { Shield, Lock, EyeOff, Server, ArrowLeft } from 'lucide-react';

export default function Privacy() {
  const { navigate } = useRouter();

  const pillars = [
    {
      icon: <Lock className="text-emerald-600" size={24} />,
      title: "Bank-Grade Encryption",
      desc: "All your personal and transaction data is encrypted in transit and at rest using AES-256 standards."
    },
    {
      icon: <EyeOff className="text-emerald-600" size={24} />,
      title: "No Third-Party Selling",
      desc: "We never sell or rent your personal information to third parties. Your data is yours alone."
    },
    {
      icon: <Shield className="text-emerald-600" size={24} />,
      title: "Strict Access Control",
      desc: "Only authorized personnel have access to sensitive information, strictly for support or legal obligations."
    },
    {
      icon: <Server className="text-emerald-600" size={24} />,
      title: "Secure Infrastructure",
      desc: "Our servers are hosted in secure, ISO-certified data centers with 24/7 monitoring."
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-50 py-16 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-900 to-slate-50 pointer-events-none opacity-5" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-semibold transition-colors mb-12 cursor-pointer"
          >
            <ArrowLeft size={18} /> Back to Home
          </button>

          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">Our Privacy Commitment</h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              At FarmDirect, we treat your data with the same respect as a top-tier financial institution. Transparency and security are our core principles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {pillars.map((p, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition duration-300">
                <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center mb-5">
                  {p.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{p.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-8 border-b border-slate-100 pb-4">Detailed Privacy Policy</h2>
            
            <div className="prose prose-lg max-w-none text-slate-600 space-y-8">
              <section>
                <h3 className="text-lg font-bold text-slate-900 mb-2">1. Information We Collect</h3>
                <p>
                  FarmDirect collects information you provide directly to us, including personal identification information, 
                  contact details, farm information, and transaction history. We ensure minimal data collection for essential functionality.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-slate-900 mb-2">2. How We Use Your Information</h3>
                <p>
                  We use the information we collect to provide, maintain, and improve our services, process transactions, 
                  send transactional and promotional communications, and comply with legal obligations.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-slate-900 mb-2">3. Information Sharing</h3>
                <p>
                  We do not sell or rent your personal information to third parties. We may share information with 
                  trusted partners who assist us in operating our platform under strict confidentiality agreements and regular security audits.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-slate-900 mb-2">4. Security</h3>
                <p>
                  We implement robust technical and organizational measures to protect your personal information 
                  against unauthorized access, alteration, disclosure, or destruction. Regular penetration testing ensures our systems remain secure.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-slate-900 mb-2">5. Cookies</h3>
                <p>
                  We use cookies and similar technologies securely to understand how you use our platform and to improve 
                  your experience. You have full control over your cookie settings.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-slate-900 mb-2">6. Your Rights</h3>
                <p>
                  You have the absolute right to access, correct, export, or permanently delete your personal information. Please contact us 
                  at privacy@farmdirect.com to exercise these rights.
                </p>
              </section>

              <div className="bg-slate-50 p-6 rounded-xl mt-8 border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Contact Us</h3>
                <p>
                  If you have questions about this Privacy Policy or our privacy practices, our Data Protection Officer is available at:
                  <br /><br />
                  <strong>Email:</strong> privacy@farmdirect.com<br />
                  <strong>Phone:</strong> +91-98765-43210
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <p className="text-slate-500 text-sm font-medium">Last updated: August 2026</p>
                <div className="flex gap-6 text-sm font-medium">
                  <button onClick={() => navigate('/terms')} className="text-emerald-700 hover:text-emerald-800 transition cursor-pointer">Terms of Service</button>
                  <button onClick={() => navigate('/refund')} className="text-emerald-700 hover:text-emerald-800 transition cursor-pointer">Refund Policy</button>
                  <button onClick={() => navigate('/contact')} className="text-emerald-700 hover:text-emerald-800 transition cursor-pointer">Support</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
