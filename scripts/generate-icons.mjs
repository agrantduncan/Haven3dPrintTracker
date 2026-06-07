import sharp from 'sharp';
import { mkdir } from 'fs/promises';

await mkdir('public/icons', { recursive: true });

for (const size of [192, 512]) {
  const fontSize = Math.round(size * 0.28);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="#0d1b2a"/>
    <text x="${size / 2}" y="${size / 2}" font-family="Arial,sans-serif" font-weight="bold"
      font-size="${fontSize}" fill="#7ec8e3" text-anchor="middle" dominant-baseline="central">H3D</text>
  </svg>`;

  await sharp(Buffer.from(svg)).png().toFile(`public/icons/icon-${size}.png`);
  console.log(`✓ icon-${size}.png`);
}
