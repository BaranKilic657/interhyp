import React from 'react';
import type { PersonalizedRoute } from '../types/routes';

interface RouteDetailsProps {
  route: PersonalizedRoute;
}

export default function RouteDetails({ route }: RouteDetailsProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'financial': return '💰';
      case 'lifestyle': return '🏃';
      case 'education': return '📚';
      case 'preparation': return '📋';
      default: return '✓';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getRiskTypeIcon = (type: string) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'caution': return '⚡';
      case 'opportunity': return '💡';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="space-y-8">
      {/* Future Self Narrative */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 border-2 border-purple-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>🔮</span>
          <span>Your Future Self</span>
        </h3>
        <p className="text-lg text-gray-700 leading-relaxed italic">
          "{route.futureSelfNarrative}"
        </p>
      </div>

      {/* Financial Breakdown */}
      <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span>💼</span>
          <span>Financial Breakdown</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">Target Purchase Year:</span>
              <span className="text-xl font-bold text-[#FF6600]">{route.targetPurchaseYear}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">Total Property Cost:</span>
              <span className="text-xl font-bold text-gray-900">{formatPrice(route.totalCost)}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">Required Equity ({route.downPaymentPercentage}%):</span>
              <span className="text-xl font-bold text-green-600">{formatPrice(route.requiredEquity)}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">Loan Amount:</span>
              <span className="text-xl font-bold text-blue-600">{formatPrice(route.loanAmount)}</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">Interest Rate:</span>
              <span className="text-xl font-bold text-gray-900">{route.interestRate.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">Loan Term:</span>
              <span className="text-xl font-bold text-gray-900">{route.loanTerm} years</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">Monthly Payment:</span>
              <span className="text-xl font-bold text-[#FF6600]">{formatPrice(route.monthlyPayment)}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">Monthly Savings Needed:</span>
              <span className="text-xl font-bold text-purple-600">{formatPrice(route.monthlySavingsRequired)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Steps */}
      <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span>📋</span>
          <span>Your Action Plan</span>
        </h3>
        
        <div className="space-y-4">
          {route.actionSteps.map((step) => (
            <div
              key={step.id}
              className={`rounded-2xl p-6 border-l-4 ${getPriorityColor(step.priority)} transition-all hover:shadow-md`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getCategoryIcon(step.category)}</span>
                  <h4 className="text-lg font-bold text-gray-900">{step.title}</h4>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  step.priority === 'high' ? 'bg-red-200 text-red-800' :
                  step.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-blue-200 text-blue-800'
                }`}>
                  {step.priority}
                </span>
              </div>
              <p className="text-gray-700 mb-2">{step.description}</p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>⏱️</span>
                <span>{step.timeline}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones Timeline */}
      <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span>🎯</span>
          <span>Key Milestones</span>
        </h3>
        
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#FF6600] to-green-500"></div>
          
          <div className="space-y-8">
            {route.milestones.map((milestone, index) => (
              <div key={index} className="relative pl-20">
                {/* Timeline dot */}
                <div className={`absolute left-4 w-8 h-8 rounded-full flex items-center justify-center ${
                  index === 0 ? 'bg-[#FF6600]' :
                  index === route.milestones.length - 1 ? 'bg-green-500' :
                  'bg-blue-500'
                } text-white font-bold text-sm shadow-lg`}>
                  {index === route.milestones.length - 1 ? '🏠' : '✓'}
                </div>
                
                <div className="bg-gray-50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-bold text-gray-900">{milestone.title}</h4>
                    <span className="text-sm font-semibold text-gray-600">{milestone.date}</span>
                  </div>
                  <p className="text-gray-700 mb-2">{milestone.description}</p>
                  {milestone.amountSaved && (
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-600 font-bold">
                        {formatPrice(milestone.amountSaved)} saved
                      </span>
                      {milestone.equityPercentage && (
                        <span className="text-blue-600 font-bold">
                          {milestone.equityPercentage}% complete
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Flags */}
      {route.riskFlags.length > 0 && (
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span>⚠️</span>
            <span>Things to Watch</span>
          </h3>
          
          <div className="space-y-4">
            {route.riskFlags.map((flag, index) => (
              <div
                key={index}
                className={`rounded-2xl p-6 border-2 ${
                  flag.type === 'warning' ? 'border-red-300 bg-red-50' :
                  flag.type === 'caution' ? 'border-yellow-300 bg-yellow-50' :
                  'border-green-300 bg-green-50'
                }`}
              >
                <div className="flex items-start gap-3 mb-2">
                  <span className="text-3xl">{getRiskTypeIcon(flag.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-bold text-gray-900">{flag.title}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        flag.impact === 'high' ? 'bg-red-200 text-red-800' :
                        flag.impact === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-green-200 text-green-800'
                      }`}>
                        {flag.impact} impact
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3">{flag.description}</p>
                    {flag.mitigation && (
                      <div className="bg-white rounded-xl p-4 border-l-4 border-blue-500">
                        <p className="text-sm font-semibold text-gray-900 mb-1">💡 Mitigation Strategy:</p>
                        <p className="text-sm text-gray-700">{flag.mitigation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personalized Insights */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-8 border-2 border-blue-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span>💡</span>
          <span>Personalized Insights</span>
        </h3>
        
        <div className="space-y-3">
          {route.personalizedInsights.map((insight, index) => (
            <div key={index} className="flex items-start gap-3 bg-white rounded-xl p-4">
              <span className="text-blue-600 font-bold text-lg">•</span>
              <p className="text-gray-700 flex-1">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Tradeoffs */}
      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-3xl p-8 border-2 border-orange-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span>⚖️</span>
          <span>Key Tradeoffs</span>
        </h3>
        
        <div className="space-y-3">
          {route.keyTradeoffs.map((tradeoff, index) => (
            <div key={index} className="flex items-start gap-3 bg-white rounded-xl p-4">
              <span className="text-orange-600 font-bold text-lg">⚠</span>
              <p className="text-gray-700 flex-1">{tradeoff}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Neighborhood Alternatives (if available) */}
      {route.neighborhoodAlternatives && route.neighborhoodAlternatives.length > 0 && (
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span>🗺️</span>
            <span>Alternative Neighborhoods</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {route.neighborhoodAlternatives.map((neighborhood, index) => (
              <div key={index} className="border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all">
                <h4 className="text-xl font-bold text-gray-900 mb-4">{neighborhood.location}</h4>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Price:</span>
                    <span className="font-bold text-[#FF6600]">{formatPrice(neighborhood.averagePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per m²:</span>
                    <span className="font-bold">{formatPrice(neighborhood.pricePerSqm)}</span>
                  </div>
                  {neighborhood.commuteTime && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Commute Time:</span>
                      <span className="font-semibold">{neighborhood.commuteTime}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Affordability:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-full bg-green-500 rounded-full" 
                          style={{ width: `${neighborhood.affordabilityScore}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-sm">{neighborhood.affordabilityScore}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm font-semibold text-green-700 mb-2">✓ Advantages:</p>
                  <ul className="space-y-1">
                    {neighborhood.advantages.map((advantage, i) => (
                      <li key={i} className="text-sm text-gray-700 pl-4">• {advantage}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <p className="text-sm font-semibold text-orange-700 mb-2">⚠ Tradeoffs:</p>
                  <ul className="space-y-1">
                    {neighborhood.tradeoffs.map((tradeoff, i) => (
                      <li key={i} className="text-sm text-gray-700 pl-4">• {tradeoff}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial Projections Chart */}
      <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span>📊</span>
          <span>Financial Projection Timeline</span>
        </h3>
        
        <div className="space-y-4">
          {route.financialProjections.map((projection, index) => (
            <div key={index} className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-gray-900">{projection.year}</span>
                <span className="text-sm text-gray-600">
                  {Math.round(projection.savingsRate * 100)}% savings rate
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-xl p-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Equity Saved</p>
                  <p className="text-lg font-bold text-green-600">{formatPrice(projection.equity)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Est. Income</p>
                  <p className="text-lg font-bold text-blue-600">{formatPrice(projection.estimatedIncome)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Monthly Savings</p>
                  <p className="text-lg font-bold text-purple-600">{formatPrice(projection.monthlyPayment)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
