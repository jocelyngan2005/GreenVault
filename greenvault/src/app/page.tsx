'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [language, setLanguage] = useState('en');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'es' : 'en');
  };

  const content = {
    en: {
      title: 'GreenVault',
      mission: 'Secure your digital life while protecting our planet',
      description: 'A privacy-preserving identity manager and decentralized carbon credit marketplace built on Web3 technology.',
      features: [
        'Encrypted password management with Walrus & Seal storage',
        'Decentralized carbon credit marketplace',
        'Privacy-first identity management with zkLogin',
        'AI-powered carbon offset assistant'
      ],
      login: 'Login',
      signup: 'Sign Up',
      learnMore: 'Learn More'
    },
    es: {
      title: 'GreenVault',
      mission: 'Asegura tu vida digital mientras proteges nuestro planeta',
      description: 'Un administrador de identidad que preserva la privacidad y un mercado descentralizado de créditos de carbono construido con tecnología Web3.',
      features: [
        'Gestión de contraseñas cifradas con almacenamiento Walrus & Seal',
        'Mercado descentralizado de créditos de carbono',
        'Gestión de identidad que prioriza la privacidad con zkLogin',
        'Asistente de compensación de carbono impulsado por IA'
      ],
      login: 'Iniciar Sesión',
      signup: 'Registrarse',
      learnMore: 'Aprender Más'
    }
  };

  const t = content[language as keyof typeof content];

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b border-black">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <button 
            onClick={toggleLanguage}
            className="border border-black px-3 py-1 hover:bg-black hover:text-white transition-colors"
          >
            {language === 'en' ? 'ES' : 'EN'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">{t.title}</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">{t.mission}</p>
          <p className="text-lg mb-12 max-w-3xl mx-auto text-gray-600">{t.description}</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/login" 
              className="bg-black text-white px-8 py-3 border border-black hover:bg-white hover:text-black transition-colors text-center"
            >
              {t.login}
            </Link>
            <Link 
              href="/signup" 
              className="bg-white text-black px-8 py-3 border border-black hover:bg-black hover:text-white transition-colors text-center"
            >
              {t.signup}
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-16">
          <h3 className="text-2xl font-bold mb-8 text-center">Key Features</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {t.features.map((feature, index) => (
              <div key={index} className="border border-black p-6">
                <p className="text-lg">{feature}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center border-t border-black pt-16">
          <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
          <p className="text-lg mb-8">Join the future of secure digital identity and sustainable technology.</p>
          <Link 
            href="/signup" 
            className="bg-black text-white px-8 py-3 border border-black hover:bg-white hover:text-black transition-colors inline-block"
          >
            {t.signup}
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-black mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm">&copy; 2025 GreenVault. Built with privacy and sustainability in mind.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Link href="/vault" className="text-sm hover:underline">Vault</Link>
              <Link href="/marketplace" className="text-sm hover:underline">Marketplace</Link>
              <Link href="/assistant" className="text-sm hover:underline">AI Assistant</Link>
              <Link href="/settings" className="text-sm hover:underline">Settings</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
