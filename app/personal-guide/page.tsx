'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PathChoices {
  propertyType?: 'apartment' | 'house' | 'townhouse';
  targetPropertyValue?: number;
  savingsFrequency?: 'monthly' | 'yearly' | 'quarterly';
  savingsAmount?: number;
  targetYear?: number;
  financingType?: '100%' | '90%' | '80%';
  familySupport?: 'yes' | 'no' | 'maybe';
  locationPriority?: 'price' | 'location' | 'balanced';
  lifestyleMatch?: 'urban' | 'suburban' | 'rural';
}

interface Statistics {
  totalNeeded: number;
  timeToGoal: number;
  monthlyRequired: number;
  interestRate: number;
  estimatedPropertyValue: number;
}

export default function PersonalGuide() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [openQuestion, setOpenQuestion] = useState('');
  const [pathChoices, setPathChoices] = useState<PathChoices>({});
  const [statistics, setStatistics] = useState<Statistics>({
    totalNeeded: 50000,
    timeToGoal: 5,
    monthlyRequired: 835,
    interestRate: 3.5,
    estimatedPropertyValue: 350000,
  });

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Recalculate statistics when choices change
  useEffect(() => {
    calculateStatistics();
  }, [pathChoices, selectedPath]);

  const calculateStatistics = () => {
    if (!selectedPath) return;

    let newStats = { ...statistics };

    // Calculate based on selected path and choices
    if (selectedPath === 'young-professional') {
      // Use selected property value or default
      const propertyValue = pathChoices.targetPropertyValue || 300000;
      const equityNeeded = propertyValue * 0.15; // 15% down payment for young professionals
      
      newStats.estimatedPropertyValue = propertyValue;
      newStats.totalNeeded = Math.round(equityNeeded);
      newStats.interestRate = 3.2; // Better rates for young professionals
      
      // Calculate timeline based on savings
      if (pathChoices.savingsFrequency && pathChoices.savingsAmount) {
        const annualSavings = pathChoices.savingsAmount * 
          (pathChoices.savingsFrequency === 'monthly' ? 12 : 
           pathChoices.savingsFrequency === 'quarterly' ? 4 : 1);
        
        newStats.monthlyRequired = pathChoices.savingsFrequency === 'monthly' 
          ? pathChoices.savingsAmount 
          : Math.round(annualSavings / 12);
        
        newStats.timeToGoal = Math.ceil(equityNeeded / annualSavings * 10) / 10;
      } else {
        // Default calculation
        newStats.monthlyRequired = Math.round(equityNeeded / 60); // 5 years default
        newStats.timeToGoal = 5;
      }
    } 
    else if (selectedPath === 'zero-equity') {
      const baseValue = pathChoices.targetPropertyValue || 250000;
      
      newStats.estimatedPropertyValue = baseValue;
      
      if (pathChoices.financingType === '100%') {
        newStats.totalNeeded = 10000; // Closing costs only
        newStats.interestRate = 4.2;
        newStats.monthlyRequired = 1200;
        newStats.timeToGoal = 1;
      } else if (pathChoices.financingType === '90%') {
        newStats.totalNeeded = Math.round(baseValue * 0.1);
        newStats.interestRate = 3.7;
        newStats.monthlyRequired = Math.round(baseValue * 0.1 / 24); // 2 years
        newStats.timeToGoal = 2;
      } else if (pathChoices.financingType === '80%') {
        newStats.totalNeeded = Math.round(baseValue * 0.2);
        newStats.interestRate = 3.4;
        newStats.monthlyRequired = Math.round(baseValue * 0.2 / 36); // 3 years
        newStats.timeToGoal = 3;
      }
      
      if (pathChoices.familySupport === 'yes') {
        newStats.totalNeeded = Math.round(newStats.totalNeeded * 0.5); // Family helps with half
        newStats.timeToGoal = Math.ceil(newStats.timeToGoal * 0.5 * 10) / 10;
        newStats.monthlyRequired = Math.round(newStats.monthlyRequired * 0.5);
      } else if (pathChoices.familySupport === 'maybe') {
        newStats.totalNeeded = Math.round(newStats.totalNeeded * 0.75); // Family helps with 25%
        newStats.timeToGoal = Math.ceil(newStats.timeToGoal * 0.75 * 10) / 10;
        newStats.monthlyRequired = Math.round(newStats.monthlyRequired * 0.75);
      }
    }
    else if (selectedPath === 'lifestyle-match') {
      let baseValue = 350000;
      
      // Adjust for property type
      if (pathChoices.propertyType === 'apartment') {
        baseValue = 280000;
      } else if (pathChoices.propertyType === 'house') {
        baseValue = 450000;
      } else if (pathChoices.propertyType === 'townhouse') {
        baseValue = 380000;
      }
      
      // Adjust for location priority
      if (pathChoices.locationPriority === 'price') {
        baseValue *= 0.75;
      } else if (pathChoices.locationPriority === 'location') {
        baseValue *= 1.3;
      }
      
      // Adjust for lifestyle
      if (pathChoices.lifestyleMatch === 'urban') {
        baseValue *= 1.4;
      } else if (pathChoices.lifestyleMatch === 'rural') {
        baseValue *= 0.7;
      }
      
      newStats.estimatedPropertyValue = Math.round(baseValue);
      newStats.totalNeeded = Math.round(baseValue * 0.15);
      newStats.monthlyRequired = Math.round(newStats.totalNeeded / 60); // 5 years
      newStats.timeToGoal = 5;
      newStats.interestRate = 3.5;
    }

    setStatistics(newStats);
  };

  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!openQuestion.trim()) return;
    
    // Trigger the chatbot to open with this question
    const event = new CustomEvent('openChatWithMessage', { detail: openQuestion });
    window.dispatchEvent(event);
    
    // Clear the input
    setOpenQuestion('');
  };

  const updateChoice = <K extends keyof PathChoices>(key: K, value: PathChoices[K]) => {
    setPathChoices(prev => ({ ...prev, [key]: value }));
  };

  const guidePaths = [
    {
      id: 'young-professional',
      title: 'How to buy before 25',
      description: 'Get your first home while you are young - with smart strategies for early buyers',
      icon: '🚀',
      color: 'from-blue-500 to-cyan-500',
      features: ['Early savings strategies', 'Government support programs', 'Co-ownership options', 'Smart career moves'],
      bgImage: '🏡',
    },
    {
      id: 'zero-equity',
      title: 'How to buy with 0€ equity',
      description: 'Own a home without massive savings - alternative financing paths explained',
      icon: '💡',
      color: 'from-purple-500 to-pink-500',
      features: ['100% financing options', 'Family support strategies', 'Property types to target', 'Credit optimization'],
      bgImage: '💰',
    },
    {
      id: 'lifestyle-match',
      title: 'Which property fits my life?',
      description: 'Find the perfect property type based on your lifestyle, goals, and future plans',
      icon: '🎯',
      color: 'from-orange-500 to-red-500',
      features: ['Lifestyle assessment', 'Location analysis', 'Property type matching', 'Future-proof decisions'],
      bgImage: '🏠',
    },
  ];

  const handlePathSelect = (pathId: string) => {
    setSelectedPath(pathId);
    // Scroll to the detail section
    setTimeout(() => {
      document.getElementById('path-details')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <main className="flex-1 bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Decorative background elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200 rounded-full blur-3xl opacity-20 animate-breathe"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-20 animate-breathe delay-1000"></div>
          </div>

          {/* Header Content */}
          <div
            className={`text-center max-w-4xl mx-auto space-y-6 transition-all duration-1000 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-full text-[#FF6600] font-semibold text-sm mb-4">
              <span className="text-xl">🎓</span>
              <span>Your Personal Path to Homeownership</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[#1C1C1C] leading-tight">
              Personal Guide
            </h1>

            <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed">
              Get a personalized roadmap to your first home based on your unique situation, goals, and lifestyle.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Link href="/questions">
                <button className="px-8 py-4 bg-[#FF6600] text-white font-semibold text-lg rounded-full hover:bg-[#FF7A26] hover:scale-[1.02] transition-all duration-300 hover:shadow-lg hover:shadow-orange-200 flex items-center gap-2">
                  <span>Start Full Assessment</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </Link>

              <span className="text-gray-400 font-medium">or choose a quick path below</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Path Selection */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Open Question Section */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
              <div className="text-center mb-6">
                <h2 className="text-3xl sm:text-4xl font-bold text-[#1C1C1C] mb-3">
                  Have a specific question?
                </h2>
                <p className="text-lg text-gray-600">
                  Ask anything about buying your first home - our AI will understand and connect it to your personal plan
                </p>
              </div>

              <form onSubmit={handleQuestionSubmit} className="relative">
                <div className="relative">
                  <input
                    type="text"
                    value={openQuestion}
                    onChange={(e) => setOpenQuestion(e.target.value)}
                    placeholder="e.g., How much do I need to save monthly to buy in 3 years?"
                    className="w-full px-6 py-4 pr-32 text-lg rounded-full border-2 border-gray-200 focus:border-[#FF6600] focus:outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!openQuestion.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-[#FF6600] text-white font-semibold rounded-full hover:bg-[#FF7A26] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
                  >
                    <span>Ask AI</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </form>

              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setOpenQuestion("How can I afford a home with my current salary?")}
                  className="px-4 py-2 bg-white text-gray-700 text-sm rounded-full border border-gray-200 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors"
                >
                  💰 Can I afford a home?
                </button>
                <button
                  onClick={() => setOpenQuestion("What's the fastest way to save for a down payment?")}
                  className="px-4 py-2 bg-white text-gray-700 text-sm rounded-full border border-gray-200 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors"
                >
                  ⚡ Fastest way to save?
                </button>
                <button
                  onClick={() => setOpenQuestion("Should I buy or keep renting?")}
                  className="px-4 py-2 bg-white text-gray-700 text-sm rounded-full border border-gray-200 hover:border-[#FF6600] hover:text-[#FF6600] transition-colors"
                >
                  🏠 Buy vs rent?
                </button>
              </div>
            </div>
          </div>

          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1C1C1C] mb-4">
              Choose Your Path
            </h2>
            <p className="text-lg text-gray-600">
              Select the guide that matches your situation best
            </p>
          </div>

          {/* Guide Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {guidePaths.map((path, index) => (
              <div
                key={path.id}
                className={`group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer border-2 ${
                  selectedPath === path.id ? 'border-[#FF6600] scale-[1.02]' : 'border-transparent hover:scale-[1.02]'
                } ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onClick={() => handlePathSelect(path.id)}
              >
                {/* Gradient Header */}
                <div className={`relative h-48 bg-gradient-to-br ${path.color} flex items-center justify-center overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  <span className="text-8xl opacity-20 absolute">{path.bgImage}</span>
                  <span className="text-6xl relative z-10 group-hover:scale-110 transition-transform duration-300">{path.icon}</span>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <h3 className="text-2xl font-bold text-[#1C1C1C] group-hover:text-[#FF6600] transition-colors">
                    {path.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {path.description}
                  </p>

                  {/* Features List */}
                  <ul className="space-y-2 pt-2">
                    {path.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <svg className="w-5 h-5 text-[#FF6600] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button className="w-full mt-6 px-6 py-3 bg-gray-100 text-[#1C1C1C] font-semibold rounded-lg group-hover:bg-[#FF6600] group-hover:text-white transition-all duration-300 flex items-center justify-center gap-2">
                    <span>Explore this path</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Selected indicator */}
                {selectedPath === path.id && (
                  <div className="absolute top-4 right-4 bg-[#FF6600] text-white rounded-full p-2 animate-bounce">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Path Details Section - Shows when a path is selected */}
      {selectedPath && (
        <section id="path-details" className="px-4 sm:px-6 lg:px-8 pb-24">
          <div className="max-w-6xl mx-auto">
            {/* Two Column Layout: Choices + Statistics */}
            <div className="grid lg:grid-cols-3 gap-8">
              
              {/* Left Column: Personalized Steps & Choices */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                  {/* Success Message */}
                  <div className="flex items-start gap-4 mb-8 bg-green-50 border border-green-200 rounded-xl p-6">
                    <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="font-bold text-green-900 text-lg mb-1">Great choice!</h3>
                      <p className="text-green-700">
                        You selected <strong>{guidePaths.find(p => p.id === selectedPath)?.title}</strong>. 
                        Customize your plan below.
                      </p>
                    </div>
                  </div>

                  <h3 className="text-3xl font-bold text-[#1C1C1C] mb-6">Personalize Your Path</h3>
                  
                  {/* Dynamic Steps Based on Selected Path */}
                  <div className="space-y-8">
                    
                    {/* Young Professional Path */}
                    {selectedPath === 'young-professional' && (
                      <>
                        {/* Step 1: Property Type */}
                        <div className="border-l-4 border-[#FF6600] pl-6">
                          <div className="flex items-start gap-4 mb-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-[#FF6600] text-white rounded-full flex items-center justify-center font-bold">1</div>
                            <div className="flex-1">
                              <h4 className="text-xl font-bold text-[#1C1C1C] mb-2">What type of property do you want?</h4>
                              <p className="text-gray-600 mb-4">This determines your budget range</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3 ml-14">
                            {(['apartment', 'townhouse', 'house'] as const).map((type) => (
                              <button
                                key={type}
                                onClick={() => updateChoice('propertyType', type)}
                                className={`px-4 py-4 rounded-lg font-semibold transition-all ${
                                  pathChoices.propertyType === type
                                    ? 'bg-[#FF6600] text-white shadow-lg scale-105'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                <div className="text-3xl mb-2">
                                  {type === 'apartment' ? '🏢' : type === 'townhouse' ? '🏘️' : '🏠'}
                                </div>
                                <div className="text-sm capitalize">{type}</div>
                                <div className="text-xs mt-1 opacity-80">
                                  {type === 'apartment' ? '€200-300k' : type === 'townhouse' ? '€300-400k' : '€400-500k'}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Step 2: Location/Property Value Slider */}
                        {pathChoices.propertyType && (
                          <div className="border-l-4 border-blue-500 pl-6">
                            <div className="flex items-start gap-4 mb-4">
                              <div className="flex-shrink-0 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                              <div className="flex-1">
                                <h4 className="text-xl font-bold text-[#1C1C1C] mb-2">What&apos;s your target property value?</h4>
                                <p className="text-gray-600 mb-4">Adjust based on your location and preferences</p>
                              </div>
                            </div>
                            
                            <div className="ml-14 space-y-3">
                              <input
                                type="range"
                                min={pathChoices.propertyType === 'apartment' ? 200000 : pathChoices.propertyType === 'townhouse' ? 300000 : 400000}
                                max={pathChoices.propertyType === 'apartment' ? 350000 : pathChoices.propertyType === 'townhouse' ? 450000 : 600000}
                                step={10000}
                                value={pathChoices.targetPropertyValue || (pathChoices.propertyType === 'apartment' ? 250000 : pathChoices.propertyType === 'townhouse' ? 350000 : 450000)}
                                onChange={(e) => updateChoice('targetPropertyValue', Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FF6600]"
                              />
                              <div className="flex justify-between text-sm text-gray-500">
                                <span>€{(pathChoices.propertyType === 'apartment' ? 200 : pathChoices.propertyType === 'townhouse' ? 300 : 400)}k</span>
                                <span className="text-2xl font-bold text-[#FF6600]">
                                  €{((pathChoices.targetPropertyValue || (pathChoices.propertyType === 'apartment' ? 250000 : pathChoices.propertyType === 'townhouse' ? 350000 : 450000)) / 1000).toFixed(0)}k
                                </span>
                                <span>€{(pathChoices.propertyType === 'apartment' ? 350 : pathChoices.propertyType === 'townhouse' ? 450 : 600)}k</span>
                              </div>
                              <div className="text-xs text-gray-500 text-center mt-2">
                                Required equity (15%): <span className="font-bold text-[#FF6600]">€{(((pathChoices.targetPropertyValue || (pathChoices.propertyType === 'apartment' ? 250000 : pathChoices.propertyType === 'townhouse' ? 350000 : 450000)) * 0.15) / 1000).toFixed(1)}k</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Step 3: Savings Frequency */}
                        {pathChoices.targetPropertyValue && (
                          <div className="border-l-4 border-purple-500 pl-6">
                            <div className="flex items-start gap-4 mb-4">
                              <div className="flex-shrink-0 w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                              <div className="flex-1">
                                <h4 className="text-xl font-bold text-[#1C1C1C] mb-2">How do you want to save?</h4>
                                <p className="text-gray-600 mb-4">Choose your savings rhythm</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3 ml-14">
                              {(['monthly', 'quarterly', 'yearly'] as const).map((freq) => (
                                <button
                                  key={freq}
                                  onClick={() => updateChoice('savingsFrequency', freq)}
                                  className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                                    pathChoices.savingsFrequency === freq
                                      ? 'bg-purple-500 text-white shadow-lg scale-105'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Step 4: Savings Amount */}
                        {pathChoices.savingsFrequency && (
                          <div className="border-l-4 border-green-500 pl-6">
                            <div className="flex items-start gap-4 mb-4">
                              <div className="flex-shrink-0 w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">4</div>
                              <div className="flex-1">
                                <h4 className="text-xl font-bold text-[#1C1C1C] mb-2">
                                  How much can you save {pathChoices.savingsFrequency}?
                                </h4>
                                <p className="text-gray-600 mb-4">This determines your timeline</p>
                              </div>
                            </div>
                            
                            <div className="ml-14 space-y-3">
                              <input
                                type="range"
                                min={pathChoices.savingsFrequency === 'monthly' ? 200 : pathChoices.savingsFrequency === 'quarterly' ? 600 : 2400}
                                max={pathChoices.savingsFrequency === 'monthly' ? 1500 : pathChoices.savingsFrequency === 'quarterly' ? 4500 : 18000}
                                step={pathChoices.savingsFrequency === 'monthly' ? 50 : pathChoices.savingsFrequency === 'quarterly' ? 150 : 600}
                                value={pathChoices.savingsAmount || (pathChoices.savingsFrequency === 'monthly' ? 500 : pathChoices.savingsFrequency === 'quarterly' ? 1500 : 6000)}
                                onChange={(e) => updateChoice('savingsAmount', Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FF6600]"
                              />
                              <div className="flex justify-between text-sm text-gray-500">
                                <span>€{pathChoices.savingsFrequency === 'monthly' ? '200' : pathChoices.savingsFrequency === 'quarterly' ? '600' : '2,400'}</span>
                                <span className="text-2xl font-bold text-[#FF6600]">
                                  €{(pathChoices.savingsAmount || (pathChoices.savingsFrequency === 'monthly' ? 500 : pathChoices.savingsFrequency === 'quarterly' ? 1500 : 6000)).toLocaleString()}
                                </span>
                                <span>€{pathChoices.savingsFrequency === 'monthly' ? '1,500' : pathChoices.savingsFrequency === 'quarterly' ? '4,500' : '18,000'}</span>
                              </div>
                              {pathChoices.targetPropertyValue && pathChoices.savingsAmount && (
                                <div className="text-xs text-gray-500 text-center mt-2">
                                  Time to reach goal: <span className="font-bold text-green-500">
                                    {Math.ceil((pathChoices.targetPropertyValue * 0.15) / (pathChoices.savingsAmount * (pathChoices.savingsFrequency === 'monthly' ? 12 : pathChoices.savingsFrequency === 'quarterly' ? 4 : 1)) * 10) / 10} years
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Zero Equity Path */}
                    {selectedPath === 'zero-equity' && (
                      <>
                        {/* Step 1: Financing Type */}
                        <div className="border-l-4 border-[#FF6600] pl-6">
                          <div className="flex items-start gap-4 mb-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-[#FF6600] text-white rounded-full flex items-center justify-center font-bold">1</div>
                            <div className="flex-1">
                              <h4 className="text-xl font-bold text-[#1C1C1C] mb-2">Choose your financing model</h4>
                              <p className="text-gray-600 mb-4">Different down payment levels</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3 ml-14">
                            {(['100%', '90%', '80%'] as const).map((type) => (
                              <button
                                key={type}
                                onClick={() => updateChoice('financingType', type)}
                                className={`px-4 py-4 rounded-lg font-semibold transition-all ${
                                  pathChoices.financingType === type
                                    ? 'bg-[#FF6600] text-white shadow-lg scale-105'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                <div className="text-2xl font-bold mb-1">{type}</div>
                                <div className="text-xs">
                                  {type === '100%' ? 'Full financing' : type === '90%' ? '10% equity' : '20% equity'}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Step 2: Family Support */}
                        {pathChoices.financingType && (
                          <div className="border-l-4 border-blue-500 pl-6">
                            <div className="flex items-start gap-4 mb-4">
                              <div className="flex-shrink-0 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                              <div className="flex-1">
                                <h4 className="text-xl font-bold text-[#1C1C1C] mb-2">Can family help financially?</h4>
                                <p className="text-gray-600 mb-4">This can significantly reduce your timeline</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3 ml-14">
                              {(['yes', 'maybe', 'no'] as const).map((support) => (
                                <button
                                  key={support}
                                  onClick={() => updateChoice('familySupport', support)}
                                  className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                                    pathChoices.familySupport === support
                                      ? 'bg-blue-500 text-white shadow-lg scale-105'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  {support === 'yes' ? '👍 Yes' : support === 'maybe' ? '🤔 Maybe' : '👎 No'}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Step 3: Property Type */}
                        {pathChoices.familySupport && (
                          <div className="border-l-4 border-purple-500 pl-6">
                            <div className="flex items-start gap-4 mb-4">
                              <div className="flex-shrink-0 w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                              <div className="flex-1">
                                <h4 className="text-xl font-bold text-[#1C1C1C] mb-2">Target property type</h4>
                                <p className="text-gray-600 mb-4">Affects approval chances</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3 ml-14">
                              {(['apartment', 'townhouse', 'house'] as const).map((type) => (
                                <button
                                  key={type}
                                  onClick={() => updateChoice('propertyType', type)}
                                  className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                                    pathChoices.propertyType === type
                                      ? 'bg-purple-500 text-white shadow-lg scale-105'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  {type === 'apartment' ? '🏢 Apartment' : type === 'townhouse' ? '🏘️ Townhouse' : '🏠 House'}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Lifestyle Match Path */}
                    {selectedPath === 'lifestyle-match' && (
                      <>
                        {/* Step 1: Property Type */}
                        <div className="border-l-4 border-[#FF6600] pl-6">
                          <div className="flex items-start gap-4 mb-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-[#FF6600] text-white rounded-full flex items-center justify-center font-bold">1</div>
                            <div className="flex-1">
                              <h4 className="text-xl font-bold text-[#1C1C1C] mb-2">What type of property fits you?</h4>
                              <p className="text-gray-600 mb-4">This affects price and lifestyle</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3 ml-14">
                            {(['apartment', 'townhouse', 'house'] as const).map((type) => (
                              <button
                                key={type}
                                onClick={() => updateChoice('propertyType', type)}
                                className={`px-4 py-4 rounded-lg font-semibold transition-all ${
                                  pathChoices.propertyType === type
                                    ? 'bg-[#FF6600] text-white shadow-lg scale-105'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                <div className="text-3xl mb-2">
                                  {type === 'apartment' ? '🏢' : type === 'townhouse' ? '🏘️' : '🏠'}
                                </div>
                                <div className="text-sm capitalize">{type}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Step 2: Location Priority */}
                        {pathChoices.propertyType && (
                          <div className="border-l-4 border-blue-500 pl-6">
                            <div className="flex items-start gap-4 mb-4">
                              <div className="flex-shrink-0 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                              <div className="flex-1">
                                <h4 className="text-xl font-bold text-[#1C1C1C] mb-2">What matters most?</h4>
                                <p className="text-gray-600 mb-4">Price vs Location trade-off</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3 ml-14">
                              <button
                                onClick={() => updateChoice('locationPriority', 'price')}
                                className={`px-4 py-4 rounded-lg font-semibold transition-all ${
                                  pathChoices.locationPriority === 'price'
                                    ? 'bg-blue-500 text-white shadow-lg scale-105'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                <div className="text-2xl mb-1">💰</div>
                                <div className="text-sm font-bold">Best Price</div>
                                <div className="text-xs mt-1">Save money</div>
                              </button>
                              <button
                                onClick={() => updateChoice('locationPriority', 'balanced')}
                                className={`px-4 py-4 rounded-lg font-semibold transition-all ${
                                  pathChoices.locationPriority === 'balanced'
                                    ? 'bg-blue-500 text-white shadow-lg scale-105'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                <div className="text-2xl mb-1">⚖️</div>
                                <div className="text-sm font-bold">Balanced</div>
                                <div className="text-xs mt-1">Mix of both</div>
                              </button>
                              <button
                                onClick={() => updateChoice('locationPriority', 'location')}
                                className={`px-4 py-4 rounded-lg font-semibold transition-all ${
                                  pathChoices.locationPriority === 'location'
                                    ? 'bg-blue-500 text-white shadow-lg scale-105'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                <div className="text-2xl mb-1">📍</div>
                                <div className="text-sm font-bold">Prime Location</div>
                                <div className="text-xs mt-1">Best area</div>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Step 3: Lifestyle Match */}
                        {pathChoices.locationPriority && (
                          <div className="border-l-4 border-purple-500 pl-6">
                            <div className="flex items-start gap-4 mb-4">
                              <div className="flex-shrink-0 w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                              <div className="flex-1">
                                <h4 className="text-xl font-bold text-[#1C1C1C] mb-2">Your lifestyle preference?</h4>
                                <p className="text-gray-600 mb-4">Where do you see yourself?</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3 ml-14">
                              {(['urban', 'suburban', 'rural'] as const).map((lifestyle) => (
                                <button
                                  key={lifestyle}
                                  onClick={() => updateChoice('lifestyleMatch', lifestyle)}
                                  className={`px-4 py-4 rounded-lg font-semibold transition-all ${
                                    pathChoices.lifestyleMatch === lifestyle
                                      ? 'bg-purple-500 text-white shadow-lg scale-105'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  <div className="text-3xl mb-2">
                                    {lifestyle === 'urban' ? '🏙️' : lifestyle === 'suburban' ? '🏡' : '🌳'}
                                  </div>
                                  <div className="text-sm capitalize">{lifestyle}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-10 pt-8 border-t border-gray-200 flex gap-4">
                  <Link href="/questions" className="flex-1">
                    <button className="w-full px-6 py-3 bg-[#FF6600] text-white font-semibold rounded-lg hover:bg-[#FF7A26] transition-all duration-300 inline-flex items-center justify-center gap-2">
                      <span>Start Full Assessment</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  </Link>
                  <button className="px-6 py-3 bg-white text-[#1C1C1C] font-semibold rounded-lg border-2 border-gray-300 hover:border-[#FF6600] hover:text-[#FF6600] transition-all duration-300">
                    Book Consultation
                  </button>
                </div>
              </div>

              {/* Right Column: Live Statistics */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 bg-gradient-to-br from-[#FF6600] to-[#FF7A26] rounded-2xl shadow-2xl p-8 text-white">
                  <div className="flex items-center gap-2 mb-6">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    <h3 className="text-2xl font-bold">Your Plan</h3>
                  </div>

                  <div className="space-y-6">
                    {/* Property Value */}
                    <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                      <div className="text-white/80 text-sm font-medium mb-1">Estimated Property Value</div>
                      <div className="text-3xl font-bold">€{statistics.estimatedPropertyValue.toLocaleString()}</div>
                    </div>

                    {/* Equity Needed */}
                    <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                      <div className="text-white/80 text-sm font-medium mb-1">Equity Needed</div>
                      <div className="text-3xl font-bold">€{statistics.totalNeeded.toLocaleString()}</div>
                      <div className="text-white/60 text-xs mt-1">
                        {((statistics.totalNeeded / statistics.estimatedPropertyValue) * 100).toFixed(1)}% down payment
                      </div>
                    </div>

                    {/* Monthly Savings */}
                    <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                      <div className="text-white/80 text-sm font-medium mb-1">Monthly Required</div>
                      <div className="text-3xl font-bold">€{statistics.monthlyRequired.toLocaleString()}</div>
                      <div className="text-white/60 text-xs mt-1">to reach your goal</div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                      <div className="text-white/80 text-sm font-medium mb-1">Time to Goal</div>
                      <div className="text-3xl font-bold">{statistics.timeToGoal} years</div>
                      <div className="text-white/60 text-xs mt-1">
                        Ready by {new Date().getFullYear() + Math.ceil(statistics.timeToGoal)}
                      </div>
                    </div>

                    {/* Interest Rate */}
                    <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                      <div className="text-white/80 text-sm font-medium mb-1">Est. Interest Rate</div>
                      <div className="text-3xl font-bold">{statistics.interestRate}%</div>
                      <div className="text-white/60 text-xs mt-1">based on current market</div>
                    </div>
                  </div>

                  {/* Live Update Indicator */}
                  <div className="mt-6 pt-6 border-t border-white/20 flex items-center justify-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-white/80">Updates live with your choices</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* Bottom CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-[#FF6600] to-[#FF7A26] rounded-2xl p-8 sm:p-12 text-center text-white shadow-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready for Your Full Personalized Plan?
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Get exact timelines, budget breakdowns, and step-by-step guidance tailored to your situation
            </p>
            <Link href="/questions">
              <button className="px-8 py-4 bg-white text-[#FF6600] font-bold text-lg rounded-full hover:bg-gray-100 hover:scale-[1.02] transition-all duration-300 shadow-lg inline-flex items-center gap-2">
                <span>Start Your Journey</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
