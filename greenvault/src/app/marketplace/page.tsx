'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { 
  useBuyCarbonCredit, 
  useListCarbonCredit, 
  useMarketplaceStats,
  useUserCredits,
  useRegisterProject,
  useMintCarbonCredit
} from '@/lib/useSmartContract';

interface CarbonCredit {
  id: string;
  projectName: string;
  co2Amount: number;
  location: string;
  price: number;
  verified: boolean;
  description: string;
  projectType: string;
}

export default function MarketplacePage() {
  // Smart contract hooks
  const { execute: buyCredit, loading: buyLoading, error: buyError } = useBuyCarbonCredit();
  const { execute: listCredit, loading: listLoading, error: listError } = useListCarbonCredit();
  const { execute: registerProject, loading: registerLoading, error: registerError } = useRegisterProject();
  const { execute: mintCredit, loading: mintLoading, error: mintError } = useMintCarbonCredit();
  const { data: marketStats, loading: statsLoading } = useMarketplaceStats();
  
  // Form states
  const [newProjectForm, setNewProjectForm] = useState({
    projectId: '',
    name: '',
    description: '',
    location: '',
    projectType: 0,
    co2ReductionCapacity: 0,
    price: 0,
    oracleDataSource: '',
  });

  const [credits] = useState<CarbonCredit[]>([
    {
      id: '1',
      projectName: 'Amazon Rainforest Conservation',
      co2Amount: 1.5,
      location: 'Brazil',
      price: 25,
      verified: true,
      description: 'Supporting indigenous communities in preserving 10,000 hectares of rainforest',
      projectType: 'Forest Conservation'
    },
    {
      id: '2',
      projectName: 'Solar Farm Initiative',
      co2Amount: 2.0,
      location: 'Kenya',
      price: 18,
      verified: true,
      description: 'Clean energy generation providing power to rural communities',
      projectType: 'Renewable Energy'
    },
    {
      id: '3',
      projectName: 'Mangrove Restoration',
      co2Amount: 1.2,
      location: 'Philippines',
      price: 22,
      verified: true,
      description: 'Coastal ecosystem restoration and community livelihood support',
      projectType: 'Ecosystem Restoration'
    },
    {
      id: '4',
      projectName: 'Wind Power Development',
      co2Amount: 3.0,
      location: 'Morocco',
      price: 20,
      verified: false,
      description: 'Large-scale wind energy infrastructure development',
      projectType: 'Renewable Energy'
    }
  ]);

  const [filter, setFilter] = useState('All');
  const [showListForm, setShowListForm] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const projectTypes = ['All', 'Forest Conservation', 'Renewable Energy', 'Ecosystem Restoration'];

  const filteredCredits = filter === 'All' 
    ? credits 
    : credits.filter(c => c.projectType === filter);

  // Handle credit purchase with smart contract
  const handlePurchase = async (creditId: string, price: number) => {
    try {
      setNotification(null);
      
      // Convert price to appropriate units (assuming SUI units)
      const paymentAmount = Math.floor(price * 1000000000); // Convert to mist units
      
      const result = await buyCredit(creditId, paymentAmount);
      
      if (result.success) {
        setNotification({
          type: 'success',
          message: `Successfully purchased credit ${creditId}! Transaction: ${result.txDigest?.slice(0, 10)}...`
        });
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Purchase failed'
        });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Transaction failed. Please try again.'
      });
    }
  };

  // Handle new project registration
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setNotification(null);
      
      const projectData = {
        projectId: newProjectForm.projectId || `PRJ_${Date.now()}`,
        name: newProjectForm.name,
        description: newProjectForm.description,
        location: newProjectForm.location,
        projectType: newProjectForm.projectType,
        co2ReductionCapacity: newProjectForm.co2ReductionCapacity,
        oracleDataSource: newProjectForm.oracleDataSource || 'default_oracle',
      };
      
      const result = await registerProject(projectData);
      
      if (result.success) {
        setNotification({
          type: 'success',
          message: `Project registered successfully! Transaction: ${result.txDigest?.slice(0, 10)}...`
        });
        
        // Reset form
        setNewProjectForm({
          projectId: '',
          name: '',
          description: '',
          location: '',
          projectType: 0,
          co2ReductionCapacity: 0,
          price: 0,
          oracleDataSource: '',
        });
        setShowListForm(false);
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Project registration failed'
        });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Project registration failed. Please try again.'
      });
    }
  };

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <Navigation>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Notification */}
        {notification && (
          <div className={`mb-4 p-4 border ${
            notification.type === 'success' 
              ? 'border-green-500 bg-green-50 text-green-800' 
              : 'border-red-500 bg-red-50 text-red-800'
          }`}>
            <p>{notification.message}</p>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Carbon Credit Marketplace</h1>
            <p className="text-gray-600">Verified carbon offset projects as NFTs</p>
            {statsLoading && <p className="text-sm text-gray-500">Loading marketplace stats...</p>}
          </div>
          <button
            onClick={() => setShowListForm(true)}
            className="bg-black text-white px-6 py-2 border border-black hover:bg-white hover:text-black transition-colors"
            disabled={registerLoading}
          >
            {registerLoading ? 'Creating...' : 'Register New Project'}
          </button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {projectTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 border border-black whitespace-nowrap ${
                filter === type 
                  ? 'bg-black text-white' 
                  : 'bg-white text-black hover:bg-black hover:text-white'
              } transition-colors`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* New Project Registration Form */}
        {showListForm && (
          <div className="border border-black p-6 mb-6 bg-gray-50">
            <h3 className="text-lg font-bold mb-4">Register New Carbon Credit Project</h3>
            <form onSubmit={handleCreateProject}>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Project Name"
                  value={newProjectForm.name}
                  onChange={(e) => setNewProjectForm(prev => ({ ...prev, name: e.target.value }))}
                  className="border border-black px-3 py-2 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black"
                  required
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={newProjectForm.location}
                  onChange={(e) => setNewProjectForm(prev => ({ ...prev, location: e.target.value }))}
                  className="border border-black px-3 py-2 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black"
                  required
                />
                <input
                  type="number"
                  placeholder="CO2 Reduction Capacity (tons)"
                  value={newProjectForm.co2ReductionCapacity || ''}
                  onChange={(e) => setNewProjectForm(prev => ({ ...prev, co2ReductionCapacity: parseInt(e.target.value) || 0 }))}
                  className="border border-black px-3 py-2 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black"
                  required
                />
                <select 
                  value={newProjectForm.projectType}
                  onChange={(e) => setNewProjectForm(prev => ({ ...prev, projectType: parseInt(e.target.value) }))}
                  className="border border-black px-3 py-2 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black"
                  required
                >
                  <option value={0}>Forest Conservation</option>
                  <option value={1}>Renewable Energy</option>
                  <option value={2}>Ecosystem Restoration</option>
                  <option value={3}>Clean Technology</option>
                </select>
              </div>
              <textarea
                placeholder="Project Description"
                value={newProjectForm.description}
                onChange={(e) => setNewProjectForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full border border-black px-3 py-2 mb-4 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black"
                required
              ></textarea>
              <input
                type="text"
                placeholder="Oracle Data Source (optional)"
                value={newProjectForm.oracleDataSource}
                onChange={(e) => setNewProjectForm(prev => ({ ...prev, oracleDataSource: e.target.value }))}
                className="w-full border border-black px-3 py-2 mb-4 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="bg-black text-white px-4 py-2 border border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                >
                  {registerLoading ? 'Registering...' : 'Register Project'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowListForm(false)}
                  className="bg-white text-black px-4 py-2 border border-black hover:bg-black hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Credits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCredits.map(credit => (
            <div key={credit.id} className="border border-black p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold">{credit.projectName}</h3>
                {credit.verified && (
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-1 border border-green-300">
                    ✓ Verified
                  </span>
                )}
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-sm"><strong>Location:</strong> {credit.location}</p>
                <p className="text-sm"><strong>CO2 Offset:</strong> {credit.co2Amount} tons</p>
                <p className="text-sm"><strong>Type:</strong> {credit.projectType}</p>
                <p className="text-sm text-gray-600">{credit.description}</p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xl font-bold">${credit.price}</p>
                    <p className="text-sm text-gray-600">per ton CO2</p>
                  </div>
                  <button
                    onClick={() => handlePurchase(credit.id, credit.price)}
                    disabled={buyLoading}
                    className="bg-black text-white px-4 py-2 border border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                  >
                    {buyLoading ? 'Buying...' : 'Buy Credit'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCredits.length === 0 && (
          <div className="text-center py-12 border border-black">
            <p className="text-gray-600 mb-4">No carbon credits found in this category</p>
            <button
              onClick={() => setShowListForm(true)}
              className="bg-black text-white px-6 py-2 border border-black hover:bg-white hover:text-black transition-colors"
            >
              List First Credit
            </button>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 border-t border-black pt-8">
          <h2 className="text-2xl font-bold mb-4">How Carbon Credits Work</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-black p-4">
              <h3 className="font-bold mb-2">1. Verified Projects</h3>
              <p className="text-sm text-gray-600">All credits come from verified environmental projects with measurable CO2 impact.</p>
            </div>
            <div className="border border-black p-4">
              <h3 className="font-bold mb-2">2. NFT Ownership</h3>
              <p className="text-sm text-gray-600">Each credit is an NFT proving your ownership and environmental contribution.</p>
            </div>
            <div className="border border-black p-4">
              <h3 className="font-bold mb-2">3. Impact Tracking</h3>
              <p className="text-sm text-gray-600">Track your total environmental impact and contribution to global sustainability.</p>
            </div>
          </div>
        </div>
      </main>
    </Navigation>
  );
}
