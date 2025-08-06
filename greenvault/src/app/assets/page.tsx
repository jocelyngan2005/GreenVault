'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

interface OwnedCredit {
  id: string;
  projectName: string;
  co2Amount: number;
  location: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  status: 'active' | 'retired';
}

interface Transaction {
  id: string;
  type: 'bought' | 'sold' | 'listed';
  projectName: string;
  amount: number;
  price: number;
  date: string;
}

export default function AssetsPage() {
  const [ownedCredits] = useState<OwnedCredit[]>([
    {
      id: '1',
      projectName: 'Amazon Rainforest Conservation',
      co2Amount: 1.5,
      location: 'Brazil',
      purchaseDate: '2025-01-10',
      purchasePrice: 25,
      currentValue: 27,
      status: 'active'
    },
    {
      id: '2',
      projectName: 'Solar Farm Initiative',
      co2Amount: 2.0,
      location: 'Kenya',
      purchaseDate: '2025-01-05',
      purchasePrice: 18,
      currentValue: 19,
      status: 'retired'
    }
  ]);

  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'bought',
      projectName: 'Amazon Rainforest Conservation',
      amount: 1.5,
      price: 25,
      date: '2025-01-10'
    },
    {
      id: '2',
      type: 'bought',
      projectName: 'Solar Farm Initiative',
      amount: 2.0,
      price: 18,
      date: '2025-01-05'
    }
  ]);

  const [activeTab, setActiveTab] = useState<'assets' | 'history'>('assets');

  const totalCO2Offset = ownedCredits.reduce((sum, credit) => sum + credit.co2Amount, 0);
  const totalInvestment = ownedCredits.reduce((sum, credit) => sum + credit.purchasePrice, 0);
  const currentPortfolioValue = ownedCredits.reduce((sum, credit) => sum + credit.currentValue, 0);

  const handleRetireCredit = (creditId: string) => {
    alert(`Retiring credit ${creditId}. This would permanently retire the carbon credit from circulation.`);
  };

  return (
    <Navigation>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Carbon Assets</h1>
          <p className="text-gray-600">Track your environmental impact and carbon credit portfolio</p>
        </div>

        {/* Impact Summary */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="border border-black p-6 text-center">
            <h3 className="text-2xl font-bold text-green-600">{totalCO2Offset}</h3>
            <p className="text-sm text-gray-600">Tons CO2 Offset</p>
          </div>
          <div className="border border-black p-6 text-center">
            <h3 className="text-2xl font-bold">{ownedCredits.length}</h3>
            <p className="text-sm text-gray-600">Credits Owned</p>
          </div>
          <div className="border border-black p-6 text-center">
            <h3 className="text-2xl font-bold">${totalInvestment}</h3>
            <p className="text-sm text-gray-600">Total Investment</p>
          </div>
          <div className="border border-black p-6 text-center">
            <h3 className="text-2xl font-bold">${currentPortfolioValue}</h3>
            <p className="text-sm text-gray-600">Current Value</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('assets')}
            className={`px-4 py-2 border border-black ${
              activeTab === 'assets' 
                ? 'bg-black text-white' 
                : 'bg-white text-black hover:bg-black hover:text-white'
            } transition-colors`}
          >
            My Credits
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 border border-black ${
              activeTab === 'history' 
                ? 'bg-black text-white' 
                : 'bg-white text-black hover:bg-black hover:text-white'
            } transition-colors`}
          >
            Transaction History
          </button>
        </div>

        {/* Assets Tab */}
        {activeTab === 'assets' && (
          <div className="space-y-6">
            {ownedCredits.map(credit => (
              <div key={credit.id} className="border border-black p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold">{credit.projectName}</h3>
                    <p className="text-gray-600">{credit.location}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm px-2 py-1 border ${
                      credit.status === 'active' 
                        ? 'bg-green-100 text-green-800 border-green-300'
                        : 'bg-gray-100 text-gray-800 border-gray-300'
                    }`}>
                      {credit.status === 'active' ? 'Active' : 'Retired'}
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">CO2 Offset</p>
                    <p className="font-bold">{credit.co2Amount} tons</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Purchase Price</p>
                    <p className="font-bold">${credit.purchasePrice}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Current Value</p>
                    <p className="font-bold">${credit.currentValue}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Purchase Date</p>
                    <p className="font-bold">{credit.purchaseDate}</p>
                  </div>
                </div>

                {credit.status === 'active' && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRetireCredit(credit.id)}
                        className="bg-green-600 text-white px-4 py-2 border border-green-600 hover:bg-white hover:text-green-600 transition-colors"
                      >
                        Retire Credit
                      </button>
                      <button className="bg-white text-black px-4 py-2 border border-black hover:bg-black hover:text-white transition-colors">
                        List for Sale
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {ownedCredits.length === 0 && (
              <div className="text-center py-12 border border-black">
                <p className="text-gray-600 mb-4">You don't own any carbon credits yet</p>
                <Link 
                  href="/marketplace"
                  className="bg-black text-white px-6 py-2 border border-black hover:bg-white hover:text-black transition-colors inline-block"
                >
                  Browse Marketplace
                </Link>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {transactions.map(transaction => (
              <div key={transaction.id} className="border border-black p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{transaction.projectName}</h3>
                  <p className="text-sm text-gray-600">
                    {transaction.amount} tons CO2 • {transaction.date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">${transaction.price}</p>
                  <span className={`text-sm px-2 py-1 border ${
                    transaction.type === 'bought' 
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : transaction.type === 'sold'
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                  }`}>
                    {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                  </span>
                </div>
              </div>
            ))}

            {transactions.length === 0 && (
              <div className="text-center py-12 border border-black">
                <p className="text-gray-600">No transactions yet</p>
              </div>
            )}
          </div>
        )}

        {/* Environmental Impact */}
        <div className="mt-12 border-t border-black pt-8">
          <h2 className="text-2xl font-bold mb-4">Your Environmental Impact</h2>
          <div className="border border-black p-6">
            <div className="text-center">
              <h3 className="text-4xl font-bold text-green-600 mb-2">{totalCO2Offset} tons</h3>
              <p className="text-lg mb-4">Total CO2 offset equivalent to:</p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{Math.round(totalCO2Offset * 2174)}</p>
                  <p className="text-sm text-gray-600">Miles driven avoided</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{Math.round(totalCO2Offset * 120)}</p>
                  <p className="text-sm text-gray-600">Trees planted equivalent</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{Math.round(totalCO2Offset * 0.25)}</p>
                  <p className="text-sm text-gray-600">Homes powered for a year</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Navigation>
  );
}
