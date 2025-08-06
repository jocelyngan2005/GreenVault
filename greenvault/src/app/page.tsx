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
      mission: 'Connecting communities with carbon offset opportunities',
      description: 'A decentralized platform where local project owners can tokenize their environmental impact and companies can purchase verified carbon credits.',
      userRoles: [
        {
          title: 'Project Owners',
          subtitle: 'Local Communities & Environmental Stewards',
          description: 'Register your conservation projects, mint NFTs, and earn from carbon credits',
          features: [
            'No wallet required - simple email login',
            'Document forest preservation, clean energy projects',
            'Mint NFTs representing your carbon credits',
            'List on marketplace and earn revenue'
          ]
        },
        {
          title: 'Credit Buyers',
          subtitle: 'Companies & Individuals',
          description: 'Set offset goals, purchase verified credits, and track your environmental impact',
          features: [
            'Set monthly/yearly carbon offset goals',
            'Browse verified carbon credit NFTs',
            'AI assistant for automated purchasing',
            'Track your carbon footprint and offset history'
          ]
        }
      ],
      login: 'Login',
      signup: 'Sign Up',
      learnMore: 'Learn More'
    },
    es: {
      title: 'GreenVault',
      mission: 'Conectando comunidades con oportunidades de compensación de carbono',
      description: 'Una plataforma descentralizada donde los propietarios de proyectos locales pueden tokenizar su impacto ambiental y las empresas pueden comprar créditos de carbono verificados.',
      userRoles: [
        {
          title: 'Propietarios de Proyectos',
          subtitle: 'Comunidades Locales y Guardianes Ambientales',
          description: 'Registra tus proyectos de conservación, acuña NFTs y gana con créditos de carbono',
          features: [
            'No se requiere billetera - inicio de sesión simple por email',
            'Documenta preservación de bosques, proyectos de energía limpia',
            'Acuña NFTs que representen tus créditos de carbono',
            'Lista en el mercado y obtén ingresos'
          ]
        },
        {
          title: 'Compradores de Créditos',
          subtitle: 'Empresas e Individuos',
          description: 'Establece metas de compensación, compra créditos verificados y rastrea tu impacto ambiental',
          features: [
            'Establece metas de compensación de carbono mensuales/anuales',
            'Navega NFTs de créditos de carbono verificados',
            'Asistente de IA para compras automatizadas',
            'Rastrea tu huella de carbono e historial de compensación'
          ]
        }
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

        {/* User Roles Section */}
        <section className="mb-16">
          <h3 className="text-2xl font-bold mb-8 text-center">Two Ways to Make an Impact</h3>
          <div className="grid md:grid-cols-2 gap-8">
            {t.userRoles.map((role, index) => (
              <div key={index} className="border border-black p-6">
                <div className="text-center mb-6">
                  <h4 className="text-xl font-bold mb-2">{role.title}</h4>
                  <p className="text-sm text-gray-600 font-medium mb-3">{role.subtitle}</p>
                  <p className="text-gray-700">{role.description}</p>
                </div>
                <ul className="space-y-2">
                  {role.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start text-sm">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
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
              <Link href="/role-selection" className="text-sm hover:underline">Get Started</Link>
              <Link href="/marketplace" className="text-sm hover:underline">Marketplace</Link>
              <Link href="/learn-more" className="text-sm hover:underline">Learn More</Link>
              <Link href="/settings" className="text-sm hover:underline">Settings</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
