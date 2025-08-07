'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API submission
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Project registered successfully! You will receive an email confirmation shortly.');
      window.location.href = '/project-owner';
    }, 2000);
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
                  <label className="block text-sm font-medium mb-2">Project Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300"
                    placeholder="e.g., Amazon Rainforest Conservation"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Project Type *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300"
                    required
                  >
                    <option value="">Select project type</option>
                    {projectTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300"
                    placeholder="e.g., Acre, Brazil"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Project Area</label>
                  <input
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300"
                    placeholder="e.g., 10,000 hectares"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">Project Description *</label>
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
                  <label className="block text-sm font-medium mb-2">Expected CO₂ Impact (tons/year) *</label>
                  <input
                    type="number"
                    name="co2Impact"
                    value={formData.co2Impact}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300"
                    placeholder="e.g., 1200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Project Duration *</label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300"
                    placeholder="e.g., 10 years"
                    required
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">Methodology Standard *</label>
                <select
                  name="methodology"
                  value={formData.methodology}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300"
                  required
                >
                  <option value="">Select methodology</option>
                  {methodologies.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">Sustainability Plan *</label>
                <textarea
                  name="sustainabilityPlan"
                  value={formData.sustainabilityPlan}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 h-32"
                  placeholder="Describe how you will ensure the long-term sustainability of your project..."
                  required
                />
              </div>
            </div>
          )}

          {/* Step 3: Impact & Community */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-bold mb-6">Step 3: Impact & Community Benefits</h2>
              
              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">Community Benefits *</label>
                <textarea
                  name="communityBenefit"
                  value={formData.communityBenefit}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 h-32"
                  placeholder="Describe how your project will benefit local communities (jobs, education, health, etc.)..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Contact Email *</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Contact Phone</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300"
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Documentation */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-xl font-bold mb-6">Step 4: Documentation</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Upload Supporting Documents</label>
                <div className="border border-dashed border-gray-400 p-6 text-center">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="text-gray-500 mb-2">
                      📄 Click to upload or drag and drop
                    </div>
                    <p className="text-sm text-gray-600">
                      PDF, Word documents, or images (max 10MB each)
                    </p>
                  </label>
                </div>
                
                {formData.documents.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Uploaded files:</p>
                    <ul className="text-sm text-gray-600">
                      {formData.documents.map((file, index) => (
                        <li key={index}>• {file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded border">
                <h3 className="font-medium mb-2">Recommended Documents:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Project design document</li>
                  <li>• Land ownership or usage rights documentation</li>
                  <li>• Environmental impact assessment</li>
                  <li>• Community consent letters</li>
                  <li>• Financial projections</li>
                  <li>• Previous project photos (if applicable)</li>
                </ul>
              </div>

              <div className="mt-6 p-4 border border-orange-300 bg-orange-50">
                <h3 className="font-medium text-orange-800 mb-2">⚠️ Before You Submit</h3>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• Ensure all information is accurate and complete</li>
                  <li>• Your project will undergo a verification process</li>
                  <li>• You'll be contacted within 5-7 business days</li>
                  <li>• Verification typically takes 2-4 weeks</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-3 border border-black ${
                currentStep === 1 
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
                className="px-6 py-3 bg-black text-white border border-black hover:bg-white hover:text-black transition-colors"
              >
                Next Step
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-3 ${
                  isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                } text-white border transition-colors`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Project'}
              </button>
            )}
          </div>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-gray-50">
                  <h3 className="font-semibold mb-2">🌱 Project Creation Assistant</h3>
                  <p className="text-sm opacity-80">
                    I can help you optimize your project registration, suggest verification standards, estimate carbon impact, and guide you through best practices.
                  </p>
                </div>

                {/* Sample conversation */}
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-blue-50 ml-8">
                    <p className="text-sm">What verification standard should I choose for my forest conservation project?</p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-gray-100 mr-8">
                    <p className="text-sm">
                      For forest conservation projects, I recommend:
                      <br />• <strong>VCS (Verified Carbon Standard)</strong> - Most widely accepted, good for REDD+ projects
                      <br />• <strong>Plan Vivo</strong> - Excellent for community-focused projects
                      <br />• <strong>Gold Standard</strong> - Higher premium, strong social co-benefits focus
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-blue-50 ml-8">
                    <p className="text-sm">How do I calculate the CO₂ impact accurately?</p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-gray-100 mr-8">
                    <p className="text-sm">
                      For accurate CO₂ calculations:
                      <br />• Use satellite monitoring data for baseline measurements
                      <br />• Apply appropriate emission factors for your region
                      <br />• Consider permanence risks and buffer requirements
                      <br />• Factor in leakage prevention measures
                    </p>
                  </div>
                </div>
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
                  onClick={handleSendMessage}
                  disabled={!assistantMessage.trim()}
                  className="px-4 py-2 bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 transition-colors disabled:cursor-not-allowed"
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
