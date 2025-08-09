'use client';

import { useState, useEffect } from 'react';
import { smartContractService } from '@/lib/smartContractService';
import { v4 as uuidv4 } from 'uuid'; // npm install uuid
import Navigation from '@/components/Navigation';

interface ProjectFormData {
  name: string;
  type: string;
  location: string;
  description: string;
  co2Impact: string;
  area: string;
  duration: string;
  methodology: string;
  communityBenefit: string;
  sustainabilityPlan: string;
  contactEmail: string;
  contactPhone: string;
  documents: File[];
}

export default function NewProjectPage() {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    type: '',
    location: '',
    description: '',
    co2Impact: '',
    area: '',
    duration: '',
    methodology: '',
    communityBenefit: '',
    sustainabilityPlan: '',
    contactEmail: '',
    contactPhone: '',
    documents: []
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState('');

  const projectTypes = [
    'Forest Conservation',
    'Reforestation',
    'Renewable Energy',
    'Ecosystem Restoration',
    'Clean Cooking',
    'Sustainable Agriculture',
    'Waste Management',
    'Water Conservation'
  ];

  const methodologies = [
    'Verified Carbon Standard (VCS)',
    'Gold Standard',
    'Climate Action Reserve',
    'Plan Vivo',
    'American Carbon Registry (ACR)',
    'Other (specify in description)'
  ];

  // Smart contract state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({
        ...formData,
        documents: [...formData.documents, ...Array.from(e.target.files)]
      });
    }
  };

  // Map project type string to number for contract
  const projectTypeMap: Record<string, number> = {
    'Forest Conservation': 0,
    'Reforestation': 1,
    'Renewable Energy': 2,
    'Ecosystem Restoration': 3,
    'Clean Cooking': 4,
    'Sustainable Agriculture': 5,
    'Waste Management': 6,
    'Water Conservation': 7,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsLoading(true);
    setError(null);

    // Generate a unique projectId
    const projectId = uuidv4();

    // Prepare contract data
    const contractData = {
      projectId,
      name: formData.name,
      description: formData.description,
      location: formData.location,
      projectType: projectTypeMap[formData.type] ?? 0,
      co2ReductionCapacity: Number(formData.co2Impact) || 0,
      beneficiaryCommunity: formData.communityBenefit,
      oracleDataSource: 'oasis', // or from form if you collect it
      didAnchor: '', // optional, if available
    };

    try {
      const result = await smartContractService.registerProject(contractData);
      setIsSubmitting(false);
      setIsLoading(false);
      
      if (result.success) {
        // Project registered successfully on blockchain
        // No need to save to localStorage - data will be fetched from blockchain
        localStorage.removeItem('projects'); // Clear any old localStorage data
        alert('Project registered successfully on blockchain! Tx: ' + result.txDigest);
        window.location.href = '/project-owner';
      } else {
        setError('Registration failed: ' + (result.error || 'Unknown error'));
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setIsLoading(false);
      setError('Registration failed: ' + (err?.message || 'Unknown error'));
    }
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const getStepProgress = () => (currentStep / 4) * 100;

  const handleSendMessage = () => {
    if (assistantMessage.trim()) {
      // Here you would typically send the message to your AI service
      console.log('Sending message:', assistantMessage);
      setAssistantMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    // Handle escape key to close AI assistant
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAIAssistant) {
        setShowAIAssistant(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showAIAssistant]);

  return (
    <Navigation>
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Register Your Carbon Offset Project</h1>
          <p className="text-gray-600">
            Tell us about your project to get started with verification and NFT minting.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span>Step {currentStep} of 4</span>
            <span>{Math.round(getStepProgress())}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 h-2 border border-black">
            <div 
              className="bg-green-600 h-full transition-all duration-300"
              style={{ width: `${getStepProgress()}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-2 text-gray-600">
            <span>Basic Info</span>
            <span>Project Details</span>
            <span>Impact & Community</span>
            <span>Documentation</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="border border-black p-8">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-bold mb-6">Step 1: Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-semibold mb-1">Project Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300"
                    placeholder="e.g. Amazon Rainforest Conservation"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Project Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300"
                    required
                  >
                    <option value="">Select type</option>
                    {projectTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300"
                    placeholder="e.g. Brazil, Amazon Basin"
                    required
                  />
                </div>
              </div>
              <div className="mt-6">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 h-32"
                  placeholder="Describe your project, its goals, and how it will reduce or sequester carbon emissions..."
                  required
                />
              </div>
            </div>
          )}

          {/* Step 2: Project Details */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-xl font-bold mb-6">Step 2: Project Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-semibold mb-1">CO₂ Impact (tonnes/year)</label>
                  <input
                    type="number"
                    name="co2Impact"
                    value={formData.co2Impact}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300"
                    placeholder="e.g. 10000"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Area (hectares)</label>
                  <input
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300"
                    placeholder="e.g. 500"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Duration (years)</label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300"
                    placeholder="e.g. 10"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Methodology</label>
                  <select
                    name="methodology"
                    value={formData.methodology}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300"
                  >
                    <option value="">Select methodology</option>
                    {methodologies.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Impact & Community */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-bold mb-6">Step 3: Impact & Community</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-semibold mb-1">Community Benefit</label>
                  <input
                    type="text"
                    name="communityBenefit"
                    value={formData.communityBenefit}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300"
                    placeholder="e.g. Local jobs, education, health..."
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Sustainability Plan</label>
                  <input
                    type="text"
                    name="sustainabilityPlan"
                    value={formData.sustainabilityPlan}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300"
                    placeholder="e.g. Ongoing monitoring, community engagement..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Documentation */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-xl font-bold mb-6">Step 4: Documentation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-semibold mb-1">Contact Email</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300"
                    placeholder="e.g. you@email.com"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300"
                    placeholder="e.g. +1234567890"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold mb-1">Upload Documents</label>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="w-full"
                  />
                  {formData.documents.length > 0 && (
                    <ul className="mt-2 text-sm text-gray-600">
                      {formData.documents.map((file, idx) => (
                        <li key={idx}>{file.name}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1 || isSubmitting || isLoading}
              className={`px-6 py-3 border border-black ${
                currentStep === 1 || isSubmitting || isLoading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-black hover:bg-black hover:text-white'
              } transition-colors`}
            >
              Previous
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={isSubmitting || isLoading}
                className={`px-6 py-3 border border-black bg-green-600 text-white hover:bg-green-700 transition-colors ${isSubmitting || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className={`px-6 py-3 border border-black bg-green-600 text-white hover:bg-green-700 transition-colors ${isSubmitting || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting || isLoading ? 'Registering...' : 'Register Project'}
              </button>
            )}
          </div>
          {error && (
            <div className="mt-4 text-red-600 font-semibold">{error}</div>
          )}
        </form>
      </main>

      {/* Floating AI Assistant Button */}
      <button
        onClick={() => setShowAIAssistant(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-black text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center z-40"
        title="Project AI Assistant"
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          <path d="M13 8H7"></path>
          <path d="M17 12H7"></path>
        </svg>
      </button>

      {/* AI Assistant Overlay */}
      {showAIAssistant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white text-black border-2 border-black rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-black">
              <h2 className="text-xl font-bold">Project AI Assistant</h2>
              <button
                onClick={() => setShowAIAssistant(false)}
                className="w-8 h-8 rounded-full border border-black hover:bg-black hover:text-white flex items-center justify-center transition-colors"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {/* AI assistant content here */}
              </div>
            </div>

            {/* Input area */}
            <div className="p-4 border-t border-black">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={assistantMessage}
                  onChange={(e) => setAssistantMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about project standards, carbon calculations, verification..."
                  className="flex-1 px-3 py-2 border border-black bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-black"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Navigation>
  );
}