import re

path = 'src/components/parlay/os/ParlayOsLayer.tsx'
with open(path, 'r') as f:
    content = f.read()

# Add apiClient to imports
api_client_import = """import { apiClient } from "../../../lib/apiClient";\n"""
# insert right after the other vouch imports or somewhere near the top
content = re.sub(r'(import type \{ ParlayMarketTier \} from "../../../lib/parlays/parlayMarketCatalog";)', r'\1\n' + api_client_import, content)

# Replace the fetch call in handleSaveParlay
fetch_call = """      const res = await fetch('/api/v3/parlays/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rawSlip),
      });
      
      const data = await res.json();
      
      if (res.ok && data.ok) {"""

api_client_call = """      const data = await apiClient.post('/api/v3/parlays/save', rawSlip);
      
      if (data && data.ok) {"""

content = content.replace(fetch_call, api_client_call)

with open(path, 'w') as f:
    f.write(content)
