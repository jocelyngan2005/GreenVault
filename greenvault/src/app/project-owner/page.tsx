'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

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
}

export default function ProjectOwnerDashboard() {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'Mangrove Restoration Project',
      type: 'Ecosystem Restoration',
      location: 'Philippines',
      co2Amount: 1200,
      status: 'verified',
      nftMinted: true,
      salesCount: 3,
      totalRevenue: 66,
      createdDate: '2024-12-15'
    },
    {
      id: '2',
      name: 'Community Solar Initiative',
      type: 'Renewable Energy',
      location: 'Kenya',
      co2Amount: 2000,
      status: 'submitted',
      nftMinted: false,
      salesCount: 0,
      totalRevenue: 0,
      createdDate: '2025-01-10'
    }
  ]);

  const [showNewProjectForm, setShowNewProjectForm] = useState(false);

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
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Project Owner Dashboard</h1>
          <p className="text-gray-600">Manage your carbon offset projects and track your environmental impact.</p>
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
                          <button className="text-sm text-green-600 hover:underline">
                            Mint NFT
                          </button>
                        )}
                        {project.nftMinted && (
                          <button className="text-sm text-purple-600 hover:underline">
                            List
                          </button>
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
