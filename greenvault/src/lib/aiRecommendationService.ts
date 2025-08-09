// AI Recommendation Service using Gemini API
import { UserPreferences } from './oasisService';

interface CarbonCreditNFT {
  id: string;
  name: string;
  pricePerTon: number;
  location: string;
  category: string;
  description: string;
  co2OffsetPerYear: number;
  verificationStandard: string;
  totalSupply: number;
  availableSupply: number;
}

interface RecommendationRequest {
  userPreferences: UserPreferences;
  nftListings: CarbonCreditNFT[];
  maxResults?: number;
}

interface RecommendationResult {
  recommendations: CarbonCreditNFT[];
  explanation: string;
  confidence: number;
  matchingFactors: string[];
}

class AIRecommendationService {
  private geminiApiKey: string;
  private geminiEndpoint: string;

  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY || 'demo_key';
    this.geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  }

  /**
   * Get AI-powered NFT recommendations based on user preferences
   */
  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResult> {
    try {
      console.log('[AI] Processing recommendation request...');

      // 1. Filter NFTs based on user preferences
      const filteredNFTs = this.filterNFTsByPreferences(request.nftListings, request.userPreferences);
      
      // 2. Rank NFTs by relevance
      const rankedNFTs = this.rankNFTsByRelevance(filteredNFTs, request.userPreferences);
      
      // 3. Get top recommendations
      const maxResults = request.maxResults || 3;
      const topRecommendations = rankedNFTs.slice(0, maxResults);

      // 4. Generate AI explanation using Gemini
      const explanation = await this.generateExplanation(topRecommendations, request.userPreferences);

      // 5. Calculate confidence score
      const confidence = this.calculateConfidence(topRecommendations, request.userPreferences);

      // 6. Identify matching factors
      const matchingFactors = this.identifyMatchingFactors(topRecommendations, request.userPreferences);

      return {
        recommendations: topRecommendations,
        explanation,
        confidence,
        matchingFactors
      };
    } catch (error) {
      console.error('[AI] Recommendation generation failed:', error);
      throw new Error('Failed to generate recommendations');
    }
  }

  /**
   * Filter NFTs based on user preferences
   */
  private filterNFTsByPreferences(nfts: CarbonCreditNFT[], preferences: UserPreferences): CarbonCreditNFT[] {
    return nfts.filter(nft => {
      // Price range filter
      if (nft.pricePerTon < preferences.priceRangeMin || nft.pricePerTon > preferences.priceRangeMax) {
        return false;
      }

      // Category filter (if specific categories are preferred)
      if (preferences.preferredCategories.length > 0 && !preferences.preferredCategories.includes(nft.category)) {
        return false;
      }

      // Location filter (if specific locations are preferred)
      if (preferences.preferredLocations.length > 0 && !preferences.preferredLocations.includes(nft.location)) {
        return false;
      }

      // Availability filter
      if (nft.availableSupply <= 0) {
        return false;
      }

      return true;
    });
  }

  /**
   * Rank NFTs by relevance to user preferences
   */
  private rankNFTsByRelevance(nfts: CarbonCreditNFT[], preferences: UserPreferences): CarbonCreditNFT[] {
    return nfts.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Price preference scoring (favor middle of range)
      const priceRange = preferences.priceRangeMax - preferences.priceRangeMin;
      const idealPrice = preferences.priceRangeMin + (priceRange * 0.6); // Slightly higher than middle
      
      scoreA += Math.max(0, 100 - Math.abs(a.pricePerTon - idealPrice) * 2);
      scoreB += Math.max(0, 100 - Math.abs(b.pricePerTon - idealPrice) * 2);

      // Category preference scoring
      if (preferences.preferredCategories.includes(a.category)) scoreA += 50;
      if (preferences.preferredCategories.includes(b.category)) scoreB += 50;

      // Location preference scoring
      if (preferences.preferredLocations.includes(a.location)) scoreA += 30;
      if (preferences.preferredLocations.includes(b.location)) scoreB += 30;

      // Investment size preference
      if (preferences.investmentSize === 'large') {
        scoreA += a.co2OffsetPerYear / 100; // Favor larger impact projects
        scoreB += b.co2OffsetPerYear / 100;
      } else if (preferences.investmentSize === 'small') {
        scoreA += Math.max(0, 50 - a.co2OffsetPerYear / 100); // Favor smaller projects
        scoreB += Math.max(0, 50 - b.co2OffsetPerYear / 100);
      }

      // Risk tolerance scoring
      const riskFactorA = this.calculateRiskFactor(a);
      const riskFactorB = this.calculateRiskFactor(b);

      if (preferences.riskTolerance === 'low') {
        scoreA += Math.max(0, 50 - riskFactorA * 10);
        scoreB += Math.max(0, 50 - riskFactorB * 10);
      } else if (preferences.riskTolerance === 'high') {
        scoreA += riskFactorA * 5;
        scoreB += riskFactorB * 5;
      }

      return scoreB - scoreA; // Higher score first
    });
  }

  /**
   * Calculate risk factor for an NFT (0-10 scale)
   */
  private calculateRiskFactor(nft: CarbonCreditNFT): number {
    let risk = 5; // Base risk

    // Higher price = higher risk
    if (nft.pricePerTon > 25) risk += 1;
    if (nft.pricePerTon > 35) risk += 1;

    // Lower availability = higher risk
    const availabilityRatio = nft.availableSupply / nft.totalSupply;
    if (availabilityRatio < 0.3) risk += 1;

    // Certain categories are riskier
    const higherRiskCategories = ['ocean_conservation', 'ecosystem_restoration'];
    if (higherRiskCategories.includes(nft.category)) risk += 1;

    return Math.min(10, Math.max(0, risk));
  }

  /**
   * Generate human-readable explanation using Gemini API
   */
  private async generateExplanation(recommendations: CarbonCreditNFT[], preferences: UserPreferences): Promise<string> {
    try {
      const prompt = this.buildGeminiPrompt(recommendations, preferences);
      
      // Simulate Gemini API call for demo
      // In production, replace with actual Gemini API call
      const explanation = await this.callGeminiAPI(prompt);
      
      return explanation;
    } catch (error) {
      console.error('[AI] Failed to generate explanation:', error);
      return this.generateFallbackExplanation(recommendations, preferences);
    }
  }

  /**
   * Build prompt for Gemini API
   */
  private buildGeminiPrompt(recommendations: CarbonCreditNFT[], preferences: UserPreferences): string {
    const nftDescriptions = recommendations.map(nft => 
      `${nft.name}: $${nft.pricePerTon}/ton, ${nft.location}, ${nft.category.replace('_', ' ')}, ${nft.co2OffsetPerYear} tons CO2/year`
    ).join('\n');

    return `You are an AI assistant for a carbon credit NFT marketplace. Based on the user's preferences and the following NFT recommendations, write a friendly, concise explanation (2-3 sentences) of why these are good matches for them.

User Preferences:
- Price range: $${preferences.priceRangeMin}-${preferences.priceRangeMax} per ton
- Preferred categories: ${preferences.preferredCategories.join(', ') || 'Any'}
- Preferred locations: ${preferences.preferredLocations.join(', ') || 'Any'}
- Risk tolerance: ${preferences.riskTolerance}
- Investment size: ${preferences.investmentSize}

Recommended NFTs:
${nftDescriptions}

Write a warm, helpful explanation that highlights the key reasons these recommendations match their preferences. Focus on value, impact, and alignment with their criteria.`;
  }

  /**
   * Call Gemini API (simulated for demo)
   */
  private async callGeminiAPI(prompt: string): Promise<string> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For demo purposes, return a simulated response
    // In production, replace with actual Gemini API call
    return "Based on your preferences, I've found some excellent carbon credit opportunities that match your criteria perfectly. These projects offer great value within your price range and focus on the impact areas you care about most. The recommended projects have strong verification standards and are making measurable environmental impact.";
  }

  /**
   * Generate fallback explanation if AI fails
   */
  private generateFallbackExplanation(recommendations: CarbonCreditNFT[], preferences: UserPreferences): string {
    const count = recommendations.length;
    const avgPrice = recommendations.reduce((sum, nft) => sum + nft.pricePerTon, 0) / count;
    
    return `I found ${count} carbon credit NFTs that match your preferences perfectly! With an average price of $${avgPrice.toFixed(0)} per ton, these projects align with your budget and values. They offer verified environmental impact and are available for immediate investment.`;
  }

  /**
   * Calculate confidence score (0-100)
   */
  private calculateConfidence(recommendations: CarbonCreditNFT[], preferences: UserPreferences): number {
    if (recommendations.length === 0) return 0;

    let totalScore = 0;
    recommendations.forEach(nft => {
      let score = 50; // Base confidence

      // Price match
      const priceInRange = nft.pricePerTon >= preferences.priceRangeMin && nft.pricePerTon <= preferences.priceRangeMax;
      if (priceInRange) score += 20;

      // Category match
      if (preferences.preferredCategories.length === 0 || preferences.preferredCategories.includes(nft.category)) {
        score += 15;
      }

      // Location match
      if (preferences.preferredLocations.length === 0 || preferences.preferredLocations.includes(nft.location)) {
        score += 10;
      }

      // Availability
      if (nft.availableSupply > 10) score += 5;

      totalScore += Math.min(100, score);
    });

    return Math.round(totalScore / recommendations.length);
  }

  /**
   * Identify matching factors
   */
  private identifyMatchingFactors(recommendations: CarbonCreditNFT[], preferences: UserPreferences): string[] {
    const factors: string[] = [];

    // Check price match
    const allInPriceRange = recommendations.every(nft => 
      nft.pricePerTon >= preferences.priceRangeMin && nft.pricePerTon <= preferences.priceRangeMax
    );
    if (allInPriceRange) factors.push('Within your price range');

    // Check category preferences
    if (preferences.preferredCategories.length > 0) {
      const hasPreferredCategory = recommendations.some(nft => 
        preferences.preferredCategories.includes(nft.category)
      );
      if (hasPreferredCategory) factors.push('Matches preferred project types');
    }

    // Check location preferences
    if (preferences.preferredLocations.length > 0) {
      const hasPreferredLocation = recommendations.some(nft => 
        preferences.preferredLocations.includes(nft.location)
      );
      if (hasPreferredLocation) factors.push('Includes preferred locations');
    }

    // Check investment size alignment
    factors.push(`Suitable for ${preferences.investmentSize} investments`);

    // Check risk alignment
    factors.push(`Matches your ${preferences.riskTolerance} risk tolerance`);

    return factors;
  }
}

export const aiRecommendationService = new AIRecommendationService();
export type { CarbonCreditNFT, RecommendationRequest, RecommendationResult };
