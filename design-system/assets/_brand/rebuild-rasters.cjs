#!/usr/bin/env node
/**
 * Rebuild all Consoleri raster brand assets from ONE locked mark geometry.
 * No AI imagery — every PNG is a sharp/SVG render of the same hexagon+aperture path.
 */
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { spawnSync } = require("child_process");

const sharp = require("/Users/ra/open-design/node_modules/.pnpm/sharp@0.34.5/node_modules/sharp");

const ROOT = path.resolve(__dirname, "../..");
const OUT = {
  logoMark: path.join(ROOT, "assets/logo-mark.png"),
  appIcon: path.join(ROOT, "assets/icons/app-icon.png"),
  trayPng: path.join(ROOT, "assets/icons/tray-icon.png"),
  storeTile: path.join(ROOT, "assets/icons/store-tile.png"),
  buildIcon: path.join(ROOT, "build/icons/icon.png"),
  buildTray: path.join(ROOT, "build/icons/tray.png"),
  wordmarkLockup: path.join(ROOT, "assets/marketing/wordmark-lockup.png"),
  splash: path.join(ROOT, "assets/marketing/splash.png"),
  about: path.join(ROOT, "assets/marketing/about-panel.png"),
  hero: path.join(ROOT, "assets/marketing/hero-network.png"),
  emptyHosts: path.join(ROOT, "assets/illustrations/empty-hosts.png"),
  emptyKeys: path.join(ROOT, "assets/illustrations/empty-keys.png"),
  emptyNetwork: path.join(ROOT, "assets/illustrations/empty-network.png"),
  hostAvatars: path.join(ROOT, "assets/illustrations/host-avatars.png"),
};

const BRAND = "#f59e0b";
const INK = "#0c141f";
const FG = "#f8fafc";
const MUTED = "#94a3b8";
const ACCENT = "#2b7fff";
const SURFACE = "#151d2b";
const BORDER = "#2a3548";

/** Canonical mark path in 64×64 space (evenodd: hexagon − aperture). */
const MARK =
  "M32 4 L55.5 17.5 L55.5 46.5 L32 60 L8.5 46.5 L8.5 17.5 Z M32 24 A8 8 0 1 0 32 40 A8 8 0 1 0 32 24 Z";

function markDefs(id = "consoleri-mark-mask") {
  return `<defs>
    <mask id="${id}">
      <rect width="64" height="64" fill="white"/>
      <circle cx="32" cy="32" r="8" fill="black"/>
    </mask>
  </defs>`;
}

function mark(fill = BRAND, maskId = "consoleri-mark-mask") {
  return `<polygon points="32,4 55.5,17.5 55.5,46.5 32,60 8.5,46.5 8.5,17.5" fill="${fill}" mask="url(#${maskId})"/>`;
}

function markCentered(cx, cy, scale, fill = BRAND, maskId = "consoleri-mark-mask") {
  return `<g transform="translate(${cx} ${cy}) scale(${scale}) translate(-32 -32)">${mark(fill, maskId)}</g>`;
}

async function png(svg, file, width, height) {
  const buf = Buffer.from(svg);
  await sharp(buf, { density: 144 })
    .resize(width, height, { fit: "fill" })
    .png({ compressionLevel: 9 })
    .toFile(file);
  console.log("wrote", path.relative(ROOT, file), `${width}x${height}`);
}

function tileIcon(size, markScale = 0.62) {
  const r = Math.round(size * 0.22);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${markDefs()}
  <rect width="${size}" height="${size}" rx="${r}" fill="${INK}"/>
  ${markCentered(size / 2, size / 2, (size / 64) * markScale)}
</svg>`;
}

function logoMarkPremium(size = 1024) {
  // Flat mark on dark field — same geometry, soft ambient only (no alternate glyph)
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${markDefs()}
  <defs>
    <radialGradient id="glow" cx="50%" cy="42%" r="55%">
      <stop offset="0%" stop-color="#1a2436"/>
      <stop offset="100%" stop-color="${INK}"/>
    </radialGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="${size * 0.02}" stdDeviation="${size * 0.03}" flood-color="#000" flood-opacity="0.45"/>
    </filter>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#glow)"/>
  <g filter="url(#soft)">
    ${markCentered(size / 2, size / 2, (size / 64) * 0.55)}
  </g>
</svg>`;
}

function trayIcon(size = 256) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${markDefs()}
  ${markCentered(size / 2, size / 2, (size / 64) * 0.9)}
</svg>`;
}

function wordmarkLockup(w = 1600, h = 640) {
  const tile = 220;
  const tx = 160;
  const ty = (h - tile) / 2;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${markDefs()}
  <rect width="${w}" height="${h}" fill="${INK}"/>
  <rect x="${tx}" y="${ty}" width="${tile}" height="${tile}" rx="48" fill="#101826"/>
  <rect x="${tx}" y="${ty}" width="${tile}" height="${tile}" rx="48" fill="none" stroke="${BORDER}" stroke-width="2"/>
  ${markCentered(tx + tile / 2, ty + tile / 2, (tile / 64) * 0.62)}
  <text x="${tx + tile + 56}" y="${h / 2 + 28}"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    font-size="120" font-weight="600" fill="${FG}" letter-spacing="-2">Consoleri</text>
  <text x="${tx + tile + 56}" y="${h / 2 + 88}"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    font-size="36" font-weight="500" fill="${MUTED}">SSH · terminals · network map</text>
</svg>`;
}

function splash(w = 1600, h = 1000) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${markDefs()}
  <rect width="${w}" height="${h}" fill="${INK}"/>
  <rect x="${(w - 160) / 2}" y="${h / 2 - 170}" width="160" height="160" rx="36" fill="#101826"/>
  ${markCentered(w / 2, h / 2 - 90, (160 / 64) * 0.62)}
  <text x="${w / 2}" y="${h / 2 + 70}" text-anchor="middle"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    font-size="64" font-weight="600" fill="${FG}">Consoleri</text>
  <text x="${w / 2}" y="${h / 2 + 118}" text-anchor="middle"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    font-size="28" font-weight="500" fill="${MUTED}">v0.4.7</text>
</svg>`;
}

function aboutPanel(w = 1200, h = 800) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${markDefs()}
  <rect width="${w}" height="${h}" rx="24" fill="${SURFACE}"/>
  <rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="23" fill="none" stroke="${BORDER}" stroke-width="2"/>
  <rect x="0" y="0" width="${w}" height="64" rx="24" fill="#101826"/>
  <rect x="0" y="40" width="${w}" height="24" fill="#101826"/>
  <text x="28" y="40" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    font-size="18" font-weight="600" fill="${FG}">About Consoleri</text>
  ${markCentered(w / 2, 220, 2.2)}
  <text x="${w / 2}" y="360" text-anchor="middle"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    font-size="42" font-weight="600" fill="${FG}">Consoleri</text>
  <text x="${w / 2}" y="410" text-anchor="middle"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    font-size="22" font-weight="500" fill="${MUTED}">Host manager · terminal multiplexer · network map</text>
  <text x="${w / 2}" y="470" text-anchor="middle"
    font-family="ui-monospace, 'JetBrains Mono', Menlo, Consolas, monospace"
    font-size="18" font-weight="500" fill="${ACCENT}">v0.4.7</text>
  <rect x="${(w - 200) / 2}" y="540" width="200" height="48" rx="10" fill="${ACCENT}"/>
  <text x="${w / 2}" y="571" text-anchor="middle"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    font-size="18" font-weight="600" fill="${FG}">Close</text>
</svg>`;
}

function heroNetwork(w = 1600, h = 900) {
  const nodes = [
    [400, 280], [700, 220], [980, 300], [520, 480], [860, 520], [1180, 450], [300, 560],
  ];
  const links = [[0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 4], [4, 5], [3, 6]];
  const lines = links
    .map(([a, b]) => {
      const [x1, y1] = nodes[a];
      const [x2, y2] = nodes[b];
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${BORDER}" stroke-width="2"/>`;
    })
    .join("");
  const cards = nodes
    .map(
      ([x, y], i) => `
    <g transform="translate(${x - 70} ${y - 28})">
      <rect width="140" height="56" rx="8" fill="${SURFACE}" stroke="${i === 1 ? ACCENT : BORDER}" stroke-width="1.5"/>
      <rect width="140" height="20" rx="8" fill="${ACCENT}"/>
      <rect y="12" width="140" height="8" fill="${ACCENT}"/>
      <circle cx="16" cy="36" r="4" fill="${i % 2 ? "#10b981" : BRAND}"/>
      <text x="28" y="40" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="${FG}">host-${i + 1}</text>
    </g>`
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${markDefs()}
  <rect width="${w}" height="${h}" fill="${INK}"/>
  ${lines}
  ${cards}
  <g transform="translate(64 48)">
    <rect width="56" height="56" rx="12" fill="#101826"/>
    ${markCentered(28, 28, 0.55)}
    <text x="72" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
      font-size="28" font-weight="600" fill="${FG}">Consoleri</text>
  </g>
  <text x="64" y="${h - 48}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    font-size="18" fill="${MUTED}">Network map · same mark as app icon</text>
</svg>`;
}

function emptyScene(kind, w = 1280, h = 800) {
  const title =
    kind === "hosts" ? "No hosts yet" : kind === "keys" ? "No SSH keys" : "No network nodes";
  const sub =
    kind === "hosts"
      ? "Add a host to start connecting"
      : kind === "keys"
        ? "Generate or import a key"
        : "Discover hosts to build the map";

  let art = "";
  if (kind === "hosts") {
    art = `
      <rect x="470" y="220" width="340" height="220" rx="14" fill="${SURFACE}" stroke="${BORDER}"/>
      <rect x="494" y="248" width="48" height="48" rx="10" fill="${ACCENT}"/>
      <rect x="560" y="256" width="180" height="12" rx="4" fill="${MUTED}" opacity="0.45"/>
      <rect x="560" y="280" width="120" height="10" rx="4" fill="${MUTED}" opacity="0.25"/>
      <rect x="494" y="320" width="48" height="48" rx="10" fill="#a855f7"/>
      <rect x="560" y="328" width="160" height="12" rx="4" fill="${MUTED}" opacity="0.45"/>
      <rect x="560" y="352" width="100" height="10" rx="4" fill="${MUTED}" opacity="0.25"/>
      ${markCentered(640, 180, 1.1)}`;
  } else if (kind === "keys") {
    art = `
      <rect x="560" y="210" width="160" height="220" rx="16" fill="${SURFACE}" stroke="${BORDER}"/>
      <circle cx="640" cy="280" r="36" fill="none" stroke="${BRAND}" stroke-width="10"/>
      <rect x="620" y="310" width="40" height="70" rx="8" fill="${BRAND}"/>
      <rect x="632" y="350" width="16" height="18" rx="3" fill="${INK}"/>
      ${markCentered(640, 170, 0.9)}`;
  } else {
    art = `
      <circle cx="520" cy="300" r="10" fill="${ACCENT}"/>
      <circle cx="640" cy="250" r="10" fill="${BRAND}"/>
      <circle cx="760" cy="310" r="10" fill="#10b981"/>
      <circle cx="640" cy="380" r="10" fill="#a855f7"/>
      <line x1="520" y1="300" x2="640" y2="250" stroke="${BORDER}" stroke-width="2"/>
      <line x1="640" y1="250" x2="760" y2="310" stroke="${BORDER}" stroke-width="2"/>
      <line x1="520" y1="300" x2="640" y2="380" stroke="${BORDER}" stroke-width="2"/>
      <line x1="760" y1="310" x2="640" y2="380" stroke="${BORDER}" stroke-width="2"/>
      ${markCentered(640, 170, 0.9)}`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${markDefs()}
  <rect width="${w}" height="${h}" fill="${INK}"/>
  ${art}
  <text x="${w / 2}" y="520" text-anchor="middle"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    font-size="36" font-weight="600" fill="${FG}">${title}</text>
  <text x="${w / 2}" y="568" text-anchor="middle"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    font-size="20" font-weight="500" fill="${MUTED}">${sub}</text>
</svg>`;
}

function hostAvatars(w = 640, h = 200) {
  const colors = [ACCENT, "#a855f7", BRAND, "#10b981", "#ef4444"];
  const letters = ["A", "G", "J", "K", "R"];
  const tiles = colors
    .map((c, i) => {
      const x = 40 + i * 120;
      const fill = c === BRAND ? INK : FG;
      return `
      <rect x="${x}" y="50" width="80" height="80" rx="18" fill="${c}"/>
      <text x="${x + 40}" y="104" text-anchor="middle"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
        font-size="32" font-weight="700" fill="${fill}">${letters[i]}</text>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${INK}"/>
  ${tiles}
</svg>`;
}

async function main() {
  fs.mkdirSync(path.join(ROOT, "build/icons"), { recursive: true });
  fs.mkdirSync(path.join(ROOT, "assets/marketing"), { recursive: true });
  fs.mkdirSync(path.join(ROOT, "assets/illustrations"), { recursive: true });
  fs.mkdirSync(path.join(ROOT, "assets/icons"), { recursive: true });

  await png(logoMarkPremium(1024), OUT.logoMark, 1024, 1024);
  await png(tileIcon(1024), OUT.appIcon, 1024, 1024);
  await png(tileIcon(1024), OUT.buildIcon, 1024, 1024);
  await png(tileIcon(1024, 0.58), OUT.storeTile, 1024, 1024);
  await png(trayIcon(256), OUT.trayPng, 256, 256);
  await png(trayIcon(256), OUT.buildTray, 256, 256);

  // Text-heavy artboards: render via Chrome for reliable system fonts, fallback to sharp
  const chrome =
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const tmpDir = path.join(ROOT, ".tmp-brand-render");
  fs.mkdirSync(tmpDir, { recursive: true });

  const artboards = [
    { svg: wordmarkLockup(), file: OUT.wordmarkLockup, w: 1600, h: 640 },
    { svg: splash(), file: OUT.splash, w: 1600, h: 1000 },
    { svg: aboutPanel(), file: OUT.about, w: 1200, h: 800 },
    { svg: heroNetwork(), file: OUT.hero, w: 1600, h: 900 },
    { svg: emptyScene("hosts"), file: OUT.emptyHosts, w: 1280, h: 800 },
    { svg: emptyScene("keys"), file: OUT.emptyKeys, w: 1280, h: 800 },
    { svg: emptyScene("network"), file: OUT.emptyNetwork, w: 1280, h: 800 },
    { svg: hostAvatars(), file: OUT.hostAvatars, w: 640, h: 200 },
  ];

  for (const board of artboards) {
    const svgPath = path.join(tmpDir, path.basename(board.file, ".png") + ".svg");
    fs.writeFileSync(svgPath, board.svg);
    const htmlPath = path.join(tmpDir, path.basename(board.file, ".png") + ".html");
    fs.writeFileSync(
      htmlPath,
      `<!doctype html><html><head><style>
        html,body{margin:0;background:${INK};width:${board.w}px;height:${board.h}px;overflow:hidden}
        img{display:block;width:${board.w}px;height:${board.h}px}
      </style></head><body><img src="./${path.basename(svgPath)}" width="${board.w}" height="${board.h}"/></body></html>`
    );
    const shot = path.join(tmpDir, path.basename(board.file));
    const r = spawnSync(
      chrome,
      [
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        `--window-size=${board.w},${board.h}`,
        `--screenshot=${shot}`,
        pathToFileURL(htmlPath).href,
      ],
      { encoding: "utf8" }
    );
    if (r.status === 0 && fs.existsSync(shot)) {
      await sharp(shot).resize(board.w, board.h).png().toFile(board.file);
      console.log("wrote", path.relative(ROOT, board.file), "(chrome)");
    } else {
      console.warn("chrome failed for", board.file, r.stderr?.slice(0, 200));
      await png(board.svg, board.file, board.w, board.h);
    }
  }

  console.log("done — all rasters share mark path");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
