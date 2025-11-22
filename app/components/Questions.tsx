'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import MapComponent from './MapComponent';

export default function Questions() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [locationInput, setLocationInput] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [mapZoom, setMapZoom] = useState(4);
  const [mapCenter, setMapCenter] = useState({ lat: 51.1657, lng: 10.4515 });
  const [budgetValue, setBudgetValue] = useState('250000');
  const [roomsValue, setRoomsValue] = useState('3');
  const [sqmValue, setSqmValue] = useState('120');
  const [buyPriceValue, setBuyPriceValue] = useState('300000');
  const [constructionYearValue, setConstructionYearValue] = useState('2000');
  const [pricePerSqmValue, setPricePerSqmValue] = useState('2500');
  const suggestionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const germanStates: Record<string, { lat: number; lng: number; zoom: number }> = {
    'Baden-Württemberg': { lat: 48.6616, lng: 9.3501, zoom: 8 },
    'Bayern': { lat: 48.7758, lng: 11.4312, zoom: 8 },
    'Berlin': { lat: 52.5200, lng: 13.4050, zoom: 10 },
    'Brandenburg': { lat: 52.3667, lng: 13.6333, zoom: 8 },
    'Bremen': { lat: 53.0792, lng: 8.8412, zoom: 10 },
    'Hamburg': { lat: 53.5511, lng: 9.9937, zoom: 10 },
    'Hessen': { lat: 50.1109, lng: 9.6782, zoom: 8 },
    'Mecklenburg-Vorpommern': { lat: 53.6154, lng: 12.4289, zoom: 8 },
    'Niedersachsen': { lat: 52.6362, lng: 9.7974, zoom: 8 },
    'Nordrhein-Westfalen': { lat: 51.4556, lng: 7.0116, zoom: 8 },
    'Rheinland-Pfalz': { lat: 50.3520, lng: 7.5993, zoom: 8 },
    'Saarland': { lat: 49.2557, lng: 6.9623, zoom: 9 },
    'Sachsen': { lat: 51.1642, lng: 13.5467, zoom: 8 },
    'Sachsen-Anhalt': { lat: 51.8621, lng: 11.3944, zoom: 8 },
    'Schleswig-Holstein': { lat: 54.3319, lng: 10.1215, zoom: 8 },
    'Thüringen': { lat: 50.8364, lng: 10.6869, zoom: 8 },
  };

  const questions = [
    {
      id: 'propertyType',
      title: 'What type of property interests you?',
      options: [
        { value: 'apartment', label: 'Apartment', bgColor: 'bg-gradient-to-br from-purple-400 to-purple-600', icon: '🏢' },
        { value: 'house', label: 'House', bgColor: 'bg-gradient-to-br from-blue-400 to-blue-600', icon: '🏠' },
        { value: 'land', label: 'Land', bgColor: 'bg-gradient-to-br from-green-400 to-green-600', icon: '🌍' },
        { value: 'garage', label: 'Garage', bgColor: 'bg-gradient-to-br from-yellow-400 to-yellow-600', icon: '🚗' },
        { value: 'office', label: 'Office', bgColor: 'bg-gradient-to-br from-red-400 to-red-600', icon: '💼' },
        { value: 'dont-know', label: 'Don\'t know yet', bgColor: 'bg-gradient-to-br from-gray-400 to-gray-600', icon: '❓' },
      ],
    },
    {
      id: 'location',
      title: 'Where do you want to build/buy?',
      isMapQuestion: true,
    },
    {
      id: 'propertyDetails',
      title: 'Tell us more about what you\'re looking for',
      isPropertyDetailsQuestion: true,
    },
    {
      id: 'timeline',
      title: 'What is your timeline for buying?',
      options: [
        { value: 'within-6m', label: 'Within the next 6 months', bgColor: 'bg-gradient-to-br from-red-400 to-red-600', icon: '⏱️' },
        { value: '6m-1y', label: 'In 6-12 months', bgColor: 'bg-gradient-to-br from-orange-400 to-orange-600', icon: '📅' },
        { value: '1-2y', label: 'In 1-2 years', bgColor: 'bg-gradient-to-br from-yellow-400 to-yellow-600', icon: '🗓️' },
        { value: 'open', label: 'No specific timeline', bgColor: 'bg-gradient-to-br from-gray-400 to-gray-600', icon: '∞' },
      ],
    },
    {
      id: 'familySize',
      title: 'How many people will live in the property?',
      options: [
        { value: '1', label: '1 person', bgColor: 'bg-gradient-to-br from-violet-400 to-violet-600', icon: '👤' },
        { value: '2', label: '2 people', bgColor: 'bg-gradient-to-br from-fuchsia-400 to-fuchsia-600', icon: '👥' },
        { value: '3-4', label: '3-4 people', bgColor: 'bg-gradient-to-br from-rose-400 to-rose-600', icon: '👨‍👩‍👧' },
        { value: '5+', label: '5 or more people', bgColor: 'bg-gradient-to-br from-pink-400 to-pink-600', icon: '👨‍👩‍👧‍👦' },
      ],
    },
  ];

  const handleLocationChange = (input: string) => {
    setLocationInput(input);
    
    // Clear previous timer
    if (suggestionTimerRef.current) {
      clearTimeout(suggestionTimerRef.current);
    }

    if (input.length > 1) {
      // Debounce with shorter delay (200ms)
      suggestionTimerRef.current = setTimeout(() => {
        // Use better Nominatim parameters for German locations
        fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&countrycodes=de&limit=12&type=city,town,village,postcode,suburb,district&namedetails=1`
        )
          .then((res) => res.json())
          .then((data) => {
            if (data && data.length > 0) {
              // Sort and filter intelligently
              const processedSuggestions = data
                .map((item: any) => ({
                  name: item.name,
                  type: item.type,
                  importance: item.importance || 0,
                  isPrefixMatch: item.name.toLowerCase().startsWith(input.toLowerCase()),
                }))
                // Prioritize prefix matches and more important results
                .sort((a: any, b: any) => {
                  if (a.isPrefixMatch !== b.isPrefixMatch) {
                    return a.isPrefixMatch ? -1 : 1;
                  }
                  return b.importance - a.importance;
                })
                // Remove duplicates and get unique names
                .filter((item: any, index: number, self: any) => 
                  index === self.findIndex((t: any) => t.name === item.name)
                )
                .slice(0, 8) // Limit to 8 suggestions
                .map((item: any) => item.name);

              setLocationSuggestions(processedSuggestions);
            } else {
              setLocationSuggestions([]);
            }
          })
          .catch(() => setLocationSuggestions([]));
      }, 200); // Faster debounce
    } else {
      setLocationSuggestions([]);
    }
    
    // Check if input matches a state
    for (const [state, coords] of Object.entries(germanStates)) {
      if (state.toLowerCase().includes(input.toLowerCase()) || input.toLowerCase().includes(state.toLowerCase())) {
        setMapCenter(coords);
        setMapZoom(coords.zoom);
        break;
      }
    }
  };

  const handleAnswer = (value: string) => {
    setAnswers({
      ...answers,
      [questions[currentQuestion].id]: value,
    });

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setLocationInput('');
      setMapZoom(4);
      setMapCenter({ lat: 51.1657, lng: 10.4515 });
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleFinish = () => {
    console.log('Answers:', answers);
  };

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <main className="flex-1 bg-white">
      <section className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-7xl">
          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-700">
                Question {currentQuestion + 1} of {questions.length}
              </h2>
              <span className="text-sm font-medium text-[#FF6600]">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-[#FF6600] h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Question Title */}
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-[#1C1C1C] leading-tight">
              {question.title}
            </h1>
          </div>

          {/* Location Question with Map */}
          {question.isMapQuestion ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Input Section */}
              <div className="flex flex-col justify-center space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    State, City or Postal Code
                  </label>
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    placeholder="e.g., München, Berlin, 80331, Charlottenburg..."
                    className="w-full px-6 py-4 rounded-2xl border-2 border-gray-200 focus:border-[#FF6600] focus:outline-none text-lg font-medium transition-colors placeholder:text-gray-500 text-black"
                  />
                  
                  {/* Autocomplete Suggestions */}
                  {locationInput && locationSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-lg z-50">
                      {locationSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleLocationChange(suggestion)}
                          className="w-full text-left px-6 py-3 hover:bg-gray-100 border-b border-gray-100 last:border-b-0 text-black font-medium transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Enter a German state name, city, or postal code to see it on the map.
                </p>
              </div>

              <div className="relative h-screen md:h-[600px] rounded-3xl overflow-hidden shadow-lg">
                <MapComponent location={locationInput || 'Germany'} zoom={mapZoom} />
              </div>
            </div>
          ) : question.isPropertyDetailsQuestion ? (
            /* Combined Property Details: Buy Price, Square Meters, Construction Year, Price per m² */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {/* Buy Price Section */}
              <div className="space-y-4 p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">💶</span> Buy Price
                </h3>
                <label className="block text-sm font-medium text-gray-700">
                  Price in EUR
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-600">€</span>
                  <input
                    type="number"
                    value={buyPriceValue}
                    onChange={(e) => {
                      const value = Math.min(Math.max(parseInt(e.target.value) || 0, 50000), 10000000).toString();
                      setBuyPriceValue(value);
                    }}
                    placeholder="Enter price"
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-[#FF6600] focus:outline-none font-bold transition-colors placeholder:text-gray-400 text-black"
                  />
                </div>

                <div className="space-y-2">
                  <input
                    type="range"
                    min="50000"
                    max="10000000"
                    step="50000"
                    value={buyPriceValue}
                    onChange={(e) => setBuyPriceValue(e.target.value)}
                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #FF6600 0%, #FF6600 ${
                        ((parseInt(buyPriceValue) - 50000) / (10000000 - 50000)) * 100
                      }%, #E5E7EB ${((parseInt(buyPriceValue) - 50000) / (10000000 - 50000)) * 100}%, #E5E7EB 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>€50k</span>
                    <span>€10M</span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-[#FF6600] pt-2">
                  €{Number(buyPriceValue).toLocaleString('de-DE')}
                </p>
              </div>

              {/* Square Meters Section */}
              <div className="space-y-4 p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">📐</span> Square Meters
                </h3>
                <label className="block text-sm font-medium text-gray-700">
                  Size in m²
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="number"
                    value={sqmValue}
                    onChange={(e) => {
                      const value = Math.min(Math.max(parseInt(e.target.value) || 30, 30), 2000).toString();
                      setSqmValue(value);
                    }}
                    placeholder="m²"
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-[#FF6600] focus:outline-none font-bold transition-colors placeholder:text-gray-400 text-black"
                  />
                </div>

                <div className="space-y-2">
                  <input
                    type="range"
                    min="30"
                    max="2000"
                    step="10"
                    value={sqmValue}
                    onChange={(e) => setSqmValue(e.target.value)}
                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #FF6600 0%, #FF6600 ${
                        ((parseInt(sqmValue) - 30) / (2000 - 30)) * 100
                      }%, #E5E7EB ${((parseInt(sqmValue) - 30) / (2000 - 30)) * 100}%, #E5E7EB 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>30 m²</span>
                    <span>2000 m²</span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-[#FF6600] pt-2">
                  {sqmValue} m²
                </p>
              </div>

              {/* Construction Year Section */}
              <div className="space-y-4 p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-3xl">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">🏗️</span> Construction Year
                </h3>
                <label className="block text-sm font-medium text-gray-700">
                  Year Built
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="number"
                    value={constructionYearValue}
                    onChange={(e) => {
                      const value = Math.min(Math.max(parseInt(e.target.value) || 1900, 1900), 2024).toString();
                      setConstructionYearValue(value);
                    }}
                    placeholder="Year"
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-[#FF6600] focus:outline-none font-bold transition-colors placeholder:text-gray-400 text-black"
                  />
                </div>

                <div className="space-y-2">
                  <input
                    type="range"
                    min="1900"
                    max="2024"
                    step="1"
                    value={constructionYearValue}
                    onChange={(e) => setConstructionYearValue(e.target.value)}
                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #FF6600 0%, #FF6600 ${
                        ((parseInt(constructionYearValue) - 1900) / (2024 - 1900)) * 100
                      }%, #E5E7EB ${((parseInt(constructionYearValue) - 1900) / (2024 - 1900)) * 100}%, #E5E7EB 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>1900</span>
                    <span>2024</span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-[#FF6600] pt-2">
                  {constructionYearValue}
                </p>
              </div>

              {/* Price per m² Section */}
              <div className="space-y-4 p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-3xl">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">💰</span> Price per m²
                </h3>
                <label className="block text-sm font-medium text-gray-700">
                  EUR per m²
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-600">€</span>
                  <input
                    type="number"
                    value={pricePerSqmValue}
                    onChange={(e) => {
                      const value = Math.min(Math.max(parseInt(e.target.value) || 0, 500), 50000).toString();
                      setPricePerSqmValue(value);
                    }}
                    placeholder="EUR/m²"
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-[#FF6600] focus:outline-none font-bold transition-colors placeholder:text-gray-400 text-black"
                  />
                </div>

                <div className="space-y-2">
                  <input
                    type="range"
                    min="500"
                    max="50000"
                    step="500"
                    value={pricePerSqmValue}
                    onChange={(e) => setPricePerSqmValue(e.target.value)}
                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #FF6600 0%, #FF6600 ${
                        ((parseInt(pricePerSqmValue) - 500) / (50000 - 500)) * 100
                      }%, #E5E7EB ${((parseInt(pricePerSqmValue) - 500) / (50000 - 500)) * 100}%, #E5E7EB 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>€500/m²</span>
                    <span>€50k/m²</span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-[#FF6600] pt-2">
                  €{Number(pricePerSqmValue).toLocaleString('de-DE')}/m²
                </p>
              </div>
            </div>
          ) : (
            /* Options Grid - Apple Style */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
              {question.options?.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className={`relative h-56 rounded-3xl overflow-hidden transition-all duration-300 cursor-pointer group ${
                    answers[question.id] === option.value
                      ? 'ring-4 ring-[#FF6600] shadow-2xl scale-105'
                      : 'hover:shadow-xl'
                  } ${option.bgColor}`}
                >
                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white z-10">
                    <div className="text-6xl mb-4">{option.icon}</div>
                    <p className="text-xl font-semibold text-center leading-tight">{option.label}</p>
                  </div>

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300"></div>

                  {/* Selected Badge */}
                  {answers[question.id] === option.value && (
                    <div className="absolute top-4 right-4 bg-white rounded-full p-2 z-20">
                      <svg className="w-5 h-5 text-[#FF6600]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className={`px-8 py-3 rounded-2xl font-semibold transition-all duration-200 ${
                currentQuestion === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-[#1C1C1C] hover:bg-gray-200 active:scale-95'
              }`}
            >
              Back
            </button>

            <div className="flex-1 flex justify-end">
              {question.isMapQuestion ? (
                <button
                  onClick={() => {
                    if (locationInput.trim()) {
                      setAnswers({
                        ...answers,
                        [questions[currentQuestion].id]: locationInput,
                      });
                      if (currentQuestion < questions.length - 1) {
                        setCurrentQuestion(currentQuestion + 1);
                      }
                    }
                  }}
                  disabled={!locationInput.trim()}
                  className={`px-8 py-3 rounded-2xl font-semibold transition-all duration-200 ${
                    !locationInput.trim()
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-[#FF6600] text-white hover:bg-[#E55A00] active:scale-95 shadow-lg shadow-orange-200/50'
                  }`}
                >
                  Next
                </button>
              ) : question.isPropertyDetailsQuestion ? (
                <button
                  onClick={() => {
                    setAnswers({
                      ...answers,
                      'buyPrice': buyPriceValue,
                      'squareMeters': sqmValue,
                      'constructionYear': constructionYearValue,
                      'pricePerSqm': pricePerSqmValue,
                    });
                    if (currentQuestion < questions.length - 1) {
                      setCurrentQuestion(currentQuestion + 1);
                    }
                  }}
                  className="px-8 py-3 bg-[#FF6600] text-white rounded-2xl font-semibold hover:bg-[#E55A00] transition-all duration-200 active:scale-95 shadow-lg shadow-orange-200/50"
                >
                  {currentQuestion === questions.length - 1 ? 'Show Results' : 'Next'}
                </button>
              ) : currentQuestion === questions.length - 1 ? (
                <Link 
                  href={`/results?propertyType=${encodeURIComponent(answers.propertyType || '')}&location=${encodeURIComponent(answers.location || locationInput)}&budget=${encodeURIComponent(answers.budget || '')}&timeline=${encodeURIComponent(answers.timeline || '')}&familySize=${encodeURIComponent(answers.familySize || '')}`}
                >
                  <button
                    onClick={handleFinish}
                    className="px-8 py-3 bg-[#FF6600] text-white rounded-2xl font-semibold hover:bg-[#E55A00] transition-all duration-200 active:scale-95 shadow-lg shadow-orange-200/50"
                  >
                    Show Results
                  </button>
                </Link>
              ) : (
                <button
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                  disabled={!answers[question.id]}
                  className={`px-8 py-3 rounded-2xl font-semibold transition-all duration-200 ${
                    !answers[question.id]
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-[#FF6600] text-white hover:bg-[#E55A00] active:scale-95 shadow-lg shadow-orange-200/50'
                  }`}
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
