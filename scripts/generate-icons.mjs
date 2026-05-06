import sharp from 'sharp';

const BG = '#1E1208';

// Coffee mug SVG — same design as app page header, scaled to 512x512
const svg = `<svg viewBox="0 0 512 512" width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="107" y1="161" x2="338" y2="433" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FF4500"/>
      <stop offset="1" stop-color="#FFC107"/>
    </linearGradient>
  </defs>

  <!-- Warm dark background (rounded like iOS icon) -->
  <rect width="512" height="512" rx="110" fill="${BG}"/>

  <!-- Steam wisps -->
  <path d="M188 161 C175 134 202 113 188 86 C175 66 188 66 188 66"
    stroke="rgba(255,193,7,0.55)" stroke-width="12" stroke-linecap="round" fill="none"/>
  <path d="M276 161 C263 134 290 113 276 86 C263 66 276 66 276 66"
    stroke="rgba(255,100,0,0.45)" stroke-width="11" stroke-linecap="round" fill="none"/>

  <!-- Mug body -->
  <rect x="107" y="161" width="231" height="272" rx="27" fill="url(#g)"/>

  <!-- Handle (D-curve) -->
  <path d="M338 215 Q422 215 422 300 Q422 385 338 385"
    stroke="url(#g)" stroke-width="26" stroke-linecap="round" fill="none"/>

  <!-- Dark coffee surface at rim -->
  <ellipse cx="222" cy="164" rx="103" ry="18" fill="rgba(15,5,0,0.45)"/>

  <!-- Rim highlight -->
  <path d="M127 161 Q222 144 317 161"
    stroke="rgba(255,255,255,0.25)" stroke-width="7" stroke-linecap="round" fill="none"/>

  <!-- Left-side shine -->
  <rect x="141" y="215" width="24" height="95" rx="12" fill="rgba(255,255,255,0.18)"/>
</svg>`;

const buf = Buffer.from(svg);

await sharp(buf).resize(512, 512).png().toFile('public/icon-512.png');
console.log('✓ icon-512.png');

await sharp(buf).resize(192, 192).png().toFile('public/icon-192.png');
console.log('✓ icon-192.png');
