import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://libbbemuwtmgdtfztwaa.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpYmJiZW11d3RtZ2R0Znp0d2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0NDkzMTUsImV4cCI6MjEwOTAyNTMxNX0.5vQnDugnAhCUafHNhSCWugip9Si6QfBe0JqJABpIR20';

// Get admin access token
const authRes = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
  method: 'POST',
  headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'sayed0webdeveloper@gmail.com', password: 'OROKRONE2005' })
});
const authData = await authRes.json();
const accessToken = authData.access_token;

if (!accessToken) {
  console.error('Failed to get access token:', authData);
  process.exit(1);
}

// Product to image mapping
const imageMap = {
  'p-heritage-champagne': 'w4.jpg',
  'p-royale-twotone-white': 'w7.jpg',
  'p-vitesse-chrono-steel': 'w2.jpg',
  'p-heritage-navy-rose': 'w5.jpg',
  'p-abyss-diver-300': 'w10.jpg',
  'p-atlas-minimal-mesh': 'w9.jpg',
  'p-royale-chrono-gold': 'w8.jpg',
  'p-royale-twotone-black': 'w3.jpg',
  'p-atlas-pilot-nato': 'w6.jpg',
  'p-luna-pearl-rose': 'w1.jpg',
  'p-atelier-roll': 'acc1.jpg',
  'p-atelier-straps': 'acc2.jpg',
  'p-atelier-winder': 'acc3.jpg',
};

const basePath = 'C:/Users/opencode2.SAYED/OROKRONE/assets/img/watches/';
const results = [];

for (const [productId, filename] of Object.entries(imageMap)) {
  try {
    const filePath = basePath + filename;
    const fileBuffer = readFileSync(filePath);
    const contentType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
    
    const storagePath = `${productId}/${filename}`;
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/product-images/${storagePath}`;
    
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body: fileBuffer,
    });
    
    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error(`Failed to upload ${filename} for ${productId}: ${uploadRes.status} ${errText}`);
      results.push({ productId, filename, success: false, error: errText });
      continue;
    }
    
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/${storagePath}`;
    console.log(`Uploaded ${filename} -> ${publicUrl}`);
    results.push({ productId, filename, success: true, url: publicUrl });
  } catch (err) {
    console.error(`Error uploading ${filename} for ${productId}:`, err.message);
    results.push({ productId, filename, success: false, error: err.message });
  }
}

// Save results
import { writeFileSync } from 'fs';
writeFileSync('C:/Users/opencode2.SAYED/OROKRONE/upload_results.json', JSON.stringify(results, null, 2));
console.log('\nUpload complete. Results saved to upload_results.json');
console.log('Success:', results.filter(r => r.success).length, 'Failed:', results.filter(r => !r.success).length);