'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

interface CarbonGoal {
  id: string;
  targetAmount: number;
  currentAmount: number;
  period: 'monthly' | 'yearly';
  deadline: string;
}

interface Purchase {
  id: string;
  projectName: string;
  amount: number;
  price: number;
  date: string;
  status: 'completed' | 'pending';
}

interface CarbonCredit {
  id: string;
  projectName: string;
  co2Amount: number;
  location: string;
  price: number;
  verified: boolean;
  projectType: string;
  description: string;
}

export default function CreditBuyerDashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const [currentGoal, setCurrentGoal] = useState<CarbonGoal>({
    id: '1',
    targetAmount: 5,
    currentAmount: 2.3,
    period: 'monthly',
    deadline: '2025-08-31'
  });

  const [recentPurchases, setRecentPurchases] = useState<Purchase[]>([]);

  const [recommendedCredits] = useState<CarbonCredit[]>([
    {
      id: '1',
      projectName: 'Mangrove Restoration',
      co2Amount: 1.2,
      location: 'Philippines',
      price: 22,
      verified: true,
      projectType: 'Ecosystem Restoration',
      description: 'Coastal ecosystem restoration supporting local communities'
    },
    {
      id: '2',
      projectName: 'Wind Energy Project',
      co2Amount: 2.5,
      location: 'Morocco',
      price: 19,
      verified: true,
      projectType: 'Renewable Energy',
      description: 'Clean wind energy for rural communities'
    }
  ]);


  const [ownedNFTs, setOwnedNFTs] = useState<OwnedNFT[]>([]);
  // Load ownedNFTs and recentPurchases from localStorage (simulate demo)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedNFTs = localStorage.getItem('purchasedNFTs');
      if (storedNFTs) {
        try {
          setOwnedNFTs(JSON.parse(storedNFTs));
        } catch {
          setOwnedNFTs([]);
        }
      } else {
        setOwnedNFTs([]);
      }

      const storedPurchases = localStorage.getItem('recentPurchases');
      if (storedPurchases) {
        try {
          setRecentPurchases(JSON.parse(storedPurchases));
        } catch {
          setRecentPurchases([]);
        }
      } else {
        setRecentPurchases([]);
      }
    }
  }, []);


  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoalTarget, setNewGoalTarget] = useState(5);
  const [newGoalPeriod, setNewGoalPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const progressPercentage = (currentGoal.currentAmount / currentGoal.targetAmount) * 100;
  const remainingAmount = currentGoal.targetAmount - currentGoal.currentAmount;
  const totalSpent = recentPurchases.reduce((sum, purchase) => sum + (purchase.amount * purchase.price), 0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const updateGoal = () => {
    setCurrentGoal({
      ...currentGoal,
      targetAmount: newGoalTarget,
      period: newGoalPeriod
    });
    setShowGoalModal(false);
  };

  return (
    <Navigation>
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Carbon Offset Dashboard</h1>
          <p className="text-gray-600">Track your environmental impact and offset goals.</p>
        </div>

        {/* Current Goal Section */}
        <div className="border border-black p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold mb-2">Current Offset Goal</h2>
              <p className="text-sm text-gray-600">
                {currentGoal.targetAmount} tons CO₂ • {currentGoal.period} • Due: {new Date(currentGoal.deadline).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => setShowGoalModal(true)}
              className="text-sm border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
            >
              Update Goal
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress: {currentGoal.currentAmount} / {currentGoal.targetAmount} tons</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 h-4 border border-black">
              <div 
                className="bg-green-600 h-full transition-all duration-300"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{currentGoal.currentAmount}</p>
              <p className="text-sm text-gray-600">Tons Offset</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{remainingAmount.toFixed(1)}</p>
              <p className="text-sm text-gray-600">Tons Remaining</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">${totalSpent}</p>
              <p className="text-sm text-gray-600">Total Spent</p>
            </div>
          </div>
        </div>

       
        {/* Recommended Credits */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Recommended for You</h2>
            <Link href="/credit-buyer/marketplace" className="text-sm hover:underline">
              View All
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendedCredits.map((credit) => (
              <div key={credit.id} className="border border-black p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold mb-1">{credit.projectName}</h3>
                    <p className="text-sm text-gray-600">{credit.location} • {credit.projectType}</p>
                  </div>
                  {credit.verified && (
                    <span className="text-green-600 text-xs font-medium">✓ Verified</span>
                  )}
                </div>
                
                <p className="text-sm mb-4">{credit.description}</p>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{credit.co2Amount} tons CO₂</p>
                    <p className="text-sm text-gray-600">${credit.price} per ton</p>
                  </div>
                  <button className="bg-black text-white px-4 py-2 text-sm hover:bg-white hover:text-black border border-black transition-colors">
                    Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="border border-black">
          <div className="bg-gray-50 px-6 py-4 border-b border-black">
            <h2 className="text-xl font-bold">Recent Purchases</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-black">
                <tr>
                  <th className="text-left p-4 font-semibold">Project</th>
                  <th className="text-left p-4 font-semibold">Amount</th>
                  <th className="text-left p-4 font-semibold">Price</th>
                  <th className="text-left p-4 font-semibold">Date</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPurchases.map((purchase, index) => (
                  <tr key={purchase.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="p-4 font-medium">{purchase.projectName}</td>
                    <td className="p-4 text-sm">{purchase.amount} tons CO₂</td>
                    <td className="p-4 text-sm">${purchase.price}/ton</td>
                    <td className="p-4 text-sm">{new Date(purchase.date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        purchase.status === 'completed' 
                          ? 'text-green-600 bg-green-100' 
                          : 'text-orange-600 bg-orange-100'
                      }`}>
                        {purchase.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Update Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 max-w-md w-full mx-4 border border-black">
            <h2 className="text-xl font-bold mb-4">Update Offset Goal</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Target Amount (tons CO₂)</label>
              <input
                type="number"
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(Number(e.target.value))}
                className="w-full p-2 border border-black"
                min="0.1"
                step="0.1"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Period</label>
              <select
                value={newGoalPeriod}
                onChange={(e) => setNewGoalPeriod(e.target.value as 'monthly' | 'yearly')}
                className="w-full p-2 border border-black"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={updateGoal}
                className="flex-1 bg-black text-white py-3 px-4 border border-black hover:bg-white hover:text-black transition-colors"
              >
                Update Goal
              </button>
              <button
                onClick={() => setShowGoalModal(false)}
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
