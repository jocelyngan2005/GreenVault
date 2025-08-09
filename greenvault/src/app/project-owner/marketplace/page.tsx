
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { smartContractService } from '@/lib/smartContractService';
import { getTestUserAddress } from '@/lib/suiUtils';

// Helper function to convert project type number to name
const getProjectTypeName = (projectType: number | undefined): string => {
  const types = [
    'Forest Conservation', 
    'Reforestation', 
    'Renewable Energy', 
    'Ecosystem Restoration', 
    'Clean Cooking', 
    'Sustainable Agriculture', 
    'Waste Management', 
    'Water Conservation'
  ];
  return projectType !== undefined && projectType < types.length ? types[projectType] : 'Unknown';
};

// Place interface at the very top, only once
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
  images?: string[];
  verification_date?: string;
  creditObjectId?: string;
  status?: string;
}

export default function ProjectOwnerMarketplace() {
  const [listings, setListings] = useState<ProjectListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const loadListings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🏪 Loading marketplace listings...');
        
        // Approach 1: Try to get available credits from marketplace
        let allListings: ProjectListing[] = [];
        
        try {
          const availableResponse = await smartContractService.getAvailableCredits();
          console.log('📋 Available credits response:', availableResponse);
          
          if (availableResponse.success && Array.isArray(availableResponse.data) && availableResponse.data.length > 0) {
            const marketplaceListings: ProjectListing[] = availableResponse.data.map((credit: any) => ({
              id: credit.id || credit.object_id || credit.creditObjectId,
              projectName: credit.project_name || credit.name || 'Unnamed Project',
              owner: credit.owner_address ? `${credit.owner_address.slice(0, 6)}...${credit.owner_address.slice(-4)}` : 'Unknown',
              co2Amount: credit.credit_amount || credit.quantity || credit.co2ReductionCapacity || 0,
              pricePerTon: credit.price ? Math.floor(credit.price / (credit.credit_amount || 1)) : 20,
              location: credit.location || 'Unknown',
              projectType: getProjectTypeName(credit.projectType) || credit.project_type || credit.methodology || 'Unknown',
              description: credit.description || credit.project_description || 'No description available',
              totalCredits: credit.credit_amount || credit.quantity || credit.co2ReductionCapacity || 0,
              availableCredits: credit.available_amount || credit.credit_amount || credit.quantity || credit.co2ReductionCapacity || 0,
              verified: credit.verification_status === 'verified' || credit.verified === true,
              images: credit.images || [],
              verification_date: credit.verification_date || credit.timestamp,
              creditObjectId: credit.id || credit.object_id || credit.creditObjectId,
              status: 'listed'
            }));
            
            allListings = [...allListings, ...marketplaceListings];
            console.log('✅ Found marketplace listings:', marketplaceListings.length);
          }
        } catch (err) {
          console.log('⚠️ No marketplace data or error fetching:', err);
        }
        
        // Approach 2: Get all registered projects and filter for listed ones
        try {
          // Get current user address to exclude own projects if needed
          const currentUserAddress = getTestUserAddress();
          
          // For marketplace, we want to show projects from all users, not just current user
          // But we can still fetch projects to see which ones are listed
          const projectsResponse = await smartContractService.getRegisteredProjects(currentUserAddress);
          console.log('📊 Projects response:', projectsResponse);
          
          if (projectsResponse.success && projectsResponse.data && projectsResponse.data.projects) {
            const projects = projectsResponse.data.projects;
            
            // Filter for projects that are listed and have minted credits
            const listedProjects = projects.filter((project: any) => 
              project.status === 'listed' && project.creditObjectId
            );
            
            console.log('📋 Listed projects found:', listedProjects.length);
            
            const projectListings: ProjectListing[] = listedProjects.map((project: any) => ({
              id: project.projectId || project.id,
              projectName: project.name,
              owner: project.owner ? 
                `${project.owner.slice(0, 6)}...${project.owner.slice(-4)}` : 
                'You', // Current user's projects
              co2Amount: project.co2ReductionCapacity || 0,
              pricePerTon: 20, // Standard price
              location: project.location,
              projectType: getProjectTypeName(project.projectType),
              description: project.description || 'Carbon offset project',
              totalCredits: project.co2ReductionCapacity || 0,
              availableCredits: project.co2ReductionCapacity || 0,
              verified: project.verified === true,
              images: [],
              verification_date: project.registrationDate,
              creditObjectId: project.creditObjectId,
              status: project.status
            }));
            
            // Add project listings to all listings (avoid duplicates)
            projectListings.forEach(projectListing => {
              const exists = allListings.find(listing => 
                listing.id === projectListing.id || 
                listing.creditObjectId === projectListing.creditObjectId
              );
              if (!exists) {
                allListings.push(projectListing);
              }
            });
          }
        } catch (err) {
          console.log('⚠️ Error fetching projects data:', err);
        }
        
        // If we still have no listings, create some demo data for testing
        if (allListings.length === 0) {
          console.log('📝 No real listings found, creating demo data...');
          allListings = [
            {
              id: 'demo-1',
              projectName: 'Amazon Rainforest Conservation',
              owner: 'Green...Fund',
              co2Amount: 1000,
              pricePerTon: 25,
              location: 'Brazil',
              projectType: 'Forest Conservation',
              description: 'Large-scale rainforest conservation project protecting biodiversity and sequestering carbon.',
              totalCredits: 1000,
              availableCredits: 750,
              verified: true,
              images: [],
              verification_date: new Date().toISOString(),
              status: 'listed'
            },
            {
              id: 'demo-2',
              projectName: 'Solar Farm Initiative',
              owner: 'Solar...Tech',
              co2Amount: 500,
              pricePerTon: 18,
              location: 'California, USA',
              projectType: 'Renewable Energy',
              description: 'Community solar farm providing clean energy and carbon credits.',
              totalCredits: 500,
              availableCredits: 500,
              verified: true,
              images: [],
              verification_date: new Date().toISOString(),
              status: 'listed'
            },
            {
              id: 'demo-3',
              projectName: 'Reforestation Project',
              owner: 'Tree...Org',
              co2Amount: 750,
              pricePerTon: 22,
              location: 'Kenya',
              projectType: 'Reforestation',
              description: 'Community-led reforestation initiative creating jobs and sequestering carbon.',
              totalCredits: 750,
              availableCredits: 600,
              verified: true,
              images: [],
              verification_date: new Date().toISOString(),
              status: 'listed'
            }
          ];
        }
        
        console.log('🏪 Final marketplace listings:', allListings);
        setListings(allListings);
        setLastUpdated(new Date());
        
      } catch (error) {
        console.error('❌ Failed to load marketplace listings:', error);
        setError('Failed to load marketplace listings. Please try again.');
        setListings([]);
      } finally {
        setLoading(false);
      }
    };

    loadListings();
  }, []);

  const [selectedType, setSelectedType] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 50]);
  const [showFilters, setShowFilters] = useState(false);

  const projectTypes = [
    'All', 
    'Forest Conservation', 
    'Reforestation', 
    'Renewable Energy', 
    'Ecosystem Restoration', 
    'Clean Cooking', 
    'Sustainable Agriculture', 
    'Waste Management', 
    'Water Conservation'
  ];

  const filteredListings = listings.filter(listing => {
    if (selectedType !== 'All' && listing.projectType !== selectedType) return false;
    if (listing.pricePerTon < priceRange[0] || listing.pricePerTon > priceRange[1]) return false;
    return true;
  });

  const refreshListings = async () => {
    setLoading(true);
    setError(null);
    // Trigger the useEffect logic again
    const loadListings = async () => {
      try {
        console.log('🔄 Refreshing marketplace listings...');
        
        let allListings: ProjectListing[] = [];
        
        // Try to get available credits from marketplace
        try {
          const availableResponse = await smartContractService.getAvailableCredits();
          if (availableResponse.success && Array.isArray(availableResponse.data) && availableResponse.data.length > 0) {
            const marketplaceListings: ProjectListing[] = availableResponse.data.map((credit: any) => ({
              id: credit.id || credit.object_id || credit.creditObjectId,
              projectName: credit.project_name || credit.name || 'Unnamed Project',
              owner: credit.owner_address ? `${credit.owner_address.slice(0, 6)}...${credit.owner_address.slice(-4)}` : 'Unknown',
              co2Amount: credit.credit_amount || credit.quantity || credit.co2ReductionCapacity || 0,
              pricePerTon: credit.price ? Math.floor(credit.price / (credit.credit_amount || 1)) : 20,
              location: credit.location || 'Unknown',
              projectType: getProjectTypeName(credit.projectType) || credit.project_type || credit.methodology || 'Unknown',
              description: credit.description || credit.project_description || 'No description available',
              totalCredits: credit.credit_amount || credit.quantity || credit.co2ReductionCapacity || 0,
              availableCredits: credit.available_amount || credit.credit_amount || credit.quantity || credit.co2ReductionCapacity || 0,
              verified: credit.verification_status === 'verified' || credit.verified === true,
              images: credit.images || [],
              verification_date: credit.verification_date || credit.timestamp,
              creditObjectId: credit.id || credit.object_id || credit.creditObjectId,
              status: 'listed'
            }));
            allListings = [...allListings, ...marketplaceListings];
          }
        } catch (err) {
          console.log('⚠️ No marketplace data available');
        }
        
        // Get registered projects and filter for listed ones
        try {
          const currentUserAddress = getTestUserAddress();
          const projectsResponse = await smartContractService.getRegisteredProjects(currentUserAddress);
          
          if (projectsResponse.success && projectsResponse.data && projectsResponse.data.projects) {
            const projects = projectsResponse.data.projects;
            const listedProjects = projects.filter((project: any) => 
              project.status === 'listed' && project.creditObjectId
            );
            
            const projectListings: ProjectListing[] = listedProjects.map((project: any) => ({
              id: project.projectId || project.id,
              projectName: project.name,
              owner: project.owner ? 
                `${project.owner.slice(0, 6)}...${project.owner.slice(-4)}` : 
                'You',
              co2Amount: project.co2ReductionCapacity || 0,
              pricePerTon: 20,
              location: project.location,
              projectType: getProjectTypeName(project.projectType),
              description: project.description || 'Carbon offset project',
              totalCredits: project.co2ReductionCapacity || 0,
              availableCredits: project.co2ReductionCapacity || 0,
              verified: project.verified === true,
              images: [],
              verification_date: project.registrationDate,
              creditObjectId: project.creditObjectId,
              status: project.status
            }));
            
            projectListings.forEach(projectListing => {
              const exists = allListings.find(listing => 
                listing.id === projectListing.id || 
                listing.creditObjectId === projectListing.creditObjectId
              );
              if (!exists) {
                allListings.push(projectListing);
              }
            });
          }
        } catch (err) {
          console.log('⚠️ Error fetching projects data');
        }
        
        setListings(allListings);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('❌ Failed to refresh marketplace listings:', error);
        setError('Failed to refresh marketplace listings.');
      } finally {
        setLoading(false);
      }
    };
    
    await loadListings();
  };

  return (
    <Navigation>
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Carbon Credit Marketplace</h1>
            <p className="text-gray-600">Explore available carbon credits from verified projects worldwide.</p>
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={refreshListings}
              disabled={loading}
              className="bg-white text-black px-4 py-3 border border-black hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {loading ? '🔄' : '↻'} Refresh
            </button>
            <Link
              href="/project-owner/new-project"
              className="bg-black text-white px-6 py-3 border border-black hover:bg-white hover:text-black transition-colors"
            >
              + List Your Project
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading marketplace...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Marketplace</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content - only show when not loading */}
        {!loading && (
          <>
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
                <p className="text-2xl font-bold">
                  ${listings.length > 0 ? Math.round(listings.reduce((sum, l) => sum + l.pricePerTon, 0) / listings.length) : 0}
                </p>
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
          {filteredListings.length > 0 ? (
            filteredListings.map((listing) => (
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
                        style={{ width: `${listing.totalCredits > 0 ? (listing.availableCredits / listing.totalCredits) * 100 : 0}%` }}
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
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-600 mb-4">
                {listings.length === 0 
                  ? "No projects are currently listed in the marketplace." 
                  : "No projects match your current filters."
                }
              </p>
              {listings.length > 0 && (
                <button
                  onClick={() => {
                    setSelectedType('All');
                    setPriceRange([0, 50]);
                  }}
                  className="bg-black text-white px-4 py-2 border border-black hover:bg-white hover:text-black transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
          </>
        )}
      </main>
    </Navigation>
  );
}

