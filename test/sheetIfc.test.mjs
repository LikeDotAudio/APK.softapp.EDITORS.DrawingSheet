// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
// cad-9: the sheet as IfcDocumentInformation (+ one per earlier revision, chained) and back.
// IFC_OUT=<dir> npm test  also writes the files there, for IfcOpenShell validate.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SheetModel } from '../js/sheetModel.js';
import { fromIfc, toIfc } from '../js/ifc/sheetIfc.js';
import { entitiesByType, getPsets, parseStep } from '../vendor/apk-contracts/apk-ifc.js';

const emit = (name, text) => {
  if (!process.env.IFC_OUT) return;
  mkdirSync(process.env.IFC_OUT, { recursive: true });
  writeFileSync(join(process.env.IFC_OUT, name), text);
};
const plain = (m) => JSON.parse(JSON.stringify(m.toJSON()));

test('the default sheet → 3 IfcDocumentInformation, 2 revision relationships, and back', () => {
  const m = new SheetModel({ id: 'sheet_default', date: '2026-11-06' });
  const text = toIfc(m);
  emit('sheet-default.ifc', text);
  const f = parseStep(text);
  const docs = entitiesByType(f, 'IFCDOCUMENTINFORMATION');
  assert.equal(docs.length, 3);
  const rels = entitiesByType(f, 'IFCDOCUMENTINFORMATIONRELATIONSHIP');
  assert.equal(rels.length, 2);
  assert.ok(rels.every((r) => r.args[4] === 'REVISION'));
  const sheet = docs.find((d) => d.args[7] === 'C');
  assert.equal(sheet.args[0], 'TA01-C101');
  assert.equal(sheet.args[1], 'AUDIO SYSTEM SCHEMATIC — CONTROL ROOM & STUDIO A');
  assert.equal(sheet.args[10], '2026-11-06T00:00:00');
  // the project and client are the project's own names
  const project = entitiesByType(f, 'IFCPROJECT')[0];
  assert.equal(project.args[2], 'BROADCAST PRODUCTION FACILITY');
  assert.equal(project.args[5], 'APK.audio Production Center');
  // reached from the project through a reference
  const assoc = entitiesByType(f, 'IFCRELASSOCIATESDOCUMENT')[0];
  assert.ok(assoc.args[4].some((x) => x.id === project.id));
  assert.equal(f.byId.get(f.byId.get(assoc.args[5].id).args[4].id), sheet);
  const paper = entitiesByType(f, 'IFCANNOTATION').find((a) => a.args[4] === 'DRAWING_SHEET');
  assert.deepEqual(getPsets(f, paper).APK_DrawingSheet, {
    Schema: 'apk.drawingsheet/ifc@1', SheetId: 'sheet_default', SheetSize: 'ANSI_B', Width: 431.8, Height: 279.4, SheetNumber: 1, SheetTotal: 8, ScaleText: 'N.T.S.',
  });
  assert.deepEqual(fromIfc(text), plain(m));
  assert.equal(toIfc(new SheetModel(fromIfc(text))), text);
});

test('a new revision, a current rev not in the table, and odd dates round-trip', () => {
  const m = new SheetModel({ id: 'sheet_2', date: '2026-11-06', sheetSize: 'ISO_A1' });
  m.addRevision('D', 'Issued for Construction', 'JS');
  m.revisions[3].date = '2026-11-06';
  assert.deepEqual(fromIfc(toIfc(m)), plain(m));
  const n = new SheetModel({ id: 'sheet_3', date: 'week 45', currentRev: 'E' });
  const text = toIfc(n);
  emit('sheet-odd.ifc', text);
  assert.equal(entitiesByType(parseStep(text), 'IFCDOCUMENTINFORMATION').length, 4);
  assert.deepEqual(fromIfc(text), plain(n));
  assert.throws(() => fromIfc('nope'), /not an IFC file/);
});
