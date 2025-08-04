'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [didSetup, setDidSetup] = useState(false);

  const steps = [
    {
      title: 'Welcome to GreenVault',
      content: 'Your secure digital identity and carbon marketplace platform.',
      action: 'Get Started'
    },
    {
      title: 'Decentralized Identity (DID)',
      content: 'We\'re creating your unique digital identity. This will be used to securely access your vault and marketplace.',
      action: 'Create DID'
    },
    {
      title: 'Secure Vault Setup',
      content: 'Your passwords and secrets will be encrypted and stored on Walrus & Seal network for maximum security.',
      action: 'Setup Vault'
    },
    {
      title: 'Carbon Marketplace',
      content: 'Browse and purchase verified carbon credits to offset your environmental impact.',
      action: 'Explore Marketplace'
    },
    {
      title: 'Ready to Go!',
      content: 'Your GreenVault is ready. Start securing your digital life and making a positive environmental impact.',
      action: 'Enter Dashboard'
    }
  ];

  const handleNext = () => {
    if (currentStep === 1 && !didSetup) {
      // Simulate DID setup
      setDidSetup(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 1500);
    } else if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      window.location.href = '/vault';
    }
  };

  const handleSkip = () => {
    window.location.href = '/vault';
  };

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center">
      <div className="max-w-2xl w-full mx-4">
        <div className="border border-black p-8">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-600">Step {currentStep + 1} of {steps.length}</span>
              <Link href="/" className="text-sm hover:underline">GreenVault</Link>
            </div>
            <div className="w-full bg-gray-200 h-1">
              <div 
                className="bg-black h-1 transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step content */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">{steps[currentStep].title}</h1>
            <p className="text-lg text-gray-600 max-w-lg mx-auto">{steps[currentStep].content}</p>
          </div>

          {/* DID Setup Animation */}
          {currentStep === 1 && didSetup && (
            <div className="text-center mb-8">
              <div className="border border-black p-4 bg-gray-50">
                <p className="text-sm">Setting up your DID...</p>
                <div className="mt-2 flex justify-center">
                  <div className="animate-pulse">●●●</div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleNext}
              disabled={currentStep === 1 && didSetup}
              className="bg-black text-white px-8 py-3 border border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50"
            >
              {currentStep === 1 && didSetup ? 'Creating...' : steps[currentStep].action}
            </button>
            
            {currentStep > 0 && currentStep < steps.length - 1 && (
              <button
                onClick={handleSkip}
                className="bg-white text-black px-8 py-3 border border-black hover:bg-black hover:text-white transition-colors"
              >
                Skip Tutorial
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="text-sm text-gray-600 hover:underline disabled:opacity-50"
            >
              ← Previous
            </button>
            
            <span className="text-sm text-gray-600">
              {currentStep + 1} / {steps.length}
            </span>
            
            <button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              disabled={currentStep === steps.length - 1}
              className="text-sm text-gray-600 hover:underline disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
