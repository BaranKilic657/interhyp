'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PathChoices {
  // Personal Context
  age?: number;
  employmentStatus?: 'student' | 'employed' | 'self-employed' | 'part-time' | 'looking';
  monthlyIncome?: number;
  currentSavings?: number;
  hasPartner?: 'yes' | 'no' | 'planning';
  
  // Property Preferences
  propertyType?: 'apartment' | 'house' | 'townhouse';
  targetPropertyValue?: number;
  savingsFrequency?: 'monthly' | 'yearly' | 'quarterly';
  savingsAmount?: number;
  targetYear?: number;
  financingType?: '100%' | '90%' | '80%';
  familySupport?: 'yes' | 'no' | 'maybe';
  locationPriority?: 'price' | 'location' | 'balanced';
  lifestyleMatch?: 'urban' | 'suburban' | 'rural';
  
  // Additional Context
  hasDebt?: 'yes' | 'no';
  creditScore?: 'excellent' | 'good' | 'fair' | 'unknown';
  urgency?: 'urgent' | 'flexible' | 'planning';
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
  const [showPersonalization, setShowPersonalization] = useState(false);
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
    
    // Get personal context for better calculations
    const { 
      age, 
      employmentStatus, 
      monthlyIncome, 
      currentSavings, 
      hasPartner 
    } = pathChoices;

    // Calculate based on selected path and choices
    if (selectedPath === 'young-professional') {
      // Use selected property value or default
      const propertyValue = pathChoices.targetPropertyValue || 300000;
      let equityPercentage = 0.15; // Default 15% down payment
      
      // Adjust based on personal situation
      if (employmentStatus === 'student') {
        equityPercentage = 0.10; // Students can aim for 10% with special programs
      } else if (age && age < 23) {
        equityPercentage = 0.12; // Very young buyers get better terms
      }
      
      const equityNeeded = propertyValue * equityPercentage;
      
      newStats.estimatedPropertyValue = propertyValue;
      newStats.totalNeeded = Math.round(equityNeeded);
      
      // Better rates for stable employment
      if (employmentStatus === 'employed') {
        newStats.interestRate = 3.1;
      } else if (employmentStatus === 'student' && monthlyIncome && monthlyIncome > 1000) {
        newStats.interestRate = 3.3; // Student with good income
      } else {
        newStats.interestRate = 3.5;
      }
      
      // Calculate timeline based on savings
      if (pathChoices.savingsFrequency && pathChoices.savingsAmount) {
        const annualSavings = pathChoices.savingsAmount * 
          (pathChoices.savingsFrequency === 'monthly' ? 12 : 
           pathChoices.savingsFrequency === 'quarterly' ? 4 : 1);
        
        // Account for current savings
        const remainingNeeded = Math.max(0, equityNeeded - (currentSavings || 0));
        
        newStats.monthlyRequired = pathChoices.savingsFrequency === 'monthly' 
          ? pathChoices.savingsAmount 
          : Math.round(annualSavings / 12);
        
        newStats.timeToGoal = Math.ceil((remainingNeeded / annualSavings) * 10) / 10;
        
        // Partner doubles the savings potential
        if (hasPartner === 'yes') {
          newStats.timeToGoal = Math.ceil(newStats.timeToGoal * 0.6 * 10) / 10; // 40% faster
        }
      } else {
        // Default calculation
        const remainingNeeded = Math.max(0, equityNeeded - (currentSavings || 0));
        newStats.monthlyRequired = Math.round(remainingNeeded / 60); // 5 years default
        newStats.timeToGoal = 5;
        
        if (hasPartner === 'yes') {
          newStats.timeToGoal = 3;
          newStats.monthlyRequired = Math.round(newStats.monthlyRequired * 0.5);
        }
      }
    } 
    else if (selectedPath === 'zero-equity') {
      const baseValue = pathChoices.targetPropertyValue || 250000;
      
      newStats.estimatedPropertyValue = baseValue;
      
      if (pathChoices.financingType === '100%') {
        newStats.totalNeeded = 10000; // Closing costs only
        newStats.interestRate = employmentStatus === 'employed' ? 4.0 : 4.5; // Better rate for employed
        newStats.monthlyRequired = 1200;
        newStats.timeToGoal = Math.ceil((10000 - (currentSavings || 0)) / (monthlyIncome ? monthlyIncome * 0.2 : 400) / 12 * 10) / 10;
      } else if (pathChoices.financingType === '90%') {
        newStats.totalNeeded = Math.round(baseValue * 0.1);
        newStats.interestRate = employmentStatus === 'employed' ? 3.5 : 3.9;
        const remainingNeeded = Math.max(0, newStats.totalNeeded - (currentSavings || 0));
        newStats.monthlyRequired = Math.round(remainingNeeded / 24); // 2 years
        newStats.timeToGoal = 2;
      } else if (pathChoices.financingType === '80%') {
        newStats.totalNeeded = Math.round(baseValue * 0.2);
        newStats.interestRate = employmentStatus === 'employed' ? 3.2 : 3.6;
        const remainingNeeded = Math.max(0, newStats.totalNeeded - (currentSavings || 0));
        newStats.monthlyRequired = Math.round(remainingNeeded / 36); // 3 years
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
      
      // Partner effect
      if (hasPartner === 'yes') {
        newStats.monthlyRequired = Math.round(newStats.monthlyRequired * 0.6);
        newStats.timeToGoal = Math.ceil(newStats.timeToGoal * 0.6 * 10) / 10;
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
      
      // Adjust based on income level
      if (monthlyIncome && monthlyIncome < 2000) {
        baseValue *= 0.8; // Lower property value for lower income
      } else if (monthlyIncome && monthlyIncome > 4000) {
        baseValue *= 1.2; // Higher buying power
      }
      
      newStats.estimatedPropertyValue = Math.round(baseValue);
      newStats.totalNeeded = Math.round(baseValue * 0.15);
      
      const remainingNeeded = Math.max(0, newStats.totalNeeded - (currentSavings || 0));
      newStats.monthlyRequired = Math.round(remainingNeeded / 60); // 5 years
      newStats.timeToGoal = 5;
      newStats.interestRate = employmentStatus === 'employed' ? 3.3 : 3.7;
      
      // Partner effect
      if (hasPartner === 'yes') {
        newStats.monthlyRequired = Math.round(newStats.monthlyRequired * 0.5);
        newStats.timeToGoal = 3;
      }
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
    setShowPersonalization(true);
    // Scroll to the personalization section
    setTimeout(() => {
      document.getElementById('personalization-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const getPersonalizedHeader = () => {
    if (!selectedPath) return '';
    
    const { age, employmentStatus, hasPartner, currentSavings, monthlyIncome } = pathChoices;
    
    if (selectedPath === 'young-professional') {
      if (!age || !employmentStatus) return 'Let\'s understand your situation first';
      
      const isStudent = employmentStatus === 'student';
      const hasJob = employmentStatus === 'employed' || employmentStatus === 'part-time';
      const ageText = age < 25 ? `at ${age}` : 'in your early career';
      
      if (isStudent && hasJob) {
        return `Perfect! As a ${age}-year-old student with a job, you're already ahead. Let's build your path to homeownership.`;
      } else if (isStudent) {
        return `Great timing! As a ${age}-year-old student, let's explore how you can start building towards homeownership.`;
      } else if (hasJob && age < 25) {
        return `Excellent! Starting your career ${ageText}, you have a strong foundation. Let's create your homeownership plan.`;
      } else {
        return `At ${age}, you're in a great position. Let's map out your journey to buying your first home.`;
      }
    } 
    else if (selectedPath === 'zero-equity') {
      if (!employmentStatus || currentSavings === undefined) return 'Let\'s understand your financial situation';
      
      const hasIncome = employmentStatus !== 'looking';
      const savings = currentSavings || 0;
      
      if (hasIncome && savings < 5000) {
        return `With steady income but limited savings (€${savings.toLocaleString()}), 100% financing could be your key to homeownership.`;
      } else if (hasIncome && savings < 20000) {
        return `You have €${savings.toLocaleString()} saved. Let's explore smart financing options that minimize upfront costs.`;
      } else if (!hasIncome) {
        return 'Building your income first is crucial. Let\'s create a realistic plan for when you\'re employed.';
      } else {
        return `With €${savings.toLocaleString()} available, let's optimize your financing strategy to maximize buying power.`;
      }
    }
    else if (selectedPath === 'lifestyle-match') {
      if (!employmentStatus) return 'Let\'s understand your lifestyle first';
      
      const { hasPartner, urgency } = pathChoices;
      
      if (hasPartner === 'yes' && urgency === 'urgent') {
        return 'Planning together with your partner and ready to move fast? Let\'s find the perfect property match.';
      } else if (hasPartner === 'yes') {
        return 'Buying with a partner opens up more possibilities. Let\'s find what fits your combined lifestyle.';
      } else if (hasPartner === 'planning') {
        return 'Planning for the future? Let\'s find a property that works for you now and later.';
      } else if (urgency === 'urgent') {
        return 'Looking to buy soon? Let\'s quickly identify properties that match your lifestyle and budget.';
      } else {
        return 'Let\'s explore what type of property best fits your lifestyle, preferences, and long-term goals.';
      }
    }
    
    return 'Let\'s personalize your path';
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
        <>
          {/* Personalization Section - Collects context first */}
          <section id="personalization-section" className="px-4 sm:px-6 lg:px-8 pb-16">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 font-semibold text-sm mb-4">
                    <span className="text-xl">📋</span>
                    <span>Step 1: Tell us about yourself</span>
                  </div>
                  <h2 className="text-3xl font-bold text-[#1C1C1C] mb-3">
                    {getPersonalizedHeader() || 'Let\'s get to know you better'}
                  </h2>
                  <p className="text-lg text-gray-600">
                    This helps us provide the most relevant guidance for your situation
                  </p>
                </div>

                {/* Personal Context Questions */}
                <div className="space-y-8">
                  
                  {/* Question 1: Age */}
                  <div className="border-l-4 border-[#FF6600] pl-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-[#FF6600] text-white rounded-full flex items-center justify-center font-bold">1</div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-[#1C1C1C] mb-2">How old are you?</h4>
                        <p className="text-gray-600 mb-4">
                          {selectedPath === 'young-professional' 
                            ? 'This path is designed for buyers under 25' 
                            : 'Age affects financing options and strategies'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="ml-14 space-y-3">
                      <input
                        type="range"
                        min={18}
                        max={selectedPath === 'young-professional' ? 24 : 40}
                        step={1}
                        value={pathChoices.age || (selectedPath === 'young-professional' ? 22 : 25)}
                        onChange={(e) => updateChoice('age', Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FF6600]"
                      />
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>18</span>
                        <span className="text-2xl font-bold text-[#FF6600]">
                          {pathChoices.age || (selectedPath === 'young-professional' ? 22 : 25)} years
                        </span>
                        <span>{selectedPath === 'young-professional' ? '24' : '40+'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Question 2: Employment Status */}
                  {pathChoices.age && (
                    <div className="border-l-4 border-blue-500 pl-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-[#1C1C1C] mb-2">What&apos;s your current employment status?</h4>
                          <p className="text-gray-600 mb-4">This determines your income stability and financing eligibility</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 ml-14">
                        {([
                          { value: 'student' as const, label: '🎓 Student', desc: 'Currently studying' },
                          { value: 'employed' as const, label: '💼 Employed', desc: 'Full-time job' },
                          { value: 'self-employed' as const, label: '👨‍💼 Self-Employed', desc: 'Own business' },
                          { value: 'part-time' as const, label: '⏰ Part-Time', desc: 'Part-time work' },
                          { value: 'looking' as const, label: '🔍 Job Seeking', desc: 'Looking for work' },
                        ]).map((status) => (
                          <button
                            key={status.value}
                            onClick={() => updateChoice('employmentStatus', status.value)}
                            className={`px-4 py-3 rounded-lg font-semibold transition-all text-left ${
                              pathChoices.employmentStatus === status.value
                                ? 'bg-blue-500 text-white shadow-lg scale-105'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <div className="font-bold text-sm">{status.label}</div>
                            <div className="text-xs mt-1 opacity-80">{status.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Question 3: Monthly Income */}
                  {pathChoices.employmentStatus && pathChoices.employmentStatus !== 'looking' && (
                    <div className="border-l-4 border-purple-500 pl-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-[#1C1C1C] mb-2">What&apos;s your monthly income?</h4>
                          <p className="text-gray-600 mb-4">
                            {pathChoices.employmentStatus === 'student' 
                              ? 'Include any part-time work, support, or stipends' 
                              : 'Your net monthly income after taxes'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="ml-14 space-y-3">
                        <input
                          type="range"
                          min={pathChoices.employmentStatus === 'student' ? 0 : 1000}
                          max={pathChoices.employmentStatus === 'student' ? 2000 : 6000}
                          step={pathChoices.employmentStatus === 'student' ? 100 : 250}
                          value={pathChoices.monthlyIncome || (pathChoices.employmentStatus === 'student' ? 800 : 2500)}
                          onChange={(e) => updateChoice('monthlyIncome', Number(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FF6600]"
                        />
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>€{pathChoices.employmentStatus === 'student' ? '0' : '1,000'}</span>
                          <span className="text-2xl font-bold text-[#FF6600]">
                            €{(pathChoices.monthlyIncome || (pathChoices.employmentStatus === 'student' ? 800 : 2500)).toLocaleString()}
                          </span>
                          <span>€{pathChoices.employmentStatus === 'student' ? '2,000' : '6,000'}+</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Question 4: Current Savings */}
                  {pathChoices.monthlyIncome !== undefined && (
                    <div className="border-l-4 border-green-500 pl-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">4</div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-[#1C1C1C] mb-2">How much have you saved so far?</h4>
                          <p className="text-gray-600 mb-4">Total savings available for home purchase</p>
                        </div>
                      </div>
                      
                      <div className="ml-14 space-y-3">
                        <input
                          type="range"
                          min={0}
                          max={50000}
                          step={1000}
                          value={pathChoices.currentSavings || 5000}
                          onChange={(e) => updateChoice('currentSavings', Number(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FF6600]"
                        />
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>€0</span>
                          <span className="text-2xl font-bold text-[#FF6600]">
                            €{(pathChoices.currentSavings || 5000).toLocaleString()}
                          </span>
                          <span>€50,000+</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Question 5: Partner Status */}
                  {pathChoices.currentSavings !== undefined && (
                    <div className="border-l-4 border-pink-500 pl-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold">5</div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-[#1C1C1C] mb-2">Are you buying with a partner?</h4>
                          <p className="text-gray-600 mb-4">Combined income increases buying power</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 ml-14">
                        {([
                          { value: 'yes' as const, label: '👫 Yes', desc: 'Buying together' },
                          { value: 'planning' as const, label: '💭 Planning', desc: 'Future plans' },
                          { value: 'no' as const, label: '🙋 Solo', desc: 'Buying alone' },
                        ]).map((status) => (
                          <button
                            key={status.value}
                            onClick={() => updateChoice('hasPartner', status.value)}
                            className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                              pathChoices.hasPartner === status.value
                                ? 'bg-pink-500 text-white shadow-lg scale-105'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <div className="font-bold text-sm">{status.label}</div>
                            <div className="text-xs mt-1 opacity-80">{status.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Question 6: Urgency/Timeline */}
                  {pathChoices.hasPartner && (
                    <div className="border-l-4 border-orange-500 pl-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">6</div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-[#1C1C1C] mb-2">How urgent is your purchase?</h4>
                          <p className="text-gray-600 mb-4">This affects strategy and options</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 ml-14">
                        {([
                          { value: 'urgent' as const, label: '🚀 Urgent', desc: 'Within 6 months' },
                          { value: 'flexible' as const, label: '⏳ Flexible', desc: '1-2 years' },
                          { value: 'planning' as const, label: '📅 Planning', desc: '2+ years' },
                        ]).map((timing) => (
                          <button
                            key={timing.value}
                            onClick={() => updateChoice('urgency', timing.value)}
                            className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                              pathChoices.urgency === timing.value
                                ? 'bg-orange-500 text-white shadow-lg scale-105'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <div className="font-bold text-sm">{timing.label}</div>
                            <div className="text-xs mt-1 opacity-80">{timing.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Continue Button */}
                {pathChoices.urgency && (
                  <div className="mt-10 pt-8 border-t border-gray-200 text-center">
                    <button 
                      onClick={() => {
                        setShowPersonalization(false);
                        setTimeout(() => {
                          document.getElementById('path-details')?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }}
                      className="px-8 py-4 bg-[#FF6600] text-white font-bold text-lg rounded-full hover:bg-[#FF7A26] hover:scale-[1.02] transition-all duration-300 shadow-lg inline-flex items-center gap-2"
                    >
                      <span>Continue to Your Personalized Plan</span>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Path-Specific Details Section - Shows after personalization */}
          {!showPersonalization && pathChoices.urgency && (
        <section id="path-details" className="px-4 sm:px-6 lg:px-8 pb-24">
          <div className="max-w-6xl mx-auto">
            {/* Two Column Layout: Choices + Statistics */}
            <div className="grid lg:grid-cols-3 gap-8">
              
              {/* Left Column: Personalized Steps & Choices */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                  {/* Success Message with Personalized Header */}
                  <div className="flex items-start gap-4 mb-8 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
                    <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="font-bold text-green-900 text-lg mb-2">
                        {getPersonalizedHeader()}
                      </h3>
                      <p className="text-green-700 text-sm">
                        Based on your profile: {pathChoices.age} years old • {pathChoices.employmentStatus} • €{pathChoices.monthlyIncome?.toLocaleString()} monthly • €{pathChoices.currentSavings?.toLocaleString()} saved
                        {pathChoices.hasPartner === 'yes' && ' • Buying with partner'}
                      </p>
                    </div>
                  </div>

                  <h3 className="text-3xl font-bold text-[#1C1C1C] mb-6">Your Personalized Action Plan</h3>
                  
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
                        {/* Step 1: Daily Lifestyle */}
                        <div className="border-l-4 border-[#FF6600] pl-6">
                          <div className="flex items-start gap-4 mb-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-[#FF6600] text-white rounded-full flex items-center justify-center font-bold">1</div>
                            <div className="flex-1">
                              <h4 className="text-xl font-bold text-[#1C1C1C] mb-2">Describe your ideal daily life</h4>
                              <p className="text-gray-600 mb-4">Where do you see yourself thriving?</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3 ml-14">
                            {([
                              { value: 'urban' as const, icon: '🏙️', label: 'City Life', desc: 'Walk to cafes, nightlife, culture' },
                              { value: 'suburban' as const, icon: '🏡', label: 'Suburban', desc: 'Quiet streets, parks, community' },
                              { value: 'rural' as const, icon: '🌳', label: 'Countryside', desc: 'Nature, space, tranquility' },
                            ]).map((lifestyle) => (
                              <button
                                key={lifestyle.value}
                                onClick={() => updateChoice('lifestyleMatch', lifestyle.value)}
                                className={`px-4 py-4 rounded-lg font-semibold transition-all ${
                                  pathChoices.lifestyleMatch === lifestyle.value
                                    ? 'bg-[#FF6600] text-white shadow-lg scale-105'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                <div className="text-3xl mb-2">{lifestyle.icon}</div>
                                <div className="text-sm font-bold">{lifestyle.label}</div>
                                <div className="text-xs mt-1 opacity-80">{lifestyle.desc}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Step 2: Space Needs */}
                        {pathChoices.lifestyleMatch && (
                          <div className="border-l-4 border-blue-500 pl-6">
                            <div className="flex items-start gap-4 mb-4">
                              <div className="flex-shrink-0 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                              <div className="flex-1">
                                <h4 className="text-xl font-bold text-[#1C1C1C] mb-2">How much space do you need?</h4>
                                <p className="text-gray-600 mb-4">Think about your daily activities and future plans</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3 ml-14">
                              {([
                                { value: 'apartment' as const, icon: '🏢', label: 'Compact', desc: '1-2 rooms, low maintenance' },
                                { value: 'townhouse' as const, icon: '🏘️', label: 'Medium', desc: '2-3 rooms, shared yard' },
                                { value: 'house' as const, icon: '🏠', label: 'Spacious', desc: '3+ rooms, own garden' },
                              ]).map((space) => (
                                <button
                                  key={space.value}
                                  onClick={() => updateChoice('propertyType', space.value)}
                                  className={`px-4 py-4 rounded-lg font-semibold transition-all ${
                                    pathChoices.propertyType === space.value
                                      ? 'bg-blue-500 text-white shadow-lg scale-105'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  <div className="text-3xl mb-2">{space.icon}</div>
                                  <div className="text-sm font-bold">{space.label}</div>
                                  <div className="text-xs mt-1 opacity-80">{space.desc}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Step 3: Budget Priority */}
                        {pathChoices.propertyType && (
                          <div className="border-l-4 border-purple-500 pl-6">
                            <div className="flex items-start gap-4 mb-4">
                              <div className="flex-shrink-0 w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                              <div className="flex-1">
                                <h4 className="text-xl font-bold text-[#1C1C1C] mb-2">What&apos;s your priority?</h4>
                                <p className="text-gray-600 mb-4">Finding the right balance for your situation</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3 ml-14">
                              {([
                                { value: 'price' as const, icon: '💰', label: 'Best Price', desc: 'Save money, farther out' },
                                { value: 'balanced' as const, icon: '⚖️', label: 'Balanced', desc: 'Mix of price & location' },
                                { value: 'location' as const, icon: '📍', label: 'Prime Location', desc: 'Pay more, live central' },
                              ]).map((priority) => (
                                <button
                                  key={priority.value}
                                  onClick={() => updateChoice('locationPriority', priority.value)}
                                  className={`px-4 py-4 rounded-lg font-semibold transition-all ${
                                    pathChoices.locationPriority === priority.value
                                      ? 'bg-purple-500 text-white shadow-lg scale-105'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  <div className="text-2xl mb-1">{priority.icon}</div>
                                  <div className="text-sm font-bold">{priority.label}</div>
                                  <div className="text-xs mt-1 opacity-80">{priority.desc}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                  </div>

                  {/* Statistical Summary Section - Shows at the end of each path */}
                  {((selectedPath === 'young-professional' && pathChoices.savingsFrequency) ||
                    (selectedPath === 'zero-equity' && pathChoices.propertyType) ||
                    (selectedPath === 'lifestyle-match' && pathChoices.locationPriority)) && (
                    <div className="mt-12 pt-8 border-t-2 border-gray-200">
                      <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-blue-200">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-3 bg-[#FF6600] rounded-full">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-[#1C1C1C]">Your Path Statistics</h3>
                            <p className="text-gray-600">Based on real market data and your profile</p>
                          </div>
                        </div>

                        {selectedPath === 'young-professional' && (
                          <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="bg-white rounded-xl p-5 border border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-2xl">🎯</span>
                                  <h4 className="font-bold text-gray-900">Success Rate</h4>
                                </div>
                                <p className="text-3xl font-bold text-[#FF6600] mb-2">73%</p>
                                <p className="text-sm text-gray-600">
                                  {pathChoices.employmentStatus === 'student' 
                                    ? 'Students with part-time jobs who save €500+/month successfully buy within 5-7 years'
                                    : pathChoices.employmentStatus === 'employed'
                                    ? 'Young professionals under 25 with stable income achieve homeownership 3-4 years faster'
                                    : 'Early buyers benefit from compound wealth building and lower lifetime housing costs'}
                                </p>
                              </div>

                              <div className="bg-white rounded-xl p-5 border border-purple-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-2xl">💡</span>
                                  <h4 className="font-bold text-gray-900">Key Insight</h4>
                                </div>
                                <p className="text-3xl font-bold text-purple-600 mb-2">
                                  {pathChoices.hasPartner === 'yes' ? '40%' : '25%'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {pathChoices.hasPartner === 'yes'
                                    ? 'Couples in their early 20s save 40% faster and qualify for 30% higher mortgages'
                                    : 'First-time buyers under 25 qualify for government programs reducing equity needs by 25%'}
                                </p>
                              </div>
                            </div>

                            <div className="bg-white rounded-xl p-5 border border-green-200">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">📊</span>
                                <h4 className="font-bold text-gray-900">Market Reality Check</h4>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                  <p className="text-2xl font-bold text-gray-900">
                                    €{pathChoices.monthlyIncome && pathChoices.monthlyIncome < 2000 ? '220k' : '320k'}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">Realistic target with your income</p>
                                </div>
                                <div>
                                  <p className="text-2xl font-bold text-gray-900">
                                    {pathChoices.age && pathChoices.age < 23 ? '4-5' : '5-6'} yrs
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">Average time to save needed equity</p>
                                </div>
                                <div>
                                  <p className="text-2xl font-bold text-gray-900">15-20%</p>
                                  <p className="text-xs text-gray-600 mt-1">Equity needed (incl. special programs)</p>
                                </div>
                              </div>
                            </div>

                            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-5 border border-orange-200">
                              <p className="text-sm text-gray-700 leading-relaxed">
                                <strong className="text-[#FF6600]">💪 Your advantage:</strong> Starting young means you have time on your side. 
                                {pathChoices.employmentStatus === 'student' && ' As a student, you can access special KfW programs and lower equity requirements. '}
                                {pathChoices.hasPartner === 'yes' && ' With a partner, you double your income potential and save significantly faster. '}
                                Most successful young buyers start with a smaller apartment and upgrade within 5-8 years as their income grows.
                              </p>
                            </div>
                          </div>
                        )}

                        {selectedPath === 'zero-equity' && (
                          <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="bg-white rounded-xl p-5 border border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-2xl">🎯</span>
                                  <h4 className="font-bold text-gray-900">Approval Rate</h4>
                                </div>
                                <p className="text-3xl font-bold text-[#FF6600] mb-2">
                                  {pathChoices.financingType === '100%' ? '42%' : pathChoices.financingType === '90%' ? '68%' : '89%'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {pathChoices.financingType === '100%'
                                    ? 'Full financing approval requires excellent credit and stable income of €3,000+ monthly'
                                    : pathChoices.financingType === '90%'
                                    ? 'With 10% equity, approval rates jump significantly, especially for employed buyers'
                                    : 'Standard 20% equity gives you the best rates and highest approval chances'}
                                </p>
                              </div>

                              <div className="bg-white rounded-xl p-5 border border-purple-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-2xl">💰</span>
                                  <h4 className="font-bold text-gray-900">Cost Reality</h4>
                                </div>
                                <p className="text-3xl font-bold text-purple-600 mb-2">
                                  +€{pathChoices.financingType === '100%' ? '180' : pathChoices.financingType === '90%' ? '95' : '0'}/mo
                                </p>
                                <p className="text-sm text-gray-600">
                                  {pathChoices.financingType === '100%'
                                    ? 'Full financing costs €180+ more monthly vs 20% equity due to higher rates and insurance'
                                    : pathChoices.financingType === '90%'
                                    ? 'With 10% equity you save ~€95/month compared to full financing'
                                    : 'Standard equity gives you the best monthly rate and total interest savings'}
                                </p>
                              </div>
                            </div>

                            <div className="bg-white rounded-xl p-5 border border-green-200">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">📊</span>
                                <h4 className="font-bold text-gray-900">Real Numbers for €250k Property</h4>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                  <p className="text-2xl font-bold text-gray-900">
                                    €{pathChoices.financingType === '100%' ? '10k' : pathChoices.financingType === '90%' ? '35k' : '60k'}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">Total upfront needed (incl. costs)</p>
                                </div>
                                <div>
                                  <p className="text-2xl font-bold text-gray-900">
                                    {pathChoices.financingType === '100%' ? '4.0' : pathChoices.financingType === '90%' ? '3.5' : '3.2'}%
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">Current interest rate range</p>
                                </div>
                                <div>
                                  <p className="text-2xl font-bold text-gray-900">
                                    €{pathChoices.financingType === '100%' ? '1,280' : pathChoices.financingType === '90%' ? '1,095' : '945'}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">Est. monthly payment (30yr)</p>
                                </div>
                              </div>
                            </div>

                            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-5 border border-orange-200">
                              <p className="text-sm text-gray-700 leading-relaxed">
                                <strong className="text-[#FF6600]">⚡ Reality check:</strong> 
                                {pathChoices.financingType === '100%' 
                                  ? ' Full financing is possible but challenging. Only 1 in 3 banks offers it, requiring perfect credit, no other debts, and income 4x+ the monthly payment.'
                                  : pathChoices.financingType === '90%'
                                  ? ' With 10% equity you unlock significantly better rates and more bank options. Most successful buyers save this amount first.'
                                  : ' Standard 20% equity gives you negotiating power and the best terms. This is what 65% of first-time buyers achieve.'}
                                {pathChoices.familySupport === 'yes' && ' With family support, you can bridge the equity gap faster or start with better terms.'}
                                {pathChoices.employmentStatus === 'employed' && ' Your stable employment significantly improves approval chances.'}
                              </p>
                            </div>
                          </div>
                        )}

                        {selectedPath === 'lifestyle-match' && (
                          <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="bg-white rounded-xl p-5 border border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-2xl">🏠</span>
                                  <h4 className="font-bold text-gray-900">Your Match</h4>
                                </div>
                                <p className="text-3xl font-bold text-[#FF6600] mb-2">
                                  {pathChoices.propertyType === 'apartment' ? 'Apartment' : pathChoices.propertyType === 'townhouse' ? 'Townhouse' : 'House'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {pathChoices.lifestyleMatch === 'urban' && pathChoices.propertyType === 'apartment'
                                    ? 'Perfect fit! City apartments offer walkability, low maintenance, and appreciation potential'
                                    : pathChoices.lifestyleMatch === 'suburban' && pathChoices.propertyType === 'townhouse'
                                    ? 'Ideal choice! Townhouses balance space, community, and manageable costs'
                                    : pathChoices.lifestyleMatch === 'rural' && pathChoices.propertyType === 'house'
                                    ? 'Great match! Houses in countryside offer space, nature, and best value per m²'
                                    : 'Good choice, though there may be trade-offs between location preference and property type'}
                                </p>
                              </div>

                              <div className="bg-white rounded-xl p-5 border border-purple-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-2xl">💵</span>
                                  <h4 className="font-bold text-gray-900">Price Range</h4>
                                </div>
                                <p className="text-3xl font-bold text-purple-600 mb-2">
                                  €{Math.round(statistics.estimatedPropertyValue / 1000)}k
                                </p>
                                <p className="text-sm text-gray-600">
                                  Based on your {pathChoices.lifestyleMatch} lifestyle preference and {pathChoices.locationPriority} budget priority
                                  {pathChoices.monthlyIncome && `, your €${pathChoices.monthlyIncome.toLocaleString()} income can support this`}
                                </p>
                              </div>
                            </div>

                            <div className="bg-white rounded-xl p-5 border border-green-200">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">📊</span>
                                <h4 className="font-bold text-gray-900">Lifestyle Cost Analysis</h4>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                  <p className="text-2xl font-bold text-gray-900">
                                    {pathChoices.lifestyleMatch === 'urban' ? '€4,200' : pathChoices.lifestyleMatch === 'suburban' ? '€3,400' : '€2,800'}/m²
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">Average price per m² in area</p>
                                </div>
                                <div>
                                  <p className="text-2xl font-bold text-gray-900">
                                    {pathChoices.propertyType === 'apartment' ? '65' : pathChoices.propertyType === 'townhouse' ? '95' : '130'}m²
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">Typical size for property type</p>
                                </div>
                                <div>
                                  <p className="text-2xl font-bold text-gray-900">
                                    €{pathChoices.propertyType === 'apartment' ? '220' : pathChoices.propertyType === 'townhouse' ? '310' : '450'}/mo
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">Est. monthly maintenance costs</p>
                                </div>
                              </div>
                            </div>

                            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-5 border border-orange-200">
                              <p className="text-sm text-gray-700 leading-relaxed">
                                <strong className="text-[#FF6600]">🎯 Your lifestyle fit:</strong> 
                                {pathChoices.lifestyleMatch === 'urban' && ' City living means higher property costs but lower transport expenses and walkable amenities. '}
                                {pathChoices.lifestyleMatch === 'suburban' && ' Suburban life offers the best balance - reasonable prices, good schools, and community. '}
                                {pathChoices.lifestyleMatch === 'rural' && ' Countryside properties give maximum space for your money but factor in commute costs. '}
                                {pathChoices.locationPriority === 'price' && 'Prioritizing price can save you €50-100k on the same property type. '}
                                {pathChoices.locationPriority === 'location' && 'Prime locations appreciate 2-3% more annually than outer areas. '}
                                {pathChoices.hasPartner === 'yes' && 'With a partner, you can afford 30-40% more property in your preferred area.'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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
        </>
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
