'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestions?: {
    type: 'purchase' | 'learn' | 'calculate';
    label: string;
    action: string;
  }[];
}

interface CarbonGoal {
  current: number;
  target: number;
  period: 'monthly' | 'yearly';
}

export default function CreditBuyerAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your carbon offset assistant. I can help you find the best carbon credits, track your progress toward offset goals, and suggest ways to reduce your carbon footprint. What would you like to do today?',
      timestamp: '10:00 AM',
      suggestions: [
        { type: 'purchase', label: 'Find carbon credits under $20', action: 'search-credits' },
        { type: 'calculate', label: 'Calculate my carbon footprint', action: 'carbon-calculator' },
        { type: 'learn', label: 'Learn about offset strategies', action: 'education' }
      ]
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [carbonGoal] = useState<CarbonGoal>({
    current: 2.3,
    target: 5.0,
    period: 'monthly'
  });

  const quickActions = [
    'Recommend credits for my budget',
    'Show eco-friendly project types',
    'Calculate offset for my last flight',
    'Set up automated monthly purchases',
    'Find projects in developing countries'
  ];

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateAssistantResponse(inputMessage),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: generateSuggestions(inputMessage)
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
    handleSendMessage();
  };

  const generateAssistantResponse = (input: string): string => {
    const lower = input.toLowerCase();
    
    if (lower.includes('recommend') || lower.includes('budget')) {
      return 'Based on your current offset goal and budget, I recommend looking at these verified projects: Solar Farm Initiative in Kenya ($18/ton), Mangrove Restoration in Philippines ($22/ton), and Wind Energy in Morocco ($19/ton). These offer excellent value and strong community impact.';
    } else if (lower.includes('calculate') || lower.includes('footprint')) {
      return 'I can help you calculate your carbon footprint! For a basic estimate: Air travel (~0.4 tons CO₂ per 1000 miles, Home energy varies by location and size, Transportation depends on vehicle type and usage. Would you like me to walk you through a detailed calculation?';
    } else if (lower.includes('automat')) {
      return 'Setting up automated purchases is a great way to consistently meet your offset goals! I can help you: 1) Set monthly purchase amounts, 2) Choose preferred project types, 3) Set price alerts for your favorite projects, 4) Review and adjust your strategy monthly.';
    } else if (lower.includes('flight')) {
      return 'For flight offset calculations, I need to know: departure and arrival cities, flight class (economy/business/first), and whether it\'s round trip. On average, domestic flights emit ~0.4 tons CO₂ per passenger per 1000 miles.';
    } else {
      return 'I understand you\'re looking for carbon offset advice. I can help you find the best credits for your needs, calculate your footprint, or set up an automated offset strategy. What specific area would you like to focus on?';
    }
  };

  const generateSuggestions = (input: string): Message['suggestions'] => {
    const lower = input.toLowerCase();
    
    if (lower.includes('recommend') || lower.includes('budget')) {
      return [
        { type: 'purchase', label: 'View recommended projects', action: 'view-recommendations' },
        { type: 'learn', label: 'Learn about project types', action: 'project-education' },
        { type: 'calculate', label: 'Set budget preferences', action: 'budget-settings' }
      ];
    } else if (lower.includes('calculate')) {
      return [
        { type: 'calculate', label: 'Start carbon calculator', action: 'calculator' },
        { type: 'learn', label: 'Learn about emissions', action: 'emissions-education' }
      ];
    }
    
    return [
      { type: 'purchase', label: 'Browse marketplace', action: 'marketplace' },
      { type: 'calculate', label: 'Carbon calculator', action: 'calculator' }
    ];
  };

  return (
    <Navigation>
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Quick Stats */}
          <div className="lg:col-span-1">
            <div className="border border-black p-4 mb-6">
              <h3 className="font-bold mb-3">Your Progress</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Monthly Goal</span>
                    <span>{carbonGoal.current} / {carbonGoal.target} tons</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 border border-gray-300">
                    <div 
                      className="bg-green-600 h-full"
                      style={{ width: `${(carbonGoal.current / carbonGoal.target) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-sm">
                  <p className="text-gray-600">Remaining: {(carbonGoal.target - carbonGoal.current).toFixed(1)} tons</p>
                </div>
              </div>
            </div>

            <div className="border border-black p-4">
              <h3 className="font-bold mb-3">Quick Actions</h3>
              <div className="space-y-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action)}
                    className="w-full text-left text-sm p-2 border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <div className="border border-black h-96 overflow-y-auto p-4 mb-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 border ${
                        message.type === 'user'
                          ? 'bg-black text-white border-black'
                          : 'bg-gray-50 text-black border-gray-300'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">{message.timestamp}</p>
                      
                      {message.suggestions && (
                        <div className="mt-3 space-y-2">
                          {message.suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleQuickAction(suggestion.label)}
                              className="block w-full text-left text-xs p-2 bg-white text-black border border-gray-300 hover:bg-gray-100 transition-colors"
                            >
                              {suggestion.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-xs px-4 py-2 bg-gray-50 border border-gray-300">
                      <p className="text-sm">Assistant is typing...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Message Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about carbon credits, offset strategies, or calculations..."
                className="flex-1 p-3 border border-black"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className={`px-6 py-3 border border-black ${
                  isLoading || !inputMessage.trim()
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-white hover:text-black'
                } transition-colors`}
              >
                Send
              </button>
            </div>

            {/* Assistant Features */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-black p-4 text-center">
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-semibold mb-2">Smart Recommendations</h3>
                <p className="text-sm text-gray-600">
                  Get personalized credit recommendations based on your goals and budget.
                </p>
              </div>
              
              <div className="border border-black p-4 text-center">
                <div className="text-2xl mb-2">🔄</div>
                <h3 className="font-semibold mb-2">Automated Purchasing</h3>
                <p className="text-sm text-gray-600">
                  Set up recurring purchases to automatically meet your offset goals.
                </p>
              </div>
              
              <div className="border border-black p-4 text-center">
                <div className="text-2xl mb-2">🌍</div>
                <h3 className="font-semibold mb-2">Impact Tracking</h3>
                <p className="text-sm text-gray-600">
                  Monitor your environmental impact and offset progress over time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Navigation>
  );
}
