// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

import test from 'node:test';
import assert from 'node:assert/strict';
import { SheetModel, SHEET_SIZES } from '../js/sheetModel.js';
import { renderDrawingSheetSvg } from '../js/sheetSvg.js';

test('SheetModel initializes with ANSI B default dimensions and title block', () => {
  const model = new SheetModel();
  assert.equal(model.sheetSize, 'ANSI_B');
  assert.equal(model.drawingCode, 'TA01-C101');
  assert.ok(model.revisions.length >= 3);
  assert.equal(model.currentRev, 'C');
});

test('SheetModel changes sheet sizes to ISO standards', () => {
  const model = new SheetModel();
  const changed = model.setSheetSize('ISO_A3');
  assert.equal(changed, true);
  assert.equal(model.sheetSize, 'ISO_A3');
});

test('SheetModel adds new revisions and bumps current rev', () => {
  const model = new SheetModel();
  const revCount = model.revisions.length;
  model.addRevision('D', 'Issued for Construction');
  assert.equal(model.revisions.length, revCount + 1);
  assert.equal(model.currentRev, 'D');
});

test('renderDrawingSheetSvg produces complete SVG with zone marks and title block', () => {
  const model = new SheetModel();
  const svg = renderDrawingSheetSvg(model);
  assert.ok(svg.includes('<svg'));
  assert.ok(svg.includes('title-block'));
  assert.ok(svg.includes('TA01-C101'));
  assert.ok(svg.includes('REVISIONS'));
  assert.ok(svg.includes('APK.audio'));
});
