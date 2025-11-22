import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Ignore user input - always search for Rostock property
    const { location, budget, propertyType } = await request.json();

    console.log('=== PROPERTIES API CALLED ===');
    console.log('User Input - Location:', location);
    console.log('User Input - Budget:', budget);
    console.log('User Input - PropertyType:', propertyType);
    console.log('⚠️ OVERRIDING: Searching for Rostock HOUSEBUY instead');

    // OVERRIDE: Always search for the Rostock property
    const thinkImmoType = 'HOUSEBUY'; // Multi-family house
    const searchQuery = 'Rostock';
    const region = 'Mecklenburg-Vorpommern';

    console.log('Mapped - Type:', thinkImmoType);
    console.log('Mapped - Location:', searchQuery);
    console.log('Mapped - Region:', region);

    const requestBody: any = {
      active: true,
      type: thinkImmoType,
      sortBy: 'asc',
      sortKey: 'buyingPrice',
      from: 0,
      size: 50,
      geoSearches: {
        geoSearchQuery: searchQuery,
        geoSearchType: 'town',
        region: region
      }
    };

    console.log('ThinkImmo API Request Body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://thinkimmo-api.mgraetz.de/thinkimmo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('ThinkImmo API Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ThinkImmo API error response:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch properties', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    console.log('ThinkImmo API Response - Total results:', data.total);
    console.log('ThinkImmo API Response - Results count:', data.results?.length || 0);
    
    if (data.results && data.results.length > 0) {
      console.log('First property sample:', {
        title: data.results[0].title,
        price: data.results[0].buyingPrice,
        location: data.results[0].address?.city,
        rooms: data.results[0].rooms,
        sqm: data.results[0].squareMeter
      });
    }

    const finalResults = data.results || [];
    
    console.log('Final results to return:', finalResults.length);
    console.log('=== END PROPERTIES API ===\n');

    return NextResponse.json({
      total: finalResults.length,
      results: finalResults,
      debug: {
        originalTotal: data.total,
        finalCount: finalResults.length,
        searchQuery: searchQuery,
        region: region
      }
    });
  } catch (error) {
    console.error('Properties API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
