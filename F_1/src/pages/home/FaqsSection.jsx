import ScrollAnimation from '../../components/common/ScrollAnimation';
import Card from '../../components/common/Card';

export default function FaqsSection() {
  const faqs = [
    { q: "Is it really fresh?", a: "Yes! Products ship directly from farmers to you within 3-5 days. No storage, no middlemen - just farm fresh." },
    { q: "What if I don't know how to use online shopping?", a: "No problem! Our simple interface is designed for everyone. Just fill basic info, browse, click add to cart, and checkout - that's it!" },
    { q: "What if the product arrives in bad condition?", a: "We have a quality guarantee. If products arrive damaged, we'll replace them or refund your money." },
    { q: "Is payment safe?", a: "Absolutely. We use secure payment gateways. Your card information is encrypted and never stored on our servers." },
    { q: "How do I know the farmer is trustworthy?", a: "All farmers are verified. You can see their ratings, reviews, and years of experience before ordering." },
  ];

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <ScrollAnimation className="scroll-slide mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center">Common Questions Answered</h2>
        </ScrollAnimation>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <ScrollAnimation key={i} className="scroll-slide" style={{ animationDelay: `${i * 0.05}s` }}>
              <Card className="p-6 bg-white">
                <h3 className="font-bold text-gray-900 mb-2 text-lg">❓ {faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </Card>
            </ScrollAnimation>
          ))}
        </div>
      </div>
    </section>
  );
}
