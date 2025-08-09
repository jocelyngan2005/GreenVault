'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import WalletStatus from '@/components/WalletStatus';
import { useWalletIntegration } from '@/lib/hooks/useWalletIntegration';
import { walletIntegratedSuiClient } from '@/lib/walletSuiIntegration';

interface ProjectListing {
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
  images: string[];
  verification_date: string;
}

export default function ProjectOwnerMarketplace() {
  // Load authenticated user data from localStorage/session (supports email & Google)
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; role?: string } | null>(null);

  useEffect(() => {
    import('@/lib/auth/user-data-sync').then(({ loadUnifiedUserData }) => {
      const user = loadUnifiedUserData();
      if (user && user.id && user.email) {
        setCurrentUser({ id: user.id, email: user.email, role: user.authType });
      }
    });
  }, []);

  // Wallet integration hook (only activate if user loaded)
  const {
    wallet,
    loading: walletLoading,
    error: walletError,
    activateWallet,
    refreshWallet,
    isWalletReady,
    canTransact
  } = useWalletIntegration({
    userId: currentUser?.id,
    email: currentUser?.email,
    autoRefresh: true,
    refreshInterval: 30000
  });

  const handleListProject = async (projectData: {
    projectName: string;
    location: string;
    co2Amount: number;
    price: number;
    projectType: string;
    description: string;
  }) => {
    if (!canTransact || !wallet) {
      alert('Please activate your Sui wallet first to list projects.');
      return;
    }

    try {
      console.log('Listing project on blockchain:', {
        projectData,
        walletAddress: wallet.address,
      });

      const result = await walletIntegratedSuiClient.listCarbonCredit(
        wallet.address, // This should be the private key, but we don't expose it in the frontend
        {
          projectId: `project-${Date.now()}`,
          co2Amount: projectData.co2Amount,
          price: projectData.price,
          location: projectData.location,
          projectType: projectData.projectType,
          description: projectData.description,
          methodology: 'GreenVault Standard v1.0',
          metadataUri: '',
        }
      );

      if (result.success) {
        alert(`Project listed successfully!\n\nTransaction: ${result.txDigest}\nWallet: ${wallet.address}`);
      } else {
        alert(`Failed to list project: ${result.error}`);
      }
    } catch (error) {
      console.error('Error listing project:', error);
      alert('Failed to list project. Please try again.');
    }
  };

  const [listings] = useState<ProjectListing[]>([
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
      images: [],
      verification_date: '2024-12-15'
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
      images: [],
      verification_date: '2025-01-05'
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
      images: [],
      verification_date: '2024-11-20'
    }
  ]);

  const [selectedType, setSelectedType] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 50]);
  const [showFilters, setShowFilters] = useState(false);

  const projectTypes = ['All', 'Forest Conservation', 'Renewable Energy', 'Ecosystem Restoration', 'Clean Cooking', 'Agriculture'];

  const filteredListings = listings.filter(listing => {
    if (selectedType !== 'All' && listing.projectType !== selectedType) return false;
    if (listing.pricePerTon < priceRange[0] || listing.pricePerTon > priceRange[1]) return false;
    return true;
  });

  return (
    <Navigation>
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Section with Wallet Status */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Carbon Credit Marketplace</h1>
              <p className="text-gray-600">Explore successful projects and learn from other community initiatives.</p>
            </div>
            <Link
              href="/project-owner/new-project"
              className={`px-6 py-3 border border-black transition-colors ${
                canTransact
                  ? 'bg-black text-white hover:bg-white hover:text-black'
                  : 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed'
              }`}
              title={!canTransact ? 'Please activate your wallet first to list projects' : 'Create a new project listing'}
            >
              {canTransact ? '+ List Your Project' : '+ Wallet Required'}
            </Link>
          </div>
          {/* Wallet Status Alert */}
          {!isWalletReady && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-50 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">Sui Wallet Required for Project Listing</h3>
              <p className="text-yellow-700 text-sm">
                You need an activated Sui wallet to list projects and manage carbon credits on the blockchain.
              </p>
            </div>
          )}
          {/* Sui Wallet Status Component - now below the alert, with extra margin */}
          <div className="mt-3">
            <WalletStatus 
              userId={currentUser?.id || ''}
              email={currentUser?.email || ''}
              showFullAddress={true}
              className="h-fit mb-4"
            />
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="border border-black p-4 text-center">
            <p className="text-2xl font-bold">{listings.length}</p>
            <p className="text-sm text-gray-600">Active Projects</p>
          </div>
          <div className="border border-black p-4 text-center">
            <p className="text-2xl font-bold">{listings.reduce((sum, l) => sum + l.totalCredits, 0).toLocaleString()}</p>
            <p className="text-sm text-gray-600">Total Credits</p>
          </div>
          <div className="border border-black p-4 text-center">
            <p className="text-2xl font-bold">{listings.reduce((sum, l) => sum + l.availableCredits, 0).toLocaleString()}</p>
            <p className="text-sm text-gray-600">Available</p>
          </div>
          <div className="border border-black p-4 text-center">
            <p className="text-2xl font-bold">${Math.round(listings.reduce((sum, l) => sum + l.pricePerTon, 0) / listings.length)}</p>
            <p className="text-sm text-gray-600">Avg. Price/Ton</p>
          </div>
        </div>

        {/* Filters */}
        <div className="border border-black p-4 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Filter Projects</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm border border-black px-3 py-1 hover:bg-black hover:text-white transition-colors"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedType('All');
                    setPriceRange([0, 50]);
                  }}
                  className="w-full p-2 border border-black hover:bg-black hover:text-white transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Project Listings */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <div key={listing.id} className="border border-black">
              {/* Project Image Placeholder */}
              <div className="h-48 bg-gray-100 border-b border-black flex items-center justify-center">
                <span className="text-gray-500 text-sm">Project Image</span>
              </div>

              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg mb-1">{listing.projectName}</h3>
                    <p className="text-sm text-gray-600">{listing.location} • {listing.projectType}</p>
                  </div>
                  {listing.verified && (
                    <span className="text-green-600 text-xs font-medium">✓ Verified</span>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-700 mb-4 line-clamp-2">{listing.description}</p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="font-medium">{listing.co2Amount} tons CO₂</p>
                    <p className="text-gray-600">per credit</p>
                  </div>
                  <div>
                    <p className="font-medium">${listing.pricePerTon}/ton</p>
                    <p className="text-gray-600">current price</p>
                  </div>
                </div>

                {/* Availability */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Available Credits</span>
                    <span>{listing.availableCredits} / {listing.totalCredits}</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 border border-gray-300">
                    <div 
                      className="bg-green-600 h-full"
                      style={{ width: `${(listing.availableCredits / listing.totalCredits) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Owner */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-600">Project Owner</p>
                  <p className="font-medium text-sm">{listing.owner}</p>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Link
                    href={`/project-owner/marketplace/${listing.id}`}
                    className="w-full bg-white text-black py-2 px-4 border border-black text-center text-sm hover:bg-black hover:text-white transition-colors block"
                  >
                    View Details
                  </Link>
                  <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 border border-gray-300 text-sm hover:bg-gray-200 transition-colors">
                    Contact Owner
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        
      </main>
    </Navigation>
  );
}
