import { NextRequest, NextResponse } from 'next/server';
import { aiRecommendationService } from '@/lib/aiRecommendationService';
import { oasisService } from '@/lib/oasisService';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, maxResults = 3 } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('[API] Getting AI recommendations for user:', userId);

    // 1. Get user preferences from Oasis
    const userPreferences = await oasisService.getUserPreferences(userId);
    
    if (!userPreferences) {
      return NextResponse.json(
        { success: false, error: 'User preferences not found. Please set up your preferences first.' },
        { status: 404 }
      );
    }

    // 2. Load NFT listings from mock dataset
    const dataPath = path.join(process.cwd(), 'mock_data', 'carbon-credits-nft-dataset.json');
    const fileContent = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(fileContent);
    const nftListings = data.carbonCreditNFTs;

    console.log('[API] Loaded', nftListings.length, 'NFT listings');

    // 3. Get AI recommendations
    const recommendations = await aiRecommendationService.getRecommendations({
      userPreferences,
      nftListings,
      maxResults
    });

    console.log('[API] Generated', recommendations.recommendations.length, 'recommendations');

    return NextResponse.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('[API] Failed to get recommendations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    console.log('[API] Getting filtered NFT listings');

    // Load NFT listings from mock dataset
    const dataPath = path.join(process.cwd(), 'mock_data', 'carbon-credits-nft-dataset.json');
    const fileContent = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(fileContent);
    let nftListings = data.carbonCreditNFTs;

    // Apply filters
    if (category && category !== 'all') {
      nftListings = nftListings.filter((nft: any) => nft.category === category);
    }

    if (location && location !== 'all') {
      nftListings = nftListings.filter((nft: any) => nft.location === location);
    }

    if (minPrice) {
      nftListings = nftListings.filter((nft: any) => nft.pricePerTon >= Number(minPrice));
    }

    if (maxPrice) {
      nftListings = nftListings.filter((nft: any) => nft.pricePerTon <= Number(maxPrice));
    }

    // If user ID is provided, try to get personalized ranking
    if (userId) {
      try {
        const userPreferences = await oasisService.getUserPreferences(userId);
        if (userPreferences) {
          // Use AI service to rank results
          const recommendations = await aiRecommendationService.getRecommendations({
            userPreferences,
            nftListings,
            maxResults: nftListings.length
          });
          nftListings = recommendations.recommendations;
        }
      } catch (error) {
        console.log('[API] Could not personalize results, using default order');
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        listings: nftListings,
        count: nftListings.length
      }
    });
  } catch (error) {
    console.error('[API] Failed to get NFT listings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get listings' },
      { status: 500 }
    );
  }
}
