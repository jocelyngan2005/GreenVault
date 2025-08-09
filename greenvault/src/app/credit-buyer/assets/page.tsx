
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { smartContractService } from '@/lib/smartContractService';

// Helper to check if a string is a valid Sui object ID
function isValidSuiObjectId(id: string) {
  return /^0x[a-fA-F0-9]{40,64}$/.test(id);
}

// Helper to check if an object ID is a mock/demo ID
function isMockObjectId(objectId: string): boolean {
  // Check for various mock/test patterns
  if (objectId.includes('credit_') || 
      objectId.startsWith('0x00000000000000000000000000000000000000000000000000000000credit_') ||
      objectId.includes('mock_') ||
      (objectId.startsWith('0x') && objectId.length === 66 && objectId.endsWith('00000000'))) {
    return true;
  }
  
  // Check if the object ID was likely created by converting a UUID
  // UUIDs converted to Sui object IDs will start with many zeros
  if (objectId.startsWith('0x') && objectId.length === 66) {
    // Count leading zeros after 0x
    const hexPart = objectId.slice(2);
    const leadingZeros = hexPart.match(/^0*/)?.[0].length || 0;
    
    // If more than 24 leading zeros, it's likely a converted UUID or mock ID
    if (leadingZeros > 24) {
      return true;
    }
  }
  
  return false;
}

interface OwnedNFT {
  id: string;
  projectName: string;
  co2Amount: number;
  origin: string;
  status: 'active' | 'retired';
  datePurchased: string;
  nftCount: number;
  projectType: string;
  verification: string;
  region: string;
  expiryDate?: string;
  retiredDate?: string;
  purchasePrice: number;
  currentValue: number;
}

export default function CreditBuyerAssets() {
  const [isMounted, setIsMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterProjectType, setFilterProjectType] = useState('All');
  const [sortBy, setSortBy] = useState('date-desc');
  const [searchTerm, setSearchTerm] = useState('');

  const [ownedNFTs, setOwnedNFTs] = useState<OwnedNFT[]>([]);

  useEffect(() => {
    // Load purchased NFTs from localStorage (simulate demo)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('purchasedNFTs');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setOwnedNFTs(parsed);
        } catch (e) {
          setOwnedNFTs([]);
        }
      } else {
        setOwnedNFTs([]);
      }
    }
  }, []);

  const regions = ['All', 'Africa', 'Asia', 'South America', 'North America', 'Europe'];
  const projectTypes = ['All', 'Forest Conservation', 'Renewable Energy', 'Ecosystem Restoration', 'Clean Cooking', 'Agriculture'];
  const statuses = ['All', 'active', 'retired'];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filter and sort NFTs
  const filteredAndSortedNFTs = ownedNFTs
    .filter(nft => {
      if (filterRegion !== 'All' && nft.region !== filterRegion) return false;
      if (filterStatus !== 'All' && nft.status !== filterStatus) return false;
      if (filterProjectType !== 'All' && nft.projectType !== filterProjectType) return false;
      if (searchTerm && !nft.projectName.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !nft.origin.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc': return new Date(b.datePurchased).getTime() - new Date(a.datePurchased).getTime();
        case 'date-asc': return new Date(a.datePurchased).getTime() - new Date(b.datePurchased).getTime();
        case 'amount-desc': return b.co2Amount - a.co2Amount;
        case 'amount-asc': return a.co2Amount - b.co2Amount;
        case 'value-desc': return b.currentValue - a.currentValue;
        case 'name-asc': return a.projectName.localeCompare(b.projectName);
        default: return 0;
      }
    });

  const totalCO2 = ownedNFTs.reduce((sum, nft) => sum + nft.co2Amount, 0);
  const totalValue = ownedNFTs.reduce((sum, nft) => sum + (nft.currentValue * nft.nftCount), 0);
  const totalPurchasePrice = ownedNFTs.reduce((sum, nft) => sum + (nft.purchasePrice * nft.nftCount), 0);
  const totalNFTs = ownedNFTs.reduce((sum, nft) => sum + nft.nftCount, 0);

  const retireNFT = async (nftId: string) => {
    const nft = ownedNFTs.find(n => n.id === nftId);
    if (!nft) return;
    
    if (!isValidSuiObjectId(nftId)) {
      alert('This NFT has an invalid ID format and cannot be retired.');
      return;
    }
    
    if (isMockObjectId(nftId)) {
      alert('This is a demo NFT. In development mode, this will be processed as a mock retirement.');
    }
    
    const reason = prompt('Enter a reason for retirement:', 'Offsetting emissions');
    if (!reason) return;
    
    try {
      const result = await smartContractService.retireCarbonCredit({
        creditId: nftId,
        retirementReason: reason,
      });
      if (result.success) {
        // Update localStorage and UI
        const updatedNFTs = ownedNFTs.map(n =>
          n.id === nftId
            ? { ...n, status: 'retired' as 'retired', retiredDate: new Date().toISOString() }
            : n
        );
        setOwnedNFTs(updatedNFTs);
        if (typeof window !== 'undefined') {
          localStorage.setItem('purchasedNFTs', JSON.stringify(updatedNFTs));
        }
        alert('NFT retired successfully!');
      } else {
        alert('Failed to retire NFT: ' + (result.error || 'Unknown error'));
      }
    } catch (e) {
      alert('Error retiring NFT: ' + (e instanceof Error ? e.message : 'Unknown error'));
    }
  };

  return (
    <Navigation>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">🌱 My Carbon Credit NFTs</h1>
              <p className="text-gray-600">Manage and track your carbon credit NFT portfolio</p>
            </div>
            <Link 
              href="/credit-buyer/marketplace" 
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              Buy More NFTs
            </Link>
          </div>

          {/* Portfolio Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <p className="text-sm text-green-600 mb-1">Total NFTs</p>
              <p className="text-2xl font-bold text-green-800">{totalNFTs}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-600 mb-1">Total CO₂ Offset</p>
              <p className="text-2xl font-bold text-blue-800">{totalCO2.toFixed(1)} tons</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Purchase Value</p>
              <p className="text-2xl font-bold text-gray-800">${totalPurchasePrice}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
              <p className="text-sm text-purple-600 mb-1">Current Value</p>
              <p className="text-2xl font-bold text-purple-800">${totalValue}</p>
              <p className={`text-xs ${totalValue >= totalPurchasePrice ? 'text-green-600' : 'text-red-600'}`}>
                {totalValue >= totalPurchasePrice ? '+' : ''}${(totalValue - totalPurchasePrice).toFixed(0)} ({(((totalValue - totalPurchasePrice) / totalPurchasePrice) * 100).toFixed(1)}%)
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="border border-black p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Filter & Sort ({filteredAndSortedNFTs.length} NFTs)</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1 text-sm border border-black ${
                  viewMode === 'cards' ? 'bg-black text-white' : 'hover:bg-black hover:text-white'
                } transition-colors`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 text-sm border border-black ${
                  viewMode === 'table' ? 'bg-black text-white' : 'hover:bg-black hover:text-white'
                } transition-colors`}
              >
                Table
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 text-sm"
              />
            </div>
            <div>
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="w-full p-2 border border-gray-300 text-sm"
              >
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filterProjectType}
                onChange={(e) => setFilterProjectType(e.target.value)}
                className="w-full p-2 border border-gray-300 text-sm"
              >
                {projectTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 text-sm"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status === 'All' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-2 border border-gray-300 text-sm"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">CO₂ Amount: High to Low</option>
                <option value="amount-asc">CO₂ Amount: Low to High</option>
                <option value="value-desc">Value: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </div>
            <div>
              <button
                onClick={() => {
                  setFilterRegion('All');
                  setFilterProjectType('All');
                  setFilterStatus('All');
                  setSearchTerm('');
                  setSortBy('date-desc');
                }}
                className="w-full p-2 border border-black hover:bg-black hover:text-white transition-colors text-sm"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* NFT Display */}
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedNFTs.map((nft) => (
              <div key={nft.id} className="border border-black p-6 bg-white">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">{nft.projectName}</h3>
                      {isMockObjectId(nft.id) && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                          DEMO
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{nft.origin}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    nft.status === 'active' 
                      ? 'text-green-600 bg-green-100' 
                      : 'text-gray-600 bg-gray-100'
                  }`}>
                    {nft.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">CO₂ Amount:</span>
                    <span className="font-semibold">{nft.co2Amount} tons</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">NFT Count:</span>
                    <span className="font-semibold">{nft.nftCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Purchased:</span>
                    <span className="font-semibold">{new Date(nft.datePurchased).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Value:</span>
                    <span className="font-semibold">${nft.currentValue * nft.nftCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Verification:</span>
                    <span className="font-semibold text-green-600">{nft.verification}</span>
                  </div>
                  {nft.expiryDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expires:</span>
                      <span className="font-semibold">{new Date(nft.expiryDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {nft.retiredDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Retired:</span>
                      <span className="font-semibold">{new Date(nft.retiredDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {nft.status === 'active' && (
                    <button
                      onClick={() => retireNFT(nft.id)}
                      className="flex-1 bg-red-600 text-white py-2 px-4 text-sm hover:bg-red-700 transition-colors"
                    >
                      Retire NFT
                    </button>
                  )}
                  <Link
                    href={`/credit-buyer/assets/${nft.id}`}
                    className="flex-1 bg-black text-white py-2 px-4 text-center text-sm hover:bg-gray-800 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-black bg-white">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-black">
                  <tr>
                    <th className="text-left p-4 font-semibold">Project Name</th>
                    <th className="text-left p-4 font-semibold">Origin</th>
                    <th className="text-left p-4 font-semibold">CO₂ Amount</th>
                    <th className="text-left p-4 font-semibold">NFTs</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Date Purchased</th>
                    <th className="text-left p-4 font-semibold">Current Value</th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedNFTs.map((nft, index) => (
                    <tr key={nft.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{nft.projectName}</p>
                          <p className="text-xs text-gray-600">{nft.verification}</p>
                        </div>
                      </td>
                      <td className="p-4 text-sm">{nft.origin}</td>
                      <td className="p-4 text-sm font-medium">{nft.co2Amount} tons</td>
                      <td className="p-4 text-sm">{nft.nftCount}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          nft.status === 'active' 
                            ? 'text-green-600 bg-green-100' 
                            : 'text-gray-600 bg-gray-100'
                        }`}>
                          {nft.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-sm">{new Date(nft.datePurchased).toLocaleDateString()}</td>
                      <td className="p-4 text-sm font-medium">${nft.currentValue * nft.nftCount}</td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          {nft.status === 'active' && (
                            <button
                              onClick={() => retireNFT(nft.id)}
                              className="bg-red-600 text-white px-2 py-1 text-xs hover:bg-red-700 transition-colors"
                            >
                              Retire
                            </button>
                          )}
                          <Link
                            href={`/credit-buyer/assets/${nft.id}`}
                            className="bg-black text-white px-2 py-1 text-xs hover:bg-gray-800 transition-colors"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredAndSortedNFTs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No NFTs match your current filters</p>
            <button
              onClick={() => {
                setFilterRegion('All');
                setFilterProjectType('All');
                setFilterStatus('All');
                setSearchTerm('');
              }}
              className="px-6 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>
    </Navigation>
  );
}

