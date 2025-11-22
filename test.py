#!/usr/bin/env python3
import requests
import json

# Test different location variations for Munich
locations = [
    ("München", ""),
]

for location, region in locations:
    print(f"\n{'='*60}")
    print(f"Testing location: '{location}' with region: {region}")
    print('='*60)
    
    payload = {
        "active": True,
        "type": "APPARTMENTBUY",
        "from": 0,
        "size": 3,
        "sortBy": "asc",
        "sortKey": "buyingPrice",
        "geoSearches": {
            "geoSearchQuery": location,
            "geoSearchType": "town",
            "region": region
        }
    }
    
    
    print("Request:", json.dumps(payload, indent=2))
    
    response = requests.post("https://thinkimmo-api.mgraetz.de/thinkimmo", json=payload)
    
    if response.status_code in [200, 201]:
        data = response.json()
        total = data.get('total', 0)
        results = len(data.get('results', []))
        
        if total > 0:
            print(f"✅ SUCCESS! Total: {total:,}, Returned: {results}")
            if results > 0:
                first = data['results'][0]
                print(f"   First: {first.get('address', {}).get('city', 'N/A')} -")
        else:
            print(f"❌ No results (total={total})")
    else:
        print(f"❌ Error: {response.status_code}")