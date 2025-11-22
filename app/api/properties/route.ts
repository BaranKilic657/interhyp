import { NextRequest, NextResponse } from 'next/server';

// Map English and international city names to German names for API compatibility
const cityNameMapping: Record<string, string> = {
  // Major German cities
  'munich': 'München',
  'cologne': 'Köln',
  'nuremberg': 'Nürnberg',
  'frankfurt': 'Frankfurt am Main',
  'hanover': 'Hannover',
  'brunswick': 'Braunschweig',
  'ratisbon': 'Regensburg',
  'ratisbonne': 'Regensburg',
  'augsburg': 'Augsburg',
  'stuttgart': 'Stuttgart',
  'dusseldorf': 'Düsseldorf',
  'dortmund': 'Dortmund',
  'essen': 'Essen',
  'bremen': 'Bremen',
  'dresden': 'Dresden',
  'leipzig': 'Leipzig',
  'hamburg': 'Hamburg',
  'berlin': 'Berlin',
  'bonn': 'Bonn',
  'mannheim': 'Mannheim',
  'karlsruhe': 'Karlsruhe',
  'wiesbaden': 'Wiesbaden',
  'munster': 'Münster',
  'freiburg': 'Freiburg im Breisgau',
  'lubeck': 'Lübeck',
  'erfurt': 'Erfurt',
  'mainz': 'Mainz',
  'kiel': 'Kiel',
  'kassel': 'Kassel',
  'halle': 'Halle (Saale)',
  'magdeburg': 'Magdeburg',
  'chemnitz': 'Chemnitz',
  'heidelberg': 'Heidelberg',
  'potsdam': 'Potsdam',
  'wurzburg': 'Würzburg',
  'gottingen': 'Göttingen',
  'ulm': 'Ulm',
  'aachen': 'Aachen',
  'bielefeld': 'Bielefeld',
  'rostock': 'Rostock',
  'ingolstadt': 'Ingolstadt',
  'regensburg': 'Regensburg',
  'constance': 'Konstanz',
  'konstanz': 'Konstanz',
  'trier': 'Trier',
  'jena': 'Jena',
  'tübingen': 'Tübingen',
  'tubingen': 'Tübingen',
  'bamberg': 'Bamberg',
  'passau': 'Passau',
  
  // Austria (Österreich)
  'vienna': 'Wien',
  'salzburg': 'Salzburg',
  'innsbruck': 'Innsbruck',
  'graz': 'Graz',
  'linz': 'Linz',
  'klagenfurt': 'Klagenfurt',
  'villach': 'Villach',
  'wels': 'Wels',
  'sankt polten': 'Sankt Pölten',
  'st polten': 'Sankt Pölten',
  'st. polten': 'Sankt Pölten',
  'dornbirn': 'Dornbirn',
  'bregenz': 'Bregenz',
  
  // Switzerland (Schweiz)
  'zurich': 'Zürich',
  'geneva': 'Genf',
  'geneve': 'Genf',
  'genève': 'Genf',
  'basel': 'Basel',
  'basle': 'Basel',
  'bern': 'Bern',
  'berne': 'Bern',
  'lausanne': 'Lausanne',
  'lucerne': 'Luzern',
  'luzern': 'Luzern',
  'lugano': 'Lugano',
  'st gallen': 'St. Gallen',
  'st. gallen': 'St. Gallen',
  'winterthur': 'Winterthur',
  'zug': 'Zug',
  
  // France
  'paris': 'Paris',
  'marseille': 'Marseille',
  'lyon': 'Lyon',
  'toulouse': 'Toulouse',
  'nice': 'Nizza',
  'nantes': 'Nantes',
  'strasbourg': 'Straßburg',
  'montpellier': 'Montpellier',
  'bordeaux': 'Bordeaux',
  'lille': 'Lille',
  'rennes': 'Rennes',
  'reims': 'Reims',
  'toulon': 'Toulon',
  'saint-etienne': 'Saint-Étienne',
  'grenoble': 'Grenoble',
  'dijon': 'Dijon',
  'angers': 'Angers',
  'nimes': 'Nîmes',
  'cannes': 'Cannes',
  
  // Italy
  'rome': 'Rom',
  'roma': 'Rom',
  'milan': 'Mailand',
  'milano': 'Mailand',
  'naples': 'Neapel',
  'napoli': 'Neapel',
  'turin': 'Turin',
  'torino': 'Turin',
  'palermo': 'Palermo',
  'genoa': 'Genua',
  'genova': 'Genua',
  'bologna': 'Bologna',
  'florence': 'Florenz',
  'firenze': 'Florenz',
  'venice': 'Venedig',
  'venezia': 'Venedig',
  'verona': 'Verona',
  'padua': 'Padua',
  'padova': 'Padua',
  'trieste': 'Triest',
  'brescia': 'Brescia',
  'parma': 'Parma',
  'modena': 'Modena',
  'pisa': 'Pisa',
  'bari': 'Bari',
  'catania': 'Catania',
  
  // Spain
  'madrid': 'Madrid',
  'barcelona': 'Barcelona',
  'valencia': 'Valencia',
  'seville': 'Sevilla',
  'sevilla': 'Sevilla',
  'zaragoza': 'Saragossa',
  'malaga': 'Málaga',
  'murcia': 'Murcia',
  'palma': 'Palma',
  'las palmas': 'Las Palmas',
  'bilbao': 'Bilbao',
  'alicante': 'Alicante',
  'cordoba': 'Córdoba',
  'valladolid': 'Valladolid',
  'vigo': 'Vigo',
  'gijon': 'Gijón',
  'granada': 'Granada',
  'san sebastian': 'San Sebastián',
  
  // Portugal
  'lisbon': 'Lissabon',
  'lisboa': 'Lissabon',
  'porto': 'Porto',
  'oporto': 'Porto',
  'braga': 'Braga',
  'coimbra': 'Coimbra',
  'funchal': 'Funchal',
  
  // Netherlands (Niederlande)
  'amsterdam': 'Amsterdam',
  'rotterdam': 'Rotterdam',
  'the hague': 'Den Haag',
  'den haag': 'Den Haag',
  's-gravenhage': 'Den Haag',
  'utrecht': 'Utrecht',
  'eindhoven': 'Eindhoven',
  'groningen': 'Groningen',
  'maastricht': 'Maastricht',
  'leiden': 'Leiden',
  'haarlem': 'Haarlem',
  'arnhem': 'Arnhem',
  
  // Belgium (Belgien)
  'brussels': 'Brüssel',
  'bruxelles': 'Brüssel',
  'brussel': 'Brüssel',
  'antwerp': 'Antwerpen',
  'antwerpen': 'Antwerpen',
  'ghent': 'Gent',
  'gent': 'Gent',
  'bruges': 'Brügge',
  'brugge': 'Brügge',
  'liege': 'Lüttich',
  'liège': 'Lüttich',
  'namur': 'Namur',
  'leuven': 'Löwen',
  'louvain': 'Löwen',
  
  // Poland (Polen)
  'warsaw': 'Warschau',
  'warszawa': 'Warschau',
  'krakow': 'Krakau',
  'cracow': 'Krakau',
  'kraków': 'Krakau',
  'lodz': 'Lodz',
  'łódź': 'Lodz',
  'wroclaw': 'Breslau',
  'wrocław': 'Breslau',
  'breslau': 'Breslau',
  'poznan': 'Posen',
  'poznań': 'Posen',
  'gdansk': 'Danzig',
  'gdańsk': 'Danzig',
  'danzig': 'Danzig',
  'szczecin': 'Stettin',
  'stettin': 'Stettin',
  
  // Czech Republic (Tschechien)
  'prague': 'Prag',
  'praha': 'Prag',
  'brno': 'Brünn',
  'ostrava': 'Ostrau',
  'plzen': 'Pilsen',
  'pilsen': 'Pilsen',
  'liberec': 'Liberec',
  'olomouc': 'Olmütz',
  
  // Hungary (Ungarn)
  'budapest': 'Budapest',
  'debrecen': 'Debrecen',
  'szeged': 'Szeged',
  'miskolc': 'Miskolc',
  'pecs': 'Pécs',
  'gyor': 'Győr',
  
  // Romania (Rumänien)
  'bucharest': 'Bukarest',
  'bucuresti': 'Bukarest',
  'cluj-napoca': 'Klausenburg',
  'cluj': 'Klausenburg',
  'timisoara': 'Temeswar',
  'iasi': 'Jassy',
  'constanta': 'Konstanza',
  'brasov': 'Kronstadt',
  
  // Greece (Griechenland)
  'athens': 'Athen',
  'athina': 'Athen',
  'thessaloniki': 'Thessaloniki',
  'saloniki': 'Thessaloniki',
  'patras': 'Patras',
  'heraklion': 'Heraklion',
  'larissa': 'Larisa',
  
  // Scandinavia
  'copenhagen': 'Kopenhagen',
  'kobenhavn': 'Kopenhagen',
  'københavn': 'Kopenhagen',
  'stockholm': 'Stockholm',
  'gothenburg': 'Göteborg',
  'goteborg': 'Göteborg',
  'malmo': 'Malmö',
  'malmö': 'Malmö',
  'oslo': 'Oslo',
  'bergen': 'Bergen',
  'helsinki': 'Helsinki',
  'espoo': 'Espoo',
  'tampere': 'Tampere',
  'turku': 'Turku',
  
  // UK & Ireland
  'london': 'London',
  'manchester': 'Manchester',
  'birmingham': 'Birmingham',
  'liverpool': 'Liverpool',
  'edinburgh': 'Edinburgh',
  'glasgow': 'Glasgow',
  'dublin': 'Dublin',
  'cork': 'Cork',
  
  // Eastern Europe
  'moscow': 'Moskau',
  'moskva': 'Moskau',
  'saint petersburg': 'Sankt Petersburg',
  'st petersburg': 'Sankt Petersburg',
  'kiev': 'Kiew',
  'kyiv': 'Kiew',
  'minsk': 'Minsk',
  'vilnius': 'Vilnius',
  'riga': 'Riga',
  'tallinn': 'Tallinn',
  
  // Balkans
  'belgrade': 'Belgrad',
  'beograd': 'Belgrad',
  'zagreb': 'Zagreb',
  'sofia': 'Sofia',
  'sarajevo': 'Sarajevo',
  'ljubljana': 'Ljubljana',
  'pristina': 'Pristina',
  'skopje': 'Skopje',
  'podgorica': 'Podgorica',
  'tirana': 'Tirana',
  
  // German states/regions (English to German)
  'bavaria': 'Bayern',
  'north rhine-westphalia': 'Nordrhein-Westfalen',
  'lower saxony': 'Niedersachsen',
  'baden-wurttemberg': 'Baden-Württemberg',
  'baden-wuerttemberg': 'Baden-Württemberg',
  'rhineland-palatinate': 'Rheinland-Pfalz',
  'saxony': 'Sachsen',
  'thuringia': 'Thüringen',
  'hesse': 'Hessen',
  'saarland': 'Saarland',
  'schleswig-holstein': 'Schleswig-Holstein',
  'mecklenburg-vorpommern': 'Mecklenburg-Vorpommern',
  'brandenburg': 'Brandenburg',
  'saxony-anhalt': 'Sachsen-Anhalt',
  
  // Common variations without umlauts
  'muenchen': 'München',
  'koln': 'Köln',
  'nurnberg': 'Nürnberg',
  'duesseldorf': 'Düsseldorf',
  'muenster': 'Münster',
  'luebeck': 'Lübeck',
  'wuerzburg': 'Würzburg',
  'goettingen': 'Göttingen',
  'tuebingen': 'Tübingen',
  'zuerich': 'Zürich',
  'strassburg': 'Straßburg',
  'bruessel': 'Brüssel',
  'bruegge': 'Brügge',
  'luettich': 'Lüttich',
  'loewen': 'Löwen',
  
  // Alternative spellings
  'frankfort': 'Frankfurt am Main',
  'frankfort on main': 'Frankfurt am Main',
  'frankfort am main': 'Frankfurt am Main',
  'frankfurt on main': 'Frankfurt am Main',
  'freiburg im breisgau': 'Freiburg im Breisgau',
  'halle an der saale': 'Halle (Saale)',
  'halle saale': 'Halle (Saale)',
  
  // Common typos or alternative names
  'colgne': 'Köln',
  'colone': 'Köln',
  'berlin city': 'Berlin',
  'hamburg city': 'Hamburg',
  'munich city': 'München',
};

function normalizeLocation(location: string): string {
  const lower = location.toLowerCase().trim();
  
  // Check if it's in our mapping
  if (cityNameMapping[lower]) {
    return cityNameMapping[lower];
  }
  
  // Return original if not found in mapping (keeps German names intact)
  return location.trim();
}

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
      page = 1,
      sortBy = 'asc',
      sortKey = 'buyingPrice',
      bestValue = false
    } = await request.json();

    console.log('=== PROPERTIES API CALLED ===');
    console.log('Location (original):', location);
    console.log('Budget:', budget);
    console.log('Rooms:', rooms);
    console.log('Sqm:', sqm);
    console.log('Property Type:', propertyType);
    console.log('Page:', page);

    if (!location) {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      );
    }

    // Normalize location to German name
    const normalizedLocation = normalizeLocation(location);
    console.log('Location (normalized):', normalizedLocation);

    // Determine the property type for ThinkImmo API
    // Map frontend property types to API types
    const apiType = type || (propertyType === 'house' ? 'HOUSEBUY' : 'APPARTMENTBUY');

    // Calculate pagination offset
    const from = (page - 1) * size;

    // If best value sorting is enabled, fetch more results to allow better sorting after filtering
    const fetchSize = bestValue ? size * 3 : size; // Fetch 3x to compensate for filtering
    const fetchFrom = bestValue ? 0 : from; // Always start from 0 for best value to ensure consistency

    // Prepare the payload for ThinkImmo API
    const payload: any = {
      active: true,
      type: apiType,
      from: fetchFrom,
      size: fetchSize,
      sortBy: bestValue ? 'asc' : sortBy, // Use consistent sort for best value
      sortKey: bestValue ? 'buyingPrice' : sortKey, // Use price sort for best value
      geoSearches: {
        geoSearchQuery: normalizedLocation,
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

    // Add room filter if provided (minimum rooms)
    if (rooms) {
      payload.minRooms = rooms;
      // No maxRooms - allow any number of rooms equal or greater
    }

    // Add size filter if provided (minimum size)
    if (sqm) {
      payload.minSquareMeter = sqm;
      // No maxSquareMeter - allow any size equal or greater
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

    // Filter out unrealistic or invalid properties
    const filteredResults = (data.results || []).filter((property: any) => {
      // Filter out properties with unrealistic square meters
      if (property.squareMeter > 10000) {
        console.log('Filtered out: unrealistic size', property.squareMeter, 'm²');
        return false;
      }

      // Filter out properties with unrealistic small sizes for apartments/houses
      if (property.squareMeter < 15) {
        console.log('Filtered out: too small', property.squareMeter, 'm²');
        return false;
      }

      // Calculate estimated price if buyingPrice is null
      const estimatedPrice = property.buyingPrice || 
                            property.aggregations?.similarListing?.buyingPrice ||
                            (property.spPricePerSqm && property.squareMeter ? property.spPricePerSqm * property.squareMeter : null);

      // Filter out properties with unrealistic low prices per sqm
      if (estimatedPrice && property.squareMeter > 0) {
        const pricePerSqm = estimatedPrice / property.squareMeter;
        
        // Filter if price per sqm is less than 100€ (likely data error)
        if (pricePerSqm < 100) {
          console.log('Filtered out: unrealistic price/m²', pricePerSqm.toFixed(2), '€/m²');
          return false;
        }

        // Filter if price per sqm is more than 50,000€ (likely data error)
        if (pricePerSqm > 50000) {
          console.log('Filtered out: unrealistic high price/m²', pricePerSqm.toFixed(2), '€/m²');
          return false;
        }
      }

      // Filter out properties with unrealistic total prices
      if (estimatedPrice) {
        // Too cheap (less than 10,000€)
        if (estimatedPrice < 10000) {
          console.log('Filtered out: unrealistic low price', estimatedPrice, '€');
          return false;
        }

        // Too expensive (more than 50 million€)
        if (estimatedPrice > 50000000) {
          console.log('Filtered out: unrealistic high price', estimatedPrice, '€');
          return false;
        }
      }

      // Filter out properties with 0 rooms
      if (!property.rooms || property.rooms === 0) {
        console.log('Filtered out: 0 rooms');
        return false;
      }

      // All checks passed
      return true;
    });

    console.log('Filtered properties:', {
      original: data.results?.length || 0,
      filtered: filteredResults.length,
      removed: (data.results?.length || 0) - filteredResults.length
    });

    // Calculate value score for each property if bestValue sort is enabled
    let finalResults = filteredResults;
    
    if (bestValue) {
      console.log('Calculating best value scores...');
      
      finalResults = filteredResults.map((property: any) => {
        const estimatedPrice = property.buyingPrice || 
                              property.aggregations?.similarListing?.buyingPrice ||
                              (property.spPricePerSqm && property.squareMeter ? property.spPricePerSqm * property.squareMeter : null);
        
        if (!estimatedPrice || !property.squareMeter || !property.rooms) {
          return { ...property, valueScore: 0 };
        }

        const pricePerSqm = estimatedPrice / property.squareMeter;
        const pricePerRoom = estimatedPrice / property.rooms;
        
        // Calculate value score (0-100)
        // Lower price per sqm = better value
        // More rooms for the price = better value
        // Larger size for the price = better value
        // Having images = bonus
        
        // Normalize price per sqm (assume 8000€/m² is average, lower is better)
        const pricePerSqmScore = Math.max(0, 100 - ((pricePerSqm - 3000) / 100));
        
        // Normalize price per room (assume 150,000€/room is average, lower is better)
        const pricePerRoomScore = Math.max(0, 100 - ((pricePerRoom - 50000) / 2000));
        
        // Size score (larger is better, up to reasonable limits)
        const sizeScore = Math.min(100, (property.squareMeter / 150) * 100);
        
        // Room score (more rooms is better, up to reasonable limits)
        const roomScore = Math.min(100, (property.rooms / 5) * 100);
        
        // Image bonus (25% boost if has images - increased from 10%)
        const imageBonus = property.images && property.images.length > 0 ? 1.25 : 1.0;
        
        // Combined score (weighted average) - removed location bonus
        const baseScore = (
          pricePerSqmScore * 0.35 +  // 35% weight on price per sqm
          pricePerRoomScore * 0.25 + // 25% weight on price per room
          sizeScore * 0.20 +          // 20% weight on size
          roomScore * 0.20            // 20% weight on rooms
        );
        
        const valueScore = baseScore * imageBonus;
        
        return {
          ...property,
          valueScore: Math.round(valueScore)
        };
      });
      
      // Sort by value score (highest first)
      finalResults.sort((a: any, b: any) => (b.valueScore || 0) - (a.valueScore || 0));
      
      // Paginate after sorting for consistency
      const startIndex = (page - 1) * size;
      finalResults = finalResults.slice(startIndex, startIndex + size);
      
      console.log('Top 5 value scores:', finalResults.slice(0, 5).map((p: any) => ({
        title: p.title?.substring(0, 50),
        valueScore: p.valueScore,
        price: p.buyingPrice,
        rooms: p.rooms,
        sqm: p.squareMeter
      })));
    }

    // Return the properties data in the format the frontend expects
    return NextResponse.json({
      total: data.total || 0,
      results: finalResults,
      location: normalizedLocation,
      originalLocation: location,
      page: page,
      pageSize: size,
      totalPages: Math.ceil((data.total || 0) / size),
      hasMore: from + size < (data.total || 0),
      debug: {
        requestParams: { location, normalizedLocation, budget, rooms, sqm, propertyType, page, bestValue },
        thinkImmoPayload: payload,
        resultsCount: data.results?.length || 0,
        filteredCount: filteredResults.length
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
