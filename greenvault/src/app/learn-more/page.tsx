'use client';

import Link from 'next/link';

export default function LearnMorePage() {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b border-black">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold hover:underline">
              GreenVault
            </Link>
            <div className="flex gap-4">
              <Link href="/role-selection" className="text-sm hover:underline">
                Get Started
              </Link>
              <Link href="/login" className="text-sm hover:underline">
                Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">How GreenVault Works</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Learn how our platform connects environmental stewards with those seeking to offset their carbon footprint.
          </p>
        </div>

        {/* For Project Owners */}
        <section className="mb-16">
          <div className="border border-black p-8">
            <div className="flex items-center mb-6">
              <span className="text-4xl mr-4">🌱</span>
              <div>
                <h2 className="text-2xl font-bold">For Project Owners</h2>
                <p className="text-gray-600">Local communities, environmental stewards, conservation groups</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="text-3xl mb-3">📝</div>
                <h3 className="font-semibold mb-2">1. Register Your Project</h3>
                <p className="text-sm text-gray-600">
                  Document your conservation project: forest preservation, clean energy, ecosystem restoration, or sustainable agriculture.
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">✅</div>
                <h3 className="font-semibold mb-2">2. Get Verified</h3>
                <p className="text-sm text-gray-600">
                  Our verification process ensures your project meets international carbon credit standards.
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">💰</div>
                <h3 className="font-semibold mb-2">3. Mint & Sell</h3>
                <p className="text-sm text-gray-600">
                  Create NFTs representing your carbon credits and list them on our marketplace to earn revenue.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 border border-gray-300">
              <h3 className="font-semibold mb-3">What You Need:</h3>
              <ul className="text-sm space-y-1">
                <li>• An email address (no crypto wallet required)</li>
                <li>• Documentation of your environmental project</li>
                <li>• Proof of land ownership or usage rights</li>
                <li>• Community consent and impact measurements</li>
              </ul>
            </div>
          </div>
        </section>

        {/* For Credit Buyers */}
        <section className="mb-16">
          <div className="border border-black p-8">
            <div className="flex items-center mb-6">
              <span className="text-4xl mr-4">🏢</span>
              <div>
                <h2 className="text-2xl font-bold">For Credit Buyers</h2>
                <p className="text-gray-600">Companies, organizations, environmentally conscious individuals</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="font-semibold mb-2">1. Set Your Goals</h3>
                <p className="text-sm text-gray-600">
                  Define your carbon offset targets - monthly, yearly, or per project basis.
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">🛒</div>
                <h3 className="font-semibold mb-2">2. Browse & Buy</h3>
                <p className="text-sm text-gray-600">
                  Explore verified carbon credit projects and purchase NFTs that align with your values.
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="font-semibold mb-2">3. Track Impact</h3>
                <p className="text-sm text-gray-600">
                  Monitor your carbon footprint reduction and the positive impact of your purchases.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 border border-gray-300">
              <h3 className="font-semibold mb-3">Platform Features:</h3>
              <ul className="text-sm space-y-1">
                <li>• AI assistant for personalized recommendations</li>
                <li>• Automated monthly purchasing options</li>
                <li>• Detailed project impact metrics</li>
                <li>• Carbon footprint calculator and tracking</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Built on Sustainable Technology</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border border-black p-6">
              <h3 className="font-semibold mb-3">🔐 Privacy-First Identity</h3>
              <p className="text-sm text-gray-600 mb-4">
                zkLogin technology ensures your identity remains private while enabling secure transactions.
              </p>
              <ul className="text-sm space-y-1">
                <li>• No personal data stored on blockchain</li>
                <li>• Secure authentication without revealing identity</li>
                <li>• Compliance with global privacy regulations</li>
              </ul>
            </div>
            
            <div className="border border-black p-6">
              <h3 className="font-semibold mb-3">🌐 Sui Blockchain</h3>
              <p className="text-sm text-gray-600 mb-4">
                Built on Sui for fast, low-cost, and environmentally sustainable transactions.
              </p>
              <ul className="text-sm space-y-1">
                <li>• Low energy consumption</li>
                <li>• Instant transaction finality</li>
                <li>• Minimal transaction fees</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Impact Section */}
        <section className="mb-16">
          <div className="bg-green-50 border border-green-200 p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Global Impact</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-3xl font-bold text-green-600">50+</p>
                <p className="text-sm text-gray-600">Verified Projects</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">10,000+</p>
                <p className="text-sm text-gray-600">Tons CO₂ Offset</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">25</p>
                <p className="text-sm text-gray-600">Countries Represented</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-6">
              Join thousands of projects and buyers making a real difference in climate action.
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Make an Impact?</h2>
          <p className="text-gray-600 mb-8">
            Choose your role and start contributing to global climate action today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/role-selection" 
              className="bg-black text-white px-8 py-3 border border-black hover:bg-white hover:text-black transition-colors text-center"
            >
              Get Started
            </Link>
            <Link 
              href="/marketplace" 
              className="bg-white text-black px-8 py-3 border border-black hover:bg-black hover:text-white transition-colors text-center"
            >
              Browse Projects
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
