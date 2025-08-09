'use client';

import { useState, useEffect } from 'react';
import { smartContractService } from '@/lib/smartContractService';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import WalletStatus from '@/components/WalletStatus';
import { useWalletIntegration } from '@/lib/hooks/useWalletIntegration';
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
  status?: 'listed' | 'unlisted' | 'sold'; // Add status for filtering
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
  // User's carbon credit balance (real, fetched from smart contract)
  const [userBalance, setUserBalance] = useState<CarbonCreditBalance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // Replace with real user address (from wallet or session)
  const [userAddress, setUserAddress] = useState<string>('');


  // Load authenticated user data from localStorage/session (supports email & Google)
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; role?: string } | null>(null);

  useEffect(() => {
    // Dynamically import to avoid SSR issues with localStorage
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
    
  useEffect(() => {
    let addr = '';
    if (!addr) {
      // Only use env variable, never hardcode the address
      addr = process.env.NEXT_PUBLIC_USER_ADDRESS || process.env.SUI_ADDRESS || '';
    }
    setUserAddress(addr);
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function fetchBalance() {
      setLoadingBalance(true);
      setBalanceError(null);
      try {
        if (!userAddress) {
          setBalanceError('No user address found. Please connect your wallet.');
          setLoadingBalance(false);
          return;
        }
        const res = await smartContractService.getUserCredits(userAddress);
        if (isMounted) {
          if (res.success && res.data) {
            setUserBalance(res.data);
          } else {
            setBalanceError(res.error || 'Failed to fetch balance');
          }
          setLoadingBalance(false);
        }
      } catch (e: any) {
        if (isMounted) {
          setBalanceError(e.message || 'Error fetching balance');
          setLoadingBalance(false);
        }
      }
    }
    fetchBalance();
    return () => { isMounted = false; };
  }, [userAddress]);

  // Load listed projects from localStorage and merge with hardcoded ones
  const [projectNFTs, setProjectNFTs] = useState<ProjectNFT[]>([]);

  useEffect(() => {
    async function loadProjects() {
      // Get hardcoded demo projects
      const demoProjects: ProjectNFT[] = [
        {
          id: 'demo-1',
          projectName: 'Amazon Rainforest Conservation',
          owner: 'Indigenous Community Brazil',
          realWorldCO2Impact: 1500,
          priceInCredits: 25,
          minimumStake: 5,
          location: 'Brazil',
          projectType: 'Forest Conservation',
          description: 'Supporting indigenous communities in preserving 10,000 hectares of rainforest',
          totalNFTs: 100,
          availableNFTs: 75,
          verified: true,
          verificationDate: '2024-12-15',
          images: [],
          status: 'listed',
          impactMetrics: {
            communitiesBenefited: 5,
            jobsCreated: 120,
            biodiversityScore: 95
          },
          stakingRewards: {
            expectedAnnualReturn: 8,
            stakingPeriod: '12 months',
            totalStaked: 625
          }
        },
        {
          id: 'demo-2',
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
          status: 'listed',
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
          id: 'demo-3',
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
          status: 'listed',
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
      ];

      // Load blockchain projects from API
      let blockchainProjects: ProjectNFT[] = [];
      try {
        console.log('Marketplace - Loading blockchain projects from API...');
        const availableResponse = await smartContractService.getAvailableCredits();
        console.log('Marketplace - getAvailableCredits response:', availableResponse);
        
        if (availableResponse.success && Array.isArray(availableResponse.data)) {
          blockchainProjects = availableResponse.data.map((credit: any) => ({
            id: credit.id || credit.object_id || `blockchain_${Date.now()}_${Math.random()}`,
            projectName: credit.project_name || credit.name || 'Blockchain Project',
            owner: credit.owner_address ? `${credit.owner_address.slice(0, 6)}...${credit.owner_address.slice(-4)}` : 'Project Owner',
            realWorldCO2Impact: credit.credit_amount || credit.quantity || credit.co2_impact || 100,
            priceInCredits: credit.price_per_credit || credit.price || Math.floor((credit.credit_amount || 100) * 0.2),
            minimumStake: credit.minimum_stake || 1,
            location: credit.location || 'Unknown',
            projectType: credit.project_type || credit.methodology || credit.category || 'Unknown',
            description: credit.description || credit.project_description || `Available carbon credit: ${credit.project_name || 'Verified project'}`,
            totalNFTs: credit.total_supply || credit.credit_amount || credit.available_credits || 100,
            availableNFTs: credit.available_amount || credit.available_credits || credit.credit_amount || 100,
            verified: credit.verification_status === 'verified' || credit.verified === true || credit.is_verified === true,
            verificationDate: credit.verification_date || credit.created_at || credit.timestamp || new Date().toISOString().slice(0, 10),
            images: credit.images || credit.image_urls || [],
            status: (credit.status === 'listed' || credit.status === 'unlisted' || credit.status === 'sold') ? credit.status : 'listed',
            impactMetrics: {
              communitiesBenefited: credit.communities_benefited || credit.impact_metrics?.communities || Math.floor(Math.random() * 15) + 5,
              jobsCreated: credit.jobs_created || credit.impact_metrics?.jobs || Math.floor(Math.random() * 100) + 50,
              biodiversityScore: credit.biodiversity_score || credit.impact_metrics?.biodiversity || Math.floor(Math.random() * 40) + 60
            },
            stakingRewards: {
              expectedAnnualReturn: credit.expected_return || credit.annual_return || Math.floor(Math.random() * 5) + 5,
              stakingPeriod: credit.staking_period || credit.lock_period || '12 months',
              totalStaked: credit.total_staked || credit.staked_amount || Math.floor(Math.random() * 1000) + 500
            }
          }));
          
          console.log('Marketplace - Blockchain projects loaded:', blockchainProjects.length);
        } else {
          console.log('Marketplace - No blockchain projects found or error:', availableResponse.error);
        }
      } catch (error) {
        console.error('Marketplace - Failed to load blockchain projects:', error);
      }

      // Load project owner projects from localStorage (legacy)
      let localStorageProjects: ProjectNFT[] = [];
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('projects');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            localStorageProjects = parsed
              .filter((p: any) => p.status === 'listed')
              .map((p: any) => ({
                id: p.id,
                projectName: p.name,
                owner: p.owner || 'Project Owner',
                realWorldCO2Impact: p.co2Amount,
                priceInCredits: p.pricePerTon || 20,
                minimumStake: 1,
                location: p.location,
                projectType: p.type,
                description: p.description || '',
                totalNFTs: p.totalSupply || p.co2Amount || 0,
                availableNFTs: p.availableNFTs || 1,
                verified: true,
                verificationDate: p.createdDate || '',
                images: [],
                status: 'listed',
                impactMetrics: {
                  communitiesBenefited: p.communitiesBenefited || 0,
                  jobsCreated: p.jobsCreated || 0,
                  biodiversityScore: p.biodiversityScore || 0
                },
                stakingRewards: {
                  expectedAnnualReturn: p.annualReturns || 0,
                  stakingPeriod: '12 months',
                  totalStaked: p.stakingValue || 0
                }
              }));
          } catch (e) {
            console.error('Error parsing localStorage projects:', e);
          }
        }
      }

      // Combine all projects: demo + blockchain + localStorage (avoid duplicates by id)
      const allProjects = [
        ...demoProjects,
        ...blockchainProjects.filter(bp => !demoProjects.some(dp => dp.id === bp.id)),
        ...localStorageProjects.filter(lp => 
          !demoProjects.some(dp => dp.id === lp.id) && 
          !blockchainProjects.some(bp => bp.id === lp.id)
        )
      ];

      console.log('Marketplace - Final project counts:', {
        demo: demoProjects.length,
        blockchain: blockchainProjects.length,
        localStorage: localStorageProjects.length,
        total: allProjects.length
      });

      setProjectNFTs(allProjects);
    }

    loadProjects();
  }, []);

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
      if (wallet && canTransact) {
        alert(`Added ${quantity} credit(s) from ${project.projectName} to cart!\n\nWallet: ${wallet.address}\nBalance: ${wallet.balance.toFixed(4)} SUI`);
      } else {
        alert(`Added ${quantity} credit(s) from ${project.projectName} to cart!\n\nNote: You'll need to activate your wallet before checkout.`);
      }
    } else {
      alert('Failed to add item to cart. Please try again.');
    }
  };

  const buyNow = async (project: ProjectNFT, quantity: number = 1) => {
    // Check if wallet is ready for transactions
    if (!canTransact) {
      alert('Please activate your Sui wallet first to make a purchase.');
      return;
    }

    if (!wallet) {
      alert('Wallet not available. Please activate your wallet.');
      return;
    }

    const totalPrice = project.priceInCredits * quantity;
    
    // Confirm purchase
    const confirmPurchase = confirm(
      `Confirm Purchase:\n\n` +
      `Project: ${project.projectName}\n` +
      `Quantity: ${quantity} NFT(s)\n` +
      `Price: ${totalPrice} credits total\n` +
      `CO₂ Impact: ${project.realWorldCO2Impact * quantity} tons\n\n` +
      `Proceed with purchase?`
    );

    if (!confirmPurchase) return;

    try {
      // Helper function to convert UUID to Sui object ID format
      const convertToSuiObjectId = (uuid: string): string => {
        const cleanId = uuid.replace(/-/g, '');
        const paddedId = cleanId.padStart(64, '0');
        return '0x' + paddedId;
      };

      const suiObjectId = convertToSuiObjectId(project.id);
      
      // Call smart contract to buy the credit
      const result = await smartContractService.buyCarbonCredit({
        creditId: suiObjectId,
        paymentAmount: totalPrice
      });

      if (result.success) {
        // Use the real Sui object ID from the transaction events if available
        let realObjectId = suiObjectId;
        
        // For real transactions (not mock), try to extract the actual object ID
        if (result.success && !result.data?.note?.includes('mock')) {
          if (result.events && Array.isArray(result.events)) {
            // Try to find a created object event
            const created = result.events.find((ev: any) => ev.type === 'newObject' && ev.objectId);
            if (created && created.objectId) {
              realObjectId = created.objectId;
            } else {
              // Try to find in objectChanges
              if (result.objectChanges && Array.isArray(result.objectChanges)) {
                const objChange = result.objectChanges.find((oc: any) => oc.objectType && oc.objectId && oc.objectType.includes('CarbonCredit'));
                if (objChange && objChange.objectId) {
                  realObjectId = objChange.objectId;
                }
              }
            }
          }
        }

        // Save purchased NFT to localStorage
        if (typeof window !== 'undefined') {
          const newNFT = {
            id: realObjectId,
            projectName: project.projectName,
            co2Amount: project.realWorldCO2Impact,
            origin: project.location,
            status: 'active',
            datePurchased: new Date().toISOString(),
            nftCount: quantity,
            projectType: project.projectType,
            verification: project.verified ? 'Verified' : 'Unverified',
            region: project.location,
            purchasePrice: project.priceInCredits,
            currentValue: project.priceInCredits,
          };

          // Add to purchased NFTs
          const existingNFTs = localStorage.getItem('purchasedNFTs');
          let nftsArr = [];
          if (existingNFTs) {
            try { nftsArr = JSON.parse(existingNFTs); } catch { nftsArr = []; }
          }
          nftsArr.push(newNFT);
          localStorage.setItem('purchasedNFTs', JSON.stringify(nftsArr));

          // Add to recent purchases
          const newPurchase = {
            id: realObjectId,
            projectName: project.projectName,
            amount: project.realWorldCO2Impact * quantity,
            price: project.priceInCredits,
            date: new Date().toISOString(),
            status: 'completed',
          };

          const existingPurchases = localStorage.getItem('recentPurchases');
          let purchasesArr = [];
          if (existingPurchases) {
            try { purchasesArr = JSON.parse(existingPurchases); } catch { purchasesArr = []; }
          }
          purchasesArr.push(newPurchase);
          localStorage.setItem('recentPurchases', JSON.stringify(purchasesArr));
        }

        alert(
          `Purchase Successful! 🎉\n\n` +
          `✅ ${quantity} NFT(s) from ${project.projectName}\n` +
          `🌱 ${project.realWorldCO2Impact * quantity} tons CO₂ offset\n` +
          `💰 ${totalPrice} credits spent\n\n` +
          `Your carbon credits have been added to your portfolio!`
        );

        // Update the project's available NFTs (optimistic update)
        setProjectNFTs(prev => prev.map(p => 
          p.id === project.id 
            ? { ...p, availableNFTs: Math.max(0, p.availableNFTs - quantity) }
            : p
        ));

      } else {
        let errorMsg = result.error || 'Unknown error';
        if (errorMsg.includes('E_INVALID_PROJECT') || errorMsg.includes('MoveAbort') || errorMsg.includes('error code 5')) {
          errorMsg = `Credit "${project.projectName}" is not available for purchase. This might be because the credit needs to be properly minted and listed for sale first.`;
        }
        alert('Purchase failed: ' + errorMsg + '\n\nNote: In development, credits need to be properly minted and listed for sale before they can be purchased.');
      }
    } catch (error) {
      const errorStr = error instanceof Error ? error.message : 'Unknown error';
      let errorMsg = errorStr;
      if (errorStr.includes('E_INVALID_PROJECT') || errorStr.includes('MoveAbort') || errorStr.includes('error code 5')) {
        errorMsg = `Credit "${project.projectName}" is not available for purchase. This might be because the credit needs to be properly minted and listed for sale first.`;
      }
      alert('Purchase failed: ' + errorMsg + '\n\nNote: In development, credits need to be properly minted and listed for sale before they can be purchased.');
    }
  };

  // Only allow listed credits as tradable NFTs
  const filteredAndSortedCredits = projectNFTs
    .filter((project: ProjectNFT) => {
      if (project.status !== 'listed') return false;
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
        {/* Header Section with Wallet Status */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🌱 Carbon Credit NFT Marketplace</h1>
          <p className="text-gray-600">Invest your carbon credits in real-world offset projects represented as tradable NFTs.</p>

          {/* Wallet Status Alert */}
          {!isWalletReady && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-50 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">Sui Wallet Required for Purchasing</h3>
              <p className="text-yellow-700 text-sm">
                You need an activated Sui wallet to buy carbon credits. Your wallet handles secure blockchain transactions.
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
                      title="Add to cart"
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
                    <button 
                      onClick={() => buyNow(project, 1)}
                      disabled={!canTransact}
                      className={`px-4 py-2 text-sm border border-black transition-colors ${
                        canTransact
                          ? 'bg-black text-white hover:bg-white hover:text-black'
                          : 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed'
                      }`}
                      title={!canTransact ? 'Please activate your wallet first' : 'Buy this project NFT'}
                    >
                      {canTransact ? 'Buy Now' : 'Wallet Required'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </main>
    </Navigation>
  );
}
