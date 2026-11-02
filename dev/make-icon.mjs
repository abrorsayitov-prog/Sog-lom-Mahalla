// public/icons uchun PNG launcher ikonchasi: yumaloq kvadrat, diagonal gradient,
// yurak va puls chizig'i. Bitmap kerak — Chrome PWA uchun SVG'ni to'liq qo'llamaydi.
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), "../public/icons");

const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});

function crc32(bytes) {
  let c = ~0;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8);
  return ~c >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y += 1) {
    raw[y * (size * 4 + 1)] = 0;
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const STOPS = [
  [0, 0x1d, 0x4e, 0xd8],
  [0.5, 0x0e, 0xa5, 0xe9],
  [1, 0x22, 0xc5, 0x5e],
];

function gradient(t) {
  const [a, b] = t < 0.5 ? [STOPS[0], STOPS[1]] : [STOPS[1], STOPS[2]];
  const local = (t - a[0]) / (b[0] - a[0]);
  return [a[1] + (b[1] - a[1]) * local, a[2] + (b[2] - a[2]) * local, a[3] + (b[3] - a[3]) * local];
}

function roundedSquare(x, y, size, radius) {
  if (x < 0 || y < 0 || x >= size || y >= size) return false;
  const cx = Math.min(Math.max(x, radius), size - radius);
  const cy = Math.min(Math.max(y, radius), size - radius);
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}

const PULSE = [
  [-0.62, 0.02],
  [-0.26, 0.02],
  [-0.1, -0.42],
  [0.2, 0.5],
  [0.36, 0.06],
  [0.66, 0.06],
];

function distanceToPulse(x, y) {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < PULSE.length - 1; i += 1) {
    const [ax, ay] = PULSE[i];
    const [bx, by] = PULSE[i + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
    best = Math.min(best, Math.hypot(x - (ax + t * dx), y - (ay + t * dy)));
  }
  return best;
}

function heartInside(x, y) {
  return (x * x + (9 / 4) * y * y - 1) ** 3 - x * x * y * y * y <= 0;
}

function render(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const radius = size * 0.22;
  const scale = (size / 2) * 0.72;
  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      const index = (py * size + px) * 4;
      if (!roundedSquare(px, py, size, radius)) {
        pixels[index + 3] = 0;
        continue;
      }
      const x = (px - size / 2) / scale;
      const y = -(py - size / 2) / scale;
      const [r, g, b] = gradient((px + py) / (2 * size));
      let color = [0xf5, 0xf7, 0xfb];
      if (heartInside(x, y)) color = [r, g, b];
      if (heartInside(x, y) && distanceToPulse(x, y) < 0.075) color = [255, 255, 255];
      pixels[index] = Math.round(color[0]);
      pixels[index + 1] = Math.round(color[1]);
      pixels[index + 2] = Math.round(color[2]);
      pixels[index + 3] = 255;
    }
  }
  return encodePng(size, pixels);
}

mkdirSync(outDir, { recursive: true });
for (const size of [192, 512]) writeFileSync(`${outDir}/icon-${size}.png`, render(size));
writeFileSync(`${outDir}/icon.png`, render(512));
console.log(`ikonchalar: ${outDir}`);
