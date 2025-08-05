'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: {
    type: 'browse' | 'buy' | 'learn';
    label: string;
    target?: string;
  }[];
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your carbon offset assistant. I can help you find the best carbon credits, suggest sustainable actions, and track your environmental impact. How can I help you today?',
      timestamp: '10:00 AM'
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const quickActions = [
    'Find carbon credits under $20',
    'Show my environmental impact',
    'Suggest sustainable actions',
    'Calculate my carbon footprint',
    'Find forest conservation projects'
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
        content: generateResponse(inputMessage),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: generateActions(inputMessage)
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const generateResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('carbon credit') || lowerInput.includes('offset')) {
      return 'I found several high-quality carbon credits that match your criteria. Based on your preferences, I recommend the Amazon Rainforest Conservation project - it offers 1.5 tons of CO2 offset for $25 and supports indigenous communities. Would you like me to show you more details or help you purchase it?';
    }
    
    if (lowerInput.includes('impact') || lowerInput.includes('environment')) {
      return 'Your current environmental impact is impressive! You\'ve offset 3.5 tons of CO2 through 2 carbon credit purchases, equivalent to taking a car off the road for 7,600 miles. You\'re in the top 15% of environmentally conscious users. Would you like suggestions for additional offset opportunities?';
    }
    
    if (lowerInput.includes('suggest') || lowerInput.includes('action')) {
      return 'Here are personalized sustainability actions for you: 1) Offset your monthly energy usage with solar farm credits ($18/month), 2) Support mangrove restoration in the Philippines, 3) Consider forest conservation projects in Brazil. Each of these aligns with your previous choices and budget.';
    }
    
    if (lowerInput.includes('footprint') || lowerInput.includes('calculate')) {
      return 'To calculate your carbon footprint accurately, I\'ll need some information about your lifestyle. On average, a person generates 16 tons of CO2 annually. Based on your location and typical usage patterns, I estimate your footprint at around 14 tons/year. Would you like personalized offset recommendations?';
    }
    
    if (lowerInput.includes('forest') || lowerInput.includes('tree')) {
      return 'I found 3 excellent forest conservation projects currently available: 1) Amazon Rainforest Conservation (Brazil) - $25 for 1.5 tons, 2) African Reforestation Initiative (Kenya) - $20 for 1.2 tons, 3) Southeast Asian Forest Protection (Indonesia) - $22 for 1.3 tons. All are verified and support local communities.';
    }
    
    return 'I understand you\'re interested in carbon offsets and sustainability. I can help you find verified carbon credits, track your environmental impact, suggest sustainable actions, or calculate your carbon footprint. What specific area would you like to explore?';
  };

  const generateActions = (input: string): Message['actions'] => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('carbon credit') || lowerInput.includes('find')) {
      return [
        { type: 'browse', label: 'Browse Marketplace', target: '/marketplace' },
        { type: 'buy', label: 'Quick Buy Recommended' }
      ];
    }
    
    if (lowerInput.includes('impact')) {
      return [
        { type: 'browse', label: 'View My Assets', target: '/assets' },
        { type: 'learn', label: 'Learn More About Impact' }
      ];
    }
    
    return [
      { type: 'browse', label: 'Explore Options', target: '/marketplace' }
    ];
  };

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
    handleSendMessage();
  };

  const handleActionClick = (action: { type: 'browse' | 'buy' | 'learn'; label: string; target?: string }) => {
    if (action.target) {
      window.location.href = action.target;
    } else {
      alert(`Action: ${action.label} - This would perform the specific action.`);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b border-black">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-2xl font-bold hover:underline">
                GreenVault
              </Link>
              <nav className="flex gap-4">
                <Link href="/vault" className="text-sm hover:underline">Vault</Link>
                <Link href="/marketplace" className="text-sm hover:underline">Marketplace</Link>
                <Link href="/assets" className="text-sm hover:underline">My Assets</Link>
                <Link href="/assistant" className="text-sm font-medium underline">AI Assistant</Link>
              </nav>
            </div>
            <Link href="/settings" className="text-sm hover:underline">Settings</Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Carbon Offset Assistant</h1>
          <p className="text-gray-600">AI-powered guidance for sustainable living and carbon offsetting</p>
        </div>

        {/* Chat Interface */}
        <div className="border border-black">
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 bg-gray-50">
            {messages.map(message => (
              <div key={message.id} className={`mb-4 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block max-w-xs lg:max-w-md px-4 py-2 ${
                  message.type === 'user' 
                    ? 'bg-black text-white' 
                    : 'bg-white text-black border border-gray-300'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs mt-2 opacity-70">{message.timestamp}</p>
                </div>
                
                {message.actions && (
                  <div className="mt-2 space-x-2">
                    {message.actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleActionClick(action)}
                        className="text-xs bg-white text-black border border-black px-2 py-1 hover:bg-black hover:text-white transition-colors"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="text-left mb-4">
                <div className="inline-block bg-white text-black border border-gray-300 px-4 py-2">
                  <p className="text-sm">Assistant is typing...</p>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-black p-4 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about carbon credits, sustainability, or your environmental impact..."
                className="flex-1 border border-black px-3 py-2 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-black text-white px-6 py-2 border border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action)}
                className="text-left text-sm bg-white text-black border border-black px-3 py-2 hover:bg-black hover:text-white transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        </div>

        {/* Assistant Capabilities */}
        <div className="mt-12 border-t border-black pt-8">
          <h2 className="text-2xl font-bold mb-4">What I Can Help With</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-black p-4">
              <h3 className="font-bold mb-2">Carbon Credit Recommendations</h3>
              <p className="text-sm text-gray-600">Find verified carbon credits based on your budget, preferences, and impact goals.</p>
            </div>
            <div className="border border-black p-4">
              <h3 className="font-bold mb-2">Impact Tracking</h3>
              <p className="text-sm text-gray-600">Monitor your environmental impact and get insights on your sustainability journey.</p>
            </div>
            <div className="border border-black p-4">
              <h3 className="font-bold mb-2">Sustainable Actions</h3>
              <p className="text-sm text-gray-600">Receive personalized suggestions for reducing your carbon footprint.</p>
            </div>
            <div className="border border-black p-4">
              <h3 className="font-bold mb-2">Market Analysis</h3>
              <p className="text-sm text-gray-600">Get insights on carbon credit trends and optimal purchasing strategies.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
