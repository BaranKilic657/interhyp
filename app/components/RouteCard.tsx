import React from 'react';
import type { PersonalizedRoute } from '../types/routes';

interface RouteCardProps {
  route: PersonalizedRoute;
  isRecommended?: boolean;
  onSelect: () => void;
  isSelected?: boolean;
}

export default function RouteCard({ route, isRecommended, onSelect, isSelected }: RouteCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDuration = (months: number) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) {
      return `${months} months`;
    } else if (remainingMonths === 0) {
      return `${years} ${years === 1 ? 'year' : 'years'}`;
    } else {
      return `${years}y ${remainingMonths}m`;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`relative rounded-3xl overflow-hidden transition-all duration-300 cursor-pointer group ${
        isSelected
          ? 'ring-4 ring-[#FF6600] shadow-2xl scale-105'
          : 'hover:shadow-xl hover:scale-102'
      } ${isRecommended ? 'border-4 border-green-500' : ''}`}
    >
      {isRecommended && (
        <div className="absolute top-0 left-0 right-0 bg-green-500 text-white text-center py-2 px-4 text-sm font-bold z-10">
          ⭐ RECOMMENDED FOR YOU
        </div>
      )}
      
      <div className={`bg-gradient-to-br ${route.color} p-8 text-white ${isRecommended ? 'pt-16' : 'pt-8'} min-h-[550px] flex flex-col`}>
        <div className="text-6xl mb-4">{route.icon}</div>
        <h3 className="text-3xl font-bold mb-2">{route.name}</h3>
        <p className="text-lg opacity-90 mb-2">{route.tagline}</p>
        <p className="text-sm opacity-80 mb-6">{route.description}</p>
        
        <div className="space-y-4 flex-1">
          {/* Timeline */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="text-xs opacity-80 mb-1">Target Purchase</div>
            <div className="text-2xl font-bold">{route.targetPurchaseYear}</div>
            <div className="text-sm opacity-90">{formatDuration(route.monthsUntilPurchase)}</div>
          </div>

          {/* Financial Overview */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="text-xs opacity-80 mb-2">Financial Overview</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Required Equity:</span>
                <span className="font-bold">{formatPrice(route.requiredEquity)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Monthly Payment:</span>
                <span className="font-bold">{formatPrice(route.monthlyPayment)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Monthly Savings:</span>
                <span className="font-bold">{formatPrice(route.monthlySavingsRequired)}</span>
              </div>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="text-xs opacity-80 mb-2">Risk Assessment</div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm capitalize">{route.riskLevel} Risk</span>
              <span className="text-sm font-bold">{route.riskScore}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${route.riskScore}%` }}
              ></div>
            </div>
          </div>

          {/* Lifestyle Impact */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="text-xs opacity-80 mb-1">Lifestyle Impact</div>
            <div className="text-sm">{route.lifestyleImpact}</div>
          </div>
        </div>

        {isSelected && (
          <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <span className="text-sm font-semibold">✓ Selected - View Details Below</span>
          </div>
        )}
      </div>
    </div>
  );
}
