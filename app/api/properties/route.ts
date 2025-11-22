import { NextRequest, NextResponse } from "next/server";

interface Property {
  id: string;
  title: string;
  buyingPrice: number;
  rooms: number;
  squareMeter: number;
  pricePerSqm: number;
  address: {
    city: string;
    postcode: string;
    displayName: string;
  };
  type?: string;
  images?: Array<{ originalUrl: string; title: string }>;
  locationFactor?: {
    score: number;
    population: number;
    hasUniversity: boolean;
  };
}

const propertyTypeMap: Record<string, string> = {
  apartment: "APPARTMENTBUY",
  condo: "APPARTMENTBUY",
  house: "HOUSEBUY",
  "multi-family": "HOUSEBUY",
};

// German transliteration
const transliterate = (t: string) =>
  t
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae")
    .replace(/Ö/g, "Oe")
    .replace(/Ü/g, "Ue")
    .replace(/ß/g, "ss");

// Region mapping
const regionMap: Record<string, string> = {
  münchen: "Bayern",
  muenchen: "Bayern",
  munich: "Bayern",
  berlin: "Berlin",
  hamburg: "Hamburg",
  köln: "Nordrhein-Westfalen",
  koeln: "Nordrhein-Westfalen",
  cologne: "Nordrhein-Westfalen",
  frankfurt: "Hessen",
  stuttgart: "Baden-Württemberg",
};

// 🔥 Concurrency limiter
async function runInBatches<T>(tasks: (() => Promise<T>)[], limit: number) {
  const results: T[] = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array(Math.min(limit, tasks.length))
    .fill(0)
    .map(() => worker());

  await Promise.all(workers);
  return results;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location, budget, rooms, sqm, propertyType } = body;

    const thinkImmoType =
      propertyTypeMap[propertyType?.toLowerCase()] || "APPARTMENTBUY";

    const locationLower = (location || "").toLowerCase();
    const region = regionMap[locationLower] || undefined;

    // Build geoSearch identical to Python
    const geoSearch: any = {
      geoSearchQuery: location,
      geoSearchType: "town",
    };
    if (region) geoSearch.region = region;

    const baseRequestBody = {
      active: true,
      type: thinkImmoType,
      sortBy: "asc",
      sortKey: "buyingPrice",
      geoSearches: geoSearch,
    };

    // -------------------------------
    // 1️⃣ GET TRUE TOTAL COUNT
    // -------------------------------
    const firstResponse = await fetch(
      "https://thinkimmo-api.mgraetz.de/thinkimmo",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...baseRequestBody,
          from: 0,
          size: 3,
        }),
      }
    );

    const firstData = await firstResponse.json();
    const total = firstData.total || 0;

    if (total === 0) {
      return NextResponse.json({
        total: 0,
        results: [],
        debug: { message: "No results", location, region },
      });
    }

    // -------------------------------
    // 2️⃣ CREATE PAGINATED TASKS
    // -------------------------------
    const PAGE_SIZE = 100;
    const totalPages = Math.ceil(total / PAGE_SIZE);

    const tasks = Array.from({ length: totalPages }, (_, pageIndex) => {
      return async () => {
        const from = pageIndex * PAGE_SIZE;

        // Retry loop for stability
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const res = await fetch(
              "https://thinkimmo-api.mgraetz.de/thinkimmo",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...baseRequestBody,
                  from,
                  size: PAGE_SIZE,
                }),
              }
            );

            const json = await res.json();
            return json.results || [];
          } catch (err) {
            console.error(`⚠️ Request failed for page ${pageIndex}, attempt ${attempt + 1}`);
            await new Promise((r) => setTimeout(r, 500));
          }
        }

        return []; // fallback
      };
    });

    // -------------------------------
    // 3️⃣ RUN WITH CONCURRENCY LIMIT
    // -------------------------------
    const results = await runInBatches(tasks, 5); // ← IMPORTANT: max 5 parallel

    const allResults = results.flat();

    // -------------------------------
    // 4️⃣ STRUCTURE + FILTER
    // -------------------------------
    const structured: Property[] = allResults.map((prop: any) => ({
      id: prop.id || "",
      title: prop.title || "Untitled Property",
      buyingPrice: prop.buyingPrice || 0,
      rooms: prop.rooms || 0,
      squareMeter: prop.squareMeter || 0,
      pricePerSqm:
        prop.pricePerSqm ||
        (prop.buyingPrice && prop.squareMeter
          ? prop.buyingPrice / prop.squareMeter
          : 0),
      address: {
        city: prop.address?.town || prop.address?.city || "",
        postcode: prop.address?.postcode || "",
        displayName: prop.address?.displayName || "",
      },
      type: prop.type,
      images: prop.images || [],
      locationFactor: prop.locationFactor,
    }));

    const filtered = structured.filter((p) => {
      const budgetMatch = !budget || p.buyingPrice <= budget * 1.2;
      const roomsMatch = !rooms || (p.rooms >= rooms - 1 && p.rooms <= rooms + 2);
      const sqmMatch =
        !sqm ||
        (p.squareMeter >= sqm * 0.8 && p.squareMeter <= sqm * 1.2);
      return p.buyingPrice > 0 && budgetMatch && roomsMatch && sqmMatch;
    });

    filtered.sort((a, b) => a.buyingPrice - b.buyingPrice);

    return NextResponse.json({
      total: filtered.length,
      results: filtered,
      debug: {
        thinkImmoTotal: total,
        fetched: structured.length,
        location,
        region: region || null,
      },
    });
  } catch (err: any) {
    console.error("❌ ERROR:", err);
    return NextResponse.json(
      { error: "Server error", details: String(err) },
      { status: 500 }
    );
  }
}
