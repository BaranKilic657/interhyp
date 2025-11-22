import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { 
      monthlyIncome, 
      existingEquity, 
      existingLoans, 
      desiredTerm, 
      location,
      monthlyRate 
    } = await request.json();

    console.log('=== BUDGET CALCULATOR API CALLED ===');
    console.log('Monthly Income:', monthlyIncome);
    console.log('Existing Equity:', existingEquity);
    console.log('Existing Loans:', existingLoans);
    console.log('Desired Term (years):', desiredTerm);
    console.log('Location:', location);
    console.log('Desired Monthly Rate:', monthlyRate);

    // Current interest rate (approximate as of Nov 2025)
    const interestRate = 0.04; // 4% annual
    const monthlyInterestRate = interestRate / 12;

    // Calculate purchase costs by state (Grunderwerbsteuer + Notar + Makler)
    const purchaseCostsByState: Record<string, number> = {
      'BY': 0.115,   // Bayern: 3.5% + ~8%
      'BW': 0.135,   // Baden-Württemberg: 5% + ~8.5%
      'BE': 0.145,   // Berlin: 6% + ~8.5%
      'BB': 0.145,   // Brandenburg: 6.5% + ~8%
      'HB': 0.135,   // Bremen: 5% + ~8.5%
      'HH': 0.125,   // Hamburg: 4.5% + ~8%
      'HE': 0.145,   // Hessen: 6% + ~8.5%
      'MV': 0.145,   // Mecklenburg-Vorpommern: 6% + ~8.5%
      'NI': 0.135,   // Niedersachsen: 5% + ~8.5%
      'NW': 0.145,   // Nordrhein-Westfalen: 6.5% + ~8%
      'RP': 0.135,   // Rheinland-Pfalz: 5% + ~8.5%
      'SL': 0.145,   // Saarland: 6.5% + ~8.5%
      'SN': 0.115,   // Sachsen: 3.5% + ~8%
      'ST': 0.135,   // Sachsen-Anhalt: 5% + ~8.5%
      'SH': 0.145,   // Schleswig-Holstein: 6.5% + ~8.5%
      'TH': 0.135,   // Thüringen: 5% + ~8.5%
    };

    // Extract state code from location
    const getStateCode = (loc: string): string => {
      const stateMapping: Record<string, string> = {
        'muenchen': 'BY', 'munich': 'BY', 'bayern': 'BY', 'bavaria': 'BY',
        'berlin': 'BE',
        'hamburg': 'HH',
        'koeln': 'NW', 'cologne': 'NW', 'duesseldorf': 'NW', 'dortmund': 'NW',
        'frankfurt': 'HE', 'hessen': 'HE',
        'stuttgart': 'BW', 'baden-wuerttemberg': 'BW',
        'leipzig': 'SN', 'dresden': 'SN', 'sachsen': 'SN',
        'bremen': 'HB',
        'hannover': 'NI', 'niedersachsen': 'NI',
      };
      
      const lowerLoc = loc.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue');
      for (const [key, code] of Object.entries(stateMapping)) {
        if (lowerLoc.includes(key)) return code;
      }
      return 'BY'; // Default to Bayern
    };

    const stateCode = getStateCode(location);
    const purchaseCostRate = purchaseCostsByState[stateCode] || 0.12;

    console.log('State Code:', stateCode);
    console.log('Purchase Cost Rate:', (purchaseCostRate * 100).toFixed(1) + '%');

    // Calculate affordable monthly payment
    // Rule: Monthly housing cost should not exceed 35-40% of net income
    const maxMonthlyPayment = monthlyRate || (monthlyIncome * 0.35 - existingLoans);
    
    console.log('Max Monthly Payment:', maxMonthlyPayment);

    // Calculate loan amount based on monthly payment
    // Using annuity formula: P = M * [(1 - (1 + r)^-n) / r]
    const numberOfPayments = desiredTerm * 12;
    const loanAmount = maxMonthlyPayment * ((1 - Math.pow(1 + monthlyInterestRate, -numberOfPayments)) / monthlyInterestRate);

    console.log('Calculated Loan Amount:', loanAmount);

    // Calculate maximum purchase price
    // Total financing = Loan + Equity
    const totalFinancing = loanAmount + existingEquity;
    
    // Purchase price = Total financing / (1 + purchase costs)
    // Because: Total financing = Purchase price * (1 + purchase costs) - Purchase costs need to be covered
    const maxPurchasePrice = totalFinancing / (1 + purchaseCostRate);

    console.log('Total Financing Available:', totalFinancing);
    console.log('Maximum Purchase Price:', maxPurchasePrice);

    // Calculate purchase costs
    const purchaseCosts = maxPurchasePrice * purchaseCostRate;

    // Calculate equity percentage
    const equityPercentage = (existingEquity / maxPurchasePrice) * 100;

    // Risk assessment
    let riskLevel = 'Low';
    let riskScore = 25;
    if (equityPercentage < 15) {
      riskLevel = 'High';
      riskScore = 80;
    } else if (equityPercentage < 20) {
      riskLevel = 'Moderate-High';
      riskScore = 65;
    } else if (equityPercentage < 25) {
      riskLevel = 'Moderate';
      riskScore = 50;
    } else if (equityPercentage < 30) {
      riskLevel = 'Low-Moderate';
      riskScore = 35;
    }

    // Affordability score (1-100)
    const incomeUtilization = (maxMonthlyPayment / monthlyIncome) * 100;
    const affordabilityScore = Math.max(0, Math.min(100, 100 - incomeUtilization + equityPercentage));

    const result = {
      maxPurchasePrice: Math.round(maxPurchasePrice),
      loanAmount: Math.round(loanAmount),
      existingEquity: existingEquity,
      purchaseCosts: Math.round(purchaseCosts),
      monthlyPayment: Math.round(maxMonthlyPayment),
      totalFinancing: Math.round(totalFinancing),
      interestRate: interestRate * 100,
      loanTerm: desiredTerm,
      equityPercentage: Math.round(equityPercentage * 10) / 10,
      riskLevel: riskLevel,
      riskScore: riskScore,
      affordabilityScore: Math.round(affordabilityScore),
      purchaseCostRate: purchaseCostRate * 100,
      stateCode: stateCode,
      breakdown: {
        propertyPrice: Math.round(maxPurchasePrice),
        notaryFees: Math.round(maxPurchasePrice * 0.015),
        landRegistry: Math.round(maxPurchasePrice * 0.005),
        realEstateTransferTax: Math.round(maxPurchasePrice * (purchaseCostRate - 0.08)),
        brokerFee: Math.round(maxPurchasePrice * 0.06),
      },
      recommendations: [] as string[]
    };

    // Generate recommendations
    if (equityPercentage < 20) {
      result.recommendations.push('Consider increasing your equity to at least 20% for better financing conditions');
    }
    if (incomeUtilization > 40) {
      result.recommendations.push('Your monthly payment is high relative to income. Consider a longer term or lower property price');
    }
    if (existingEquity < purchaseCosts) {
      result.recommendations.push('Your equity should at least cover the purchase costs (' + Math.round(purchaseCosts).toLocaleString('de-DE') + ' €)');
    }

    console.log('Budget Calculation Result:', result);
    console.log('=== END BUDGET CALCULATOR API ===\n');

    return NextResponse.json(result);
  } catch (error) {
    console.error('Budget calculator error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
