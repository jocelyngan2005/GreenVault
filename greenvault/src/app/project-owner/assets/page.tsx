// project owner assets page

"use client";

import React, { useState, useEffect } from 'react';
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

interface MintedNFT {
  object_id: string;
  owner_address: string;
  project_name: string;
  credit_amount: number;
  verification_status: string;
  timestamp: string;
  project_description?: string;
  verification_method?: string;
  metadata?: {
    environmental_impact?: string;
    location?: string;
    project_type?: string;
  };
}

interface Analytics {
  totalMinted: number;
  totalRevenue: number;
  averagePrice: number;
  creditsSold: number;
  projectsActive: number;
  verificationRate: number;
}

interface Transaction {
  id: string;
  type: 'mint' | 'purchase' | 'transfer';
  from?: string;
  to?: string;
  amount: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  project_name?: string;
  price?: number;
}

export default function AssetsPage() {
  const [mintedCredits, setMintedCredits] = useState<MintedNFT[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalMinted: 0,
    totalRevenue: 0,
    averagePrice: 0,
    creditsSold: 0,
    projectsActive: 0,
    verificationRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'credits' | 'history' | 'analytics'>('credits');

  const isValidSuiAddress = (address: string | null | undefined): boolean => {
    return !!(address && typeof address === 'string' && address.startsWith('0x') && address.length >= 42);
  };

  useEffect(() => {
    const loadAssets = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get user address
        const address = getTestUserAddress();
        console.log('🔍 Debug - Current user address:', address);
        
        if (!address) {
          setError('No user address found. Please ensure you are logged in.');
          return;
        }

        if (!isValidSuiAddress(address)) {
          setError('Invalid user address format. Please check your account setup.');
          return;
        }

        setUserAddress(address);

        // Load registered projects (which contain minted credits info)
        try {
          const projectsResponse = await smartContractService.getRegisteredProjects(address);
          console.log('📋 Projects response:', projectsResponse);
          
          if (projectsResponse.success && projectsResponse.data && projectsResponse.data.projects) {
            const projects = projectsResponse.data.projects;
            
            // Filter projects that have minted credits (creditObjectId exists)
            const projectsWithCredits = projects.filter((project: any) => project.creditObjectId);
            console.log('💳 Projects with minted credits:', projectsWithCredits);
            
            // Convert projects to minted credits format
            const mintedCredits: MintedNFT[] = projectsWithCredits.map((project: any) => ({
              object_id: project.creditObjectId,
              owner_address: project.owner || address,
              project_name: project.name,
              credit_amount: project.co2ReductionCapacity || 0,
              verification_status: project.verified ? 'verified' : (project.submitted ? 'pending' : 'draft'),
              timestamp: project.registrationDate || new Date().toISOString(),
              project_description: project.description,
              verification_method: 'Blockchain Verification',
              metadata: {
                environmental_impact: `${project.co2ReductionCapacity || 0} tons CO₂ reduction`,
                location: project.location,
                project_type: getProjectTypeName(project.projectType)
              }
            }));
            
            setMintedCredits(mintedCredits);
            
            // Calculate analytics based on project data
            const totalMinted = projects.reduce((sum: number, project: any) => 
              sum + (project.creditObjectId ? (project.co2ReductionCapacity || 0) : 0), 0);
            const totalRevenue = projects.reduce((sum: number, project: any) => 
              sum + (project.totalRevenue || 0), 0);
            const verifiedCredits = projectsWithCredits.filter((project: any) => project.verified).length;
            const projectsActive = projectsWithCredits.length;
            const totalSold = projects.reduce((sum: number, project: any) => 
              sum + (project.salesCount || 0), 0);
            
            setAnalytics({
              totalMinted,
              totalRevenue,
              averagePrice: totalMinted > 0 ? (totalRevenue / totalMinted) : 20, // Default $20 per credit
              creditsSold: totalSold,
              projectsActive,
              verificationRate: projectsWithCredits.length > 0 ? 
                (verifiedCredits / projectsWithCredits.length) * 100 : 0
            });
            
            // Create transactions from project data
            const transactions: Transaction[] = [];
            
            projects.forEach((project: any) => {
              // Add registration transaction
              transactions.push({
                id: `register_${project.projectId}`,
                type: 'mint',
                amount: 0,
                timestamp: project.registrationDate || new Date().toISOString(),
                status: 'completed',
                project_name: project.name,
                to: address
              });
              
              // Add minting transaction if credit exists
              if (project.creditObjectId) {
                transactions.push({
                  id: `mint_${project.projectId}`,
                  type: 'mint',
                  amount: project.co2ReductionCapacity || 0,
                  timestamp: project.registrationDate || new Date().toISOString(),
                  status: 'completed',
                  project_name: project.name,
                  to: address,
                  price: (project.co2ReductionCapacity || 0) * 20 // $20 per credit
                });
              }
              
              // Add listing transaction if project status is listed
              if (project.status === 'listed') {
                transactions.push({
                  id: `list_${project.projectId}`,
                  type: 'transfer',
                  amount: project.co2ReductionCapacity || 0,
                  timestamp: project.registrationDate || new Date().toISOString(),
                  status: 'completed',
                  project_name: project.name,
                  from: address,
                  to: 'marketplace',
                  price: (project.co2ReductionCapacity || 0) * 20
                });
              }
              
              // Add purchase transactions based on sales count
              for (let i = 0; i < (project.salesCount || 0); i++) {
                transactions.push({
                  id: `sale_${project.projectId}_${i}`,
                  type: 'purchase',
                  amount: Math.floor((project.co2ReductionCapacity || 0) / (project.salesCount || 1)),
                  timestamp: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
                  status: 'completed',
                  project_name: project.name,
                  from: address,
                  to: 'buyer',
                  price: Math.floor((project.co2ReductionCapacity || 0) / (project.salesCount || 1)) * 20
                });
              }
            });
            
            setTransactions(transactions.sort((a, b) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            ));
            
          } else {
            console.log('No projects found or error:', projectsResponse.error);
            setMintedCredits([]);
            setAnalytics({
              totalMinted: 0,
              totalRevenue: 0,
              averagePrice: 0,
              creditsSold: 0,
              projectsActive: 0,
              verificationRate: 0
            });
            setTransactions([]);
          }
        } catch (err) {
          console.error('Error loading projects data:', err);
          setMintedCredits([]);
          setAnalytics({
            totalMinted: 0,
            totalRevenue: 0,
            averagePrice: 0,
            creditsSold: 0,
            projectsActive: 0,
            verificationRate: 0
          });
          setTransactions([]);
        }

      } catch (err) {
        console.error('Error loading assets:', err);
        setError(err instanceof Error ? err.message : 'Failed to load assets. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAssets();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Navigation>
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading your assets...</p>
              </div>
            </div>
          </div>
        </Navigation>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Navigation>
          <div className="container mx-auto px-4 py-8">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error Loading Assets</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Navigation>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navigation>
        <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Project Owner Assets</h1>
          <p className="text-gray-600">Manage your minted carbon credits, view transaction history, and track analytics</p>
          {userAddress && (
            <p className="text-sm text-gray-500 mt-2">
              Wallet: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
            </p>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('credits')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'credits'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Minted Credits
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'history'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Transaction History
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'analytics'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>

        {/* Minted Credits Tab */}
        {activeTab === 'credits' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Minted Credits</h2>
            {mintedCredits.length > 0 ? (
              <div className="space-y-4">
                {mintedCredits.map((credit) => (
                  <div key={credit.object_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-800">{credit.project_name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        credit.verification_status === 'verified' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {credit.verification_status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{credit.project_description}</p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">{credit.credit_amount} Credits</span>
                      <span className="text-gray-500">{new Date(credit.timestamp).toLocaleDateString()}</span>
                    </div>
                    {credit.metadata && (
                      <div className="mt-2 text-xs text-gray-500">
                        {credit.metadata.location && <span>📍 {credit.metadata.location}</span>}
                        {credit.metadata.project_type && <span className="ml-2">🏷️ {credit.metadata.project_type}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-gray-500 mb-4">No minted credits yet</p>
                <Link 
                  href="/project-owner/new-project" 
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Create New Project
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Transaction History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Transaction History</h2>
            {transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            transaction.type === 'mint' ? 'bg-green-100 text-green-800' :
                            transaction.type === 'purchase' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.project_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.amount} Credits
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.price ? `$${transaction.price}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(transaction.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-500">No transactions yet</p>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Project Analytics</h2>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-600">Total Credits Minted</p>
                      <p className="text-2xl font-semibold text-green-900">{analytics.totalMinted.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-600">Total Revenue</p>
                      <p className="text-2xl font-semibold text-blue-900">${analytics.totalRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-purple-600">Active Projects</p>
                      <p className="text-2xl font-semibold text-purple-900">{analytics.projectsActive}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-yellow-600">Average Price</p>
                      <p className="text-2xl font-semibold text-yellow-900">${analytics.averagePrice.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-indigo-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-indigo-600">Credits Sold</p>
                      <p className="text-2xl font-semibold text-indigo-900">{analytics.creditsSold.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Verification Rate</p>
                      <p className="text-2xl font-semibold text-gray-900">{analytics.verificationRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Summary */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Performance Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Project Distribution</h4>
                    <div className="space-y-2">
                      {mintedCredits.length > 0 ? (
                        Array.from(new Set(mintedCredits.map(credit => credit.metadata?.project_type).filter(Boolean))).map(type => {
                          const count = mintedCredits.filter(credit => credit.metadata?.project_type === type).length;
                          const percentage = (count / mintedCredits.length) * 100;
                          return (
                            <div key={type} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">{type}</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-green-600 h-2 rounded-full" 
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-500 w-8">{count}</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-gray-500">No project data available</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Verification Status</h4>
                    <div className="space-y-2">
                      {mintedCredits.length > 0 ? (
                        ['verified', 'pending', 'rejected'].map(status => {
                          const count = mintedCredits.filter(credit => credit.verification_status === status).length;
                          const percentage = (count / mintedCredits.length) * 100;
                          return (
                            <div key={status} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 capitalize">{status}</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      status === 'verified' ? 'bg-green-600' :
                                      status === 'pending' ? 'bg-yellow-600' : 'bg-red-600'
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-500 w-8">{count}</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-gray-500">No verification data available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </Navigation>
    </div>
  );
}
