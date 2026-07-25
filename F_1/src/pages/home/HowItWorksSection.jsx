import ScrollAnimation from '../../components/common/ScrollAnimation';
import Card from '../../components/common/Card';

export default function HowItWorksSection() {
  return (
    <section className="py-20 px-4 relative z-10">
      <div className="max-w-6xl mx-auto relative z-10">
        <ScrollAnimation className="scroll-slide mb-16">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works - Simple Steps</h2>
            <p className="text-lg text-gray-600">A beginner's guide to buying fresh produce directly from farmers</p>
          </div>
        </ScrollAnimation>

        {/* For Buyers */}
        <div className="mb-20">
          <ScrollAnimation className="scroll-slide mb-12">
            <h3 className="text-3xl font-bold text-green-600 text-center mb-8 flex items-center justify-center gap-2">
              👥 For Buyers - 3 Simple Steps
            </h3>
          </ScrollAnimation>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <ScrollAnimation className="scroll-slide">
              <Card hover className="h-full bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
                <div className="p-8">
                  <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center text-3xl font-bold mb-6 mx-auto">
                    1
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4 text-center">Sign Up (1 minute)</h4>
                  <div className="space-y-3 text-gray-700">
                    <div className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Click <strong>"Start Buying"</strong> button</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Enter your name, email, and phone</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Create a password</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Select "Buyer" role and continue</span>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-blue-100 rounded-lg text-sm text-blue-800">
                    ℹ️ No technical knowledge needed - just basic info required
                  </div>
                </div>
              </Card>
            </ScrollAnimation>

            {/* Step 2 */}
            <ScrollAnimation className="scroll-slide" style={{ animationDelay: '0.1s' }}>
              <Card hover className="h-full bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                <div className="p-8">
                  <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center text-3xl font-bold mb-6 mx-auto">
                    2
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4 text-center">Browse Products (5 minutes)</h4>
                  <div className="space-y-3 text-gray-700">
                    <div className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Go to <strong>Marketplace</strong></span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>See fresh fruits & vegetables</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>View farmer info and prices</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Read product details & reviews</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Click "Add to Cart" for items you like</span>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-green-100 rounded-lg text-sm text-green-800">
                    💡 Tip: Check farmer ratings before purchasing
                  </div>
                </div>
              </Card>
            </ScrollAnimation>

            {/* Step 3 */}
            <ScrollAnimation className="scroll-slide" style={{ animationDelay: '0.2s' }}>
              <Card hover className="h-full bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200">
                <div className="p-8">
                  <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center text-3xl font-bold mb-6 mx-auto">
                    3
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4 text-center">Checkout & Delivery (2-3 days)</h4>
                  <div className="space-y-3 text-gray-700">
                    <div className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Go to <strong>Shopping Cart</strong></span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Review your items</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Click <strong>"Proceed to Checkout"</strong></span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Enter delivery address</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Complete payment</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Get fresh produce in 3-5 days!</span>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-orange-100 rounded-lg text-sm text-orange-800">
                    🚚 Free delivery on orders above ₹500
                  </div>
                </div>
              </Card>
            </ScrollAnimation>
          </div>
        </div>

        {/* For Farmers */}
        <div>
          <ScrollAnimation className="scroll-slide mb-12">
            <h3 className="text-3xl font-bold text-green-600 text-center mb-8 flex items-center justify-center gap-2">
              🌾 For Farmers - 3 Simple Steps
            </h3>
          </ScrollAnimation>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {/* Farmer Step 1 */}
            <ScrollAnimation className="scroll-slide">
              <Card hover className="h-full bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                <div className="p-8">
                  <div className="w-16 h-16 bg-purple-500 text-white rounded-full flex items-center justify-center text-3xl font-bold mb-6 mx-auto">
                    1
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4 text-center">Register (3 minutes)</h4>
                  <div className="space-y-3 text-gray-700">
                    <div className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Click <strong>"Join as Farmer"</strong></span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Enter basic information</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Add farm location</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Create your account</span>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-purple-100 rounded-lg text-sm text-purple-800">
                    ℹ️ Your profile gets verified within 24 hours
                  </div>
                </div>
              </Card>
            </ScrollAnimation>

            {/* Farmer Step 2 */}
            <ScrollAnimation className="scroll-slide" style={{ animationDelay: '0.1s' }}>
              <Card hover className="h-full bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200">
                <div className="p-8">
                  <div className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center text-3xl font-bold mb-6 mx-auto">
                    2
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4 text-center">List Your Products (5 minutes)</h4>
                  <div className="space-y-3 text-gray-700">
                    <div className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Go to <strong>My Farm Dashboard</strong></span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Click <strong>"Add Crop"</strong></span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Enter crop name and quantity</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Set your price</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Add photos and description</span>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-red-100 rounded-lg text-sm text-red-800">
                    💡 Tip: Competitive pricing = more sales
                  </div>
                </div>
              </Card>
            </ScrollAnimation>

            {/* Farmer Step 3 */}
            <ScrollAnimation className="scroll-slide" style={{ animationDelay: '0.2s' }}>
              <Card hover className="h-full bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200">
                <div className="p-8">
                  <div className="w-16 h-16 bg-yellow-500 text-white rounded-full flex items-center justify-center text-3xl font-bold mb-6 mx-auto">
                    3
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4 text-center">Get Orders & Earn (Ongoing)</h4>
                  <div className="space-y-3 text-gray-700">
                    <div className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Customers order your products</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Get order notifications instantly</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Prepare and pack your produce</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Arrange courier pickup</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-green-600 font-bold">•</span>
                      <span>Get paid directly (no commission!)</span>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-yellow-100 rounded-lg text-sm text-yellow-800">
                    ✅ Keep 100% of your earnings - no middlemen
                  </div>
                </div>
              </Card>
            </ScrollAnimation>
          </div>
        </div>
      </div>
    </section>
  );
}
