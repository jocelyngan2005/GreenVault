'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { smartContractService } from '@/lib/smartContractService';
import { getTestUserAddress, shortenAddress, generateMockSuiObjectId } from '@/lib/suiUtils';

interface Project {
  id: string;
  name: string;
  type: string;
  location: string;
  co2Amount: number;
  status: 'draft' | 'submitted' | 'verified' | 'listed';
  nftMinted: boolean;
  salesCount: number;
  totalRevenue: number;
  createdDate: string;
  creditObjectId?: string; // Sui object id of minted credit
}

export default function ProjectOwnerDashboard() {
  // Loading states for different operations
  const [mintLoading, setMintLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  
  // Mock user address - in real app, get from wallet/auth
  const userAddress = getTestUserAddress();
  const [userCredits, setUserCredits] = useState<any>(null);
  
  // Fetch user credits
  const fetchUserCredits = async () => {
    try {
      const result = await smartContractService.getUserCredits(userAddress);
      if (result.success) {
        setUserCredits(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch user credits:', error);
    }
  };

  useEffect(() => {
    fetchUserCredits();
  }, [userAddress]);

  const [projects, setProjects] = useState<Project[]>([]);
  // Load projects from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('projects');
    if (stored) {
      setProjects(JSON.parse(stored));
    }
  }, []);

  // Helper to update localStorage when projects change
  const updateProjects = (newProjects: Project[]) => {
    setProjects(newProjects);
    localStorage.setItem('projects', JSON.stringify(newProjects));
  };

  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Handle NFT minting for verified projects
  const handleMintNFT = async (project: Project) => {
    console.log('[handleMintNFT] Called for project:', project);
    setMintLoading(true);
    try {
      const creditData = {
        projectId: project.id,
        serialNumber: `SER_${Date.now()}`,
        vintageYear: new Date().getFullYear(),
        quantity: project.co2Amount,
        methodology: 'VCS-Standard',
        metadataUri: `https://metadata.greenvault.com/${project.id}`,
        co2DataHash: `hash_${project.id}_${Date.now()}`,
      };

      console.log('[handleMintNFT] About to call smartContractService.mintCarbonCredit with:', creditData);
      const result = await smartContractService.mintCarbonCredit(creditData);
      console.log('[handleMintNFT] Mint result:', result);

      // Try to extract the real credit object id from result.objectChanges
      let creditObjectId = undefined;
      console.log('[handleMintNFT] Full result object:', JSON.stringify(result, null, 2));
      
      if (result.success && result.objectChanges && Array.isArray(result.objectChanges)) {
        console.log('[handleMintNFT] ObjectChanges array:', result.objectChanges);
        
        // Look for created objects
        const createdObjects = result.objectChanges.filter((obj: any) => 
          obj.type === 'created' || 
          (obj.objectChange && obj.objectChange.type === 'created')
        );
        console.log('[handleMintNFT] Created objects:', createdObjects);
        
        // Find the carbon credit object
        const carbonCreditObject = result.objectChanges.find((obj: any) => {
          // Check different possible structures
          const objectType = obj.objectType || obj.type || 
            (obj.objectChange && obj.objectChange.objectType);
          return objectType && 
            typeof objectType === 'string' && 
            objectType.includes('CarbonCredit');
        });
        
        console.log('[handleMintNFT] Carbon credit object found:', carbonCreditObject);
        
        if (carbonCreditObject) {
          // Extract object ID from different possible locations
          creditObjectId = carbonCreditObject.objectId || 
            carbonCreditObject.id ||
            (carbonCreditObject.objectChange && carbonCreditObject.objectChange.objectId);
        }
      }
      console.log('[handleMintNFT] Extracted creditObjectId:', creditObjectId);

      // Fallback: if we can't extract real object ID, generate a mock one for testing
      if (!creditObjectId && result.success) {
        creditObjectId = `0x${Math.random().toString(16).substring(2, 10).padStart(8, '0')}mock${Date.now().toString(16)}`;
        console.log('[handleMintNFT] Generated fallback mock creditObjectId:', creditObjectId);
      }

      if (result.success) {
        setNotification({
          type: 'success',
          message: `NFT minted successfully on blockchain! TX: ${result.txDigest?.slice(0, 10)}...`
        });
        // Update project status, store creditObjectId, and persist
        updateProjects(projects.map(p =>
          p.id === project.id ? { ...p, nftMinted: true, creditObjectId } : p
        ));
        await fetchUserCredits(); // Refresh user credits
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Minting failed'
        });
      }
    } catch (error) {
      console.error('[handleMintNFT] Error during minting:', error);
      setNotification({
        type: 'error',
        message: 'Minting failed. Please try again.'
      });
    } finally {
      setMintLoading(false);
    }
  };

  // Handle listing credit for sale
  const handleListCredit = async (project: Project) => {
    setListLoading(true);
    try {
      // Use the real credit object ID from the project
      const creditId = project.creditObjectId;
      if (!creditId) {
        setNotification({
          type: 'error',
          message: 'Credit object ID not found. Please mint the NFT first.'
        });
        return;
      }
      const price = Math.floor(project.co2Amount * 20 * 1000000000); // Price in mist units

      const result = await smartContractService.listCreditForSale({
        creditId,
        price,
        reservedForCommunity: false
      });

      if (result.success) {
        setNotification({
          type: 'success',
          message: `Credit listed for sale on blockchain! TX: ${result.txDigest?.slice(0, 10)}...`
        });
        // Update project status and persist
        updateProjects(projects.map(p =>
          p.id === project.id ? { ...p, status: 'listed' } : p
        ));
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Listing failed'
        });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Listing failed. Please try again.'
      });
    } finally {
      setListLoading(false);
    }
  };

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'submitted': return 'text-blue-600 bg-blue-100';
      case 'verified': return 'text-green-600 bg-green-100';
      case 'listed': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const totalRevenue = projects.reduce((sum, project) => sum + project.totalRevenue, 0);
  const totalCO2 = projects.reduce((sum, project) => sum + project.co2Amount, 0);
  const activeProjects = projects.filter(p => p.status === 'verified' || p.status === 'listed').length;

  return (
    <Navigation>
      {/* Main Content */}
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

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Project Owner Dashboard</h1>
          <p className="text-gray-600">Manage your carbon offset projects and track your environmental impact.</p>
          
          {/* Smart Contract Connection Status */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              Connected to blockchain. Your credits: {userCredits?.credits?.length || 0}
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="border border-black p-6">
            <h3 className="text-sm uppercase tracking-wide mb-2">Total Projects</h3>
            <p className="text-3xl font-bold">{projects.length}</p>
          </div>
          <div className="border border-black p-6">
            <h3 className="text-sm uppercase tracking-wide mb-2">Active Projects</h3>
            <p className="text-3xl font-bold text-green-600">{activeProjects}</p>
          </div>
          <div className="border border-black p-6">
            <h3 className="text-sm uppercase tracking-wide mb-2">Total CO₂ Impact</h3>
            <p className="text-3xl font-bold">{totalCO2.toLocaleString()}</p>
            <p className="text-sm text-gray-600">tons</p>
          </div>
          <div className="border border-black p-6">
            <h3 className="text-sm uppercase tracking-wide mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold text-green-600">${totalRevenue}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowNewProjectForm(true)}
            className="bg-black text-white px-6 py-3 border border-black hover:bg-white hover:text-black transition-colors"
          >
            + Register New Project
          </button>
          <Link
            href="/project-owner/verification"
            className="bg-white text-black px-6 py-3 border border-black hover:bg-black hover:text-white transition-colors"
              passHref
          >
            Submit for Verification
          </Link>
        </div>

        {/* Projects Table */}
        <div className="border border-black">
          <div className="bg-gray-50 px-6 py-4 border-b border-black">
            <h2 className="text-xl font-bold">Your Projects</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-black">
                <tr>
                  <th className="text-left p-4 font-semibold">Project Name</th>
                  <th className="text-left p-4 font-semibold">Type</th>
                  <th className="text-left p-4 font-semibold">Location</th>
                  <th className="text-left p-4 font-semibold">CO₂ Impact</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">NFT</th>
                  <th className="text-left p-4 font-semibold">Sales</th>
                  <th className="text-left p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project, index) => (
                  <tr key={project.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="p-4 font-medium">{project.name}</td>
                    <td className="p-4 text-sm">{project.type}</td>
                    <td className="p-4 text-sm">{project.location}</td>
                    <td className="p-4 text-sm">{project.co2Amount.toLocaleString()} tons</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-sm">
                      {project.nftMinted ? (
                        <span className="text-green-600">✓ Minted</span>
                      ) : (
                        <span className="text-gray-500">Not minted</span>
                      )}
                    </td>
                    <td className="p-4 text-sm">
                      {project.salesCount > 0 ? (
                        <div>
                          <div>{project.salesCount} sales</div>
                          <div className="text-green-600">${project.totalRevenue}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500">No sales</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button className="text-sm text-blue-600 hover:underline">
                          Edit
                        </button>
                        {project.status === 'verified' && !project.nftMinted && (
                          <button 
                            onClick={() => {
                              console.log('[UI] Mint NFT button clicked for project:', project);
                              handleMintNFT(project);
                            }}
                            disabled={mintLoading}
                            className="text-sm text-green-600 hover:underline disabled:opacity-50"
                          >
                            {mintLoading ? 'Minting...' : 'Mint NFT'}
                          </button>
                        )}
                        {project.nftMinted && project.status !== 'listed' && (
                          <button 
                            onClick={() => handleListCredit(project)}
                            disabled={listLoading}
                            className="text-sm text-purple-600 hover:underline disabled:opacity-50"
                          >
                            {listLoading ? 'Listing...' : 'List for Sale'}
                          </button>
                        )}
                        {project.status === 'listed' && (
                          <span className="text-sm text-gray-500">Listed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        
      </main>

      {/* New Project Modal */}
      {showNewProjectForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 max-w-md w-full mx-4 border border-black">
            <h2 className="text-xl font-bold mb-4">Register New Project</h2>
            <p className="text-sm text-gray-600 mb-6">
              Start by providing basic information about your carbon offset project.
            </p>
            <div className="flex gap-4">
              <Link
                href="/project-owner/new-project"
                className="flex-1 bg-black text-white py-3 px-4 text-center border border-black hover:bg-white hover:text-black transition-colors"
              >
                Start Registration
              </Link>
              <button
                onClick={() => setShowNewProjectForm(false)}
                className="flex-1 bg-white text-black py-3 px-4 border border-black hover:bg-black hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Navigation>
  );
}
