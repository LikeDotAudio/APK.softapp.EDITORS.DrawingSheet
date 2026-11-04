// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

import { linkBlock, mountDiscovered } from './softappLink.js';
import { SheetModel, SHEET_SIZES } from './sheetModel.js';
import { renderDrawingSheetSvg } from './sheetSvg.js';

const S = window.APKSoftapp;
const esc = S.esc;
let model = new SheetModel();

const bridge = linkBlock(S, {
  editor: 'Drawing Sheet Editor',
  blockType: 'drawingsheet',
  Model: SheetModel,
  getModel: () => model,
  setModel: (m, meta) => {
    model = m;
    const tag = document.getElementById('block-tag');
    if (tag && (meta.blockName || meta.filename)) tag.textContent = meta.blockName || meta.filename;
    renderAll();
  },
  filename: (m) => m.drawingCode.toLowerCase(),
});

function renderInspector() {
  const container = document.getElementById('inspector-content');
  if (!container) return;

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <div>
        <label style="display: block; font-size: 10px; color: var(--osc-text-muted); margin-bottom: 3px;">DRAWING CODE</label>
        <input type="text" class="input" id="inp-code" value="${esc(model.drawingCode)}">
      </div>

      <div>
        <label style="display: block; font-size: 10px; color: var(--osc-text-muted); margin-bottom: 3px;">SHEET TITLE</label>
        <input type="text" class="input" id="inp-title" value="${esc(model.title)}">
      </div>

      <div>
        <label style="display: block; font-size: 10px; color: var(--osc-text-muted); margin-bottom: 3px;">PROJECT NAME</label>
        <input type="text" class="input" id="inp-project" value="${esc(model.projectName)}">
      </div>

      <div>
        <label style="display: block; font-size: 10px; color: var(--osc-text-muted); margin-bottom: 3px;">CLIENT / FACILITY</label>
        <input type="text" class="input" id="inp-client" value="${esc(model.clientName)}">
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div>
          <label style="display: block; font-size: 10px; color: var(--osc-text-muted); margin-bottom: 3px;">SHEET NUMBER</label>
          <input type="number" class="input" id="inp-sheet-num" value="${esc(model.sheetNumber)}">
        </div>
        <div>
          <label style="display: block; font-size: 10px; color: var(--osc-text-muted); margin-bottom: 3px;">TOTAL SHEETS</label>
          <input type="number" class="input" id="inp-sheet-total" value="${esc(model.sheetTotal)}">
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div>
          <label style="display: block; font-size: 10px; color: var(--osc-text-muted); margin-bottom: 3px;">SCALE</label>
          <input type="text" class="input" id="inp-scale" value="${esc(model.scaleText)}">
        </div>
        <div>
          <label style="display: block; font-size: 10px; color: var(--osc-text-muted); margin-bottom: 3px;">ENGINEER</label>
          <input type="text" class="input" id="inp-eng" value="${esc(model.engineer)}">
        </div>
      </div>

      <div style="margin-top: 8px; border-top: 1px solid var(--osc-border-default); padding-top: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <label style="font-size: 10px; color: var(--osc-text-muted); font-weight: 700;">ADD REVISION</label>
        </div>
        <div style="display: flex; gap: 6px;">
          <input type="text" class="input" id="inp-new-rev" placeholder="Rev" style="width: 50px; text-align: center;">
          <input type="text" class="input" id="inp-new-desc" placeholder="Revision description..." style="flex: 1;">
          <button class="btn btn-secondary btn-sm" id="btn-add-rev">Add</button>
        </div>
        <div id="revisions-table" style="margin-top: 8px;"></div>
      </div>
    </div>
  `;

  renderRevisionTable();

  const bind = (id, prop, isNum = false) => {
    document.getElementById(id)?.addEventListener('input', (e) => {
      const val = isNum ? parseInt(e.target.value, 10) || 1 : e.target.value;
      model[prop] = val;
      bridge.changed();
      renderSvg();
    });
  };

  bind('inp-code', 'drawingCode');
  bind('inp-title', 'title');
  bind('inp-project', 'projectName');
  bind('inp-client', 'clientName');
  bind('inp-sheet-num', 'sheetNumber', true);
  bind('inp-sheet-total', 'sheetTotal', true);
  bind('inp-scale', 'scaleText');
  bind('inp-eng', 'engineer');

  document.getElementById('btn-add-rev')?.addEventListener('click', () => {
    const rev = document.getElementById('inp-new-rev')?.value;
    const desc = document.getElementById('inp-new-desc')?.value;
    if (rev && desc) {
      model.addRevision(rev, desc);
      bridge.changed();
      renderAll();
    }
  });
}

/* The revision list is an APKTable (vendor/apk-table): APKTable.get('drawingsheet-revisions'). */
function renderRevisionTable() {
  const tableHost = document.getElementById('revisions-table');
  if (!tableHost || !window.APKTable) return;
  window.APKTable.create(tableHost, {
    id: 'drawingsheet-revisions',
    columns: [
      { key: 'rev', label: 'Rev', mono: true },
      { key: 'date', label: 'Date', mono: true },
      { key: 'desc', label: 'Description' },
      { key: 'by', label: 'By' },
    ],
    rows: model.revisions,
    empty: 'No revisions yet.',
    onEdit: (i, key, value) => {
      if (!model.revisions[i]) return;
      model.revisions[i][key] = value;
      model.currentRev = model.revisions.at(-1)?.rev || model.currentRev;
      bridge.changed();
      renderSvg();
    },
    onDelete: (i) => {
      model.revisions.splice(i, 1);
      model.currentRev = model.revisions.at(-1)?.rev || '';
      bridge.changed();
      renderAll();
    },
  });
}

function renderSvg() {
  const container = document.getElementById('canvas-wrapper');
  if (!container) return;

  container.innerHTML = renderDrawingSheetSvg(model);
}

function renderAll() {
  renderSvg();
  renderInspector();
}

document.addEventListener('DOMContentLoaded', () => {
  renderAll();

  // Populate sheet size selector
  const selSize = document.getElementById('sel-sheet-size');
  if (selSize) {
    selSize.innerHTML = Object.entries(SHEET_SIZES).map(([key, s]) => `
      <option value="${esc(key)}" ${model.sheetSize === key ? 'selected' : ''}>${esc(s.label)}</option>
    `).join('');

    selSize.addEventListener('change', (e) => {
      model.setSheetSize(e.target.value);
      bridge.changed();
      renderAll();
    });
  }

  document.getElementById('btn-open-block')?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          bridge.openLocal(parsed, { filename: file.name });
        } catch (err) {
          alert('Failed to parse drawing sheet json: ' + err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });

  mountDiscovered(S, window.APKTable, {
    button: document.getElementById('btn-discovered'),
    panel: document.getElementById('discovered-panel'),
    status: document.getElementById('discovered-status'),
    tableHost: document.getElementById('discovered-table'),
    tableId: 'drawingsheet-discovered',
  });

  document.getElementById('btn-save-block')?.addEventListener('click', () => {
    bridge.save();
  });

  document.getElementById('btn-close')?.addEventListener('click', () => {
    bridge.close();
  });
});
