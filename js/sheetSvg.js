// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

import { SHEET_SIZES } from './sheetModel.js';

/* Every text from the model is escaped before it goes into the SVG markup. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function renderDrawingSheetSvg(model, options = {}) {
  const size = SHEET_SIZES[model.sheetSize] || SHEET_SIZES.ANSI_B;

  // Scale: 2 pixels per mm
  const scale = 2.0;
  const sheetWidthPx = size.width_mm * scale;
  const sheetHeightPx = size.height_mm * scale;

  const margin = 20; // 10mm margin
  const borderW = sheetWidthPx - margin * 2;
  const borderH = sheetHeightPx - margin * 2;

  // Title Block dimensions in bottom-right corner
  const tbWidth = 360;
  const tbHeight = 140;
  const tbX = sheetWidthPx - margin - tbWidth;
  const tbY = sheetHeightPx - margin - tbHeight;

  // Revision Table dimensions in top-right or above title block
  const revTableW = 360;
  const revRowH = 18;
  const revTableH = 22 + model.revisions.length * revRowH;
  const revTableX = tbX;
  const revTableY = tbY - revTableH - 10;

  // Grid / Zone coordinate markings along borders (e.g., 1 to 8, A to D)
  const zoneCols = 8;
  const zoneRows = 4;
  let zoneMarksSvg = '';

  for (let c = 1; c < zoneCols; c++) {
    const zx = margin + (borderW / zoneCols) * c;
    zoneMarksSvg += `
      <line x1="${zx}" y1="${margin - 5}" x2="${zx}" y2="${margin}" stroke="#4A9EFF" stroke-width="1"/>
      <line x1="${zx}" y1="${sheetHeightPx - margin}" x2="${zx}" y2="${sheetHeightPx - margin + 5}" stroke="#4A9EFF" stroke-width="1"/>
      <text x="${zx - (borderW / zoneCols) / 2}" y="${margin - 7}" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="9" fill="#888888">${c}</text>
    `;
  }
  const lastColX = margin + (borderW / zoneCols) * (zoneCols - 0.5);
  zoneMarksSvg += `<text x="${lastColX}" y="${margin - 7}" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="9" fill="#888888">${zoneCols}</text>`;

  const rowLetters = ['A', 'B', 'C', 'D'];
  for (let r = 0; r < zoneRows; r++) {
    const zy = margin + (borderH / zoneRows) * (r + 0.5);
    zoneMarksSvg += `
      <text x="${margin - 8}" y="${zy + 3}" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="9" fill="#888888">${rowLetters[r]}</text>
      <text x="${sheetWidthPx - margin + 8}" y="${zy + 3}" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="9" fill="#888888">${rowLetters[r]}</text>
    `;
  }

  // Revision table rows
  const revRowsSvg = model.revisions.slice(-4).map((r, idx) => {
    const ry = revTableY + 22 + idx * revRowH;
    return `
      <rect x="${revTableX}" y="${ry}" width="${revTableW}" height="${revRowH}" fill="${idx % 2 === 0 ? '#18181b' : '#0f0f11'}" stroke="#2c2c2c" stroke-width="0.5"/>
      <text x="${revTableX + 10}" y="${ry + 13}" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" fill="#F4902C">${esc(r.rev)}</text>
      <text x="${revTableX + 35}" y="${ry + 13}" font-family="'JetBrains Mono', monospace" font-size="9" fill="#888888">${esc(r.date)}</text>
      <text x="${revTableX + 115}" y="${ry + 13}" font-family="-apple-system, sans-serif" font-size="9" fill="#f4f4f5">${esc(r.desc)}</text>
      <text x="${revTableX + revTableW - 10}" y="${ry + 13}" text-anchor="end" font-family="'JetBrains Mono', monospace" font-size="9" fill="#888888">${esc(r.by)}</text>
    `;
  }).join('');

  return `
    <svg id="drawing-sheet-svg" width="${sheetWidthPx}" height="${sheetHeightPx}" xmlns="http://www.w3.org/2000/svg">
      <!-- Outer Paper Sheet -->
      <rect width="${sheetWidthPx}" height="${sheetHeightPx}" fill="#121212" stroke="#2c2c2c" stroke-width="2"/>

      <!-- Inner Border Double Lines -->
      <rect x="${margin}" y="${margin}" width="${borderW}" height="${borderH}" fill="none" stroke="#4A9EFF" stroke-width="2"/>
      <rect x="${margin + 4}" y="${margin + 4}" width="${borderW - 8}" height="${borderH - 8}" fill="none" stroke="#2c2c2c" stroke-width="1"/>

      <!-- Zone Coordinates -->
      ${zoneMarksSvg}

      <!-- Drawing Working Area watermark -->
      <text x="${(sheetWidthPx - tbWidth) / 2}" y="${sheetHeightPx / 2}" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="18" font-weight="700" fill="#18181b" letter-spacing="0.2em">
        DRAWING WORKING AREA • SCHEMATIC & WIRING
      </text>

      <!-- Revision Block -->
      <g class="revision-table">
        <rect x="${revTableX}" y="${revTableY}" width="${revTableW}" height="22" fill="#2c2c2c"/>
        <text x="${revTableX + 10}" y="${revTableY + 15}" font-family="-apple-system, sans-serif" font-size="10" font-weight="700" fill="#f4f4f5">REVISIONS</text>
        <line x1="${revTableX + 30}" y1="${revTableY}" x2="${revTableX + 30}" y2="${revTableY + revTableH}" stroke="#2c2c2c" stroke-width="0.5"/>
        <line x1="${revTableX + 110}" y1="${revTableY}" x2="${revTableX + 110}" y2="${revTableY + revTableH}" stroke="#2c2c2c" stroke-width="0.5"/>
        <line x1="${revTableX + revTableW - 35}" y1="${revTableY}" x2="${revTableX + revTableW - 35}" y2="${revTableY + revTableH}" stroke="#2c2c2c" stroke-width="0.5"/>
        ${revRowsSvg}
      </g>

      <!-- Title Block -->
      <g class="title-block">
        <rect x="${tbX}" y="${tbY}" width="${tbWidth}" height="${tbHeight}" fill="#18181b" stroke="#4A9EFF" stroke-width="2"/>
        
        <!-- Company & Project Branding Header -->
        <rect x="${tbX}" y="${tbY}" width="${tbWidth}" height="32" fill="#0f0f11" stroke="#2c2c2c" stroke-width="1"/>
        <circle cx="${tbX + 18}" cy="${tbY + 16}" r="7" fill="#F4902C"/>
        <text x="${tbX + 32}" y="${tbY + 20}" font-family="-apple-system, sans-serif" font-size="13" font-weight="800" fill="#f4f4f5" letter-spacing="0.05em">APK.audio</text>
        <text x="${tbX + tbWidth - 12}" y="${tbY + 20}" text-anchor="end" font-family="-apple-system, sans-serif" font-size="10" font-weight="600" fill="#888888">${esc(model.clientName)}</text>

        <!-- Project Title -->
        <text x="${tbX + 12}" y="${tbY + 48}" font-family="'JetBrains Mono', monospace" font-size="9" fill="#888888">PROJECT:</text>
        <text x="${tbX + 12}" y="${tbY + 62}" font-family="-apple-system, sans-serif" font-size="11" font-weight="700" fill="#f4f4f5">${esc(model.projectName)}</text>

        <!-- Sheet Title -->
        <line x1="${tbX}" y1="${tbY + 70}" x2="${tbX + tbWidth}" y2="${tbY + 70}" stroke="#2c2c2c" stroke-width="1"/>
        <text x="${tbX + 12}" y="${tbY + 84}" font-family="'JetBrains Mono', monospace" font-size="9" fill="#888888">SHEET TITLE:</text>
        <text x="${tbX + 12}" y="${tbY + 98}" font-family="-apple-system, sans-serif" font-size="11" font-weight="700" fill="#F4902C">${esc(model.title)}</text>

        <!-- Bottom Grid: Drawing Code, Rev, Sheet Number, Scale -->
        <line x1="${tbX}" y1="${tbY + 106}" x2="${tbX + tbWidth}" y2="${tbY + 106}" stroke="#2c2c2c" stroke-width="1"/>
        
        <text x="${tbX + 12}" y="${tbY + 119}" font-family="'JetBrains Mono', monospace" font-size="8" fill="#888888">DWG NO.</text>
        <text x="${tbX + 12}" y="${tbY + 133}" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700" fill="#4A9EFF">${esc(model.drawingCode)}</text>

        <line x1="${tbX + 140}" y1="${tbY + 106}" x2="${tbX + 140}" y2="${tbY + tbHeight}" stroke="#2c2c2c" stroke-width="1"/>
        <text x="${tbX + 148}" y="${tbY + 119}" font-family="'JetBrains Mono', monospace" font-size="8" fill="#888888">SCALE</text>
        <text x="${tbX + 148}" y="${tbY + 132}" font-family="'JetBrains Mono', monospace" font-size="10" fill="#f4f4f5">${esc(model.scaleText)}</text>

        <line x1="${tbX + 220}" y1="${tbY + 106}" x2="${tbX + 220}" y2="${tbY + tbHeight}" stroke="#2c2c2c" stroke-width="1"/>
        <text x="${tbX + 228}" y="${tbY + 119}" font-family="'JetBrains Mono', monospace" font-size="8" fill="#888888">REV</text>
        <text x="${tbX + 228}" y="${tbY + 133}" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700" fill="#F4902C">${esc(model.currentRev)}</text>

        <line x1="${tbX + 280}" y1="${tbY + 106}" x2="${tbX + 280}" y2="${tbY + tbHeight}" stroke="#2c2c2c" stroke-width="1"/>
        <text x="${tbX + 288}" y="${tbY + 119}" font-family="'JetBrains Mono', monospace" font-size="8" fill="#888888">SHEET</text>
        <text x="${tbX + 288}" y="${tbY + 133}" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" fill="#f4f4f5">${esc(model.sheetNumber)} OF ${esc(model.sheetTotal)}</text>
      </g>
    </svg>
  `;
}
