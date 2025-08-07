'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { cartUtils } from '@/lib/cartUtils';

interface CarbonCredit {
  id: string;
  projectName: string;
  owner: string;
  co2Amount: number;
  pricePerTon: number;
  location: string;
  projectType: string;
  description: string;
  totalCredits: number;
  availableCredits: number;
  verified: boolean;
  verificationDate: string;
  images: string[];
  impactMetrics: {
    communitiesBenefited: number;
    jobsCreated: number;
    biodiversityScore: number;
  };
}

export default function CreditBuyerMarketplace() {
  const [credits] = useState<CarbonCredit[]>([
    {
      id: '1',
      projectName: 'Amazon Rainforest Conservation',
      owner: 'Indigenous Community Brazil',
      co2Amount: 1.5,
      pricePerTon: 25,
      location: 'Brazil',
      projectType: 'Forest Conservation',
      description: 'Supporting indigenous communities in preserving 10,000 hectares of rainforest',
      totalCredits: 1000,
      availableCredits: 750,
      verified: true,
      verificationDate: '2024-12-15',
      images: [],
      impactMetrics: {
        communitiesBenefited: 5,
        jobsCreated: 120,
        biodiversityScore: 95
      }
    },
    {
      id: '2',
      projectName: 'Solar Farm Initiative',
      owner: 'Community Solar Kenya',
      co2Amount: 2.0,
      pricePerTon: 18,
      location: 'Kenya',
      projectType: 'Renewable Energy',
      description: 'Clean energy generation providing power to rural communities',
      totalCredits: 500,
      availableCredits: 320,
      verified: true,
      verificationDate: '2025-01-05',
      images: [],
      impactMetrics: {
        communitiesBenefited: 8,
        jobsCreated: 75,
        biodiversityScore: 60
      }
    },
    {
      id: '3',
      projectName: 'Mangrove Restoration',
      owner: 'Coastal Communities Phil',
      co2Amount: 1.2,
      pricePerTon: 22,
      location: 'Philippines',
      projectType: 'Ecosystem Restoration',
      description: 'Coastal ecosystem restoration and community livelihood support',
      totalCredits: 800,
      availableCredits: 600,
      verified: true,
      verificationDate: '2024-11-20',
      images: [],
      impactMetrics: {
        communitiesBenefited: 12,
        jobsCreated: 200,
        biodiversityScore: 88
      }
    }
  ]);

  const [selectedType, setSelectedType] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 50]);
  const [sortBy, setSortBy] = useState('price-low');
  const [showFilters, setShowFilters] = useState(false);
  const [cartSummary, setCartSummary] = useState({ itemCount: 0, totalAmount: 0, totalCO2: 0 });

  useEffect(() => {
    // Initialize cart summary
    setCartSummary(cartUtils.getCartSummary());

    // Listen for cart updates
    const handleCartUpdate = () => {
      setCartSummary(cartUtils.getCartSummary());
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const projectTypes = ['All', 'Forest Conservation', 'Renewable Energy', 'Ecosystem Restoration', 'Clean Cooking', 'Agriculture'];

  const addToCart = (credit: CarbonCredit, quantity: number = 1) => {
    const success = cartUtils.addToCart({
      id: credit.id,
      projectName: credit.projectName,
      owner: credit.owner,
      co2Amount: credit.co2Amount,
      pricePerTon: credit.pricePerTon,
      location: credit.location,
      projectType: credit.projectType,
      description: credit.description,
      verified: credit.verified
    }, quantity);

    if (success) {
      // Show success feedback
      alert(`Added ${quantity} credit(s) from ${credit.projectName} to cart!`);
    } else {
      alert('Failed to add item to cart. Please try again.');
    }
  };

  const filteredAndSortedCredits = credits
    .filter(credit => {
      if (selectedType !== 'All' && credit.projectType !== selectedType) return false;
      if (credit.pricePerTon < priceRange[0] || credit.pricePerTon > priceRange[1]) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.pricePerTon - b.pricePerTon;
        case 'price-high': return b.pricePerTon - a.pricePerTon;
        case 'impact-high': return b.impactMetrics.biodiversityScore - a.impactMetrics.biodiversityScore;
        case 'newest': return new Date(b.verificationDate).getTime() - new Date(a.verificationDate).getTime();
        default: return 0;
      }
    });

  return (
    <Navigation>
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Carbon Credit Marketplace</h1>
          <p className="text-gray-600">Purchase verified carbon credits to offset your emissions and support sustainable projects worldwide.</p>
        </div>

        {/* Quick Purchase Goals */}
        <div className="border border-black p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">Quick Purchase Goals</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { amount: 1, label: '1 Ton CO₂', price: 20 },
              { amount: 5, label: '5 Tons CO₂', price: 100 },
              { amount: 10, label: '10 Tons CO₂', price: 190 },
              { amount: 25, label: '25 Tons CO₂', price: 450 }
            ].map((goal) => (
              <button
                key={goal.amount}
                className="border border-black p-4 hover:bg-gray-50 transition-colors text-center"
              >
                <p className="font-semibold">{goal.label}</p>
                <p className="text-sm text-gray-600">~${goal.price}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="border border-black p-4 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Browse Credits ({filteredAndSortedCredits.length} available)</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm border border-black px-3 py-1 hover:bg-black hover:text-white transition-colors"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Project Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full p-2 border border-gray-300"
                >
                  {projectTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Price Range ($/ton)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="w-full p-2 border border-gray-300"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-full p-2 border border-gray-300"
                    placeholder="Max"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 border border-gray-300"
                >
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="impact-high">Impact Score: High to Low</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedType('All');
                    setPriceRange([0, 50]);
                    setSortBy('price-low');
                  }}
                  className="w-full p-2 border border-black hover:bg-black hover:text-white transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Credit Listings */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedCredits.map((credit) => (
            <div key={credit.id} className="border border-black">
              {/* Project Image Placeholder */}
              <div className="h-48 bg-gray-100 border-b border-black flex items-center justify-center">
                <span className="text-gray-500 text-sm">Project Image</span>
              </div>

              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg mb-1">{credit.projectName}</h3>
                    <p className="text-sm text-gray-600">{credit.location} • {credit.projectType}</p>
                  </div>
                  {credit.verified && (
                    <span className="text-green-600 text-xs font-medium">✓ Verified</span>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-700 mb-4 line-clamp-2">{credit.description}</p>

                {/* Impact Metrics */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                  <div className="text-center">
                    <p className="font-medium">{credit.impactMetrics.communitiesBenefited}</p>
                    <p className="text-gray-600">Communities</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{credit.impactMetrics.jobsCreated}</p>
                    <p className="text-gray-600">Jobs Created</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{credit.impactMetrics.biodiversityScore}/100</p>
                    <p className="text-gray-600">Bio Score</p>
                  </div>
                </div>

                {/* Price and CO2 */}
                <div className="bg-gray-50 p-3 mb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-bold">${credit.pricePerTon}/ton</p>
                      <p className="text-sm text-gray-600">{credit.co2Amount} tons CO₂ per credit</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Available</p>
                      <p className="font-medium">{credit.availableCredits.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Purchase Section */}
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Tons"
                      min="0.1"
                      step="0.1"
                      className="flex-1 p-2 border border-gray-300 text-sm"
                    />
                    <button
                      onClick={() => addToCart(credit, 1)}
                      className="bg-green-600 text-white px-4 py-2 text-sm hover:bg-green-700 transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link
                      href={`/credit-buyer/marketplace/${credit.id}`}
                      className="flex-1 bg-white text-black py-2 px-4 border border-black text-center text-sm hover:bg-black hover:text-white transition-colors"
                    >
                      View Details
                    </Link>
                    <button className="bg-black text-white px-4 py-2 text-sm hover:bg-white hover:text-black border border-black transition-colors">
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cart Summary */}
        {cartSummary.itemCount > 0 && (
          <div className="fixed bottom-4 right-4 bg-black text-white p-4 border border-black max-w-sm">
            <h3 className="font-bold mb-2">Cart Summary</h3>
            <p className="text-sm mb-3">
              {cartSummary.itemCount} items • Total: ${cartSummary.totalAmount.toFixed(2)}
            </p>
            <div className="flex gap-2">
              <Link
                href="/credit-buyer/cart"
                className="flex-1 bg-white text-black py-2 px-3 text-sm hover:bg-gray-200 transition-colors text-center"
              >
                View Cart
              </Link>
              <Link
                href="/credit-buyer/cart"
                className="flex-1 bg-green-600 text-white py-2 px-3 text-sm hover:bg-green-700 transition-colors text-center"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </main>
    </Navigation>
  );
}
