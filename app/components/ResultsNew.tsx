// New comprehensive Results component with property selection and AI-generated routes
'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import RouteCard from './RouteCard';
import RouteDetails from './RouteDetails';
import type { Property, PersonalizedRoute, RouteGenerationRequest, RouteGenerationResponse, UserProfile } from '../types/routes';

export default function ResultsNew() {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyForRoutes, setSelectedPropertyForRoutes] = useState<Property | null>(null);
  const [propertyForDetailModal, setPropertyForDetailModal] = useState<Property | null>(null);
  const [routes, setRoutes] = useState<PersonalizedRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<PersonalizedRoute | null>(null);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [routeSummary, setRouteSummary] = useState('');
  const [recommendedRouteId, setRecommendedRouteId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [imageIndexes, setImageIndexes] = useState<Record<string, number>>({});
  const [failedImages, setFailedImages] = useState<Record<string, Set<number>>>({});
  const ran = useRef(false);
  const routesGenerated = useRef(false);

  // Get URL parameters
  const propertyType = searchParams.get('propertyType') || 'apartment';
  const location = searchParams.get('location') || 'Munich';
  const budget = searchParams.get('budget') || '400000';
  const rooms = searchParams.get('rooms') || '3';
  const sqm = searchParams.get('sqm') || '120';
  const timeline = searchParams.get('timeline') || '36';
  const familySize = searchParams.get('familySize') || '2';
  const age = searchParams.get('age') || '30';
  const gender = searchParams.get('gender') || 'not specified';
  const occupation = searchParams.get('occupation') || 'professional';
  const equity = searchParams.get('equity') || '50000';
  const monthlyBudget = searchParams.get('monthlyBudget') || '2000';

  // Fetch properties
  const fetchProperties = async (page: number = 1) => {
    try {
      setLoading(true);
      
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
          page,
          sortBy: 'asc',
          sortKey: 'buyingPrice',
          bestValue: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProperties(data.results || []);
        setTotalPages(data.totalPages || 1);
        setTotalResults(data.total || 0);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate personalized routes
  const generateRoutes = async (property: Property) => {
    if (routesGenerated.current) return; // Prevent duplicate calls
    routesGenerated.current = true;

    try {
      setLoadingRoutes(true);
      
      const userProfile: UserProfile = {
        age: parseInt(age),
        gender,
        occupation,
        monthlyIncome: parseInt(monthlyBudget) * 3,
        existingEquity: parseInt(equity),
        familySize,
        timeline,
        location,
        propertyType,
        budget: parseInt(budget),
        rooms,
        sqm,
      };

      const request: RouteGenerationRequest = {
        userProfile,
        selectedProperty: property,
        budgetCalculation: {
          maxPurchasePrice: parseInt(budget),
          monthlyPayment: parseInt(monthlyBudget),
          existingEquity: parseInt(equity),
        },
      };

      console.log('Generating routes for:', property.title);

      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (response.ok) {
        const data: RouteGenerationResponse = await response.json();
        setRoutes(data.routes);
        setRouteSummary(data.summary);
        setRecommendedRouteId(data.recommendedRouteId);
        
        // Auto-select recommended route
        const recommended = data.routes.find(r => r.id === data.recommendedRouteId);
        if (recommended) {
          setSelectedRoute(recommended);
        }
        
        // Scroll to routes section
        setTimeout(() => {
          document.getElementById('routes-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      }
    } catch (error) {
      console.error('Error generating routes:', error);
    } finally {
      setLoadingRoutes(false);
    }
  };

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    fetchProperties();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Toggle property selection (single select only)
  const togglePropertySelection = (property: Property) => {
    if (selectedPropertyForRoutes?.id === property.id) {
      setSelectedPropertyForRoutes(null);
      setRoutes([]);
      setSelectedRoute(null);
    } else {
      setSelectedPropertyForRoutes(property);
      // Don't generate routes yet - wait for button click
    }
  };

  // Handle route generation button click
  const handleGenerateRoutes = async () => {
    if (!selectedPropertyForRoutes) return;
    
    routesGenerated.current = false;
    await generateRoutes(selectedPropertyForRoutes);
    
    // Scroll to routes section
    setTimeout(() => {
      document.getElementById('routes-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  // Open property detail modal
  const openPropertyDetail = (property: Property) => {
    setPropertyForDetailModal(property);
  };

  const nextImage = (propertyId: string, imageCount: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setImageIndexes(prev => {
      const currentIndex = prev[propertyId] || 0;
      let nextIndex = (currentIndex + 1) % imageCount;
      
      // Skip failed images - find next working image
      let attempts = 0;
      while (failedImages[propertyId]?.has(nextIndex) && attempts < imageCount) {
        nextIndex = (nextIndex + 1) % imageCount;
        attempts++;
      }
      
      // If all images failed, just go to next index anyway
      if (attempts >= imageCount) {
        nextIndex = (currentIndex + 1) % imageCount;
      }
      
      return {
        ...prev,
        [propertyId]: nextIndex
      };
    });
  };

  const prevImage = (propertyId: string, imageCount: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setImageIndexes(prev => {
      const currentIndex = prev[propertyId] || 0;
      let prevIndex = (currentIndex - 1 + imageCount) % imageCount;
      
      // Skip failed images - find previous working image
      let attempts = 0;
      while (failedImages[propertyId]?.has(prevIndex) && attempts < imageCount) {
        prevIndex = (prevIndex - 1 + imageCount) % imageCount;
        attempts++;
      }
      
      // If all images failed, just go to previous index anyway
      if (attempts >= imageCount) {
        prevIndex = (currentIndex - 1 + imageCount) % imageCount;
      }
      
      return {
        ...prev,
        [propertyId]: prevIndex
      };
    });
  };

  return (
    <>
    <main className="flex-1 bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#FF6600] to-[#FF8533] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Your Personalized Path to Homeownership
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Choose a property, and we'll create a custom roadmap with multiple routes tailored just for you
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-sm opacity-80 mb-1">Location</div>
              <div className="text-lg font-semibold">{location}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-sm opacity-80 mb-1">Budget</div>
              <div className="text-lg font-semibold">{formatPrice(parseInt(budget))}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-sm opacity-80 mb-1">Your Profile</div>
              <div className="text-lg font-semibold">{age}y, {occupation}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-sm opacity-80 mb-1">Timeline</div>
              <div className="text-lg font-semibold">{Math.round(parseInt(timeline) / 12)} years</div>
            </div>
          </div>
        </div>
      </section>

      {/* Property Selection Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1C1C1C] mb-4">
              Step 1: Choose Your Dream Property
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Select a property that interests you, and we'll generate personalized routes showing different paths to make it yours
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gray-100 rounded-3xl h-96 animate-pulse"></div>
              ))}
            </div>
          ) : properties.length > 0 ? (
            <>
              {/* Property Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {properties
                  .filter((property) => {
                    if (!property.images || property.images.length === 0) return false;
                    const propertyFailed = failedImages[property.id];
                    if (propertyFailed && property.images.every((_, idx) => propertyFailed.has(idx))) {
                      return false;
                    }
                    return true;
                  })
                  .map((property) => {
                    const propertyPrice = property.buyingPrice || 
                                         property.aggregations?.similarListing?.buyingPrice || 
                                         (property.spPricePerSqm && property.squareMeter ? 
                                          property.spPricePerSqm * property.squareMeter : 0);
                    
                    const isSelected = selectedPropertyForRoutes?.id === property.id;
                    
                    return (
                      <div
                        key={property.id}
                        onClick={() => openPropertyDetail(property)}
                        className={`bg-white rounded-3xl overflow-hidden shadow-lg transition-all duration-300 relative cursor-pointer ${
                          isSelected
                            ? 'ring-4 ring-[#FF6600] scale-105 shadow-2xl'
                            : 'hover:shadow-xl hover:scale-102'
                        }`}
                      >
                        {/* Selection Checkbox */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePropertySelection(property);
                          }}
                          className={`absolute top-4 left-4 z-10 w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-lg ${
                            isSelected
                              ? 'bg-[#FF6600] text-white'
                              : 'bg-white/90 text-gray-600 hover:bg-white'
                          }`}
                        >
                          {isSelected ? '✓' : '□'}
                        </button>

                        {/* Property Image */}
                        <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 group">
                          {property.images && property.images.length > 0 ? (
                            <>
                              {(() => {
                                const currentIndex = imageIndexes[property.id] || 0;
                                const failed = failedImages[property.id]?.has(currentIndex);
                                
                                if (failed) {
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
                                      setFailedImages(prev => {
                                        const newFailed = { ...prev };
                                        if (!newFailed[property.id]) {
                                          newFailed[property.id] = new Set();
                                        }
                                        newFailed[property.id].add(currentIndex);
                                        return newFailed;
                                      });
                                      
                                      if (property.images && property.images.length > 1) {
                                        let nextIndex = (currentIndex + 1) % property.images.length;
                                        let attempts = 0;
                                        
                                        const currentFailed = failedImages[property.id] || new Set();
                                        currentFailed.add(currentIndex);
                                        
                                        while (currentFailed.has(nextIndex) && attempts < property.images.length) {
                                          nextIndex = (nextIndex + 1) % property.images.length;
                                          attempts++;
                                        }
                                        
                                        if (attempts < property.images.length) {
                                          setImageIndexes(prev => ({
                                            ...prev,
                                            [property.id]: nextIndex
                                          }));
                                        }
                                      }
                                    }}
                                  />
                                );
                              })()}
                              {property.images.length > 1 && (
                                <>
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
                          {isSelected && (
                            <div className="absolute top-4 right-4 bg-[#FF6600] text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg z-10">
                              ✓ Selected
                            </div>
                          )}
                          {property.valueScore && property.valueScore >= 70 && !isSelected && (
                            <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
                              <span>⭐</span>
                              <span>Best Value {property.valueScore}</span>
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

                          <div className="text-2xl font-bold text-[#FF6600] mb-4">
                            {propertyPrice > 0 ? formatPrice(propertyPrice) : 'Price on request'}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                            <span>🛏️ {property.rooms} rooms</span>
                            <span>📐 {property.squareMeter} m²</span>
                          </div>

                          <div className="text-sm text-gray-600 mb-4">
                            {property.pricePerSqm 
                              ? `${formatPrice(property.pricePerSqm)}/m²` 
                              : property.spPricePerSqm
                              ? `${formatPrice(Math.round(property.spPricePerSqm))}/m² (est.)`
                              : 'Price details on request'}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePropertySelection(property);
                            }}
                            className={`w-full py-3 rounded-xl font-semibold transition-all ${
                              isSelected
                                ? 'bg-[#FF6600] text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-[#FF6600] hover:text-white'
                            }`}
                          >
                            {isSelected ? 'Selected ✓' : 'Select for Routes'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Generate Routes Button */}
              {selectedPropertyForRoutes && (
                <div className="text-center mt-8 mb-12">
                  <button
                    onClick={handleGenerateRoutes}
                    disabled={loadingRoutes}
                    className="px-12 py-5 bg-gradient-to-r from-[#FF6600] to-[#FF8533] text-white rounded-2xl font-bold text-lg hover:shadow-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
                  >
                    {loadingRoutes ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        <span>Generating Your Personalized Routes...</span>
                      </>
                    ) : (
                      <>
                        <span>🚀</span>
                        <span>Generate My Personalized Routes</span>
                      </>
                    )}
                  </button>
                  <p className="text-sm text-gray-600 mt-4">
                    Based on <strong>{selectedPropertyForRoutes.title}</strong>
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🏠</div>
              <h3 className="text-2xl font-bold text-[#1C1C1C] mb-2">No properties found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search criteria</p>
              <Link href="/questions">
                <button className="px-8 py-4 bg-[#FF6600] text-white rounded-2xl font-semibold hover:bg-[#E55A00] transition-all">
                  Adjust Search
                </button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Routes Section */}
      {routes.length > 0 && selectedPropertyForRoutes && (
        <section id="routes-section" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1C1C1C] mb-4">
                Step 2: Choose Your Route
              </h2>
              {routeSummary && (
                <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
                  {routeSummary}
                </p>
              )}
              <p className="text-md text-gray-500">
                We've analyzed your profile and created {routes.length} personalized paths to owning {selectedPropertyForRoutes.title}
              </p>
            </div>

            {loadingRoutes ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-[#FF6600] mb-4"></div>
                  <p className="text-lg text-gray-600">Generating your personalized routes...</p>
                  <p className="text-sm text-gray-500 mt-2">This may take a moment as we analyze multiple scenarios</p>
                </div>
              </div>
            ) : routes.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {routes.map((route) => (
                    <RouteCard
                      key={route.id}
                      route={route}
                      isRecommended={route.id === recommendedRouteId}
                      isSelected={selectedRoute?.id === route.id}
                      onSelect={() => {
                        setSelectedRoute(route);
                        setTimeout(() => {
                          document.getElementById('route-details')?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }}
                    />
                  ))}
                </div>

                {/* Detailed Route View */}
                {selectedRoute && (
                  <div id="route-details" className="mt-16">
                    <div className="bg-gradient-to-r from-[#FF6600] to-[#FF8533] text-white rounded-3xl p-8 mb-8">
                      <h2 className="text-3xl font-bold mb-2">
                        {selectedRoute.icon} {selectedRoute.name} - Detailed Roadmap
                      </h2>
                      <p className="text-lg opacity-90">{selectedRoute.tagline}</p>
                    </div>
                    
                    <RouteDetails route={selectedRoute} />

                    {/* CTA Section */}
                    <div className="mt-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-12 text-center border-2 border-blue-200">
                      <h3 className="text-3xl font-bold text-gray-900 mb-4">
                        Ready to Start Your Journey?
                      </h3>
                      <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
                        Talk to an Interhyp advisor to refine your personalized route and take the next steps toward homeownership
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button className="px-8 py-4 bg-[#FF6600] text-white rounded-2xl font-semibold hover:bg-[#E55A00] transition-all shadow-lg text-lg">
                          Schedule Consultation
                        </button>
                        <button className="px-8 py-4 bg-white text-[#1C1C1C] border-2 border-gray-300 rounded-2xl font-semibold hover:bg-gray-50 transition-all text-lg">
                          Download Your Roadmap
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </section>
      )}

      {/* No Property Selected State */}
      {!selectedPropertyForRoutes && !loading && properties.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-6xl mb-6">🎯</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Select a Property to See Your Personalized Routes
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              Once you choose a property above, we'll use AI to generate multiple tailored paths showing you exactly how to make it yours
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white rounded-2xl p-6 shadow-md">
                <div className="text-4xl mb-3">⚡</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Fast-Track Route</h3>
                <p className="text-gray-600">Aggressive timeline with focused savings</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-md">
                <div className="text-4xl mb-3">⚖️</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Balanced Route</h3>
                <p className="text-gray-600">Sustainable pace with quality of life</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-md">
                <div className="text-4xl mb-3">🛡️</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Conservative Route</h3>
                <p className="text-gray-600">Maximum security and stability</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>

    {/* Property Detail Modal */}
    {propertyForDetailModal && (
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
        onClick={() => setPropertyForDetailModal(null)}
      >
        <div 
          className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={() => setPropertyForDetailModal(null)}
            className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all z-10"
          >
            <span className="text-2xl">✕</span>
          </button>

          {/* Image Gallery */}
          <div className="relative h-96 bg-gradient-to-br from-gray-200 to-gray-300 group">
            {propertyForDetailModal.images && propertyForDetailModal.images.length > 0 ? (
              <div className="relative h-full">
                {(() => {
                  const currentIndex = imageIndexes[propertyForDetailModal.id] || 0;
                  const failed = failedImages[propertyForDetailModal.id]?.has(currentIndex);
                  
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
                      src={propertyForDetailModal.images[currentIndex].originalUrl}
                      alt={propertyForDetailModal.title}
                      className="w-full h-full object-cover"
                      onError={() => {
                        setFailedImages(prev => {
                          const newFailed = { ...prev };
                          if (!newFailed[propertyForDetailModal.id]) {
                            newFailed[propertyForDetailModal.id] = new Set();
                          }
                          newFailed[propertyForDetailModal.id].add(currentIndex);
                          return newFailed;
                        });
                        
                        if (propertyForDetailModal.images && propertyForDetailModal.images.length > 1) {
                          let nextIndex = (currentIndex + 1) % propertyForDetailModal.images.length;
                          let attempts = 0;
                          
                          const currentFailed = failedImages[propertyForDetailModal.id] || new Set();
                          currentFailed.add(currentIndex);
                          
                          while (currentFailed.has(nextIndex) && attempts < propertyForDetailModal.images.length) {
                            nextIndex = (nextIndex + 1) % propertyForDetailModal.images.length;
                            attempts++;
                          }
                          
                          if (attempts < propertyForDetailModal.images.length) {
                            setImageIndexes(prev => ({
                              ...prev,
                              [propertyForDetailModal.id]: nextIndex
                            }));
                          }
                        }
                      }}
                    />
                  );
                })()}
                {propertyForDetailModal.images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => prevImage(propertyForDetailModal.id, propertyForDetailModal.images!.length, e)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all text-xl"
                    >
                      ←
                    </button>
                    <button
                      onClick={(e) => nextImage(propertyForDetailModal.id, propertyForDetailModal.images!.length, e)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all text-xl"
                    >
                      →
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                      📷 {(imageIndexes[propertyForDetailModal.id] || 0) + 1} / {propertyForDetailModal.images.length}
                    </div>
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
                      {propertyForDetailModal.images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageIndexes(prev => ({ ...prev, [propertyForDetailModal.id]: idx }));
                          }}
                          className={`w-2 h-2 rounded-full transition-all ${
                            (imageIndexes[propertyForDetailModal.id] || 0) === idx
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
            
            {propertyForDetailModal.valueScore && propertyForDetailModal.valueScore >= 70 && (
              <div className="absolute top-4 left-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2">
                <span>⭐</span>
                <span>Best Value {propertyForDetailModal.valueScore}</span>
              </div>
            )}
          </div>

          {/* Property Details */}
          <div className="p-8">
            <h2 className="text-3xl font-bold text-[#1C1C1C] mb-3">
              {propertyForDetailModal.title}
            </h2>
            <p className="text-lg text-gray-600 mb-6 flex items-center gap-2">
              <span>📍</span>
              <span>{propertyForDetailModal.address.postcode} {propertyForDetailModal.address.city}</span>
            </p>

            {/* Price */}
            <div className="bg-gradient-to-r from-[#FF6600] to-[#FF8533] text-white p-6 rounded-2xl mb-6">
              <div className="text-sm opacity-90 mb-1">Price</div>
              <div className="text-4xl font-bold">
                {propertyForDetailModal.buyingPrice 
                  ? formatPrice(propertyForDetailModal.buyingPrice) 
                  : propertyForDetailModal.aggregations?.similarListing?.buyingPrice
                  ? formatPrice(propertyForDetailModal.aggregations.similarListing.buyingPrice)
                  : propertyForDetailModal.spPricePerSqm && propertyForDetailModal.squareMeter
                  ? formatPrice(Math.round(propertyForDetailModal.spPricePerSqm * propertyForDetailModal.squareMeter))
                  : 'Price on request'}
              </div>
              {!propertyForDetailModal.buyingPrice && (propertyForDetailModal.aggregations?.similarListing?.buyingPrice || propertyForDetailModal.spPricePerSqm) && (
                <div className="text-sm opacity-90 mt-1">Estimated market value</div>
              )}
            </div>

            {/* Key Features Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-2xl text-center">
                <div className="text-3xl mb-2">🛏️</div>
                <div className="text-2xl font-bold text-[#1C1C1C]">{propertyForDetailModal.rooms}</div>
                <div className="text-sm text-gray-600">Rooms</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl text-center">
                <div className="text-3xl mb-2">📐</div>
                <div className="text-2xl font-bold text-[#1C1C1C]">{propertyForDetailModal.squareMeter}</div>
                <div className="text-sm text-gray-600">m²</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl text-center">
                <div className="text-3xl mb-2">💰</div>
                <div className="text-2xl font-bold text-[#1C1C1C]">
                  {propertyForDetailModal.pricePerSqm 
                    ? formatPrice(propertyForDetailModal.pricePerSqm).replace(/\s€/, '')
                    : propertyForDetailModal.spPricePerSqm
                    ? formatPrice(Math.round(propertyForDetailModal.spPricePerSqm)).replace(/\s€/, '')
                    : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">€/m²</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl text-center">
                <div className="text-3xl mb-2">📍</div>
                <div className="text-2xl font-bold text-[#1C1C1C]">
                  {propertyForDetailModal.locationFactor?.score || 'N/A'}
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
                {propertyForDetailModal.constructionYear && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Construction Year:</span>
                    <span className="font-semibold">{propertyForDetailModal.constructionYear}</span>
                  </div>
                )}
                {propertyForDetailModal.apartmentType && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-semibold">{propertyForDetailModal.apartmentType.replace('_', ' ')}</span>
                  </div>
                )}
                {propertyForDetailModal.condition && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Condition:</span>
                    <span className="font-semibold">{propertyForDetailModal.condition.replace('_', ' ')}</span>
                  </div>
                )}
                {propertyForDetailModal.lastRefurbishment && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Last Refurbished:</span>
                    <span className="font-semibold">{propertyForDetailModal.lastRefurbishment}</span>
                  </div>
                )}
                {propertyForDetailModal.floor !== undefined && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Floor:</span>
                    <span className="font-semibold">{propertyForDetailModal.floor}{propertyForDetailModal.numberOfFloors ? ` of ${propertyForDetailModal.numberOfFloors}` : ''}</span>
                  </div>
                )}
                {propertyForDetailModal.energyEfficiencyClass && propertyForDetailModal.energyEfficiencyClass !== 'NO_INFORMATION' && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Energy Class:</span>
                    <span className="font-semibold">{propertyForDetailModal.energyEfficiencyClass}</span>
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
                {propertyForDetailModal.lift !== undefined && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl ${propertyForDetailModal.lift ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                    <span>{propertyForDetailModal.lift ? '✓' : '✗'}</span>
                    <span className="font-medium">Elevator</span>
                  </div>
                )}
                {propertyForDetailModal.cellar !== undefined && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl ${propertyForDetailModal.cellar ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                    <span>{propertyForDetailModal.cellar ? '✓' : '✗'}</span>
                    <span className="font-medium">Cellar</span>
                  </div>
                )}
                {propertyForDetailModal.balcony !== undefined && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl ${propertyForDetailModal.balcony ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                    <span>{propertyForDetailModal.balcony ? '✓' : '✗'}</span>
                    <span className="font-medium">Balcony</span>
                  </div>
                )}
                {propertyForDetailModal.garden !== undefined && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl ${propertyForDetailModal.garden ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                    <span>{propertyForDetailModal.garden ? '✓' : '✗'}</span>
                    <span className="font-medium">Garden</span>
                  </div>
                )}
                {propertyForDetailModal.leasehold !== undefined && !propertyForDetailModal.leasehold && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-green-100 text-green-700">
                    <span>✓</span>
                    <span className="font-medium">Freehold</span>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Information */}
            {(propertyForDetailModal.rentPrice || propertyForDetailModal.grossReturn || propertyForDetailModal.comission || propertyForDetailModal.houseMoney) && (
              <div className="bg-purple-50 p-6 rounded-2xl mb-6">
                <h3 className="font-semibold text-[#1C1C1C] mb-4 flex items-center gap-2 text-lg">
                  <span>💵</span>
                  <span>Financial Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {propertyForDetailModal.rentPrice && (
                    <div className="flex justify-between items-center py-2 border-b border-purple-200">
                      <span className="text-gray-600">Monthly Rent:</span>
                      <span className="font-semibold">{formatPrice(propertyForDetailModal.rentPrice)}</span>
                    </div>
                  )}
                  {propertyForDetailModal.rentPricePerSqm && (
                    <div className="flex justify-between items-center py-2 border-b border-purple-200">
                      <span className="text-gray-600">Rent per m²:</span>
                      <span className="font-semibold">{formatPrice(propertyForDetailModal.rentPricePerSqm)}/m²</span>
                    </div>
                  )}
                  {propertyForDetailModal.grossReturn && (
                    <div className="flex justify-between items-center py-2 border-b border-purple-200">
                      <span className="text-gray-600">Gross Return:</span>
                      <span className="font-semibold">{propertyForDetailModal.grossReturn.toFixed(2)}%</span>
                    </div>
                  )}
                  {propertyForDetailModal.comission && (
                    <div className="flex justify-between items-center py-2 border-b border-purple-200">
                      <span className="text-gray-600">Commission:</span>
                      <span className="font-semibold">{propertyForDetailModal.comission.toFixed(2)}%</span>
                    </div>
                  )}
                  {propertyForDetailModal.houseMoney && (
                    <div className="flex justify-between items-center py-2 border-b border-purple-200">
                      <span className="text-gray-600">Monthly House Money:</span>
                      <span className="font-semibold">{formatPrice(propertyForDetailModal.houseMoney)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Market Comparison */}
            {propertyForDetailModal.aggregations && (propertyForDetailModal.aggregations.location || propertyForDetailModal.aggregations.similarListing) && (
              <div className="bg-yellow-50 p-6 rounded-2xl mb-6">
                <h3 className="font-semibold text-[#1C1C1C] mb-4 flex items-center gap-2 text-lg">
                  <span>📈</span>
                  <span>Market Comparison</span>
                </h3>
                <div className="space-y-4">
                  {propertyForDetailModal.aggregations.location && (
                    <div className="bg-white p-4 rounded-xl">
                      <div className="text-sm text-gray-600 mb-2">Average in {propertyForDetailModal.aggregations.location.name}</div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Avg. Price:</span>
                        <span className="text-lg font-bold text-[#FF6600]">{formatPrice(propertyForDetailModal.aggregations.location.buyingPrice)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-medium">Avg. Price/m²:</span>
                        <span className="text-lg font-bold text-[#FF6600]">{formatPrice(propertyForDetailModal.aggregations.location.pricePerSqm)}</span>
                      </div>
                    </div>
                  )}
                  {propertyForDetailModal.aggregations.similarListing && (
                    <div className="bg-white p-4 rounded-xl">
                      <div className="text-sm text-gray-600 mb-2">Similar Listings</div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Avg. Price:</span>
                        <span className="text-lg font-bold text-[#FF6600]">{formatPrice(propertyForDetailModal.aggregations.similarListing.buyingPrice)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-medium">Avg. Price/m²:</span>
                        <span className="text-lg font-bold text-[#FF6600]">{formatPrice(propertyForDetailModal.aggregations.similarListing.pricePerSqm)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Area Information */}
            {propertyForDetailModal.locationFactor && (
              <div className="bg-green-50 p-6 rounded-2xl">
                <h3 className="font-semibold text-[#1C1C1C] mb-4 flex items-center gap-2 text-lg">
                  <span>📊</span>
                  <span>Area Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="text-gray-600">Population:</span>
                    <span className="font-semibold">{propertyForDetailModal.locationFactor.population?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="text-gray-600">University:</span>
                    <span className="font-semibold">{propertyForDetailModal.locationFactor.hasUniversity ? 'Yes ✓' : 'No'}</span>
                  </div>
                  {(propertyForDetailModal.locationFactor as any)?.unemploymentRate && (
                    <div className="flex justify-between items-center py-2 border-b border-green-200">
                      <span className="text-gray-600">Unemployment Rate:</span>
                      <span className="font-semibold">{((propertyForDetailModal.locationFactor as any).unemploymentRate as number).toFixed(1)}%</span>
                    </div>
                  )}
                  {(propertyForDetailModal.locationFactor as any)?.populationTrend && (
                    <div className="flex justify-between items-center py-2 border-b border-green-200">
                      <span className="text-gray-600">Population Trend:</span>
                      <span className="font-semibold">
                        {(propertyForDetailModal.locationFactor as any).populationTrend.from > 0 ? '↗️ Growing' : (propertyForDetailModal.locationFactor as any).populationTrend.from < 0 ? '↘️ Declining' : '→ Stable'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center col-span-full py-2">
                    <span className="text-gray-600">Location Score:</span>
                    <div className="flex items-center gap-3 flex-1 max-w-xs">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-green-500 rounded-full h-3 transition-all"
                          style={{ width: `${propertyForDetailModal.locationFactor.score}%` }}
                        ></div>
                      </div>
                      <span className="font-semibold">{propertyForDetailModal.locationFactor.score}/100</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  </>
  );
}
