'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

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

  const projectTypes = ['All', 'Forest Conservation', 'Renewable Energy', 'Ecosystem Restoration'];

  const filteredCredits = filter === 'All' 
    ? credits 
    : credits.filter(c => c.projectType === filter);

  const handlePurchase = (creditId: string) => {
    alert(`Purchase initiated for credit ${creditId}. This would integrate with payment processing.`);
  };

  return (
    <Navigation>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Carbon Credit Marketplace</h1>
            <p className="text-gray-600">Verified carbon offset projects as NFTs</p>
          </div>
          <button
            onClick={() => setShowListForm(true)}
            className="bg-black text-white px-6 py-2 border border-black hover:bg-white hover:text-black transition-colors"
          >
            List New Credit
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

        {/* List New Credit Form */}
        {showListForm && (
          <div className="border border-black p-6 mb-6 bg-gray-50">
            <h3 className="text-lg font-bold mb-4">List New Carbon Credit</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Project Name"
                className="border border-black px-3 py-2 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black"
              />
              <input
                type="text"
                placeholder="Location"
                className="border border-black px-3 py-2 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black"
              />
              <input
                type="number"
                placeholder="CO2 Amount (tons)"
                className="border border-black px-3 py-2 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black"
              />
              <input
                type="number"
                placeholder="Price (USD)"
                className="border border-black px-3 py-2 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <select className="w-full border border-black px-3 py-2 mb-4 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black">
              {projectTypes.slice(1).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <textarea
              placeholder="Project Description"
              rows={3}
              className="w-full border border-black px-3 py-2 mb-4 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black"
            ></textarea>
            <div className="flex gap-2">
              <button
                onClick={() => setShowListForm(false)}
                className="bg-black text-white px-4 py-2 border border-black hover:bg-white hover:text-black transition-colors"
              >
                List Credit
              </button>
              <button
                onClick={() => setShowListForm(false)}
                className="bg-white text-black px-4 py-2 border border-black hover:bg-black hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
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
                    onClick={() => handlePurchase(credit.id)}
                    className="bg-black text-white px-4 py-2 border border-black hover:bg-white hover:text-black transition-colors"
                  >
                    Buy Credit
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
