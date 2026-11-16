// Turns the originals listed in js/content.js (logos and screenshots under media/) into small
// WebP files the site loads from images/projects/<id>/:
//   logo.webp      the square icon, 256px
//   wordmark.webp  the logo with the name, 120px tall (if listed)
//   <n>.webp       screenshot n at full view size (1600px wide, or 720px for phone shots)
//   <n>-sm.webp    the same, small, for cards and the gallery strip
// Run after adding media:  npm i --no-save sharp && node scripts/build-media.mjs
import { mkdirSync, existsSync, readdirSync, rmSync } from 'node:fs';
import sharp from 'sharp';
import * as C from '../js/content.js';

const items = [...C.projects, ...C.moreBuilds.filter((b) => b.id)];
let made = 0;

for (const it of items) {
  const shots = it.shots || [];
  const m = it.media || {};
  if (!shots.length && !m.logo) continue;
  const dir = `images/projects/${it.id}`;
  if (existsSync(dir)) for (const f of readdirSync(dir)) rmSync(`${dir}/${f}`);
  mkdirSync(dir, { recursive: true });

  if (m.logo) {
    await sharp(m.logo).resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 90 }).toFile(`${dir}/logo.webp`);
    made++;
  }
  if (m.wordmark) {
    await sharp(m.wordmark).trim({ threshold: 4 }).resize({ height: 120 }).webp({ quality: 90 }).toFile(`${dir}/wordmark.webp`);
    made++;
  }
  for (const [i, s] of shots.entries()) {
    const meta = await sharp(s.src).metadata();
    const phone = meta.height > meta.width;
    const n = i + 1;
    await sharp(s.src).resize({ width: phone ? 720 : 1600, withoutEnlargement: true }).webp({ quality: 80 }).toFile(`${dir}/${n}.webp`);
    await sharp(s.src).resize({ width: phone ? 360 : 720, withoutEnlargement: true }).webp({ quality: 72 }).toFile(`${dir}/${n}-sm.webp`);
    made += 2;
  }
  console.log(`${it.id}: ${shots.length} shots${m.logo ? ', logo' : ''}${m.wordmark ? ', wordmark' : ''}`);
}
console.log(`${made} files written`);
