'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { MockCarbonCreditContractClient, MockCarbonCreditStorage } from '@/lib/mockCarbonCreditContracts';

// Simplified project interface for marketplace
interface MarketplaceProject {
  id: string;
  name: string;
  description: string;
  location: string;
  projectType: string;
  priceInCredits: number;      // Price in carbon credits
  minimumStake: number;        // Minimum credits to stake
  co2Impact: number;           // Annual CO2 offset in tons
  verified: boolean;
  expectedReturns: number;     // Expected annual carbon credit returns
  totalStaked: number;         // Total credits currently staked
  availableNFTs: number;       // NFTs available for purchase
}

// User's carbon credit balance
interface CarbonCreditBalance {
  totalCredits: number;
  availableCredits: number;
  lockedCredits: number;
  creditTypes: {
    forestConservation: number;
    renewableEnergy: number;
    ecosystemRestoration: number;
    cleanCooking: number;
    agriculture: number;
    wasteManagement: number;
  };
}

export default function CarbonCreditMarketplace() {
  // User's carbon credit balance (replaces USD wallet)
  const [userBalance, setUserBalance] = useState<CarbonCreditBalance>({
    totalCredits: 150,
    availableCredits: 120,
    lockedCredits: 30,
    creditTypes: {
      forestConservation: 50,
      renewableEnergy: 40,
      ecosystemRestoration: 30,
      cleanCooking: 15,
      agriculture: 10,
      wasteManagement: 5
    }
  });

  const [projects] = useState<MarketplaceProject[]>([
    {
      id: 'AMZN-2024-001',
      name: 'Amazon Rainforest Conservation',
      description: 'Protecting 50,000 hectares of Amazon rainforest through carbon credit financing',
      location: 'Brazil, Amazon Basin',
      projectType: 'Forest Conservation',
      priceInCredits: 25,
      minimumStake: 5,
      co2Impact: 1500,
      verified: true,
      expectedReturns: 8,
      totalStaked: 625,
      availableNFTs: 75
    },
    {
      id: 'SOLR-2024-002',
      name: 'Solar Farm Initiative',
      description: 'Community-owned solar farm generating clean energy and carbon credits',
      location: 'Kenya',
      projectType: 'Renewable Energy',
      priceInCredits: 18,
      minimumStake: 3,
      co2Impact: 2000,
      verified: true,
      expectedReturns: 6,
      totalStaked: 864,
      availableNFTs: 32
    },
    {
      id: 'MANG-2024-003',
      name: 'Mangrove Restoration',
      description: 'Coastal mangrove restoration for carbon sequestration and flood protection',
      location: 'Philippines',
      projectType: 'Ecosystem Restoration',
      priceInCredits: 22,
      minimumStake: 4,
      co2Impact: 1200,
      verified: true,
      expectedReturns: 7,
      totalStaked: 1320,
      availableNFTs: 60
    },
    {
      id: 'COOK-2024-004',
      name: 'Clean Cooking Stoves',
      description: 'Distribution of efficient cooking stoves to reduce deforestation',
      location: 'Uganda',
      projectType: 'Clean Cooking',
      priceInCredits: 12,
      minimumStake: 2,
      co2Impact: 800,
      verified: true,
      expectedReturns: 4,
      totalStaked: 1800,
      availableNFTs: 150
    }
  ]);

  const [selectedType, setSelectedType] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 30]);
  const [sortBy, setSortBy] = useState('price-low');
  const [stakeAmounts, setStakeAmounts] = useState<{[key: string]: number}>({});
  const [isStaking, setIsStaking] = useState<{[key: string]: boolean}>({});

  const projectTypes = ['All', 'Forest Conservation', 'Renewable Energy', 'Ecosystem Restoration', 'Clean Cooking', 'Agriculture'];

  // Mock staking function using the mock contract client
  const stakeInProject = async (project: MarketplaceProject, stakeAmount: number) => {
    if (stakeAmount < project.minimumStake) {
      alert(`❌ Minimum stake is ${project.minimumStake} carbon credits`);
      return;
    }

    if (stakeAmount > userBalance.availableCredits) {
      alert(`❌ Insufficient carbon credits. You have ${userBalance.availableCredits} available.`);
      return;
    }

    setIsStaking(prev => ({...prev, [project.id]: true}));

    try {
      // Use mock contract client
      const result = await MockCarbonCreditContractClient.stakeCreditsInProject(
        'carbon_registry',
        project.id,
        stakeAmount,
        12, // 12 months staking period
        'user_address_mock'
      );

      if (result.success) {
        // Update user balance
        setUserBalance(prev => ({
          ...prev,
          availableCredits: prev.availableCredits - stakeAmount,
          lockedCredits: prev.lockedCredits + stakeAmount
        }));

        // Save transaction to mock storage
        MockCarbonCreditStorage.saveTransaction({
          type: 'stake',
          projectId: project.id,
          projectName: project.name,
          amount: stakeAmount,
          timestamp: new Date().toISOString(),
          txHash: result.txHash
        });

        alert(`✅ Successfully staked ${stakeAmount} carbon credits in ${project.name}!\n\nExpected annual return: ${project.expectedReturns} carbon credits\n\nTransaction: ${result.txHash.substring(0, 10)}...`);
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      alert('❌ Transaction failed. Please try again.');
    } finally {
      setIsStaking(prev => ({...prev, [project.id]: false}));
    }
  };

  // Filter and sort projects
  const filteredProjects = projects
    .filter(project => {
      if (selectedType !== 'All' && project.projectType !== selectedType) return false;
      if (project.priceInCredits < priceRange[0] || project.priceInCredits > priceRange[1]) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.priceInCredits - b.priceInCredits;
        case 'price-high': return b.priceInCredits - a.priceInCredits;
        case 'return-high': return b.expectedReturns - a.expectedReturns;
        case 'impact-high': return b.co2Impact - a.co2Impact;
        default: return 0;
      }
    });

  return (
    <div className="min-h-screen bg-green-50">
      <Navigation>
        <div></div>
      </Navigation>
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-2">
            🌱 Carbon Credit Marketplace
          </h1>
          <p className="text-gray-600 text-lg">
            Invest carbon credits in real-world offset projects as tradable NFTs
          </p>
          
          {/* Carbon Credit Balance Display */}
          <div className="mt-6 p-4 bg-green-100 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Your Carbon Credit Wallet</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Available Credits</p>
                <p className="text-2xl font-bold text-green-700">{userBalance.availableCredits}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Staked Credits</p>
                <p className="text-2xl font-bold text-blue-700">{userBalance.lockedCredits}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Credits</p>
                <p className="text-2xl font-bold text-gray-700">{userBalance.totalCredits}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Project Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {projectTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Range: {priceRange[0]}-{priceRange[1]} credits
              </label>
              <input
                type="range"
                min="0"
                max="30"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="w-full"
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="return-high">Returns: High to Low</option>
                <option value="impact-high">CO2 Impact: High to Low</option>
              </select>
            </div>

            {/* Results */}
            <div className="flex items-end">
              <p className="text-sm text-gray-600">
                {filteredProjects.length} projects found
              </p>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* Project Image */}
              <div className="h-48 bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-4xl mb-2">
                    {project.projectType === 'Forest Conservation' && '🌲'}
                    {project.projectType === 'Renewable Energy' && '☀️'}
                    {project.projectType === 'Ecosystem Restoration' && '🌊'}
                    {project.projectType === 'Clean Cooking' && '🔥'}
                  </div>
                  <p className="font-semibold">{project.location}</p>
                </div>
              </div>

              {/* Project Details */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="font-bold text-lg mb-1">{project.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    {project.projectType}
                  </span>
                  {project.verified && (
                    <span className="inline-block ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      ✓ Verified
                    </span>
                  )}
                </div>

                {/* Impact Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-500">CO2 Impact</p>
                    <p className="font-medium">{project.co2Impact} tons/year</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Expected Returns</p>
                    <p className="font-medium">{project.expectedReturns} credits/year</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Staked</p>
                    <p className="font-medium">{project.totalStaked} credits</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Available NFTs</p>
                    <p className="font-medium">{project.availableNFTs}</p>
                  </div>
                </div>

                {/* Pricing and Staking */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-lg font-bold text-green-600">
                        {project.priceInCredits} credits
                      </p>
                      <p className="text-xs text-gray-500">
                        Min: {project.minimumStake} credits
                      </p>
                    </div>
                  </div>

                  {/* Stake Input */}
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder={`Min ${project.minimumStake} credits`}
                      value={stakeAmounts[project.id] || ''}
                      onChange={(e) => setStakeAmounts(prev => ({
                        ...prev,
                        [project.id]: parseInt(e.target.value) || 0
                      }))}
                      className="w-full p-2 border rounded-md text-sm"
                      min={project.minimumStake}
                      max={userBalance.availableCredits}
                    />
                    
                    <button
                      onClick={() => stakeInProject(project, stakeAmounts[project.id] || project.minimumStake)}
                      disabled={isStaking[project.id] || userBalance.availableCredits < project.minimumStake}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                    >
                      {isStaking[project.id] ? '🔄 Staking...' : '🌱 Stake Credits'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No projects match your current filters</p>
            <button
              onClick={() => {
                setSelectedType('All');
                setPriceRange([0, 30]);
              }}
              className="mt-4 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
