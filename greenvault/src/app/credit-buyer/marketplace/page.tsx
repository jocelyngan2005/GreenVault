'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { cartUtils } from '@/lib/cartUtils';
import { CarbonCreditEconomy, carbonCreditUtils, CarbonCreditBalance } from '@/lib/carbonCreditEconomy';

interface ProjectNFT {
  id: string;
  projectName: string;
  owner: string;
  realWorldCO2Impact: number;    // Actual CO2 this project offsets
  priceInCredits: number;        // Price in carbon credits (not USD)
  minimumStake: number;          // Minimum carbon credits to participate
  location: string;
  projectType: string;
  description: string;
  totalNFTs: number;             // Total project NFTs available
  availableNFTs: number;         // NFTs still available for purchase
  verified: boolean;
  verificationDate: string;
  images: string[];
  impactMetrics: {
    communitiesBenefited: number;
    jobsCreated: number;
    biodiversityScore: number;
  };
  stakingRewards: {
    expectedAnnualReturn: number; // Carbon credits per year
    stakingPeriod: string;
    totalStaked: number;         // Carbon credits currently staked
  };
}

// Also define CarbonCredit interface for cart compatibility
interface CarbonCredit {
  id: string;
  projectName: string;
  owner: string;
  co2Amount: number;
  pricePerTon: number;
  location: string;
  projectType: string;
  description: string;
  verified: boolean;
}

export default function CreditBuyerMarketplace() {
  // User's carbon credit balance (replaces USD wallet)
  const [userBalance, setUserBalance] = useState<CarbonCreditBalance>({
    totalCredits: 150,          // User has 150 carbon credits
    availableCredits: 120,      // 120 available for trading
    lockedCredits: 30,          // 30 locked in current investments
    creditTypes: {
      forestConservation: 50,
      renewableEnergy: 40,
      ecosystemRestoration: 30,
      cleanCooking: 15,
      agriculture: 10,
      wasteManagement: 5
    }
  });

  const [projectNFTs] = useState<ProjectNFT[]>([
    {
      id: '1',
      projectName: 'Amazon Rainforest Conservation',
      owner: 'Indigenous Community Brazil',
      realWorldCO2Impact: 1500,  // This project offsets 1,500 tons CO2 annually
      priceInCredits: 25,        // Costs 25 carbon credits per NFT
      minimumStake: 5,           // Minimum 5 carbon credits to participate
      location: 'Brazil',
      projectType: 'Forest Conservation',
      description: 'Supporting indigenous communities in preserving 10,000 hectares of rainforest',
      totalNFTs: 100,            // 100 NFTs represent this project
      availableNFTs: 75,         // 75 still available
      verified: true,
      verificationDate: '2024-12-15',
      images: [],
      impactMetrics: {
        communitiesBenefited: 5,
        jobsCreated: 120,
        biodiversityScore: 95
      },
      stakingRewards: {
        expectedAnnualReturn: 8,  // 8 carbon credits per year return
        stakingPeriod: '12 months',
        totalStaked: 625          // 625 carbon credits currently staked by all users
      }
    },
    {
      id: '2',
      projectName: 'Solar Farm Initiative',
      owner: 'Community Solar Kenya',
      realWorldCO2Impact: 2000,
      priceInCredits: 18,
      minimumStake: 3,
      location: 'Kenya',
      projectType: 'Renewable Energy',
      description: 'Clean energy generation providing power to rural communities',
      totalNFTs: 80,
      availableNFTs: 32,
      verified: true,
      verificationDate: '2025-01-05',
      images: [],
      impactMetrics: {
        communitiesBenefited: 8,
        jobsCreated: 75,
        biodiversityScore: 60
      },
      stakingRewards: {
        expectedAnnualReturn: 6,
        stakingPeriod: '18 months',
        totalStaked: 864
      }
    },
    {
      id: '3',
      projectName: 'Mangrove Restoration',
      owner: 'Coastal Communities Phil',
      realWorldCO2Impact: 1200,
      priceInCredits: 22,
      minimumStake: 4,
      location: 'Philippines',
      projectType: 'Ecosystem Restoration',
      description: 'Coastal ecosystem restoration and community livelihood support',
      totalNFTs: 120,
      availableNFTs: 60,
      verified: true,
      verificationDate: '2024-11-20',
      images: [],
      impactMetrics: {
        communitiesBenefited: 12,
        jobsCreated: 200,
        biodiversityScore: 88
      },
      stakingRewards: {
        expectedAnnualReturn: 7,
        stakingPeriod: '15 months',
        totalStaked: 1320
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

  const addToCart = (project: ProjectNFT, quantity: number = 1) => {
    // Convert ProjectNFT to CarbonCredit format for cart
    const credit: CarbonCredit = {
      id: project.id,
      projectName: project.projectName,
      owner: project.owner,
      co2Amount: project.realWorldCO2Impact,
      pricePerTon: project.priceInCredits,
      location: project.location,
      projectType: project.projectType,
      description: project.description,
      verified: project.verified
    };

    const success = cartUtils.addToCart(credit, quantity);

    if (success) {
      // Show success feedback
      alert(`Added ${quantity} credit(s) from ${project.projectName} to cart!`);
    } else {
      alert('Failed to add item to cart. Please try again.');
    }
  };

  const filteredAndSortedCredits = projectNFTs
    .filter((project: ProjectNFT) => {
      if (selectedType !== 'All' && project.projectType !== selectedType) return false;
      if (project.priceInCredits < priceRange[0] || project.priceInCredits > priceRange[1]) return false;
      return true;
    })
    .sort((a: ProjectNFT, b: ProjectNFT) => {
      switch (sortBy) {
        case 'price-low': return a.priceInCredits - b.priceInCredits;
        case 'price-high': return b.priceInCredits - a.priceInCredits;
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
          <h1 className="text-3xl font-bold mb-2">🌱 Carbon Credit NFT Marketplace</h1>
          <p className="text-gray-600">Invest your carbon credits in real-world offset projects represented as tradable NFTs.</p>
          
          {/* Carbon Credit Balance Display */}
          <div className="mt-4 p-4 bg-green-100 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Your Carbon Credit Wallet</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Available Credits</p>
                <p className="text-2xl font-bold text-green-700">{userBalance.availableCredits}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Locked Credits</p>
                <p className="text-2xl font-bold text-blue-700">{userBalance.lockedCredits}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Credits</p>
                <p className="text-2xl font-bold text-gray-700">{userBalance.totalCredits}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Purchase Goals */}
        <div className="border border-black p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">Quick Purchase Goals</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { amount: 5, label: '5 Carbon Credits', description: 'Small offset projects' },
              { amount: 15, label: '15 Carbon Credits', description: 'Medium impact projects' },
              { amount: 30, label: '30 Carbon Credits', description: 'Large scale projects' },
              { amount: 50, label: '50 Carbon Credits', description: 'Major conservation efforts' }
            ].map((goal) => (
              <button
                key={goal.amount}
                onClick={() => {
                  const suitableProject = projectNFTs.find(p => p.priceInCredits <= goal.amount && p.availableNFTs > 0);
                  if (suitableProject) {
                    addToCart(suitableProject, 1);
                  } else {
                    alert('No suitable projects available for this budget');
                  }
                }}
                className="border border-black p-4 hover:bg-gray-50 transition-colors text-center"
              >
                <p className="font-semibold">{goal.label}</p>
                <p className="text-sm text-gray-600">{goal.description}</p>
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
                <label className="block text-sm font-medium mb-2">Price Range (credits per NFT)</label>
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
          {filteredAndSortedCredits.map((project: ProjectNFT) => (
            <div key={project.id} className="border border-black">
              {/* Project Image Placeholder */}
              <div className="h-48 bg-gray-100 border-b border-black flex items-center justify-center">
                <span className="text-gray-500 text-sm">Project Image</span>
              </div>

              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg mb-1">{project.projectName}</h3>
                    <p className="text-sm text-gray-600">{project.location} • {project.projectType}</p>
                  </div>
                  {project.verified && (
                    <span className="text-green-600 text-xs font-medium">✓ Verified</span>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-700 mb-4 line-clamp-2">{project.description}</p>

                {/* Impact Metrics */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                  <div className="text-center">
                    <p className="font-medium">{project.impactMetrics.communitiesBenefited}</p>
                    <p className="text-gray-600">Communities</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{project.impactMetrics.jobsCreated}</p>
                    <p className="text-gray-600">Jobs Created</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{project.impactMetrics.biodiversityScore}/100</p>
                    <p className="text-gray-600">Bio Score</p>
                  </div>
                </div>

                {/* Price and CO2 */}
                <div className="bg-gray-50 p-3 mb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-bold">{project.priceInCredits} credits/NFT</p>
                      <p className="text-sm text-gray-600">{project.realWorldCO2Impact} tons CO₂ per year</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Available NFTs</p>
                      <p className="font-medium">{project.availableNFTs.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Purchase Section */}
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="NFTs"
                      min="1"
                      step="1"
                      className="flex-1 p-2 border border-gray-300 text-sm"
                    />
                    <button
                      onClick={() => addToCart(project, 1)}
                      className="bg-green-600 text-white px-4 py-2 text-sm hover:bg-green-700 transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link
                      href={`/credit-buyer/marketplace/${project.id}`}
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
