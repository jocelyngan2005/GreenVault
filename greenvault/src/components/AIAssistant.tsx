'use client';

import { useState, useEffect, useRef } from 'react';
import { oasisService, UserPreferences } from '@/lib/oasisService';
import { aiRecommendationService, CarbonCreditNFT, RecommendationResult } from '@/lib/aiRecommendationService';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  data?: any;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function AIAssistant({ isOpen, onClose, userId }: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [showPreferencesForm, setShowPreferencesForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      initializeChat();
    }
  }, [isOpen, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async () => {
    // Add welcome message
    const welcomeMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'assistant',
      content: '🌱 Hello! I\'m your AI assistant for carbon credit NFT recommendations. I can help you find the perfect projects based on your preferences. Let me check if I have your preferences stored securely...',
      timestamp: Date.now()
    };
    setMessages([welcomeMessage]);

    // Load user preferences from Oasis
    try {
      const prefs = await oasisService.getUserPreferences(userId);
      setUserPreferences(prefs);

      if (prefs) {
        const prefsMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'system',
          content: `✅ Found your preferences! Price range: $${prefs.priceRangeMin}-${prefs.priceRangeMax}, Risk: ${prefs.riskTolerance}, Investment size: ${prefs.investmentSize}`,
          timestamp: Date.now() + 1
        };
        setMessages(prev => [...prev, prefsMessage]);

        // Automatically provide recommendations
        setTimeout(() => {
          handleGetRecommendations();
        }, 1500);
      } else {
        const noPrefsMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: '🔒 No preferences found. Let\'s set up your investment profile first so I can provide personalized recommendations. Would you like to configure your preferences?',
          timestamp: Date.now() + 1
        };
        setMessages(prev => [...prev, noPrefsMessage]);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '⚠️ I had trouble accessing your preferences. Let\'s set them up now to get started!',
        timestamp: Date.now() + 1
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Process user input
    await processUserInput(inputValue);
    setIsLoading(false);
  };

  const processUserInput = async (input: string) => {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('recommend') || lowerInput.includes('suggest') || lowerInput.includes('find')) {
      await handleGetRecommendations();
    } else if (lowerInput.includes('preference') || lowerInput.includes('setting')) {
      setShowPreferencesForm(true);
      const response: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: '📋 I\'ll help you set up your preferences. Please fill out the form below to customize your recommendations.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, response]);
    } else if (lowerInput.includes('price') || lowerInput.includes('budget')) {
      const response: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'I can help you find projects within your budget! What\'s your preferred price range per ton of CO2? For example, "$10-30 per ton"',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, response]);
    } else if (lowerInput.includes('help')) {
      await handleHelpRequest();
    } else {
      // Generic response
      const response: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'I understand you\'re looking for carbon credit information. I can help you:\n\n• Get personalized NFT recommendations\n• Set up your investment preferences\n• Find projects by price or category\n• Explain project details\n\nWhat would you like to do?',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, response]);
    }
  };

  const handleGetRecommendations = async () => {
    if (!userPreferences) {
      const response: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: '🔧 I need your preferences first to provide personalized recommendations. Would you like to set them up?',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, response]);
      setShowPreferencesForm(true);
      return;
    }

    try {
      // Load mock NFT dataset
      const response = await fetch('/mock_data/carbon-credits-nft-dataset.json');
      const data = await response.json();
      const nftListings: CarbonCreditNFT[] = data.carbonCreditNFTs;

      // Get AI recommendations
      const recommendations: RecommendationResult = await aiRecommendationService.getRecommendations({
        userPreferences,
        nftListings,
        maxResults: 3
      });

      // Create recommendation message
      const recMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `🎯 ${recommendations.explanation}\n\n**Confidence**: ${recommendations.confidence}%\n**Matching factors**: ${recommendations.matchingFactors.join(', ')}`,
        timestamp: Date.now(),
        data: recommendations
      };
      setMessages(prev => [...prev, recMessage]);

      // Add individual NFT cards
      recommendations.recommendations.forEach((nft, index) => {
        setTimeout(() => {
          const nftMessage: ChatMessage = {
            id: (Date.now() + index + 1).toString(),
            type: 'system',
            content: `**${nft.name}**\n💰 $${nft.pricePerTon}/ton\n📍 ${nft.location}\n🌱 ${nft.category.replace('_', ' ')}\n💨 ${nft.co2OffsetPerYear} tons CO2/year\n📈 ${nft.availableSupply}/${nft.totalSupply} available\n\n${nft.description}`,
            timestamp: Date.now() + index + 1,
            data: nft
          };
          setMessages(prev => [...prev, nftMessage]);
        }, (index + 1) * 500);
      });

    } catch (error) {
      console.error('Failed to get recommendations:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: '❌ Sorry, I encountered an error while fetching recommendations. Please try again.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleHelpRequest = async () => {
    const helpMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'assistant',
      content: `🤖 **AI Carbon Credit Assistant Help**\n\nI can help you:\n\n🎯 **Get Recommendations**: "Find me some good projects" or "Recommend carbon credits"\n\n⚙️ **Set Preferences**: "Update my preferences" or "Change settings"\n\n💰 **Price Queries**: "Show me projects under $25"\n\n🌍 **Category Search**: "Find renewable energy projects"\n\n🔒 **Privacy**: Your preferences are stored securely on Oasis Confidential EVM\n\nJust type what you're looking for!`,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, helpMessage]);
  };

  const handleSavePreferences = async (prefs: UserPreferences) => {
    try {
      await oasisService.storeUserPreferences(prefs);
      setUserPreferences(prefs);
      setShowPreferencesForm(false);

      const successMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: '✅ Preferences saved securely on Oasis! Now I can provide personalized recommendations. Let me find some great projects for you...',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, successMessage]);

      // Auto-generate recommendations
      setTimeout(() => {
        handleGetRecommendations();
      }, 1000);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: '❌ Failed to save preferences. Please try again.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl h-[80vh] flex flex-col border border-black">
        {/* Header */}
        <div className="bg-green-600 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <h3 className="font-bold">Carbon Credit AI Assistant</h3>
            <span className="text-xs bg-green-700 px-2 py-1 rounded">Powered by Oasis</span>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg whitespace-pre-line ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.type === 'system'
                    ? 'bg-gray-100 text-black border border-gray-300'
                    : 'bg-green-100 text-black'
                }`}
              >
                {message.content}
                {message.data && message.data.id && (
                  <button className="mt-2 bg-green-600 text-white px-3 py-1 text-xs rounded hover:bg-green-700">
                    View Details
                  </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-green-100 text-black p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  <span>AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Preferences Form */}
        {showPreferencesForm && (
          <PreferencesForm
            userId={userId}
            onSave={handleSavePreferences}
            onCancel={() => setShowPreferencesForm(false)}
            initialPreferences={userPreferences}
          />
        )}

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask me about carbon credit NFTs..."
              className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              Send
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => handleGetRecommendations()}
              className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
            >
              Get Recommendations
            </button>
            <button
              onClick={() => setShowPreferencesForm(true)}
              className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
            >
              Update Preferences
            </button>
            <button
              onClick={() => handleHelpRequest()}
              className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
            >
              Help
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Preferences Form Component
interface PreferencesFormProps {
  userId: string;
  onSave: (preferences: UserPreferences) => void;
  onCancel: () => void;
  initialPreferences?: UserPreferences | null;
}

function PreferencesForm({ userId, onSave, onCancel, initialPreferences }: PreferencesFormProps) {
  const [prefs, setPrefs] = useState<Partial<UserPreferences>>({
    priceRangeMin: initialPreferences?.priceRangeMin || 10,
    priceRangeMax: initialPreferences?.priceRangeMax || 50,
    preferredCategories: initialPreferences?.preferredCategories || [],
    preferredLocations: initialPreferences?.preferredLocations || [],
    riskTolerance: initialPreferences?.riskTolerance || 'medium',
    investmentSize: initialPreferences?.investmentSize || 'medium'
  });

  const categories = [
    'forest_conservation',
    'renewable_energy',
    'ecosystem_restoration',
    'clean_cooking',
    'agriculture',
    'waste_management',
    'ocean_conservation'
  ];

  const locations = [
    'Brazil', 'Kenya', 'Philippines', 'Uganda', 'India', 
    'Indonesia', 'Vietnam', 'Costa Rica', 'Mexico', 'Norway'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullPreferences: UserPreferences = {
      userId,
      priceRangeMin: prefs.priceRangeMin!,
      priceRangeMax: prefs.priceRangeMax!,
      preferredCategories: prefs.preferredCategories!,
      preferredLocations: prefs.preferredLocations!,
      riskTolerance: prefs.riskTolerance!,
      investmentSize: prefs.investmentSize!,
      lastUpdated: Date.now()
    };
    onSave(fullPreferences);
  };

  return (
    <div className="border-t border-gray-200 p-4 bg-gray-50 max-h-[50vh] overflow-y-auto">
      <h4 className="font-bold mb-4">🔒 Set Your Investment Preferences (Stored on Oasis)</h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Min Price ($/ton)</label>
            <input
              type="number"
              value={prefs.priceRangeMin}
              onChange={(e) => setPrefs({...prefs, priceRangeMin: Number(e.target.value)})}
              className="w-full p-2 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Price ($/ton)</label>
            <input
              type="number"
              value={prefs.priceRangeMax}
              onChange={(e) => setPrefs({...prefs, priceRangeMax: Number(e.target.value)})}
              className="w-full p-2 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Risk Tolerance</label>
          <select
            value={prefs.riskTolerance}
            onChange={(e) => setPrefs({...prefs, riskTolerance: e.target.value as any})}
            className="w-full p-2 border border-gray-300 rounded text-sm"
          >
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Investment Size</label>
          <select
            value={prefs.investmentSize}
            onChange={(e) => setPrefs({...prefs, investmentSize: e.target.value as any})}
            className="w-full p-2 border border-gray-300 rounded text-sm"
          >
            <option value="small">Small ($100-500)</option>
            <option value="medium">Medium ($500-2000)</option>
            <option value="large">Large ($2000+)</option>
          </select>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            Save to Oasis
          </button>
        </div>
      </form>
    </div>
  );
}
