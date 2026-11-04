// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

import { BlockBridge } from './blockBridge.js';
import { SheetModel, SHEET_SIZES } from './sheetModel.js';
import { renderDrawingSheetSvg } from './sheetSvg.js';

let model = new SheetModel();

const bridge = new BlockBridge({
  name: 'Drawing Sheet Editor',
  type: 'drawingsheet',
  defaultBlock: model.toJSON(),
  onBlockLoaded: (block) => {
    if (block) {
      model = new SheetModel(block);
      renderAll();
    }
  },
});

function renderInspector() {
  const container = document.getElementById('inspector-content');
  if (!container) return;

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <div>
        <label style="display: block; font-size: 10px; color: var(--osc-text-muted); margin-bottom: 3px;">DRAWING CODE</label>
        <input type="text" class="input" id="inp-code" value="${model.drawingCode}">
      </div>

      <div>
        <label style="display: block; font-size: 10px; color: var(--osc-text-muted); margin-bottom: 3px;">SHEET TITLE</label>
        <input type="text" class="input" id="inp-title" value="${model.title}">
      </div>

      <div>
        <label style="display: block; font-size: 10px; color: var(--osc-text-muted); margin-bottom: 3px;">PROJECT NAME</label>
        <input type="text" class="input" id="inp-project" value="${model.projectName}">
      </div>

      <div>
        <label style="display: block; font-size: 10px; color: var(--osc-text-muted); margin-bottom: 3px;">CLIENT / FACILITY</label>
        <input type="text" class="input" id="inp-client" value="${model.clientName}">
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div>
          <label style="display: block; font-size: 10px; color: var(--osc-text-muted); margin-bottom: 3px;">SHEET NUMBER</label>
          <input type="number" class="input" id="inp-sheet-num" value="${model.sheetNumber}">
        </div>
        <div>
          <label style="display: block; font-size: 10px; color: var(--osc-text-muted); margin-bottom: 3px;">TOTAL SHEETS</label>
          <input type="number" class="input" id="inp-sheet-total" value="${model.sheetTotal}">
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div>
          <label style="display: block; font-size: 10px; color: var(--osc-text-muted); margin-bottom: 3px;">SCALE</label>
          <input type="text" class="input" id="inp-scale" value="${model.scaleText}">
        </div>
        <div>
          <label style="display: block; font-size: 10px; color: var(--osc-text-muted); margin-bottom: 3px;">ENGINEER</label>
          <input type="text" class="input" id="inp-eng" value="${model.engineer}">
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
      </div>
    </div>
  `;

  const bind = (id, prop, isNum = false) => {
    document.getElementById(id)?.addEventListener('input', (e) => {
      const val = isNum ? parseInt(e.target.value, 10) || 1 : e.target.value;
      model[prop] = val;
      bridge.notifyChanged();
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
      bridge.notifyChanged();
      renderAll();
    }
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
      <option value="${key}" ${model.sheetSize === key ? 'selected' : ''}>${s.label}</option>
    `).join('');

    selSize.addEventListener('change', (e) => {
      model.setSheetSize(e.target.value);
      bridge.notifyChanged();
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
          model = new SheetModel(parsed);
          bridge.loadBlock(model.toJSON(), { filename: file.name });
          renderAll();
        } catch (err) {
          alert('Failed to parse drawing sheet json: ' + err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });

  document.getElementById('btn-discovered')?.addEventListener('click', async () => {
    const project = await bridge.fetchDiscoveredProject();
    if (project) {
      alert(`Discovered Project: ${project.project_name || 'APK Audio'}\nSheet Code: ${model.drawingCode}`);
    } else {
      alert('Connecting to live discovery bus...');
    }
  });

  document.getElementById('btn-save-block')?.addEventListener('click', () => {
    bridge.saveBlock(model.toJSON(), { filename: model.drawingCode.toLowerCase() });
  });

  document.getElementById('btn-close')?.addEventListener('click', () => {
    bridge.close();
  });
});
