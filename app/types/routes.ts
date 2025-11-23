// Type definitions for personalized housing routes

export interface Property {
  id: string;
  title: string;
  buyingPrice: number | null;
  rooms: number;
  squareMeter: number;
  pricePerSqm: number | null;
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
  [key: string]: any;
}

export interface UserProfile {
  age?: number;
  gender?: string;
  occupation?: string;
  monthlyIncome?: number;
  existingEquity?: number;
  familySize?: string;
  timeline?: string;
  location?: string;
  propertyType?: string;
  budget?: number;
  rooms?: string;
  sqm?: string;
}

export interface ActionStep {
  id: string;
  title: string;
  description: string;
  timeline: string;
  priority: 'high' | 'medium' | 'low';
  category: 'financial' | 'lifestyle' | 'education' | 'preparation';
  completed?: boolean;
}

export interface Milestone {
  date: string;
  title: string;
  description: string;
  amountSaved?: number;
  equityPercentage?: number;
}

export interface RiskFlag {
  type: 'warning' | 'caution' | 'opportunity';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  mitigation?: string;
}

export interface FinancialProjection {
  year: number;
  equity: number;
  savingsRate: number;
  estimatedIncome: number;
  monthlyPayment: number;
  totalSaved: number;
}

export interface NeighborhoodAlternative {
  location: string;
  averagePrice: number;
  pricePerSqm: number;
  commuteTime?: string;
  advantages: string[];
  tradeoffs: string[];
  affordabilityScore: number;
}

export interface PersonalizedRoute {
  id: string;
  name: string;
  type: 'fast-track' | 'balanced' | 'conservative' | 'alternative-lifestyle' | 'neighborhood-shift';
  description: string;
  tagline: string;
  
  // Core metrics
  targetPurchaseYear: number;
  monthsUntilPurchase: number;
  requiredEquity: number;
  monthlyPayment: number;
  totalCost: number;
  
  // Risk assessment
  riskScore: number;
  riskLevel: 'low' | 'moderate' | 'high';
  riskFlags: RiskFlag[];
  
  // Financial details
  downPaymentPercentage: number;
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  monthlySavingsRequired: number;
  financialProjections: FinancialProjection[];
  
  // Action plan
  actionSteps: ActionStep[];
  milestones: Milestone[];
  
  // Lifestyle considerations
  lifestyleImpact: string;
  workLifeBalance: string;
  familyConsiderations?: string;
  
  // Alternative options
  neighborhoodAlternatives?: NeighborhoodAlternative[];
  
  // Personalization
  futureSelfNarrative: string;
  personalizedInsights: string[];
  keyTradeoffs: string[];
  
  // Visualization
  color: string;
  icon: string;
  visualTimeline?: {
    phases: Array<{
      name: string;
      duration: number;
      description: string;
    }>;
  };
}

export interface RouteGenerationRequest {
  userProfile: UserProfile;
  selectedProperty: Property;
  budgetCalculation?: any;
  questionAnswers?: Record<string, string>;
}

export interface RouteGenerationResponse {
  routes: PersonalizedRoute[];
  summary: string;
  recommendedRouteId: string;
  generatedAt: string;
  considerations: string[];
}
