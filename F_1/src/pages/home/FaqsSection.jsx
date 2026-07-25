import { useState } from 'react';
import ScrollAnimation from '../../components/common/ScrollAnimation';
import { ChevronDown, HelpCircle } from 'lucide-react';

export default function FaqsSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    { q: "Is it really fresh?", a: "Yes! Products ship directly from farmers to you within 3-5 days. No storage, no middlemen - just farm fresh." },
    { q: "What if I don't know how to use online shopping?", a: "No problem! Our simple interface is designed for everyone. Just fill basic info, browse, click add to cart, and checkout - that's it!" },
    { q: "What if the product arrives in bad condition?", a: "We have a quality guarantee. If products arrive damaged, we'll replace them or refund your money." },
    { q: "Is payment safe?", a: "Absolutely. We use secure payment gateways. Your card information is encrypted and never stored on our servers." },
    { q: "How do I know the farmer is trustworthy?", a: "All farmers are verified. You can see their ratings, reviews, and years of experience before ordering." },
  ];

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 bg-white/40 backdrop-blur-md">
      <div className="max-w-4xl mx-auto">
        <ScrollAnimation className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <HelpCircle className="w-8 h-8 text-green-500" />
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
              Common Questions
            </h2>
          </div>
          <p className="text-xl text-gray-600 font-medium">Everything you need to know about FarmDirect</p>
        </ScrollAnimation>
        
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <ScrollAnimation key={i} style={{ animationDelay: `${i * 0.05}s` }}>
              <div 
                className={`bg-white/80 backdrop-blur-xl border ${openIndex === i ? 'border-green-300 shadow-[0_10px_30px_rgb(0,0,0,0.06)]' : 'border-white/60 shadow-sm'} rounded-3xl overflow-hidden transition-all duration-300`}
              >
                <button 
                  onClick={() => toggleFaq(i)}
                  className="w-full text-left px-8 py-6 flex items-center justify-between focus:outline-none"
                >
                  <h3 className={`font-bold text-lg transition-colors duration-300 ${openIndex === i ? 'text-green-700' : 'text-gray-900'}`}>
                    {faq.q}
                  </h3>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${openIndex === i ? 'rotate-180 text-green-500' : ''}`} />
                </button>
                
                <div 
                  className={`px-8 overflow-hidden transition-all duration-300 ease-in-out ${openIndex === i ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <p className="text-gray-600 font-medium leading-relaxed">{faq.a}</p>
                </div>
              </div>
            </ScrollAnimation>
          ))}
        </div>
      </div>
    </section>
  );
}
