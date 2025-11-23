import { NextRequest, NextResponse } from 'next/server';
import type { RouteGenerationRequest, RouteGenerationResponse, PersonalizedRoute, ActionStep, Milestone, RiskFlag, FinancialProjection, NeighborhoodAlternative } from '../../types/routes';

export async function POST(request: NextRequest) {
  try {
    const data: RouteGenerationRequest = await request.json();
    const { userProfile, selectedProperty, budgetCalculation, questionAnswers } = data;

    console.log('=== ROUTE GENERATION API CALLED ===');
    console.log('User Profile:', userProfile);
    console.log('Selected Property:', selectedProperty?.title);
    console.log('Budget Calculation:', budgetCalculation);

    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    
    if (!GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Extract key information
    const propertyPrice = selectedProperty.buyingPrice || 
                         selectedProperty.aggregations?.similarListing?.buyingPrice || 
                         (selectedProperty.spPricePerSqm && selectedProperty.squareMeter ? 
                          selectedProperty.spPricePerSqm * selectedProperty.squareMeter : 0);
    
    const currentYear = new Date().getFullYear();
    const age = userProfile.age || 30;
    const income = budgetCalculation?.monthlyPayment ? budgetCalculation.monthlyPayment * 3 : userProfile.monthlyIncome || 4000;
    const equity = userProfile.existingEquity || budgetCalculation?.existingEquity || 0;
    const familySize = userProfile.familySize || '2';
    const location = userProfile.location || selectedProperty.address.city;

    // Prepare comprehensive context for LLM
    const budgetInfo = budgetCalculation ? `
BUDGET CALCULATION:
- Max Purchase Price: €${budgetCalculation.maxPurchasePrice?.toLocaleString() || 'N/A'}
- Monthly Payment: €${budgetCalculation.monthlyPayment?.toLocaleString() || 'N/A'}
- Loan Amount: €${budgetCalculation.loanAmount?.toLocaleString() || 'N/A'}
- Interest Rate: ${budgetCalculation.interestRate?.toFixed(2) || '4.0'}%
- Equity Percentage: ${budgetCalculation.equityPercentage?.toFixed(1) || '20'}%
- Risk Level: ${budgetCalculation.riskLevel || 'Moderate'}` : '';
    
    const contextPrompt = `You are an expert housing finance advisor creating personalized homeownership roadmaps.

USER CONTEXT:
- Age: ${age} years old
- Gender: ${userProfile.gender || 'not specified'}
- Occupation: ${userProfile.occupation || 'professional'}
- Monthly Income: €${income.toLocaleString()}
- Current Equity/Savings: €${equity.toLocaleString()}
- Family Size: ${familySize}
- Timeline Preference: ${userProfile.timeline || 'flexible'}
- Location: ${location}

SELECTED PROPERTY:
- Title: ${selectedProperty.title}
- Price: €${propertyPrice.toLocaleString()}
- Size: ${selectedProperty.squareMeter}m², ${selectedProperty.rooms} rooms
- Location: ${selectedProperty.address.city}, ${selectedProperty.address.postcode}
- Price per m²: €${(propertyPrice / selectedProperty.squareMeter).toFixed(0)}

${budgetInfo}

TASK: Generate 5 distinct, personalized routes to homeownership. Each route should be realistic, data-driven, and tailored to this specific person and property.`;

    // Generate multiple routes using different LLM calls for different perspectives
    const routePromises = [
      generateFastTrackRoute(contextPrompt, GOOGLE_API_KEY, propertyPrice, equity, income, currentYear, userProfile),
      generateBalancedRoute(contextPrompt, GOOGLE_API_KEY, propertyPrice, equity, income, currentYear, userProfile),
      generateConservativeRoute(contextPrompt, GOOGLE_API_KEY, propertyPrice, equity, income, currentYear, userProfile),
    ];

    const routeResults = await Promise.allSettled(routePromises);
    
    // Filter successful results
    const routes: PersonalizedRoute[] = routeResults
      .filter((result): result is PromiseFulfilledResult<PersonalizedRoute> => result.status === 'fulfilled')
      .map(result => result.value);

    if (routes.length === 0) {
      throw new Error('Failed to generate any routes');
    }

    // Determine recommended route based on user profile and risk tolerance
    const recommendedRouteId = determineRecommendedRoute(routes, userProfile, budgetCalculation);

    // Generate summary using LLM
    const summary = await generateSummary(routes, userProfile, GOOGLE_API_KEY);

    const response: RouteGenerationResponse = {
      routes,
      summary,
      recommendedRouteId,
      generatedAt: new Date().toISOString(),
      considerations: [
        'These routes are personalized based on your profile and selected property',
        'Financial projections assume stable market conditions',
        'Consult with a financial advisor before making final decisions',
        'Interest rates and market conditions may change',
      ],
    };

    console.log('=== ROUTES GENERATED SUCCESSFULLY ===');
    console.log('Number of routes:', routes.length);
    console.log('Recommended route:', recommendedRouteId);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Route generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate routes', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Helper function to call Gemini API
async function callGeminiAPI(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// Generate personalized insights based on route and user profile
async function generatePersonalizedInsights(
  routeType: string,
  userProfile: any,
  propertyPrice: number,
  equity: number,
  income: number,
  apiKey: string
): Promise<string[]> {
  const prompt = `You are a financial advisor providing personalized insights.

USER CONTEXT:
- Age: ${userProfile.age || 30}
- Occupation: ${userProfile.occupation || 'professional'}
- Monthly Income: €${income.toLocaleString()}
- Current Savings: €${equity.toLocaleString()}
- Target Property Price: €${propertyPrice.toLocaleString()}

ROUTE TYPE: ${routeType}

Generate 4-5 highly personalized, specific insights for this person's ${routeType} route to homeownership. Each insight should:
- Be specific to their situation (age, income, savings, property price)
- Provide actionable advice
- Be encouraging but realistic
- Reference concrete numbers where relevant

Return ONLY a JSON array of strings (no markdown, no code blocks):
["insight 1", "insight 2", "insight 3", "insight 4"]`;

  try {
    const response = await callGeminiAPI(prompt, apiKey);
    const jsonMatch = response.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Failed to generate insights:', error);
  }
  
  // Fallback insights
  return [
    `With your ${routeType} approach, you're taking a smart path toward homeownership`,
    `Your monthly income of €${income.toLocaleString()} provides a solid foundation for this journey`,
    `Starting with €${equity.toLocaleString()} in savings gives you a strong head start`,
    `This route is tailored to your financial situation and goals`
  ];
}

// Generate key tradeoffs for the route
async function generateKeyTradeoffs(
  routeType: string,
  targetYears: number,
  downPaymentPercentage: number,
  monthlySavings: number,
  apiKey: string
): Promise<string[]> {
  const prompt = `You are a financial advisor explaining tradeoffs.

ROUTE DETAILS:
- Route Type: ${routeType}
- Timeline: ${targetYears} years
- Down Payment: ${downPaymentPercentage}%
- Monthly Savings Required: €${monthlySavings.toLocaleString()}

Generate 3-4 key tradeoffs for this ${routeType} route. Each tradeoff should:
- Clearly state what they're giving up or risking
- Explain what they gain in return
- Be specific to the timeline and financial requirements
- Be honest about the challenges

Return ONLY a JSON array of strings (no markdown, no code blocks):
["tradeoff 1", "tradeoff 2", "tradeoff 3"]`;

  try {
    const response = await callGeminiAPI(prompt, apiKey);
    const jsonMatch = response.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Failed to generate tradeoffs:', error);
  }
  
  // Fallback tradeoffs based on route type
  if (routeType === 'fast-track') {
    return [
      'Higher monthly savings (€' + monthlySavings.toLocaleString() + ') means less disposable income for entertainment and luxury items',
      'Lower down payment (' + downPaymentPercentage + '%) results in higher monthly mortgage payments and more interest paid over time',
      'Aggressive ' + targetYears + '-year timeline requires disciplined budgeting and may limit spontaneous expenses'
    ];
  } else if (routeType === 'balanced') {
    return [
      'Moderate savings rate balances lifestyle and goals, but extends timeline to ' + targetYears + ' years',
      downPaymentPercentage + '% down payment requires sustained discipline but reduces long-term interest costs',
      'Steady pace maintains quality of life but delays homeownership compared to aggressive approaches'
    ];
  } else {
    return [
      'Longer ' + targetYears + '-year timeline provides maximum financial security but delays homeownership',
      'Higher down payment (' + downPaymentPercentage + '%) minimizes risk but requires extended saving period',
      'Conservative approach protects against market volatility but may miss opportune buying windows'
    ];
  }
}

// Generate Fast-Track Route
async function generateFastTrackRoute(
  context: string,
  apiKey: string,
  propertyPrice: number,
  equity: number,
  income: number,
  currentYear: number,
  userProfile: any
): Promise<PersonalizedRoute> {
  const prompt = `${context}

Generate a FAST-TRACK route for this person. This is the aggressive, ambitious path.

REQUIREMENTS:
- Target purchase within 1-2 years
- Higher risk tolerance
- Aggressive savings rate (40-50% of income)
- May involve lifestyle sacrifices
- Lower down payment (15-20%)
- Focus on quick action

Return ONLY a valid JSON object (no markdown, no code blocks) with this EXACT structure:
{
  "targetPurchaseYear": number,
  "requiredEquity": number,
  "monthlyPayment": number,
  "monthlySavingsRequired": number,
  "downPaymentPercentage": number,
  "riskScore": number (0-100),
  "riskLevel": "high",
  "actionSteps": [
    {
      "id": "step1",
      "title": "string",
      "description": "string",
      "timeline": "string",
      "priority": "high"|"medium"|"low",
      "category": "financial"|"lifestyle"|"education"|"preparation"
    }
  ],
  "riskFlags": [
    {
      "type": "warning"|"caution"|"opportunity",
      "title": "string",
      "description": "string",
      "impact": "high"|"medium"|"low",
      "mitigation": "string"
    }
  ],
  "futureSelfNarrative": "A vivid, personal 3-4 sentence story of this person's life in their new home. Make it emotional, specific, and inspiring. Include details about their daily life, family, and happiness.",
  "lifestyleImpact": "string"
}`;

  const response = await callGeminiAPI(prompt, apiKey);
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid JSON response from API');
  }
  
  const data = JSON.parse(jsonMatch[0]);
  
  // Calculate precise financial values
  const targetYear = currentYear + 2;
  const monthsToSave = (targetYear - currentYear) * 12;
  const requiredEquity = Math.round(propertyPrice * 0.15);
  const equityGap = Math.max(0, requiredEquity - equity);
  const monthlySavingsRequired = Math.round(equityGap / monthsToSave);
  const loanAmount = propertyPrice - requiredEquity;
  const monthlyInterestRate = 0.045 / 12;
  const loanTermMonths = 25 * 12;
  const monthlyPayment = Math.round(
    loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, loanTermMonths)) / 
    (Math.pow(1 + monthlyInterestRate, loanTermMonths) - 1)
  );
  
  // Generate personalized content with additional LLM calls
  const personalizedInsights = await generatePersonalizedInsights(
    'fast-track',
    userProfile,
    propertyPrice,
    equity,
    income,
    apiKey
  );
  
  const keyTradeoffs = await generateKeyTradeoffs(
    'fast-track',
    2,
    15,
    monthlySavingsRequired,
    apiKey
  );
  
  return {
    id: 'fast-track',
    name: 'Fast-Track Route',
    type: 'fast-track',
    description: 'Aggressive timeline with focused sacrifices and high savings rate',
    tagline: '⚡ Own your home in record time',
    targetPurchaseYear: targetYear,
    monthsUntilPurchase: monthsToSave,
    requiredEquity: requiredEquity,
    monthlyPayment: monthlyPayment,
    totalCost: propertyPrice,
    riskScore: data.riskScore || 80,
    riskLevel: data.riskLevel || 'high',
    riskFlags: data.riskFlags || [],
    downPaymentPercentage: 15,
    loanAmount: loanAmount,
    interestRate: 4.5,
    loanTerm: 25,
    monthlySavingsRequired: monthlySavingsRequired,
    financialProjections: generateFinancialProjections(
      targetYear,
      equity,
      monthlySavingsRequired,
      income
    ),
    actionSteps: data.actionSteps || [],
    milestones: generateMilestones(
      currentYear,
      targetYear,
      requiredEquity
    ),
    lifestyleImpact: data.lifestyleImpact || 'Significant lifestyle adjustments required',
    workLifeBalance: 'High focus on earning and saving',
    futureSelfNarrative: data.futureSelfNarrative || 'In just 2 years, you wake up in your own home, sunlight streaming through windows you chose yourself. Your family gathers in the kitchen you designed, laughing over breakfast. Every mortgage payment builds your wealth, not someone else\'s. This aggressive path demands sacrifice now, but delivers the pride and security of homeownership faster than you dreamed possible.',
    personalizedInsights: personalizedInsights,
    keyTradeoffs: keyTradeoffs,
    color: 'from-orange-400 to-orange-600',
    icon: '⚡',
  };
}

// Generate Balanced Route
async function generateBalancedRoute(
  context: string,
  apiKey: string,
  propertyPrice: number,
  equity: number,
  income: number,
  currentYear: number,
  userProfile: any
): Promise<PersonalizedRoute> {
  const prompt = `${context}

Generate a BALANCED route for this person. This is the recommended, sustainable path.

REQUIREMENTS:
- Target purchase within 2-4 years
- Moderate risk tolerance
- Realistic savings rate (25-35% of income)
- Maintains quality of life
- Standard down payment (20%)
- Balance between speed and stability

Return ONLY a valid JSON object (no markdown, no code blocks) with the same structure as before.`;

  const response = await callGeminiAPI(prompt, apiKey);
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid JSON response from API');
  }
  
  const data = JSON.parse(jsonMatch[0]);
  
  // Calculate precise financial values
  const targetYear = currentYear + 3;
  const monthsToSave = (targetYear - currentYear) * 12;
  const requiredEquity = Math.round(propertyPrice * 0.20);
  const equityGap = Math.max(0, requiredEquity - equity);
  const monthlySavingsRequired = Math.round(equityGap / monthsToSave);
  const loanAmount = propertyPrice - requiredEquity;
  const monthlyInterestRate = 0.04 / 12;
  const loanTermMonths = 30 * 12;
  const monthlyPayment = Math.round(
    loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, loanTermMonths)) / 
    (Math.pow(1 + monthlyInterestRate, loanTermMonths) - 1)
  );
  
  // Generate personalized content with additional LLM calls
  const personalizedInsights = await generatePersonalizedInsights(
    'balanced',
    userProfile,
    propertyPrice,
    equity,
    income,
    apiKey
  );
  
  const keyTradeoffs = await generateKeyTradeoffs(
    'balanced',
    3,
    20,
    monthlySavingsRequired,
    apiKey
  );
  
  return {
    id: 'balanced',
    name: 'Balanced Route',
    type: 'balanced',
    description: 'Sustainable pace balancing savings, lifestyle, and financial security',
    tagline: '⚖️ The recommended path',
    targetPurchaseYear: targetYear,
    monthsUntilPurchase: monthsToSave,
    requiredEquity: requiredEquity,
    monthlyPayment: monthlyPayment,
    totalCost: propertyPrice,
    riskScore: data.riskScore || 50,
    riskLevel: data.riskLevel || 'moderate',
    riskFlags: data.riskFlags || [],
    downPaymentPercentage: 20,
    loanAmount: loanAmount,
    interestRate: 4.0,
    loanTerm: 30,
    monthlySavingsRequired: monthlySavingsRequired,
    financialProjections: generateFinancialProjections(
      targetYear,
      equity,
      monthlySavingsRequired,
      income
    ),
    actionSteps: data.actionSteps || [],
    milestones: generateMilestones(
      currentYear,
      targetYear,
      requiredEquity
    ),
    lifestyleImpact: data.lifestyleImpact || 'Moderate adjustments with flexibility',
    workLifeBalance: 'Healthy balance maintained',
    futureSelfNarrative: data.futureSelfNarrative || 'In 3 years, you turn the key to your own front door, a perfect balance achieved. You didn\'t sacrifice everything to get here—you still enjoyed dinners with friends, weekend trips, and life\'s small pleasures. Now you have both: a home that\'s truly yours and memories from the journey. Your smart, steady approach paid off, proving that patience and balance create lasting success.',
    personalizedInsights: personalizedInsights,
    keyTradeoffs: keyTradeoffs,
    color: 'from-green-400 to-green-600',
    icon: '⚖️',
  };
}

// Generate Conservative Route
async function generateConservativeRoute(
  context: string,
  apiKey: string,
  propertyPrice: number,
  equity: number,
  income: number,
  currentYear: number,
  userProfile: any
): Promise<PersonalizedRoute> {
  const prompt = `${context}

Generate a CONSERVATIVE route for this person. This is the safest, most secure path.

REQUIREMENTS:
- Target purchase within 4-6 years
- Low risk tolerance
- Comfortable savings rate (15-25% of income)
- Maximum financial security
- Higher down payment (25-30%)
- Focus on building strong financial foundation

Return ONLY a valid JSON object (no markdown, no code blocks) with the same structure as before.`;

  const response = await callGeminiAPI(prompt, apiKey);
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid JSON response from API');
  }
  
  const data = JSON.parse(jsonMatch[0]);
  
  // Calculate precise financial values
  const targetYear = currentYear + 5;
  const monthsToSave = (targetYear - currentYear) * 12;
  const requiredEquity = Math.round(propertyPrice * 0.25);
  const equityGap = Math.max(0, requiredEquity - equity);
  const monthlySavingsRequired = Math.round(equityGap / monthsToSave);
  const loanAmount = propertyPrice - requiredEquity;
  const monthlyInterestRate = 0.038 / 12;
  const loanTermMonths = 30 * 12;
  const monthlyPayment = Math.round(
    loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, loanTermMonths)) / 
    (Math.pow(1 + monthlyInterestRate, loanTermMonths) - 1)
  );
  
  // Generate personalized content with additional LLM calls
  const personalizedInsights = await generatePersonalizedInsights(
    'conservative',
    userProfile,
    propertyPrice,
    equity,
    income,
    apiKey
  );
  
  const keyTradeoffs = await generateKeyTradeoffs(
    'conservative',
    5,
    25,
    monthlySavingsRequired,
    apiKey
  );
  
  return {
    id: 'conservative',
    name: 'Conservative Route',
    type: 'conservative',
    description: 'Safe and steady with maximum financial security and lower risk',
    tagline: '🛡️ Safety first',
    targetPurchaseYear: targetYear,
    monthsUntilPurchase: monthsToSave,
    requiredEquity: requiredEquity,
    monthlyPayment: monthlyPayment,
    totalCost: propertyPrice,
    riskScore: data.riskScore || 25,
    riskLevel: data.riskLevel || 'low',
    riskFlags: data.riskFlags || [],
    downPaymentPercentage: 25,
    loanAmount: loanAmount,
    interestRate: 3.8,
    loanTerm: 30,
    monthlySavingsRequired: monthlySavingsRequired,
    financialProjections: generateFinancialProjections(
      targetYear,
      equity,
      monthlySavingsRequired,
      income
    ),
    actionSteps: data.actionSteps || [],
    milestones: generateMilestones(
      currentYear,
      targetYear,
      requiredEquity
    ),
    lifestyleImpact: data.lifestyleImpact || 'Minimal lifestyle changes required',
    workLifeBalance: 'Excellent work-life balance',
    futureSelfNarrative: data.futureSelfNarrative || 'Five years from now, you unlock the door to your home with complete peace of mind. You took the time to build a fortress of financial security—25% equity down, emergency fund intact, zero stress. Your family thrives in this space you earned through patience and wisdom. While others rushed and struggled, you played the long game and won. This isn\'t just a house; it\'s the foundation of generational wealth, built on solid ground.',
    personalizedInsights: personalizedInsights,
    keyTradeoffs: keyTradeoffs,
    color: 'from-blue-400 to-blue-600',
    icon: '🛡️',
  };
}

// Generate Alternative Lifestyle Route
async function generateAlternativeLifestyleRoute(
  context: string,
  apiKey: string,
  propertyPrice: number,
  equity: number,
  income: number,
  currentYear: number,
  userProfile: any
): Promise<PersonalizedRoute> {
  const prompt = `${context}

Generate an ALTERNATIVE LIFESTYLE route. Think creatively about life choices that could accelerate homeownership.

CONSIDER:
- Remote work/relocation options
- Career pivots or side hustles
- Family support or co-ownership
- Temporary lifestyle changes (e.g., house-hacking, roommates)
- Education/upskilling investments
- Entrepreneurship opportunities

Return ONLY a valid JSON object (no markdown, no code blocks) with the same structure, plus:
- Include specific lifestyle alternatives
- Creative financing options
- Unconventional but realistic paths`;

  const response = await callGeminiAPI(prompt, apiKey);
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid JSON response from API');
  }
  
  const data = JSON.parse(jsonMatch[0]);
  
  return {
    id: 'alternative-lifestyle',
    name: 'Alternative Life-Choice Route',
    type: 'alternative-lifestyle',
    description: 'Creative path leveraging lifestyle changes and unconventional opportunities',
    tagline: '🌟 Think different',
    targetPurchaseYear: data.targetPurchaseYear || currentYear + 3,
    monthsUntilPurchase: (data.targetPurchaseYear || currentYear + 3 - currentYear) * 12,
    requiredEquity: data.requiredEquity || Math.round(propertyPrice * 0.18),
    monthlyPayment: data.monthlyPayment || Math.round(income * 0.30),
    totalCost: propertyPrice,
    riskScore: data.riskScore || 60,
    riskLevel: data.riskLevel || 'moderate',
    riskFlags: data.riskFlags || [],
    downPaymentPercentage: data.downPaymentPercentage || 18,
    loanAmount: propertyPrice - (data.requiredEquity || Math.round(propertyPrice * 0.18)),
    interestRate: 4.2,
    loanTerm: 28,
    monthlySavingsRequired: data.monthlySavingsRequired || Math.round(income * 0.35),
    financialProjections: generateFinancialProjections(
      data.targetPurchaseYear || currentYear + 3,
      equity,
      data.monthlySavingsRequired || Math.round(income * 0.35),
      income
    ),
    actionSteps: data.actionSteps || [],
    milestones: generateMilestones(
      currentYear,
      data.targetPurchaseYear || currentYear + 3,
      data.requiredEquity || Math.round(propertyPrice * 0.18)
    ),
    lifestyleImpact: data.lifestyleImpact || 'Transformative lifestyle changes',
    workLifeBalance: 'Flexible with new opportunities',
    futureSelfNarrative: data.futureSelfNarrative || '',
    personalizedInsights: data.personalizedInsights || [],
    keyTradeoffs: data.keyTradeoffs || [],
    color: 'from-purple-400 to-purple-600',
    icon: '🌟',
  };
}

// Generate Neighborhood Shift Route
async function generateNeighborhoodShiftRoute(
  context: string,
  apiKey: string,
  propertyPrice: number,
  equity: number,
  income: number,
  currentYear: number,
  location: string
): Promise<PersonalizedRoute> {
  const prompt = `${context}

Generate a NEIGHBORHOOD ALTERNATIVES route. Focus on geographic flexibility.

REQUIREMENTS:
- Identify 3-4 alternative neighborhoods/areas
- Compare costs, commute times, amenities
- Show how relocating could accelerate timeline
- Consider up-and-coming areas
- Balance affordability with lifestyle

For each alternative, include:
- Location name
- Average property price
- Price per m²
- Commute implications
- Advantages and tradeoffs
- Affordability score

Return ONLY a valid JSON object with neighborhood alternatives included.`;

  const response = await callGeminiAPI(prompt, apiKey);
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid JSON response from API');
  }
  
  const data = JSON.parse(jsonMatch[0]);
  
  // Generate alternative neighborhoods
  const neighborhoodAlternatives: NeighborhoodAlternative[] = data.neighborhoodAlternatives || [
    {
      location: `${location} Suburbs`,
      averagePrice: Math.round(propertyPrice * 0.75),
      pricePerSqm: Math.round((propertyPrice * 0.75) / 80),
      commuteTime: '25-35 minutes',
      advantages: ['More affordable', 'Larger properties', 'Family-friendly'],
      tradeoffs: ['Longer commute', 'Less urban amenities'],
      affordabilityScore: 85,
    },
  ];
  
  return {
    id: 'neighborhood-shift',
    name: 'Neighborhood Alternatives Route',
    type: 'neighborhood-shift',
    description: 'Geographic flexibility to find better value and faster path to ownership',
    tagline: '🗺️ Smart location choices',
    targetPurchaseYear: data.targetPurchaseYear || currentYear + 2,
    monthsUntilPurchase: (data.targetPurchaseYear || currentYear + 2 - currentYear) * 12,
    requiredEquity: data.requiredEquity || Math.round(propertyPrice * 0.7 * 0.20),
    monthlyPayment: data.monthlyPayment || Math.round(income * 0.30),
    totalCost: Math.round(propertyPrice * 0.7),
    riskScore: data.riskScore || 40,
    riskLevel: data.riskLevel || 'moderate',
    riskFlags: data.riskFlags || [],
    downPaymentPercentage: data.downPaymentPercentage || 20,
    loanAmount: Math.round(propertyPrice * 0.7 * 0.80),
    interestRate: 4.0,
    loanTerm: 30,
    monthlySavingsRequired: data.monthlySavingsRequired || Math.round(income * 0.28),
    financialProjections: generateFinancialProjections(
      data.targetPurchaseYear || currentYear + 2,
      equity,
      data.monthlySavingsRequired || Math.round(income * 0.28),
      income
    ),
    actionSteps: data.actionSteps || [],
    milestones: generateMilestones(
      currentYear,
      data.targetPurchaseYear || currentYear + 2,
      data.requiredEquity || Math.round(propertyPrice * 0.7 * 0.20)
    ),
    lifestyleImpact: data.lifestyleImpact || 'Location change with new community',
    workLifeBalance: 'May involve commute adjustments',
    neighborhoodAlternatives,
    futureSelfNarrative: data.futureSelfNarrative || '',
    personalizedInsights: data.personalizedInsights || [],
    keyTradeoffs: data.keyTradeoffs || [],
    color: 'from-teal-400 to-teal-600',
    icon: '🗺️',
  };
}

// Helper functions
function generateFinancialProjections(
  targetYear: number,
  currentEquity: number,
  monthlySavings: number,
  monthlyIncome: number
): FinancialProjection[] {
  const currentYear = new Date().getFullYear();
  const years = targetYear - currentYear;
  const projections: FinancialProjection[] = [];
  
  let accumulatedEquity = currentEquity;
  let currentIncome = monthlyIncome;
  
  for (let i = 0; i <= years; i++) {
    const year = currentYear + i;
    
    // Apply realistic income growth (2-3% per year, slightly variable)
    if (i > 0) {
      const growthRate = 0.025 + (Math.random() * 0.01); // 2.5-3.5% growth
      currentIncome = currentIncome * (1 + growthRate);
    }
    
    // Savings might increase with income
    const adjustedMonthlySavings = i === 0 ? monthlySavings : monthlySavings * (1.02 ** i);
    
    // Add yearly savings to accumulated equity
    if (i > 0) {
      accumulatedEquity += adjustedMonthlySavings * 12;
    }
    
    // Calculate realistic savings rate
    const savingsRate = adjustedMonthlySavings / currentIncome;
    
    projections.push({
      year,
      equity: Math.round(accumulatedEquity),
      savingsRate: Math.round(savingsRate * 100) / 100, // Round to 2 decimals
      estimatedIncome: Math.round(currentIncome),
      monthlyPayment: Math.round(adjustedMonthlySavings),
      totalSaved: Math.round(accumulatedEquity),
    });
  }
  
  return projections;
}

function generateMilestones(
  currentYear: number,
  targetYear: number,
  targetEquity: number
): Milestone[] {
  const years = targetYear - currentYear;
  const milestones: Milestone[] = [];
  
  // Initial milestone
  milestones.push({
    date: `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    title: 'Journey Begins',
    description: 'Start your focused savings plan',
    equityPercentage: 0,
  });
  
  // Quarterly milestones
  const quarters = Math.ceil(years * 4);
  for (let i = 1; i < quarters; i++) {
    const progress = i / quarters;
    const year = currentYear + Math.floor(i / 4);
    const quarter = (i % 4) + 1;
    
    if (progress === 0.25 || progress === 0.5 || progress === 0.75) {
      milestones.push({
        date: `${year}-Q${quarter}`,
        title: `${Math.round(progress * 100)}% Milestone`,
        description: `Reach €${Math.round(targetEquity * progress).toLocaleString()} in savings`,
        amountSaved: Math.round(targetEquity * progress),
        equityPercentage: Math.round(progress * 100),
      });
    }
  }
  
  // Final milestone
  milestones.push({
    date: `${targetYear}-01`,
    title: 'Ready to Purchase',
    description: 'Target equity achieved - time to buy!',
    amountSaved: targetEquity,
    equityPercentage: 100,
  });
  
  return milestones;
}

function determineRecommendedRoute(
  routes: PersonalizedRoute[],
  userProfile: any,
  budgetCalculation: any
): string {
  // Simple logic: recommend balanced by default, unless specific conditions apply
  
  // If young and high income, recommend fast-track
  if (userProfile.age && userProfile.age < 30 && budgetCalculation?.affordabilityScore > 70) {
    return 'fast-track';
  }
  
  // If risk-averse or older, recommend conservative
  if (userProfile.age && userProfile.age > 45 || budgetCalculation?.riskLevel === 'High') {
    return 'conservative';
  }
  
  // Default to balanced
  return 'balanced';
}

async function generateSummary(
  routes: PersonalizedRoute[],
  userProfile: any,
  apiKey: string
): Promise<string> {
  const prompt = `Generate a brief, encouraging summary (2-3 sentences) for a homebuyer who has ${routes.length} personalized routes to homeownership. 
  
User is ${userProfile.age || 'a'} years old, ${userProfile.occupation || 'working professional'}, looking in ${userProfile.location || 'their area'}.
  
The routes range from ${routes[0].monthsUntilPurchase} to ${routes[routes.length - 1].monthsUntilPurchase} months until purchase.

Make it personal, warm, and motivating. Return ONLY the summary text, no extra formatting.`;

  const response = await callGeminiAPI(prompt, apiKey);
  return response.trim();
}
