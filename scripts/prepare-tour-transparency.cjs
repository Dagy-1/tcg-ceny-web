// Offline, deterministic cutouts of the six existing illustrations. No AI redraw.
// Run from website/: node scripts/prepare-tour-transparency.cjs
/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS asset-preparation utility. */
const { resolve } = require('node:path');
const { mkdirSync } = require('node:fs');
const sharp = require(require.resolve('sharp', { paths: [require.resolve('next/package.json')] }));
const sealed = process.argv.includes('--sealed');
const poses = sealed ? ['search', 'collection', 'compare'] : ['welcome', 'search', 'price-drop', 'alert', 'collection', 'compare'];

async function cutout(pose) {
  const source = resolve(__dirname, `../public/brand/tour/owl-${pose}-${sealed ? 'v3-sealed-source' : 'v1'}.webp`);
  const destination = resolve(__dirname, `../public/brand/tour/owl-${pose}-${sealed ? 'v3-sealed-alpha' : 'v2-alpha'}.webp`);
  const { data, info: { width, height } } = await sharp(source).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const count = width * height;
  // Sample only the empty outer border, accommodating tiny WebP colour variation.
  const samples = [[], [], []];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (x > 3 && x < width - 4 && y > 3 && y < height - 4) continue;
    for (let c = 0; c < 3; c++) samples[c].push(data[(y * width + x) * 3 + c]);
  }
  const background = samples.map(values => values.sort((a, b) => a - b)[Math.floor(values.length / 2)]);
  const removable = new Uint8Array(count);
  for (let p = 0; p < count; p++) {
    const distance = Math.max(...background.map((v, c) => Math.abs(data[p * 3 + c] - v)));
    removable[p] = distance <= (sealed ? (pose === 'compare' ? 2 : 4) : 7) ? 1 : 0;
  }
  // Only remove the border-connected backdrop; similarly coloured eyes and feathers
  // inside the character stay opaque, unlike a global colour-key/blend operation.
  const outside = new Uint8Array(count);
  const queue = new Int32Array(count);
  let head = 0, tail = 0;
  function visit(p) {
    if (!outside[p] && removable[p]) { outside[p] = 1; queue[tail++] = p; }
  }
  for (let x = 0; x < width; x++) { visit(x); visit((height - 1) * width + x); }
  for (let y = 0; y < height; y++) { visit(y * width); visit(y * width + width - 1); }
  while (head < tail) {
    const p = queue[head++], x = p % width;
    if (x > 0) visit(p - 1);
    if (x < width - 1) visit(p + 1);
    if (p >= width) visit(p - width);
    if (p < count - width) visit(p + width);
  }
  const rgba = Buffer.alloc(count * 4);
  for (let p = 0; p < count; p++) {
    data.copy(rgba, p * 4, p * 3, p * 3 + 3);
    rgba[p * 4 + 3] = outside[p] ? 0 : 255;
  }
  // Lossless preserves every remaining original RGB pixel and exact alpha values.
  await sharp(rgba, { raw: { width, height, channels: 4 } }).webp({ lossless: true }).toFile(destination);
  const decoded = await sharp(destination).raw().toBuffer();
  let transparent = 0, opaque = 0;
  for (let p = 0; p < count; p++) {
    if (decoded[p * 4 + 3] === 0) transparent++;
    else {
      opaque++;
      for (let c = 0; c < 3; c++) if (decoded[p * 4 + c] !== data[p * 3 + c]) throw Error(`${pose}: changed character pixel`);
    }
  }
  if (transparent < count * .2 || opaque < count * .2) throw Error(`${pose}: invalid cutout area`);
  console.log(JSON.stringify({ pose, background, transparent, opaque, destination }));
  return { input: await sharp(destination).resize(240, 240).png().toBuffer(), left: poses.indexOf(pose) % 3 * 240, top: Math.floor(poses.indexOf(pose) / 3) * 240 };
}

(async () => {
  const images = [];
  for (const pose of poses) images.push(await cutout(pose));
  const review = resolve(__dirname, '../../tmp/tour-transparency');
  mkdirSync(review, { recursive: true });
  for (const [name, background] of [['panel', '#091524'], ['light', '#dedede']]) {
    await sharp({ create: { width: 720, height: sealed ? 240 : 480, channels: 3, background } }).composite(images).png().toFile(resolve(review, `${sealed ? 'sealed-' : ''}${name}.png`));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
