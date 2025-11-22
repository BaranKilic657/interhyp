'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Property {
  id: string;
  title: string;
  buyingPrice: number | null;
  rooms: number;
  squareMeter: number;
  pricePerSqm: number | null;
  spPricePerSqm?: number;
  valueScore?: number;
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
    populationTrend?: { from: number; to: number };
    unemploymentRate?: number;
  };
  aggregations?: {
    similarListing?: {
      buyingPrice: number;
      pricePerSqm: number;
    };
    location?: {
      name: string;
      buyingPrice: number;
      pricePerSqm: number;
    };
  };
  constructionYear?: number;
  apartmentType?: string;
  condition?: string;
  lastRefurbishment?: number;
  lift?: boolean;
  floor?: number;
  numberOfFloors?: number;
  cellar?: boolean;
  balcony?: boolean;
  garden?: boolean;
  energyEfficiencyClass?: string;
  rentPrice?: number;
  rentPricePerSqm?: number;
  grossReturn?: number;
  comission?: number;
  leasehold?: boolean;
  houseMoney?: number;
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [sortBy, setSortBy] = useState<'asc' | 'desc'>('asc');
  const [sortKey, setSortKey] = useState('buyingPrice');
  const [bestValue, setBestValue] = useState(true); // Default to best value
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
  // Find first working image when opening a property modal
  const openPropertyModal = (property: Property) => {
    if (property.images && property.images.length > 0) {
      // Check if current index is failed, if so find first working image
      const currentIndex = imageIndexes[property.id] || 0;
      const isCurrentFailed = failedImages[property.id]?.has(currentIndex);
      
      if (isCurrentFailed) {
        // Find first non-failed image
        let firstWorkingIndex = 0;
        for (let i = 0; i < property.images.length; i++) {
          if (!failedImages[property.id]?.has(i)) {
            firstWorkingIndex = i;
            break;
          }
        }
        setImageIndexes(prev => ({ ...prev, [property.id]: firstWorkingIndex }));
      }
    }
    setSelectedProperty(property);
  };
  
  const [selectedForComparison, setSelectedForComparison] = useState<Property[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [imageIndexes, setImageIndexes] = useState<Record<string, number>>({});
  const [failedImages, setFailedImages] = useState<Record<string, Set<number>>>({}); // Track failed images by property ID and image index
  const ran = useRef(false);

  // Get answers from URL params
  const propertyType = searchParams.get('propertyType') || 'apartment';
  const location = searchParams.get('location') || 'Munich';
  const budget = searchParams.get('budget') || '400000';
  const rooms = searchParams.get('rooms') || '3';
  const sqm = searchParams.get('sqm') || '120';
  const timeline = searchParams.get('timeline') || '1-2y';
  const familySize = searchParams.get('familySize') || '2';

  // Fetch properties from our API
  const fetchProperties = async (page: number = 1, newSortBy?: 'asc' | 'desc', newSortKey?: string, newBestValue?: boolean) => {
    try {
      setLoading(true);
      
      const currentSortBy = newSortBy !== undefined ? newSortBy : sortBy;
      const currentSortKey = newSortKey !== undefined ? newSortKey : sortKey;
      const currentBestValue = newBestValue !== undefined ? newBestValue : bestValue;
      
      console.log('=== FETCHING PROPERTIES ===');
      console.log('Location:', location);
      console.log('Budget:', budget);
      console.log('Rooms:', rooms);
      console.log('Sqm:', sqm);
      console.log('Property Type:', propertyType);
      console.log('Page:', page);
      console.log('Sort:', currentSortKey, currentSortBy);
      console.log('Best Value:', currentBestValue);
      
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location,
          budget: parseInt(budget),
          rooms: parseInt(rooms),
          sqm: parseInt(sqm),
          propertyType,
          page: page,
          sortBy: currentSortBy,
          sortKey: currentSortKey,
          bestValue: currentBestValue,
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
        setTotalPages(data.totalPages || 1);
        setTotalResults(data.total || 0);
        setCurrentPage(page);
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    // Calculate routes based on budget and timeline
    const calculateRoutes = () => {
      console.log('=== CALCULATING ROUTES ===');
      console.log('Budget input:', budget);
      console.log('Timeline input:', timeline);
      
      // Use budget directly as it's now a numeric value
      const targetPrice = parseInt(budget) || 400000;
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
        // Use budget directly as it's now a numeric value
        const targetPrice = parseInt(budget) || 400000;
        
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
  }, [location, budget, rooms, sqm, propertyType, timeline]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchProperties(newPage);
      // Scroll to properties section
      window.scrollTo({ top: document.getElementById('properties-section')?.offsetTop || 0, behavior: 'smooth' });
    }
  };

  const handleSortChange = (newSortKey: string, newSortBy: 'asc' | 'desc') => {
    setSortKey(newSortKey);
    setSortBy(newSortBy);
    setBestValue(false); // Disable best value when using other sorts
    setCurrentPage(1);
    fetchProperties(1, newSortBy, newSortKey, false);
  };

  const handleBestValueToggle = () => {
    setBestValue(true);
    setCurrentPage(1);
    fetchProperties(1, sortBy, sortKey, true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const calculateMonthlyTotal = (property: Property) => {
    const price = property.buyingPrice || 
                  (property.aggregations?.similarListing?.buyingPrice) ||
                  (property.spPricePerSqm && property.squareMeter ? property.spPricePerSqm * property.squareMeter : 0);
    
    if (!price) return null;

    // Assume 20% down payment
    const loanAmount = price * 0.8;
    // 4% annual interest rate, 30-year term
    const monthlyInterestRate = 0.04 / 12;
    const numberOfPayments = 30 * 12;
    const monthlyMortgage = loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / 
                           (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
    
    const houseMoney = property.houseMoney || 0;
    const estimatedUtilities = property.squareMeter * 2.5; // €2.50 per sqm for utilities
    
    return {
      mortgage: monthlyMortgage,
      houseMoney,
      utilities: estimatedUtilities,
      total: monthlyMortgage + houseMoney + estimatedUtilities
    };
  };

  const togglePropertyComparison = (property: Property) => {
    setSelectedForComparison(prev => {
      const isSelected = prev.find(p => p.id === property.id);
      if (isSelected) {
        return prev.filter(p => p.id !== property.id);
      } else if (prev.length < 2) {
        return [...prev, property];
      } else {
        // Replace the first selected property with the new one
        return [prev[1], property];
      }
    });
  };

  const isSelectedForComparison = (propertyId: string) => {
    return selectedForComparison.some(p => p.id === propertyId);
  };

  const nextImage = (propertyId: string, imageCount: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setImageIndexes(prev => ({
      ...prev,
      [propertyId]: ((prev[propertyId] || 0) + 1) % imageCount
    }));
  };

  const prevImage = (propertyId: string, imageCount: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setImageIndexes(prev => ({
      ...prev,
      [propertyId]: ((prev[propertyId] || 0) - 1 + imageCount) % imageCount
    }));
  };

  const getPropertyType = (property: Property) => {
    if (property.rentPrice && property.rentPrice > 0) {
      return 'rent';
    } else if (property.buyingPrice || property.aggregations?.similarListing?.buyingPrice) {
      return 'buy';
    }
    return 'unknown';
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-12">
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
              <div className="text-sm opacity-80 mb-1">Budget</div>
              <div className="text-lg font-semibold">
                {formatPrice(parseInt(budget))}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-3xl mb-2">🛏️</div>
              <div className="text-sm opacity-80 mb-1">Rooms</div>
              <div className="text-lg font-semibold">{rooms}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-3xl mb-2">📐</div>
              <div className="text-sm opacity-80 mb-1">Size</div>
              <div className="text-lg font-semibold">{sqm} m²</div>
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

      {/* Property Listings Section */}
      <section id="properties-section" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1C1C1C] mb-2">
                Available Properties in {location}
              </h2>
              <p className="text-lg text-gray-600">
                {loading ? 'Loading...' : `Showing ${properties.length} of ${totalResults.toLocaleString()} properties`}
              </p>
            </div>
            <Link href="/questions">
              <button className="px-6 py-3 bg-gray-100 text-[#1C1C1C] rounded-2xl font-semibold hover:bg-gray-200 transition-all">
                Adjust Search
              </button>
            </Link>
          </div>

          {/* Sorting Controls */}
          {!loading && properties.length > 0 && (
            <div className="flex items-center gap-4 mb-8 flex-wrap">
              <span className="text-sm font-semibold text-gray-700">Sort by:</span>
              
              <button
                onClick={handleBestValueToggle}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  bestValue
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                    : 'bg-white border-2 border-gray-300 text-[#1C1C1C] hover:bg-gray-50'
                }`}
              >
                <span>⭐</span>
                Best Value
              </button>
              
              <button
                onClick={() => handleSortChange('buyingPrice', sortKey === 'buyingPrice' && sortBy === 'asc' ? 'desc' : 'asc')}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  sortKey === 'buyingPrice' && !bestValue
                    ? 'bg-[#FF6600] text-white shadow-md'
                    : 'bg-white border-2 border-gray-300 text-[#1C1C1C] hover:bg-gray-50'
                }`}
              >
                Price
                {sortKey === 'buyingPrice' && !bestValue && (
                  <span>{sortBy === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>

              <button
                onClick={() => handleSortChange('squareMeter', sortKey === 'squareMeter' && sortBy === 'desc' ? 'asc' : 'desc')}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  sortKey === 'squareMeter' && !bestValue
                    ? 'bg-[#FF6600] text-white shadow-md'
                    : 'bg-white border-2 border-gray-300 text-[#1C1C1C] hover:bg-gray-50'
                }`}
              >
                Size
                {sortKey === 'squareMeter' && !bestValue && (
                  <span>{sortBy === 'desc' ? '↓' : '↑'}</span>
                )}
              </button>

              <button
                onClick={() => handleSortChange('rooms', sortKey === 'rooms' && sortBy === 'desc' ? 'asc' : 'desc')}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  sortKey === 'rooms' && !bestValue
                    ? 'bg-[#FF6600] text-white shadow-md'
                    : 'bg-white border-2 border-gray-300 text-[#1C1C1C] hover:bg-gray-50'
                }`}
              >
                Rooms
                {sortKey === 'rooms' && !bestValue && (
                  <span>{sortBy === 'desc' ? '↓' : '↑'}</span>
                )}
              </button>

              <button
                onClick={() => handleSortChange('pricePerSqm', sortKey === 'pricePerSqm' && sortBy === 'asc' ? 'desc' : 'asc')}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  sortKey === 'pricePerSqm' && !bestValue
                    ? 'bg-[#FF6600] text-white shadow-md'
                    : 'bg-white border-2 border-gray-300 text-[#1C1C1C] hover:bg-gray-50'
                }`}
              >
                Price/m²
                {sortKey === 'pricePerSqm' && !bestValue && (
                  <span>{sortBy === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </div>
          )}

          {/* Comparison Bar */}
          {selectedForComparison.length > 0 && (
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 bg-gradient-to-r from-[#FF6600] to-[#FF8533] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
              <span className="font-semibold">
                {selectedForComparison.length} {selectedForComparison.length === 1 ? 'property' : 'properties'} selected
              </span>
              {selectedForComparison.length === 2 && (
                <button
                  onClick={() => setShowComparison(true)}
                  className="px-6 py-2 bg-white text-[#FF6600] rounded-xl font-semibold hover:bg-gray-100 transition-all"
                >
                  Compare Properties
                </button>
              )}
              <button
                onClick={() => setSelectedForComparison([])}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition-all"
              >
                Clear
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gray-100 rounded-3xl h-96 animate-pulse"></div>
              ))}
            </div>
          ) : properties.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => {
                const monthlyCosts = calculateMonthlyTotal(property);
                return (
                <div
                  key={property.id}
                  className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 relative"
                >
                  {/* Selection Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePropertyComparison(property);
                    }}
                    className={`absolute top-4 left-4 z-10 w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-lg ${
                      isSelectedForComparison(property.id)
                        ? 'bg-[#FF6600] text-white'
                        : 'bg-white/90 text-gray-600 hover:bg-white'
                    }`}
                  >
                    {isSelectedForComparison(property.id) ? '✓' : '□'}
                  </button>

                  {/* Property Image */}
                  <div 
                    onClick={() => openPropertyModal(property)}
                    className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 cursor-pointer group"
                  >
                    {property.images && property.images.length > 0 ? (
                      <>
                        {(() => {
                          const currentIndex = imageIndexes[property.id] || 0;
                          const failed = failedImages[property.id]?.has(currentIndex);
                          
                          if (failed) {
                            // Show placeholder if this specific image failed
                            return (
                              <div className="w-full h-full flex items-center justify-center text-6xl">
                                <div className="text-center">
                                  <div className="text-6xl mb-2">🏠</div>
                                  <div className="text-xs text-gray-500">Image unavailable</div>
                                </div>
                              </div>
                            );
                          }
                          
                          return (
                            <img
                              src={property.images[currentIndex].originalUrl}
                              alt={property.title}
                              className="w-full h-full object-cover transition-opacity duration-300"
                              onError={() => {
                                // Mark this specific image as failed
                                setFailedImages(prev => {
                                  const newFailed = { ...prev };
                                  if (!newFailed[property.id]) {
                                    newFailed[property.id] = new Set();
                                  }
                                  newFailed[property.id].add(currentIndex);
                                  return newFailed;
                                });
                              }}
                            />
                          );
                        })()}
                        {property.images.length > 1 && (
                          <>
                            {/* Image Navigation Arrows */}
                            <button
                              onClick={(e) => prevImage(property.id, property.images!.length, e)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                              ←
                            </button>
                            <button
                              onClick={(e) => nextImage(property.id, property.images!.length, e)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                              →
                            </button>
                            {/* Image Counter */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium">
                              {(imageIndexes[property.id] || 0) + 1} / {property.images.length}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl bg-gray-100">
                        <div className="text-center">
                          <div className="text-6xl mb-2">🏠</div>
                          <div className="text-xs text-gray-500">No image</div>
                        </div>
                      </div>
                    )}
                    {bestValue && property.valueScore && property.valueScore >= 70 && (
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
                        <span>⭐</span>
                        <span>Best Value {property.valueScore}</span>
                      </div>
                    )}
                    {bestValue && property.valueScore && property.valueScore >= 50 && property.valueScore < 70 && (
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
                        <span>💎</span>
                        <span>Good Value {property.valueScore}</span>
                      </div>
                    )}
                    {!bestValue && property.locationFactor && property.locationFactor.score >= 70 && (
                      <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Top Location
                      </div>
                    )}
                  </div>

                  {/* Property Details */}
                  <div className="p-6" onClick={() => openPropertyModal(property)}>
                    <h3 className="text-xl font-bold text-[#1C1C1C] mb-2 line-clamp-2 cursor-pointer">
                      {property.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {property.address.postcode} {property.address.city}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-2xl font-bold text-[#FF6600]">
                          {property.buyingPrice 
                            ? formatPrice(property.buyingPrice) 
                            : property.aggregations?.similarListing?.buyingPrice
                            ? formatPrice(property.aggregations.similarListing.buyingPrice)
                            : property.spPricePerSqm && property.squareMeter
                            ? formatPrice(Math.round(property.spPricePerSqm * property.squareMeter))
                            : 'Price on request'}
                        </div>
                        {!property.buyingPrice && (property.aggregations?.similarListing?.buyingPrice || property.spPricePerSqm) && (
                          <div className="text-xs text-gray-500 mt-1">Est. market value</div>
                        )}
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
                      {property.pricePerSqm 
                        ? `${formatPrice(property.pricePerSqm)}/m²` 
                        : property.spPricePerSqm
                        ? `${formatPrice(Math.round(property.spPricePerSqm))}/m² (est.)`
                        : 'Price details on request'}
                    </div>

                    {/* Monthly Costs Breakdown */}
                    {monthlyCosts && (
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-xl mb-4 border border-blue-100">
                        <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <span>💰</span>
                          <span>Est. Monthly Costs</span>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex justify-between">
                            <span>Mortgage:</span>
                            <span className="font-semibold">{formatPrice(monthlyCosts.mortgage)}</span>
                          </div>
                          {property.houseMoney && (
                            <div className="flex justify-between">
                              <span>House Money:</span>
                              <span className="font-semibold">{formatPrice(monthlyCosts.houseMoney)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Est. Utilities:</span>
                            <span className="font-semibold">{formatPrice(monthlyCosts.utilities)}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-blue-200 text-sm font-bold text-[#FF6600]">
                            <span>Total:</span>
                            <span>{formatPrice(monthlyCosts.total)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Additional Costs Info */}
                    {(property.comission || property.houseMoney) && (
                      <div className="text-xs text-gray-500 mb-4 space-y-1">
                        {property.comission && (
                          <div className="flex justify-between">
                            <span>Commission:</span>
                            <span className="font-semibold">{property.comission.toFixed(2)}%</span>
                          </div>
                        )}
                      </div>
                    )}

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
              );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-6 py-3 bg-white border-2 border-gray-300 text-[#1C1C1C] rounded-2xl font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  <span>←</span>
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-2">
                  {/* First page */}
                  {currentPage > 3 && (
                    <>
                      <button
                        onClick={() => handlePageChange(1)}
                        className="w-12 h-12 rounded-xl bg-white border-2 border-gray-300 text-[#1C1C1C] font-semibold hover:bg-gray-50 transition-all"
                      >
                        1
                      </button>
                      {currentPage > 4 && <span className="text-gray-400">...</span>}
                    </>
                  )}

                  {/* Page numbers around current page */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      return page === currentPage || 
                             page === currentPage - 1 || 
                             page === currentPage + 1 ||
                             (page === currentPage - 2 && currentPage <= 3) ||
                             (page === currentPage + 2 && currentPage >= totalPages - 2);
                    })
                    .map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-12 h-12 rounded-xl font-semibold transition-all ${
                          page === currentPage
                            ? 'bg-[#FF6600] text-white shadow-lg'
                            : 'bg-white border-2 border-gray-300 text-[#1C1C1C] hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                  {/* Last page */}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && <span className="text-gray-400">...</span>}
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className="w-12 h-12 rounded-xl bg-white border-2 border-gray-300 text-[#1C1C1C] font-semibold hover:bg-gray-50 transition-all"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-6 py-3 bg-white border-2 border-gray-300 text-[#1C1C1C] rounded-2xl font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  <span>Next</span>
                  <span>→</span>
                </button>
              </div>
            )}
            </>
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

      {/* Property Detail Modal */}
      {selectedProperty && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedProperty(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedProperty(null)}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all z-10"
            >
              <span className="text-2xl">✕</span>
            </button>

            {/* Image Gallery */}
            <div className="relative h-96 bg-gradient-to-br from-gray-200 to-gray-300 group">
              {selectedProperty.images && selectedProperty.images.length > 0 ? (
                <div className="relative h-full">
                  {(() => {
                    const currentIndex = imageIndexes[selectedProperty.id] || 0;
                    const failed = failedImages[selectedProperty.id]?.has(currentIndex);
                    
                    if (failed) {
                      return (
                        <div className="w-full h-full flex items-center justify-center text-8xl">
                          <div className="text-center">
                            <div className="text-8xl mb-2">🏠</div>
                            <div className="text-sm text-gray-500">Image unavailable</div>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <img
                        src={selectedProperty.images[currentIndex].originalUrl}
                        alt={selectedProperty.title}
                        className="w-full h-full object-cover"
                        onError={() => {
                          setFailedImages(prev => {
                            const newFailed = { ...prev };
                            if (!newFailed[selectedProperty.id]) {
                              newFailed[selectedProperty.id] = new Set();
                            }
                            newFailed[selectedProperty.id].add(currentIndex);
                            return newFailed;
                          });
                        }}
                      />
                    );
                  })()}
                  {selectedProperty.images.length > 1 && (
                    <>
                      {/* Image Navigation Arrows */}
                      <button
                        onClick={(e) => prevImage(selectedProperty.id, selectedProperty.images!.length, e)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all text-xl"
                      >
                        ←
                      </button>
                      <button
                        onClick={(e) => nextImage(selectedProperty.id, selectedProperty.images!.length, e)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all text-xl"
                      >
                        →
                      </button>
                      {/* Image Counter */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                        📷 {(imageIndexes[selectedProperty.id] || 0) + 1} / {selectedProperty.images.length}
                      </div>
                      {/* Image Dots Indicator */}
                      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
                        {selectedProperty.images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setImageIndexes(prev => ({ ...prev, [selectedProperty.id]: idx }));
                            }}
                            className={`w-2 h-2 rounded-full transition-all ${
                              (imageIndexes[selectedProperty.id] || 0) === idx
                                ? 'bg-white w-8'
                                : 'bg-white/50 hover:bg-white/75'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl">
                  🏠
                </div>
              )}
              
              {/* Badges */}
              {bestValue && selectedProperty.valueScore && selectedProperty.valueScore >= 70 && (
                <div className="absolute top-4 left-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2">
                  <span>⭐</span>
                  <span>Best Value {selectedProperty.valueScore}</span>
                </div>
              )}
            </div>

            {/* Property Details */}
            <div className="p-8">
              {/* Title and Location */}
              <h2 className="text-3xl font-bold text-[#1C1C1C] mb-3">
                {selectedProperty.title}
              </h2>
              <p className="text-lg text-gray-600 mb-6 flex items-center gap-2">
                <span>📍</span>
                <span>{selectedProperty.address.postcode} {selectedProperty.address.city}</span>
              </p>

              {/* Price */}
              <div className="bg-gradient-to-r from-[#FF6600] to-[#FF8533] text-white p-6 rounded-2xl mb-6">
                <div className="text-sm opacity-90 mb-1">Price</div>
                <div className="text-4xl font-bold">
                  {selectedProperty.buyingPrice 
                    ? formatPrice(selectedProperty.buyingPrice) 
                    : selectedProperty.aggregations?.similarListing?.buyingPrice
                    ? formatPrice(selectedProperty.aggregations.similarListing.buyingPrice)
                    : selectedProperty.spPricePerSqm && selectedProperty.squareMeter
                    ? formatPrice(Math.round(selectedProperty.spPricePerSqm * selectedProperty.squareMeter))
                    : 'Price on request'}
                </div>
                {!selectedProperty.buyingPrice && (selectedProperty.aggregations?.similarListing?.buyingPrice || selectedProperty.spPricePerSqm) && (
                  <div className="text-sm opacity-90 mt-1">Estimated market value</div>
                )}
              </div>

              {/* Key Features Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                  <div className="text-3xl mb-2">🛏️</div>
                  <div className="text-2xl font-bold text-[#1C1C1C]">{selectedProperty.rooms}</div>
                  <div className="text-sm text-gray-600">Rooms</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                  <div className="text-3xl mb-2">📐</div>
                  <div className="text-2xl font-bold text-[#1C1C1C]">{selectedProperty.squareMeter}</div>
                  <div className="text-sm text-gray-600">m²</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                  <div className="text-3xl mb-2">💰</div>
                  <div className="text-2xl font-bold text-[#1C1C1C]">
                    {selectedProperty.pricePerSqm 
                      ? formatPrice(selectedProperty.pricePerSqm).replace(/\s€/, '')
                      : selectedProperty.spPricePerSqm
                      ? formatPrice(Math.round(selectedProperty.spPricePerSqm)).replace(/\s€/, '')
                      : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">€/m²</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                  <div className="text-3xl mb-2">📍</div>
                  <div className="text-2xl font-bold text-[#1C1C1C]">
                    {selectedProperty.locationFactor?.score || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Location Score</div>
                </div>
              </div>

              {/* Property Details Section */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl mb-6">
                <h3 className="font-semibold text-[#1C1C1C] mb-4 flex items-center gap-2 text-lg">
                  <span>🏠</span>
                  <span>Property Details</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedProperty.constructionYear && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">Construction Year:</span>
                      <span className="font-semibold">{selectedProperty.constructionYear}</span>
                    </div>
                  )}
                  {selectedProperty.apartmentType && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-semibold">{selectedProperty.apartmentType.replace('_', ' ')}</span>
                    </div>
                  )}
                  {selectedProperty.condition && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">Condition:</span>
                      <span className="font-semibold">{selectedProperty.condition.replace('_', ' ')}</span>
                    </div>
                  )}
                  {selectedProperty.lastRefurbishment && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">Last Refurbished:</span>
                      <span className="font-semibold">{selectedProperty.lastRefurbishment}</span>
                    </div>
                  )}
                  {selectedProperty.floor !== undefined && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">Floor:</span>
                      <span className="font-semibold">{selectedProperty.floor}{selectedProperty.numberOfFloors ? ` of ${selectedProperty.numberOfFloors}` : ''}</span>
                    </div>
                  )}
                  {selectedProperty.energyEfficiencyClass && selectedProperty.energyEfficiencyClass !== 'NO_INFORMATION' && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">Energy Class:</span>
                      <span className="font-semibold">{selectedProperty.energyEfficiencyClass}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Features & Amenities */}
              <div className="bg-blue-50 p-6 rounded-2xl mb-6">
                <h3 className="font-semibold text-[#1C1C1C] mb-4 flex items-center gap-2 text-lg">
                  <span>✨</span>
                  <span>Features & Amenities</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedProperty.lift !== undefined && (
                    <div className={`flex items-center gap-2 p-3 rounded-xl ${selectedProperty.lift ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                      <span>{selectedProperty.lift ? '✓' : '✗'}</span>
                      <span className="font-medium">Elevator</span>
                    </div>
                  )}
                  {selectedProperty.cellar !== undefined && (
                    <div className={`flex items-center gap-2 p-3 rounded-xl ${selectedProperty.cellar ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                      <span>{selectedProperty.cellar ? '✓' : '✗'}</span>
                      <span className="font-medium">Cellar</span>
                    </div>
                  )}
                  {selectedProperty.balcony !== undefined && (
                    <div className={`flex items-center gap-2 p-3 rounded-xl ${selectedProperty.balcony ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                      <span>{selectedProperty.balcony ? '✓' : '✗'}</span>
                      <span className="font-medium">Balcony</span>
                    </div>
                  )}
                  {selectedProperty.garden !== undefined && (
                    <div className={`flex items-center gap-2 p-3 rounded-xl ${selectedProperty.garden ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                      <span>{selectedProperty.garden ? '✓' : '✗'}</span>
                      <span className="font-medium">Garden</span>
                    </div>
                  )}
                  {selectedProperty.leasehold !== undefined && !selectedProperty.leasehold && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-green-100 text-green-700">
                      <span>✓</span>
                      <span className="font-medium">Freehold</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Information */}
              {(selectedProperty.rentPrice || selectedProperty.grossReturn || selectedProperty.comission || selectedProperty.houseMoney) && (
                <div className="bg-purple-50 p-6 rounded-2xl mb-6">
                  <h3 className="font-semibold text-[#1C1C1C] mb-4 flex items-center gap-2 text-lg">
                    <span>💵</span>
                    <span>Financial Information</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedProperty.rentPrice && (
                      <div className="flex justify-between items-center py-2 border-b border-purple-200">
                        <span className="text-gray-600">Monthly Rent:</span>
                        <span className="font-semibold">{formatPrice(selectedProperty.rentPrice)}</span>
                      </div>
                    )}
                    {selectedProperty.rentPricePerSqm && (
                      <div className="flex justify-between items-center py-2 border-b border-purple-200">
                        <span className="text-gray-600">Rent per m²:</span>
                        <span className="font-semibold">{formatPrice(selectedProperty.rentPricePerSqm)}/m²</span>
                      </div>
                    )}
                    {selectedProperty.grossReturn && (
                      <div className="flex justify-between items-center py-2 border-b border-purple-200">
                        <span className="text-gray-600">Gross Return:</span>
                        <span className="font-semibold">{selectedProperty.grossReturn.toFixed(2)}%</span>
                      </div>
                    )}
                    {selectedProperty.comission && (
                      <div className="flex justify-between items-center py-2 border-b border-purple-200">
                        <span className="text-gray-600">Commission:</span>
                        <span className="font-semibold">{selectedProperty.comission.toFixed(2)}%</span>
                      </div>
                    )}
                    {selectedProperty.houseMoney && (
                      <div className="flex justify-between items-center py-2 border-b border-purple-200">
                        <span className="text-gray-600">Monthly House Money:</span>
                        <span className="font-semibold">{formatPrice(selectedProperty.houseMoney)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Market Comparison */}
              {selectedProperty.aggregations && (selectedProperty.aggregations.location || selectedProperty.aggregations.similarListing) && (
                <div className="bg-yellow-50 p-6 rounded-2xl mb-6">
                  <h3 className="font-semibold text-[#1C1C1C] mb-4 flex items-center gap-2 text-lg">
                    <span>📈</span>
                    <span>Market Comparison</span>
                  </h3>
                  <div className="space-y-4">
                    {selectedProperty.aggregations.location && (
                      <div className="bg-white p-4 rounded-xl">
                        <div className="text-sm text-gray-600 mb-2">Average in {selectedProperty.aggregations.location.name}</div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Avg. Price:</span>
                          <span className="text-lg font-bold text-[#FF6600]">{formatPrice(selectedProperty.aggregations.location.buyingPrice)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="font-medium">Avg. Price/m²:</span>
                          <span className="text-lg font-bold text-[#FF6600]">{formatPrice(selectedProperty.aggregations.location.pricePerSqm)}</span>
                        </div>
                      </div>
                    )}
                    {selectedProperty.aggregations.similarListing && (
                      <div className="bg-white p-4 rounded-xl">
                        <div className="text-sm text-gray-600 mb-2">Similar Listings</div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Avg. Price:</span>
                          <span className="text-lg font-bold text-[#FF6600]">{formatPrice(selectedProperty.aggregations.similarListing.buyingPrice)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="font-medium">Avg. Price/m²:</span>
                          <span className="text-lg font-bold text-[#FF6600]">{formatPrice(selectedProperty.aggregations.similarListing.pricePerSqm)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Details */}
              {selectedProperty.locationFactor && (
                <div className="bg-green-50 p-6 rounded-2xl mb-6">
                  <h3 className="font-semibold text-[#1C1C1C] mb-4 flex items-center gap-2 text-lg">
                    <span>📊</span>
                    <span>Area Information</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center py-2 border-b border-green-200">
                      <span className="text-gray-600">Population:</span>
                      <span className="font-semibold">{selectedProperty.locationFactor.population?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-green-200">
                      <span className="text-gray-600">University:</span>
                      <span className="font-semibold">{selectedProperty.locationFactor.hasUniversity ? 'Yes ✓' : 'No'}</span>
                    </div>
                    {selectedProperty.locationFactor.unemploymentRate && (
                      <div className="flex justify-between items-center py-2 border-b border-green-200">
                        <span className="text-gray-600">Unemployment Rate:</span>
                        <span className="font-semibold">{selectedProperty.locationFactor.unemploymentRate.toFixed(1)}%</span>
                      </div>
                    )}
                    {selectedProperty.locationFactor.populationTrend && (
                      <div className="flex justify-between items-center py-2 border-b border-green-200">
                        <span className="text-gray-600">Population Trend:</span>
                        <span className="font-semibold">
                          {selectedProperty.locationFactor.populationTrend.from > 0 ? '↗️ Growing' : selectedProperty.locationFactor.populationTrend.from < 0 ? '↘️ Declining' : '→ Stable'}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center col-span-full py-2">
                      <span className="text-gray-600">Location Score:</span>
                      <div className="flex items-center gap-3 flex-1 max-w-xs">
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-green-500 rounded-full h-3 transition-all"
                            style={{ width: `${selectedProperty.locationFactor.score}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold">{selectedProperty.locationFactor.score}/100</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 flex-wrap">
                <button className="flex-1 min-w-[200px] px-6 py-4 bg-[#FF6600] text-white rounded-2xl font-semibold hover:bg-[#E55A00] transition-all shadow-lg">
                  Contact Agent
                </button>
                <button className="flex-1 min-w-[200px] px-6 py-4 bg-gray-100 text-[#1C1C1C] rounded-2xl font-semibold hover:bg-gray-200 transition-all">
                  Save Property
                </button>
                <button className="px-6 py-4 bg-blue-100 text-blue-600 rounded-2xl font-semibold hover:bg-blue-200 transition-all">
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Property Comparison Modal */}
      {showComparison && selectedForComparison.length === 2 && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowComparison(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-7xl w-full max-h-[90vh] overflow-y-auto my-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <div className="sticky top-0 bg-white z-10 p-6 border-b flex items-center justify-between rounded-t-3xl">
              <h2 className="text-3xl font-bold text-[#1C1C1C]">Property Comparison</h2>
              <button
                onClick={() => setShowComparison(false)}
                className="bg-gray-100 hover:bg-gray-200 rounded-full p-3 transition-all"
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {selectedForComparison.map((property, index) => {
                const monthlyCosts = calculateMonthlyTotal(property);
                return (
                  <div key={property.id} className="space-y-4">
                    {/* Property Header */}
                    <div className={`bg-gradient-to-r ${index === 0 ? 'from-blue-500 to-blue-600' : 'from-purple-500 to-purple-600'} text-white p-6 rounded-2xl`}>
                      <div className="text-sm opacity-90 mb-1">Property {index + 1}</div>
                      <h3 className="text-xl font-bold mb-2">{property.title}</h3>
                      <p className="text-sm opacity-90">
                        📍 {property.address.postcode} {property.address.city}
                      </p>
                    </div>

                    {/* Image */}
                    <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl overflow-hidden group">
                      {property.images && property.images.length > 0 ? (
                        <>
                          <img
                            src={property.images[imageIndexes[property.id] || 0].originalUrl}
                            alt={property.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          {property.images.length > 1 && (
                            <>
                              <button
                                onClick={(e) => prevImage(property.id, property.images!.length, e)}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ←
                              </button>
                              <button
                                onClick={(e) => nextImage(property.id, property.images!.length, e)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                →
                              </button>
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white px-2 py-1 rounded-full text-xs">
                                {(imageIndexes[property.id] || 0) + 1}/{property.images.length}
                              </div>
                            </>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl">
                          🏠
                        </div>
                      )}
                    </div>

                    {/* Price */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-2xl">
                      <div className="text-sm text-gray-600 mb-1">Purchase Price</div>
                      <div className="text-3xl font-bold text-[#FF6600]">
                        {property.buyingPrice 
                          ? formatPrice(property.buyingPrice) 
                          : property.aggregations?.similarListing?.buyingPrice
                          ? formatPrice(property.aggregations.similarListing.buyingPrice)
                          : property.spPricePerSqm && property.squareMeter
                          ? formatPrice(Math.round(property.spPricePerSqm * property.squareMeter))
                          : 'Price on request'}
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-blue-50 p-3 rounded-xl text-center">
                        <div className="text-2xl mb-1">🛏️</div>
                        <div className="text-xl font-bold text-[#1C1C1C]">{property.rooms}</div>
                        <div className="text-xs text-gray-600">Rooms</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-xl text-center">
                        <div className="text-2xl mb-1">📐</div>
                        <div className="text-xl font-bold text-[#1C1C1C]">{property.squareMeter}</div>
                        <div className="text-xs text-gray-600">m²</div>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-xl text-center">
                        <div className="text-2xl mb-1">💰</div>
                        <div className="text-xl font-bold text-[#1C1C1C]">
                          {property.pricePerSqm 
                            ? formatPrice(property.pricePerSqm).replace(/\s€/, '')
                            : property.spPricePerSqm
                            ? formatPrice(Math.round(property.spPricePerSqm)).replace(/\s€/, '')
                            : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-600">€/m²</div>
                      </div>
                    </div>

                    {/* Monthly Costs */}
                    {monthlyCosts && (
                      <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200">
                        <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <span>💰</span>
                          <span>Monthly Costs Breakdown</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Mortgage Payment:</span>
                            <span className="font-semibold">{formatPrice(monthlyCosts.mortgage)}</span>
                          </div>
                          {property.houseMoney && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">House Money:</span>
                              <span className="font-semibold">{formatPrice(monthlyCosts.houseMoney)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">Est. Utilities:</span>
                            <span className="font-semibold">{formatPrice(monthlyCosts.utilities)}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-purple-300 text-base font-bold text-[#FF6600]">
                            <span>Total Monthly:</span>
                            <span>{formatPrice(monthlyCosts.total)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Property Details */}
                    <div className="bg-gray-50 p-4 rounded-2xl">
                      <div className="text-sm font-semibold text-gray-700 mb-3">Property Details</div>
                      <div className="space-y-2 text-sm">
                        {property.constructionYear && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Built:</span>
                            <span className="font-semibold">{property.constructionYear}</span>
                          </div>
                        )}
                        {property.condition && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Condition:</span>
                            <span className="font-semibold capitalize">{property.condition.replace('_', ' ')}</span>
                          </div>
                        )}
                        {property.floor !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Floor:</span>
                            <span className="font-semibold">{property.floor}{property.numberOfFloors ? ` of ${property.numberOfFloors}` : ''}</span>
                          </div>
                        )}
                        {property.energyEfficiencyClass && property.energyEfficiencyClass !== 'NO_INFORMATION' && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Energy Class:</span>
                            <span className="font-semibold">{property.energyEfficiencyClass}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Features */}
                    <div className="bg-green-50 p-4 rounded-2xl">
                      <div className="text-sm font-semibold text-gray-700 mb-3">Features</div>
                      <div className="flex flex-wrap gap-2">
                        {property.lift !== undefined && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${property.lift ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                            {property.lift ? '✓' : '✗'} Elevator
                          </span>
                        )}
                        {property.balcony !== undefined && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${property.balcony ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                            {property.balcony ? '✓' : '✗'} Balcony
                          </span>
                        )}
                        {property.garden !== undefined && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${property.garden ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                            {property.garden ? '✓' : '✗'} Garden
                          </span>
                        )}
                        {property.cellar !== undefined && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${property.cellar ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                            {property.cellar ? '✓' : '✗'} Cellar
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Location Score */}
                    {property.locationFactor && (
                      <div className="bg-yellow-50 p-4 rounded-2xl">
                        <div className="text-sm font-semibold text-gray-700 mb-3">Location Analysis</div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600">Score:</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full h-2"
                                style={{ width: `${property.locationFactor.score}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-bold">{property.locationFactor.score}/100</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Population:</span>
                              <span className="font-semibold">{property.locationFactor.population?.toLocaleString() || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">University:</span>
                              <span className="font-semibold">{property.locationFactor.hasUniversity ? 'Yes ✓' : 'No'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Additional Costs */}
                    {property.comission && (
                      <div className="bg-red-50 p-4 rounded-2xl">
                        <div className="text-sm font-semibold text-gray-700 mb-2">Additional Costs</div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Agent Commission:</span>
                          <span className="font-semibold text-red-600">{property.comission.toFixed(2)}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-0 bg-white p-6 border-t rounded-b-3xl">
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedProperty(selectedForComparison[0])}
                  className="flex-1 px-6 py-4 bg-blue-500 text-white rounded-2xl font-semibold hover:bg-blue-600 transition-all"
                >
                  View Property 1 Details
                </button>
                <button
                  onClick={() => setSelectedProperty(selectedForComparison[1])}
                  className="flex-1 px-6 py-4 bg-purple-500 text-white rounded-2xl font-semibold hover:bg-purple-600 transition-all"
                >
                  View Property 2 Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
