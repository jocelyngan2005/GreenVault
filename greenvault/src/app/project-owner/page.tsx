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
  status: 'draft' | 'registered' | 'submitted' | 'verified' | 'listed';
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
  const [verifyLoading, setVerifyLoading] = useState(false);
  
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

  // Always fetch user credits and projects from blockchain, not localStorage
  useEffect(() => {
    fetchUserCredits();
  }, [userAddress]);

  const [projects, setProjects] = useState<Project[]>([]);
  
  // Load projects from blockchain on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const registeredProjectsResult = await smartContractService.getRegisteredProjects(userAddress);
        if (registeredProjectsResult.success && registeredProjectsResult.data) {
          const blockchainProjects: Project[] = registeredProjectsResult.data.projects?.map((project: any) => ({
            id: project.projectId || project.id,
            name: project.name,
            type: project.projectType !== undefined ? 
              ['Forest Conservation', 'Reforestation', 'Renewable Energy', 'Ecosystem Restoration', 'Clean Cooking', 'Sustainable Agriculture', 'Waste Management', 'Water Conservation'][project.projectType] || 'Unknown' 
              : 'Unknown',
            location: project.location,
            co2Amount: project.co2ReductionCapacity || project.quantity || 0,
            // Show status based on available fields
            status: project.status || (project.verified ? 'verified' : (project.submitted ? 'submitted' : 'draft')),
            nftMinted: project.creditObjectId ? true : false,
            salesCount: project.salesCount || 0,
            totalRevenue: project.totalRevenue || 0,
            createdDate: project.createdDate || new Date().toISOString().slice(0, 10),
            creditObjectId: project.creditObjectId
          })) || [];
          setProjects(blockchainProjects);
        } else {
          setProjects([]);
        }
      } catch (error) {
        setProjects([]);
      }
    };
    if (userAddress) {
      loadProjects();
    }
  }, [userAddress]);

  // Helper to refresh projects from blockchain
  const refreshProjects = async () => {
    try {
      const registeredProjectsResult = await smartContractService.getRegisteredProjects(userAddress);
      if (registeredProjectsResult.success && registeredProjectsResult.data) {
        const blockchainProjects: Project[] = registeredProjectsResult.data.projects?.map((project: any) => ({
          id: project.projectId || project.id,
          name: project.name,
          type: project.projectType !== undefined ? 
            ['Forest Conservation', 'Reforestation', 'Renewable Energy', 'Ecosystem Restoration', 'Clean Cooking', 'Sustainable Agriculture', 'Waste Management', 'Water Conservation'][project.projectType] || 'Unknown' 
            : 'Unknown',
          location: project.location,
          co2Amount: project.co2ReductionCapacity || project.quantity || 0,
          status: project.status || (project.verified ? 'verified' : (project.submitted ? 'submitted' : 'draft')),
          nftMinted: project.creditObjectId ? true : false,
          salesCount: project.salesCount || 0,
          totalRevenue: project.totalRevenue || 0,
          createdDate: project.createdDate || new Date().toISOString().slice(0, 10),
          creditObjectId: project.creditObjectId
        })) || [];
        setProjects(blockchainProjects);
      }
    } catch (error) {
      // ...existing code...
    }
  };
  // Handle submit for verification (for draft/registered projects)
  const handleSubmitForVerification = async (project: Project) => {
    setVerifyLoading(true);
    try {
      // For "Submit for Verification", we use the same verifyProject endpoint
      // but the backend will determine action based on current project status
      const result = await smartContractService.verifyProject(project.id);
      if (result.success) {
        setNotification({
          type: 'success',
          message: `Project submitted for verification! TX: ${result.txDigest?.slice(0, 10)}...`
        });
        await refreshProjects();
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Submission failed'
        });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Submission failed. Please try again.'
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  // Handle project verification (for submitted projects)
  const handleVerifyProject = async (project: Project) => {
    setVerifyLoading(true);
    try {
      // For "Verify", we use the same verifyProject endpoint
      // but the backend will determine action based on current project status
      const result = await smartContractService.verifyProject(project.id);

      if (result.success) {
        setNotification({
          type: 'success',
          message: `Project verified successfully on blockchain! TX: ${result.txDigest?.slice(0, 10)}...`
        });
        // Refresh projects from blockchain to get updated data
        await refreshProjects();
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Verification failed'
        });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Verification failed. Please try again.'
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Handle NFT minting for verified projects
  const handleMintNFT = async (project: Project) => {
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
      
      console.log('[handleMintNFT] Minting with data:', creditData);
      const result = await smartContractService.mintCarbonCredit(creditData);
      console.log('[handleMintNFT] Full mint result:', result);
      
      let creditObjectId: string | undefined = undefined;
      
      // Try to extract credit object ID from various possible locations in the response
      if (result.success && result.objectChanges && Array.isArray(result.objectChanges)) {
        console.log('[handleMintNFT] ObjectChanges:', result.objectChanges);
        
        // Look for created objects first
        const createdObjects = result.objectChanges.filter((obj: any) => 
          obj.type === 'created' || (obj.objectChange && obj.objectChange.type === 'created')
        );
        console.log('[handleMintNFT] Created objects:', createdObjects);
        
        // Strategy 1: Find carbon credit object by type
        const carbonCreditObject = result.objectChanges.find((obj: any) => {
          const objectType = obj.objectType || obj.type || (obj.objectChange && obj.objectChange.objectType);
          return objectType && 
            typeof objectType === 'string' && 
            (objectType.includes('CarbonCredit') || objectType.includes('carbon_credit'));
        });
        
        if (carbonCreditObject) {
          creditObjectId = carbonCreditObject.objectId || 
                          carbonCreditObject.id || 
                          (carbonCreditObject.objectChange && carbonCreditObject.objectChange.objectId);
          console.log('[handleMintNFT] Found creditObjectId via CarbonCredit type:', creditObjectId);
        }
        
        // Strategy 2: If not found, try any created object with proper structure
        if (!creditObjectId && createdObjects.length > 0) {
          for (const obj of createdObjects) {
            const possibleId = obj.objectId || obj.id || (obj.objectChange && obj.objectChange.objectId);
            if (possibleId && typeof possibleId === 'string' && possibleId.startsWith('0x')) {
              creditObjectId = possibleId;
              console.log('[handleMintNFT] Using fallback creditObjectId:', creditObjectId);
              break;
            }
          }
        }
        
        // Strategy 3: Check if there's a direct objectChanges array entry with objectId
        if (!creditObjectId) {
          for (const obj of result.objectChanges) {
            if (obj.objectId && typeof obj.objectId === 'string' && obj.objectId.startsWith('0x')) {
              creditObjectId = obj.objectId;
              console.log('[handleMintNFT] Using direct objectId:', creditObjectId);
              break;
            }
          }
        }
      }
      
      // Strategy 4: If still no creditObjectId, try to extract from events
      if (!creditObjectId && result.events && Array.isArray(result.events)) {
        console.log('[handleMintNFT] Trying to extract from events:', result.events);
        for (const event of result.events) {
          if (event.parsedJson && event.parsedJson.credit_id) {
            creditObjectId = event.parsedJson.credit_id;
            console.log('[handleMintNFT] Found creditObjectId in event:', creditObjectId);
            break;
          }
        }
      }
      
      console.log('[handleMintNFT] Final creditObjectId:', creditObjectId);
      
      if (result.success) {
        // Refresh projects first to get any backend updates
        await refreshProjects();
        
        // If we still don't have creditObjectId, try to get it from refreshed projects
        if (!creditObjectId) {
          const refreshedProject = projects.find(p => p.id === project.id);
          if (refreshedProject && refreshedProject.creditObjectId) {
            creditObjectId = refreshedProject.creditObjectId;
            console.log('[handleMintNFT] Found creditObjectId from refreshed project:', creditObjectId);
          }
        }
        
        // Update the project immediately in local state with the credit object ID
        const updatedProject = { ...project, nftMinted: true, creditObjectId };
        
        setProjects((prev) => prev.map((p) =>
          p.id === project.id ? updatedProject : p
        ));
        
        setNotification({
          type: 'success',
          message: `NFT minted successfully on blockchain! TX: ${result.txDigest?.slice(0, 10)}...${creditObjectId ? ' Credit ID: ' + creditObjectId.slice(0, 8) + '...' : ''}`
        });
        
        await fetchUserCredits();
        
        // Wait a moment for state to update, then automatically proceed to listing
        setTimeout(async () => {
          if (creditObjectId) {
            console.log('[handleMintNFT] Auto-listing with creditObjectId:', creditObjectId);
            await handleListCredit(updatedProject);
          } else {
            console.warn('[handleMintNFT] No creditObjectId found, cannot auto-list');
            setNotification({
              type: 'error',
              message: 'NFT minted but credit ID not found. Please refresh and try listing manually.'
            });
          }
        }, 2000); // Increased delay to allow for proper state sync
        
        // Final refresh to ensure consistency
        setTimeout(async () => {
          await refreshProjects();
        }, 3000);
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Minting failed'
        });
      }
    } catch (error) {
      console.error('[handleMintNFT] Error:', error);
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
    console.log('[handleListCredit] Called with project:', project);
    setListLoading(true);
    try {
      // Use the real credit object ID from the project
      const creditId = project.creditObjectId;
      console.log('[handleListCredit] Credit ID:', creditId);
      
      if (!creditId) {
        console.error('[handleListCredit] No credit object ID found in project:', project);
        setNotification({
          type: 'error',
          message: 'Credit object ID not found. Please mint the NFT first.'
        });
        setListLoading(false);
        return;
      }
      
      const price = Math.floor(project.co2Amount * 20 * 1000000000); // Price in mist units
      console.log('[handleListCredit] Listing price:', price);

      const result = await smartContractService.listCreditForSale({
        creditId,
        price,
        reservedForCommunity: false
      });

      console.log('[handleListCredit] List result:', result);

      if (result.success) {
        setNotification({
          type: 'success',
          message: `Credit listed for sale on blockchain! TX: ${result.txDigest?.slice(0, 10)}...`
        });
        // Refresh projects from blockchain to get updated data
        await refreshProjects();
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Listing failed'
        });
      }
    } catch (error) {
      console.error('[handleListCredit] Error:', error);
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
      case 'registered': return 'text-blue-600 bg-blue-100';
      case 'submitted': return 'text-yellow-600 bg-yellow-100';
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
                        {/* Allow submit for verification if project is draft or registered (not yet submitted) */}
                        {(project.status === 'draft' || project.status === 'registered') && (
                          <button
                            onClick={() => handleSubmitForVerification(project)}
                            disabled={verifyLoading}
                            className="text-sm text-orange-600 hover:underline disabled:opacity-50"
                          >
                            {verifyLoading ? 'Submitting...' : 'Submit for Verification'}
                          </button>
                        )}
                        {/* Allow verify if project is submitted */}
                        {project.status === 'submitted' && (
                          <button 
                            onClick={() => handleVerifyProject(project)}
                            disabled={verifyLoading}
                            className="text-sm text-orange-600 hover:underline disabled:opacity-50"
                          >
                            {verifyLoading ? 'Verifying...' : 'Verify'}
                          </button>
                        )}
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
