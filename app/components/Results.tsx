'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Property {
  id: string;
  title: string;
  buyingPrice: number;
  rooms: number;
  squareMeter: number;
  pricePerSqm: number;
  address: {
    city: string;
    postcode: string;
    displayName: string;
  };
  images?: Array<{ originalUrl: string; title: string }>;
  locationFactor?: {
    score: number;
    population: number;
    hasUniversity: boolean;
  };
}

interface Route {
  name: string;
  purchaseYear: number;
  requiredEquity: number;
  monthlyPayment: number;
  riskScore: number;
  description: string;
  color: string;
  icon: string;
}

export default function Results() {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState(1);
  const [budgetCalculation, setBudgetCalculation] = useState<any>(null);
  const ran = useRef(false);

  // Get answers from URL params
  const propertyType = searchParams.get('propertyType') || 'apartment';
  const location = searchParams.get('location') || 'Munich';
  const budget = searchParams.get('budget') || '300-500k';
  const timeline = searchParams.get('timeline') || '1-2y';
  const familySize = searchParams.get('familySize') || '2';

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    // Fetch properties from our API
    const fetchProperties = async () => {
      try {
        setLoading(true);
        
        console.log('=== FETCHING PROPERTIES ===');
        console.log('Location:', location);
        console.log('Budget:', budget);
        console.log('Property Type:', propertyType);
        
        const response = await fetch('/api/properties', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            location,
            budget,
            propertyType,
          }),
        });

        console.log('Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Response data:', data);
          console.log('Properties received:', data.results?.length || 0);
          
          if (data.debug) {
            console.log('Debug info:', data.debug);
          }
          
          setProperties(data.results || []);
        } else {
          const errorData = await response.json();
          console.error('API Error:', errorData);
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        setLoading(false);
      }
    };

    // Calculate routes based on budget and timeline
    const calculateRoutes = () => {
      console.log('=== CALCULATING ROUTES ===');
      console.log('Budget input:', budget);
      console.log('Timeline input:', timeline);
      
      const budgetMap: Record<string, number> = {
        'under-300k': 300000,
        '300-500k': 400000,
        '500-750k': 625000,
        'over-750k': 875000,
      };

      const targetPrice = budgetMap[budget] || 400000;
      const currentYear = new Date().getFullYear();
      
      console.log('Target price:', targetPrice);
      console.log('Current year:', currentYear);

      // Conservative Route - 25% equity, slower timeline
      const conservativeEquity = Math.round(targetPrice * 0.25);
      const conservativeYears = timeline === 'within-6m' ? 2 : timeline === '6m-1y' ? 3 : 4;
      const conservativeMonthly = Math.round((targetPrice - conservativeEquity) * 0.004); // ~4% annual rate

      // Balanced Route - 20% equity, moderate timeline
      const balancedEquity = Math.round(targetPrice * 0.20);
      const balancedYears = timeline === 'within-6m' ? 1 : timeline === '6m-1y' ? 2 : 3;
      const balancedMonthly = Math.round((targetPrice - balancedEquity) * 0.0045);

      // Fast Route - 15% equity, aggressive timeline
      const fastEquity = Math.round(targetPrice * 0.15);
      const fastYears = timeline === 'within-6m' ? 1 : timeline === '6m-1y' ? 1 : 2;
      const fastMonthly = Math.round((targetPrice - fastEquity) * 0.005);

      const calculatedRoutes = [
        {
          name: 'Conservative',
          purchaseYear: currentYear + conservativeYears,
          requiredEquity: conservativeEquity,
          monthlyPayment: conservativeMonthly,
          riskScore: 25,
          description: 'Safest path with maximum equity and longer timeline',
          color: 'from-blue-400 to-blue-600',
          icon: '🛡️',
        },
        {
          name: 'Balanced',
          purchaseYear: currentYear + balancedYears,
          requiredEquity: balancedEquity,
          monthlyPayment: balancedMonthly,
          riskScore: 50,
          description: 'Recommended path balancing security and speed',
          color: 'from-green-400 to-green-600',
          icon: '⚖️',
        },
        {
          name: 'Fast',
          purchaseYear: currentYear + fastYears,
          requiredEquity: fastEquity,
          monthlyPayment: fastMonthly,
          riskScore: 75,
          description: 'Fastest path with aggressive savings and financing',
          color: 'from-orange-400 to-orange-600',
          icon: '⚡',
        },
      ];
      
      console.log('Calculated routes:', calculatedRoutes);
      console.log('=== END CALCULATING ROUTES ===\n');

      setRoutes(calculatedRoutes);
    };

    // Calculate budget with real API
    const fetchBudgetCalculation = async () => {
      try {
        const budgetMap: Record<string, number> = {
          'under-300k': 300000,
          '300-500k': 400000,
          '500-750k': 625000,
          'over-750k': 875000,
        };

        const targetPrice = budgetMap[budget] || 400000;
        
        // Estimate monthly income from budget (rough heuristic)
        const estimatedMonthlyIncome = Math.round(targetPrice / 100);
        const estimatedEquity = Math.round(targetPrice * 0.20);
        
        console.log('=== CALLING BUDGET CALCULATOR API ===');
        
        const response = await fetch('/api/budget', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            monthlyIncome: estimatedMonthlyIncome,
            existingEquity: estimatedEquity,
            existingLoans: 0,
            desiredTerm: timeline === 'within-6m' ? 25 : timeline === '6m-1y' ? 27 : 30,
            location: location,
            monthlyRate: null
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Budget calculation received:', data);
          setBudgetCalculation(data);
        } else {
          console.error('Budget calculation failed:', response.status);
        }
      } catch (error) {
        console.error('Error fetching budget calculation:', error);
      }
    };

    fetchProperties();
    fetchBudgetCalculation();
    calculateRoutes();
  }, [location, budget, propertyType, timeline]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const selectedRouteData = routes[selectedRoute];

  console.log('Results component state:', {
    propertiesCount: properties.length,
    loading,
    routesCount: routes.length,
    selectedRoute,
    hasBudgetCalculation: !!budgetCalculation
  });

  return (
    <main className="flex-1 bg-white">
      {/* Debug info - remove after testing */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-100 p-4 text-xs">
          <strong>Debug:</strong> Properties: {properties.length}, Loading: {loading ? 'yes' : 'no'}, 
          Routes: {routes.length}, Budget Calc: {budgetCalculation ? 'loaded' : 'not loaded'}
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#FF6600] to-[#FF8533] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Your Path to Homeownership
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Based on your preferences, here's your personalized journey to owning a home in {location}
            </p>
          </div>

          {/* Quick Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-3xl mb-2">🏠</div>
              <div className="text-sm opacity-80 mb-1">Property Type</div>
              <div className="text-lg font-semibold capitalize">{propertyType.replace('-', ' ')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-3xl mb-2">📍</div>
              <div className="text-sm opacity-80 mb-1">Location</div>
              <div className="text-lg font-semibold">{location}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-3xl mb-2">💰</div>
              <div className="text-sm opacity-80 mb-1">Budget Range</div>
              <div className="text-lg font-semibold">
                {budget === 'under-300k' && 'Under €300k'}
                {budget === '300-500k' && '€300k - €500k'}
                {budget === '500-750k' && '€500k - €750k'}
                {budget === 'over-750k' && 'Over €750k'}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-3xl mb-2">👥</div>
              <div className="text-sm opacity-80 mb-1">Family Size</div>
              <div className="text-lg font-semibold">
                {familySize === '1' && '1 Person'}
                {familySize === '2' && '2 People'}
                {familySize === '3-4' && '3-4 People'}
                {familySize === '5+' && '5+ People'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Routes Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1C1C1C] mb-4">
              Choose Your Route
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Three personalized paths to homeownership, each with different timelines and equity requirements
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {routes.map((route, index) => (
              <button
                key={index}
                onClick={() => setSelectedRoute(index)}
                className={`relative rounded-3xl overflow-hidden transition-all duration-300 cursor-pointer text-left ${
                  selectedRoute === index
                    ? 'ring-4 ring-[#FF6600] shadow-2xl scale-105'
                    : 'hover:shadow-xl hover:scale-102'
                }`}
              >
                <div className={`bg-gradient-to-br ${route.color} p-8 text-white min-h-[400px] flex flex-col`}>
                  <div className="text-5xl mb-4">{route.icon}</div>
                  <h3 className="text-2xl font-bold mb-2">{route.name} Route</h3>
                  <p className="text-sm opacity-90 mb-6">{route.description}</p>
                  
                  <div className="space-y-4 flex-1">
                    <div>
                      <div className="text-sm opacity-80">Purchase Year</div>
                      <div className="text-3xl font-bold">{route.purchaseYear}</div>
                    </div>
                    <div>
                      <div className="text-sm opacity-80">Required Equity</div>
                      <div className="text-xl font-bold">{formatPrice(route.requiredEquity)}</div>
                    </div>
                    <div>
                      <div className="text-sm opacity-80">Monthly Payment</div>
                      <div className="text-xl font-bold">{formatPrice(route.monthlyPayment)}</div>
                    </div>
                    <div>
                      <div className="text-sm opacity-80">Risk Score</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white/20 rounded-full h-2">
                          <div
                            className="bg-white rounded-full h-2 transition-all duration-500"
                            style={{ width: `${route.riskScore}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold">{route.riskScore}%</span>
                      </div>
                    </div>
                  </div>

                  {selectedRoute === index && (
                    <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                      <span className="text-sm font-semibold">✓ Selected</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Property Listings Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1C1C1C] mb-2">
                Available Properties in {location}
              </h2>
              <p className="text-lg text-gray-600">
                {loading ? 'Loading...' : `${properties.length} properties match your criteria`}
              </p>
            </div>
            <Link href="/questions">
              <button className="px-6 py-3 bg-gray-100 text-[#1C1C1C] rounded-2xl font-semibold hover:bg-gray-200 transition-all">
                Adjust Search
              </button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gray-100 rounded-3xl h-96 animate-pulse"></div>
              ))}
            </div>
          ) : properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
                >
                  {/* Property Image */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300">
                    {property.images && property.images.length > 0 ? (
                      <img
                        src={property.images[0].originalUrl}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        🏠
                      </div>
                    )}
                    {property.locationFactor && property.locationFactor.score >= 70 && (
                      <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Top Location
                      </div>
                    )}
                  </div>

                  {/* Property Details */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[#1C1C1C] mb-2 line-clamp-2">
                      {property.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {property.address.postcode} {property.address.city}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl font-bold text-[#FF6600]">
                        {property.buyingPrice ? formatPrice(property.buyingPrice) : 'Price on request'}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        <span>🛏️</span>
                        <span>{property.rooms} rooms</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>📐</span>
                        <span>{property.squareMeter} m²</span>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 mb-4">
                      {property.pricePerSqm ? `${formatPrice(property.pricePerSqm)}/m²` : 'Price details on request'}
                    </div>

                    {property.locationFactor && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 border-t pt-4">
                        <span>Location Score:</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-[#FF6600] rounded-full h-1.5"
                            style={{ width: `${property.locationFactor.score}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold">{property.locationFactor.score}/100</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🏠</div>
              <h3 className="text-2xl font-bold text-[#1C1C1C] mb-2">Property Search in Progress</h3>
              <p className="text-gray-600 mb-6">
                The ThinkImmo API is returning properties with incomplete pricing data for {location}.
                We're working on getting complete property listings.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                However, your budget calculation and financial routes are ready below! ⬇️
              </p>
              <Link href="/questions">
                <button className="px-8 py-4 bg-[#FF6600] text-white rounded-2xl font-semibold hover:bg-[#E55A00] transition-all">
                  Try Different Search
                </button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Budget Calculator Section - Always show if available */}
      {budgetCalculation && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1C1C1C] mb-4 text-center">
              Real Budget Calculation
            </h2>
            <p className="text-center text-gray-600 mb-8">
              Based on Interhyp's financing calculator
            </p>

            <div className="bg-white rounded-3xl p-8 shadow-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-gradient-to-br from-[#FF6600] to-[#FF8533] rounded-2xl text-white">
                  <div className="text-sm opacity-90 mb-2">Maximum Purchase Price</div>
                  <div className="text-4xl font-bold">{formatPrice(budgetCalculation.maxPurchasePrice)}</div>
                </div>

                <div className="p-6 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl text-white">
                  <div className="text-sm opacity-90 mb-2">Monthly Payment</div>
                  <div className="text-4xl font-bold">{formatPrice(budgetCalculation.monthlyPayment)}</div>
                </div>

                <div className="p-6 bg-gray-50 rounded-2xl">
                  <div className="text-sm text-gray-600 mb-2">Loan Amount</div>
                  <div className="text-2xl font-bold text-[#1C1C1C]">{formatPrice(budgetCalculation.loanAmount)}</div>
                </div>

                <div className="p-6 bg-gray-50 rounded-2xl">
                  <div className="text-sm text-gray-600 mb-2">Purchase Costs</div>
                  <div className="text-2xl font-bold text-[#1C1C1C]">{formatPrice(budgetCalculation.purchaseCosts)}</div>
                  <div className="text-xs text-gray-500 mt-1">{budgetCalculation.purchaseCostRate.toFixed(1)}% of purchase price</div>
                </div>

                <div className="p-6 bg-gray-50 rounded-2xl">
                  <div className="text-sm text-gray-600 mb-2">Your Equity</div>
                  <div className="text-2xl font-bold text-[#1C1C1C]">{formatPrice(budgetCalculation.existingEquity)}</div>
                  <div className="text-xs text-gray-500 mt-1">{budgetCalculation.equityPercentage}% of purchase price</div>
                </div>

                <div className="p-6 bg-gray-50 rounded-2xl">
                  <div className="text-sm text-gray-600 mb-2">Interest Rate</div>
                  <div className="text-2xl font-bold text-[#1C1C1C]">{budgetCalculation.interestRate.toFixed(2)}%</div>
                  <div className="text-xs text-gray-500 mt-1">{budgetCalculation.loanTerm} years term</div>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="mt-8 p-6 border-t">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Financial Risk Level</div>
                    <div className="text-xl font-bold text-[#1C1C1C]">{budgetCalculation.riskLevel}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">Affordability Score</div>
                    <div className="text-xl font-bold text-[#FF6600]">{budgetCalculation.affordabilityScore}/100</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-400 to-yellow-400 rounded-full h-3 transition-all duration-500"
                      style={{ width: `${budgetCalculation.affordabilityScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {budgetCalculation.recommendations && budgetCalculation.recommendations.length > 0 && (
                <div className="mt-6 p-6 bg-yellow-50 rounded-2xl">
                  <div className="font-semibold text-[#1C1C1C] mb-3 flex items-center gap-2">
                    <span>💡</span>
                    <span>Recommendations</span>
                  </div>
                  <ul className="space-y-2">
                    {budgetCalculation.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-[#FF6600] mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Financing Breakdown Section (Original) */}
      {selectedRouteData && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1C1C1C] mb-8 text-center">
              Your {selectedRouteData.name} Route Breakdown
            </h2>

            <div className="bg-white rounded-3xl p-8 shadow-lg">
              <div className="space-y-6">
                {/* Timeline */}
                <div className="flex items-center justify-between pb-6 border-b">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Target Purchase Year</div>
                    <div className="text-3xl font-bold text-[#FF6600]">{selectedRouteData.purchaseYear}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">Years Until Purchase</div>
                    <div className="text-2xl font-bold text-[#1C1C1C]">
                      {selectedRouteData.purchaseYear - new Date().getFullYear()} years
                    </div>
                  </div>
                </div>

                {/* Equity Requirements */}
                <div className="pb-6 border-b">
                  <div className="text-sm text-gray-600 mb-3">Equity to Save</div>
                  <div className="text-2xl font-bold text-[#1C1C1C] mb-4">
                    {formatPrice(selectedRouteData.requiredEquity)}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Monthly savings needed:</span>
                    <span className="font-semibold text-[#FF6600]">
                      {formatPrice(
                        selectedRouteData.requiredEquity /
                          ((selectedRouteData.purchaseYear - new Date().getFullYear()) * 12)
                      )}
                    </span>
                  </div>
                </div>

                {/* Monthly Payment */}
                <div className="pb-6 border-b">
                  <div className="text-sm text-gray-600 mb-3">Estimated Monthly Payment</div>
                  <div className="text-2xl font-bold text-[#1C1C1C] mb-2">
                    {formatPrice(selectedRouteData.monthlyPayment)}
                  </div>
                  <p className="text-sm text-gray-500">
                    Includes mortgage, insurance, and estimated maintenance costs
                  </p>
                </div>

                {/* Risk Assessment */}
                <div>
                  <div className="text-sm text-gray-600 mb-3">Financial Risk Level</div>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div
                        className={`bg-gradient-to-r ${selectedRouteData.color} rounded-full h-3 transition-all duration-500`}
                        style={{ width: `${selectedRouteData.riskScore}%` }}
                      ></div>
                    </div>
                    <span className="text-xl font-bold text-[#1C1C1C]">{selectedRouteData.riskScore}%</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {selectedRouteData.riskScore < 40 && 'Low risk with strong equity buffer'}
                    {selectedRouteData.riskScore >= 40 && selectedRouteData.riskScore < 60 && 'Moderate risk with balanced approach'}
                    {selectedRouteData.riskScore >= 60 && 'Higher risk requiring careful financial management'}
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-8 pt-8 border-t">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="flex-1 px-6 py-4 bg-[#FF6600] text-white rounded-2xl font-semibold hover:bg-[#E55A00] transition-all">
                    Get Expert Consultation
                  </button>
                  <button className="flex-1 px-6 py-4 bg-gray-100 text-[#1C1C1C] rounded-2xl font-semibold hover:bg-gray-200 transition-all">
                    Download Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Next Steps Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1C1C1C] mb-8 text-center">
            Your Next Steps
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-6">
              <div className="text-4xl mb-3">💰</div>
              <h3 className="text-xl font-bold text-[#1C1C1C] mb-2">Build Your Savings</h3>
              <p className="text-gray-700 mb-4">
                Start setting aside funds for your down payment. Even small monthly contributions add up over time.
              </p>
              <div className="text-sm text-blue-700 font-semibold">
                Target: {selectedRouteData && formatPrice(selectedRouteData.requiredEquity)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-3xl p-6">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-xl font-bold text-[#1C1C1C] mb-2">Check Your Credit</h3>
              <p className="text-gray-700 mb-4">
                Review your credit score and history. A strong credit profile helps secure better mortgage rates.
              </p>
              <div className="text-sm text-green-700 font-semibold">Action: Request credit report</div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-6">
              <div className="text-4xl mb-3">🏦</div>
              <h3 className="text-xl font-bold text-[#1C1C1C] mb-2">Explore Financing</h3>
              <p className="text-gray-700 mb-4">
                Research mortgage options and get pre-approved. Know your financing power before house hunting.
              </p>
              <div className="text-sm text-orange-700 font-semibold">Action: Schedule consultation</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl p-6">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-xl font-bold text-[#1C1C1C] mb-2">Visit Properties</h3>
              <p className="text-gray-700 mb-4">
                Start attending open houses and viewings in your target area to understand the market better.
              </p>
              <div className="text-sm text-purple-700 font-semibold">Action: Schedule viewings</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
