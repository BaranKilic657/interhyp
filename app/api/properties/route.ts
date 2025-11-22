import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { 
      location,
      budget,
      rooms,
      sqm,
      propertyType,
      type,
      maxPrice,
      minPrice,
      size = 20,
      sortBy = 'asc',
      sortKey = 'buyingPrice'
    } = await request.json();

    console.log('=== PROPERTIES API CALLED ===');
    console.log('Location:', location);
    console.log('Budget:', budget);
    console.log('Rooms:', rooms);
    console.log('Sqm:', sqm);
    console.log('Property Type:', propertyType);

    if (!location) {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      );
    }

    // Determine the property type for ThinkImmo API
    // Map frontend property types to API types
    const apiType = type || (propertyType === 'house' ? 'HOUSEBUY' : 'APPARTMENTBUY');

    // Prepare the payload for ThinkImmo API
    const payload: any = {
      active: true,
      type: apiType,
      from: 0,
      size: size,
      sortBy: sortBy,
      sortKey: sortKey,
      geoSearches: {
        geoSearchQuery: location,
        geoSearchType: "town",
        region: ""
      }
    };

    // Add price filters
    // Use budget as maxPrice if provided, otherwise use explicit maxPrice
    if (budget) {
      payload.maxPrice = budget;
    } else if (maxPrice) {
      payload.maxPrice = maxPrice;
    }
    
    if (minPrice) {
      payload.minPrice = minPrice;
    }

    // Add room filter if provided
    if (rooms) {
      payload.minRooms = Math.max(1, rooms - 1); // Allow one room less
      payload.maxRooms = rooms + 2; // Allow up to 2 rooms more
    }

    // Add size filter if provided
    if (sqm) {
      payload.minSquareMeter = Math.max(20, sqm - 20); // Allow 20 sqm less
      payload.maxSquareMeter = sqm + 30; // Allow 30 sqm more
    }

    console.log('ThinkImmo Request:', JSON.stringify(payload, null, 2));

    // Call ThinkImmo API
    const response = await fetch('https://thinkimmo-api.mgraetz.de/thinkimmo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('ThinkImmo API Error:', response.status, response.statusText);
      return NextResponse.json(
        { 
          error: 'Failed to fetch properties', 
          status: response.status,
          results: [],
          total: 0,
          debug: {
            payload,
            apiStatus: response.status
          }
        },
        { status: 200 } // Return 200 so frontend doesn't break
      );
    }

    const data = await response.json();
    
    console.log('ThinkImmo Response:', {
      total: data.total,
      resultsCount: data.results?.length || 0
    });

    // Return the properties data in the format the frontend expects
    return NextResponse.json({
      total: data.total || 0,
      results: data.results || [],
      location: location,
      debug: {
        requestParams: { location, budget, rooms, sqm, propertyType },
        thinkImmoPayload: payload,
        resultsCount: data.results?.length || 0
      }
    });

  } catch (error) {
    console.error('Properties API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        results: [],
        total: 0
      },
      { status: 200 } // Return 200 so frontend doesn't break completely
    );
  }
}
