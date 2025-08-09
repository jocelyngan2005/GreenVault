'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface VaultSetupResult {
  success: boolean;
  vaultBlobId?: string;
  isNew?: boolean;
  error?: string;
}

interface DidSetupResult {
  success: boolean;
  did?: string;
  isNew?: boolean;
  error?: string;
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [didSetup, setDidSetup] = useState(false);
  const [didSetupResult, setDidSetupResult] = useState<DidSetupResult | null>(null);
  const [isSettingUpDid, setIsSettingUpDid] = useState(false);
  const [vaultSetupResult, setVaultSetupResult] = useState<VaultSetupResult | null>(null);
  const [isSettingUpVault, setIsSettingUpVault] = useState(false);

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

  // Check if user is logged in and get user data
  useEffect(() => {
    const userData = localStorage.getItem('user-data');
    const zkLoginData = localStorage.getItem('zklogin-data');
    const vaultData = localStorage.getItem('vault-data');
    const onboardingCompleted = localStorage.getItem('onboarding-completed');
    
    // Check if user has any authentication data
    if (!userData && !zkLoginData) {
      // Redirect to login if no user data
      console.log('No user data found, redirecting to login');
      window.location.href = '/login';
      return;
    }

    // For new users (who just signed up), ensure onboarding-completed is not set
    // This prevents premature redirection for new users
    let isNewUser = false;
    
    if (userData) {
      // Email user
      const userDataObj = JSON.parse(userData);
      
      // For email users, check createdAt timestamp
      if (userDataObj.createdAt) {
        const timeSinceCreation = Date.now() - new Date(userDataObj.createdAt).getTime();
        isNewUser = timeSinceCreation < 60000; // Within 1 minute
      } else {
        // For users without createdAt, check if onboarding-completed is not set
        isNewUser = !onboardingCompleted || onboardingCompleted !== 'true';
      }
    } else if (zkLoginData) {
      // zkLogin user
      console.log('zkLogin user detected, checking if new user');
      
      // For zkLogin users, always treat them as new users if they just signed up
      // This ensures they go through the onboarding process
      isNewUser = true;
      
      console.log('zkLogin user treated as new user, will go through onboarding');
    }
    
    if (isNewUser) {
      console.log('New user detected, clearing onboarding-completed flag');
      localStorage.removeItem('onboarding-completed');
      localStorage.removeItem('vault-data');
      // Also clear any vault-related keys
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('vault-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('Cleared existing vault data for new user onboarding');
      console.log('Onboarding flow: User will go through complete onboarding process');
      return; // Don't redirect, let user go through onboarding
    } else {
      console.log('Existing user detected, checking if they should be redirected');
    }

    // Only redirect if user has completed onboarding before AND has a valid vault
    if (vaultData && onboardingCompleted === 'true') {
      const parsedVaultData = JSON.parse(vaultData);
      if (parsedVaultData.initialized && parsedVaultData.vaultBlobId) {
        console.log('User has completed onboarding before, redirecting to role selection');
        console.log('Vault data:', parsedVaultData);
        console.log('Onboarding completed:', onboardingCompleted);
        window.location.href = '/role-selection';
        return;
      }
    }

    console.log('Onboarding flow: User will go through complete onboarding process');
    console.log('Debug info:', {
      hasUserData: !!userData,
      hasZkLoginData: !!zkLoginData,
      hasVaultData: !!vaultData,
      onboardingCompleted,
      isNewUser
    });
  }, []);

  const setupDid = async (): Promise<DidSetupResult> => {
    try {
      setIsSettingUpDid(true);
      
      // Get user data from localStorage (support both email and zkLogin users)
      const userDataStr = localStorage.getItem('user-data');
      const zkLoginDataStr = localStorage.getItem('zklogin-data');
      
      let userData: any;
      let userId: string;
      
      if (userDataStr) {
        // Email user
        userData = JSON.parse(userDataStr);
        userId = userData.email || userData.id;
      } else if (zkLoginDataStr) {
        // zkLogin user
        const zkLoginData = JSON.parse(zkLoginDataStr);
        userData = {
          id: zkLoginData.decodedJwt.sub,
          email: zkLoginData.decodedJwt.email,
          userAddress: zkLoginData.userAddress
        };
        userId = zkLoginData.decodedJwt.sub;
      } else {
        throw new Error('No user data found');
      }

      // Check if DID already exists in localStorage
      const existingDid = localStorage.getItem('user-did');
      if (existingDid) {
        console.log('DID already exists:', existingDid);
        return {
          success: true,
          did: existingDid,
          isNew: false
        };
      }

      // For zkLogin users, DID is already created during signup
      // For email users, we need to create DID
      if (zkLoginDataStr) {
        // zkLogin user - DID was created during signup
        const zkLoginData = JSON.parse(zkLoginDataStr);
        const did = `did:sui:${zkLoginData.userAddress}`;
        
        // Store DID in localStorage
        localStorage.setItem('user-did', did);
        
        return {
          success: true,
          did,
          isNew: false // Already created during signup
        };
      } else {
        // Email user - create DID
        const authToken = localStorage.getItem('auth-token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        // Call DID creation API
        const response = await fetch('/api/did/create', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            userId,
            email: userData.email
          })
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Failed to create DID');
        }

        // Store DID in localStorage
        localStorage.setItem('user-did', result.data.did);

        return {
          success: true,
          did: result.data.did,
          isNew: true
        };
      }

    } catch (error) {
      console.error('DID setup failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsSettingUpDid(false);
    }
  };

  const setupVault = async (): Promise<VaultSetupResult> => {
    try {
      setIsSettingUpVault(true);
      
      // Get user data from localStorage (support both email and zkLogin users)
      const userDataStr = localStorage.getItem('user-data');
      const zkLoginDataStr = localStorage.getItem('zklogin-data');
      
      let userData: any;
      let authType: 'email' | 'zklogin';
      let userId: string;
      let vaultKey: string;
      
      if (userDataStr) {
        // Email user
        userData = JSON.parse(userDataStr);
        authType = 'email';
        userId = userData.email || userData.id;
        vaultKey = `vault-${userData.id}-consistent`;
      } else if (zkLoginDataStr) {
        // zkLogin user
        const zkLoginData = JSON.parse(zkLoginDataStr);
        userData = {
          id: zkLoginData.decodedJwt.sub,
          email: zkLoginData.decodedJwt.email,
          userAddress: zkLoginData.userAddress
        };
        authType = 'zklogin';
        userId = zkLoginData.decodedJwt.sub;
        vaultKey = `vault-${zkLoginData.decodedJwt.sub}-consistent`;
      } else {
        throw new Error('No user data found');
      }

      // For zkLogin users, we don't need an auth token
      const authToken = localStorage.getItem('auth-token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      // Call vault check API
      const response = await fetch('/api/vault/check', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId,
          userKey: vaultKey,
          authType
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to setup vault');
      }

      // Store vault information
      const vaultData = {
        vaultBlobId: result.data.blobId,
        userId: result.data.userId,
        initialized: true,
        timestamp: result.data.timestamp
      };

      localStorage.setItem(`vault-${result.data.userId}`, result.data.blobId);
      localStorage.setItem('vault-data', JSON.stringify(vaultData));

      return {
        success: true,
        vaultBlobId: result.data.blobId,
        isNew: result.data.isNew
      };

    } catch (error) {
      console.error('Vault setup failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsSettingUpVault(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1 && !didSetup) {
      // Setup DID
      const result = await setupDid();
      setDidSetupResult(result);
      
      if (result.success) {
      setDidSetup(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 1500);
      } else {
        // Handle DID setup error
        console.error('DID setup failed:', result.error);
      }
    } else if (currentStep === 2) {
      // Setup vault
      const result = await setupVault();
      setVaultSetupResult(result);
      
      if (result.success) {
        setTimeout(() => {
          setCurrentStep(currentStep + 1);
        }, 1500);
      } else {
        // Handle vault setup error
        console.error('Vault setup failed:', result.error);
      }
    } else if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding - mark as completed and redirect to role selection
      localStorage.setItem('onboarding-completed', 'true');
      window.location.href = '/role-selection';
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding-completed', 'true');
    window.location.href = '/role-selection';
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
          {currentStep === 1 && isSettingUpDid && (
            <div className="text-center mb-8">
              <div className="border border-black p-4 bg-gray-50">
                <p className="text-sm">Setting up your DID...</p>
                <div className="mt-2 flex justify-center">
                  <div className="animate-pulse">●●●</div>
                </div>
              </div>
            </div>
          )}

          {/* DID Setup Result */}
          {currentStep === 1 && didSetupResult && !isSettingUpDid && (
            <div className="text-center mb-8">
              <div className={`border border-black p-4 ${didSetupResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className="text-sm">
                  {didSetupResult.success 
                    ? `DID ${didSetupResult.isNew ? 'created' : 'found'} successfully!`
                    : `DID setup failed: ${didSetupResult.error}`
                  }
                </p>
                {didSetupResult.success && didSetupResult.did && (
                  <p className="text-xs mt-1 text-gray-600">
                    DID: {didSetupResult.did}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Vault Setup Animation */}
          {currentStep === 2 && isSettingUpVault && (
            <div className="text-center mb-8">
              <div className="border border-black p-4 bg-gray-50">
                <p className="text-sm">Setting up your secure vault...</p>
                <div className="mt-2 flex justify-center">
                  <div className="animate-pulse">●●●</div>
                </div>
              </div>
            </div>
          )}

          {/* Vault Setup Result */}
          {currentStep === 2 && vaultSetupResult && !isSettingUpVault && (
            <div className="text-center mb-8">
              <div className={`border border-black p-4 ${vaultSetupResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className="text-sm">
                  {vaultSetupResult.success 
                    ? `Vault ${vaultSetupResult.isNew ? 'created' : 'found'} successfully!`
                    : `Vault setup failed: ${vaultSetupResult.error}`
                  }
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleNext}
              disabled={(currentStep === 1 && isSettingUpDid) || (currentStep === 2 && isSettingUpVault)}
              className="bg-black text-white px-8 py-3 border border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50"
            >
              {currentStep === 1 && isSettingUpDid ? 'Setting up...' : 
               currentStep === 2 && isSettingUpVault ? 'Setting up...' :
               steps[currentStep].action}
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
