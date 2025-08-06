'use client';

import { useState } from 'react';
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
    </Navigation>
  );
}
