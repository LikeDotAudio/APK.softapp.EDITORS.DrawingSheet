// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * THE DRAWING SHEET AS IFC4X3_ADD2 (IFC-CORE-DELTAS cad-9)
 *
 * - The project and client are the IfcProject's Name and LongName, not text
 *   retyped on each sheet.
 * - The sheet is an IfcDocumentInformation: Identification = drawing code,
 *   Name = title, Revision = current rev, CreationTime = the sheet's date,
 *   DocumentOwner = the engineer, Editors = the drafter (an IfcPerson by
 *   FamilyName) and whoever made the current revision (by Identification, the
 *   initials the revision table carries); Description and LastRevisionTime
 *   are the current revision's.
 * - Each other revision is its own IfcDocumentInformation (Revision, its date
 *   as LastRevisionTime, its description, its author), and the revisions are a
 *   chain of IfcDocumentInformationRelationship 'REVISION': each one relating
 *   the one before it, in the table's order (a current rev the table does not
 *   list yet relates the table's last).
 * - The sheet reaches the project through an IfcDocumentReference and an
 *   IfcRelAssociatesDocument, on the IfcProject and on the sheet's own
 *   IfcAnnotation ObjectType 'DRAWING_SHEET', which carries what only paper
 *   has: APK_DrawingSheet {SheetId, SheetSize, Width, Height (mm), SheetNumber,
 *   SheetTotal, ScaleText}.
 *
 * fromIfc(toIfc(sheet)) is the sheet again (test/sheetIfc.test.mjs).
 */
import { entitiesByType, getPsets, ifcGuid, isRef, parseStep, unwrap } from '../../vendor/apk-contracts/apk-ifc.js';
import { SHEET_SIZES } from '../sheetModel.js';
import { E, StepWriter, bool, ident, int, label, measure, projectFrame, psetWriter, stepHeader } from './stepWriter.js';

export const SHEET_IFC_SCHEMA = 'apk.drawingsheet/ifc@1';
const APP = 'EDITORS.DrawingSheet';
const DAY = /^\d{4}-\d{2}-\d{2}$/;
/** A plain date as IfcDateTime (midnight), and back. */
const dateTime = (d) => (d === undefined || d === null ? null : DAY.test(String(d)) ? `${d}T00:00:00` : String(d));
const dateOf = (t) => (typeof t === 'string' && /^\d{4}-\d{2}-\d{2}T00:00:00$/.test(t) ? t.slice(0, 10) : t ?? undefined);

/** The sheet (a SheetModel, or its toJSON block) as one IFC4X3_ADD2 file. */
export function toIfc(sheetIn, opts = {}) {
  const sheet = typeof sheetIn?.toJSON === 'function' ? sheetIn.toJSON() : sheetIn;
  const w = new StepWriter();
  const F = projectFrame(w, APP);
  const { oh } = F;
  const { pset, flush } = psetWriter(w, oh, ifcGuid);
  const role = (...r) => ifcGuid('drawingsheet', String(sheet.id), ...r.map(String));

  const project = w.add('IFCPROJECT', [role('project'), oh, sheet.projectName ?? null, 'A drawing sheet (EDITORS.DrawingSheet) as IFC', null, sheet.clientName ?? null, null, [F.model, F.plan], F.units]);
  const byName = (name) => w.add('IFCPERSON', [null, String(name), null, null, null, null, null, null]);
  const byInitials = (who) => w.add('IFCPERSON', [String(who), null, null, null, null, null, null, null]);

  const revisions = sheet.revisions ?? [];
  let current = -1;
  revisions.forEach((r, i) => { if (r.rev === sheet.currentRev) current = i; });
  const doc = (r, isSheet) => {
    const editors = [];
    if (isSheet && sheet.drafter) editors.push(byName(sheet.drafter));
    if (r?.by) editors.push(byInitials(r.by));
    return w.add('IFCDOCUMENTINFORMATION', [
      String(sheet.drawingCode ?? ''), String(sheet.title ?? ''), r?.desc ?? null, null, null, null, null,
      (isSheet ? sheet.currentRev : r?.rev) ?? null,
      isSheet && sheet.engineer ? byName(sheet.engineer) : null,
      editors.length ? editors : null,
      isSheet ? dateTime(sheet.date) : null,
      dateTime(r?.date), null, null, null, null, null,
    ]);
  };
  const sheetDoc = doc(current >= 0 ? revisions[current] : null, true);
  const chain = revisions.map((r, i) => (i === current ? sheetDoc : doc(r, false)));
  for (let i = 1; i < chain.length; i++) w.add('IFCDOCUMENTINFORMATIONRELATIONSHIP', ['Revision', null, chain[i], [chain[i - 1]], 'REVISION']);
  // a current revision the table does not list yet is the newest, after the table's last
  if (current < 0 && chain.length) w.add('IFCDOCUMENTINFORMATIONRELATIONSHIP', ['Revision', null, sheetDoc, [chain[chain.length - 1]], 'REVISION']);

  const size = SHEET_SIZES[sheet.sheetSize];
  const paper = w.add('IFCANNOTATION', [role('sheet'), oh, sheet.drawingCode ?? null, sheet.title ?? null, 'DRAWING_SHEET', null, null, E('USERDEFINED')]);
  pset(role('sheet'), 'APK_DrawingSheet', [
    ['Schema', ident(SHEET_IFC_SCHEMA)], ['SheetId', ident(sheet.id)],
    ['SheetSize', sheet.sheetSize !== undefined ? label(sheet.sheetSize) : undefined],
    ['Width', size ? measure('IFCPOSITIVELENGTHMEASURE', size.width_mm) : undefined],
    ['Height', size ? measure('IFCPOSITIVELENGTHMEASURE', size.height_mm) : undefined],
    ['SheetNumber', sheet.sheetNumber !== undefined ? int(sheet.sheetNumber) : undefined],
    ['SheetTotal', sheet.sheetTotal !== undefined ? int(sheet.sheetTotal) : undefined],
    ['ScaleText', sheet.scaleText !== undefined ? label(sheet.scaleText) : undefined],
    ['CurrentInRevisions', current >= 0 ? undefined : bool(false)],
  ], [paper]);
  // a reference names its document or carries a Name, not both (IfcDocumentReference.WR1)
  const docRef = w.add('IFCDOCUMENTREFERENCE', [null, sheet.drawingCode ?? null, null, null, sheetDoc]);
  w.add('IFCRELASSOCIATESDOCUMENT', [role('rel', 'document'), oh, null, null, [project, paper], docRef]);
  flush();
  const stem = String(opts.fileName ?? sheet.drawingCode ?? 'sheet').replace(/\.(ifc|json)$/i, '');
  return w.write(stepHeader(`${stem}.ifc`, opts.timestamp ?? new Date(0).toISOString(), APP));
}

export class SheetIfcError extends Error {
  constructor(msg) { super(msg); this.code = 'bad_input'; }
}

/** An .ifc this editor wrote back into the sheet block (what toJSON gives). */
export function fromIfc(textIn) {
  let file;
  try { file = parseStep(textIn); } catch (e) { throw new SheetIfcError(`not an IFC file: ${e.message}`); }
  const project = entitiesByType(file, 'IFCPROJECT')[0];
  if (!project) throw new SheetIfcError('the file has no IfcProject');
  const get = (v) => (isRef(v) ? file.byId.get(v.id) : undefined);
  const paper = entitiesByType(file, 'IFCANNOTATION').find((a) => a.args[4] === 'DRAWING_SHEET');
  const P = (paper && getPsets(file, paper).APK_DrawingSheet) || {};
  const assoc = entitiesByType(file, 'IFCRELASSOCIATESDOCUMENT').find((r) => (r.args[4] ?? []).some((x) => isRef(x) && (x.id === project.id || x.id === paper?.id)));
  const sheetDoc = get(get(assoc?.args[5])?.args[4]) ?? entitiesByType(file, 'IFCDOCUMENTINFORMATION')[0];
  if (!sheetDoc) throw new SheetIfcError('the file has no drawing (IfcDocumentInformation)');

  // the revision chain: each relationship relates a revision to the one before it
  const before = new Map();
  const after = new Map();
  for (const r of entitiesByType(file, 'IFCDOCUMENTINFORMATIONRELATIONSHIP')) {
    if (r.args[4] !== 'REVISION' || !isRef(r.args[2])) continue;
    const prev = (r.args[3] ?? []).find(isRef);
    if (!prev) continue;
    before.set(r.args[2].id, prev.id);
    after.set(prev.id, r.args[2].id);
  }
  let first = sheetDoc.id;
  for (let guard = 0; before.has(first) && guard < 10000; guard++) first = before.get(first);
  const docs = [];
  for (let id = first, guard = 0; id !== undefined && guard < 10000; id = after.get(id), guard++) docs.push(file.byId.get(id));
  const inChain = P.CurrentInRevisions !== false;
  const people = (v) => (Array.isArray(v) ? v : v ? [v] : []).map(get).filter((p) => p?.type === 'IFCPERSON');
  const initials = (d) => people(d.args[9]).find((p) => typeof p.args[0] === 'string')?.args[0];
  const revisions = docs.filter((d) => inChain || d.id !== sheetDoc.id).map((d) => {
    const r = { rev: unwrap(d.args[7]) ?? undefined, date: dateOf(d.args[11]), desc: d.args[2] ?? undefined, by: initials(d) };
    return Object.fromEntries(Object.entries(r).filter(([, v]) => v !== undefined));
  });

  const owner = get(sheetDoc.args[8]);
  const drafter = people(sheetDoc.args[9]).find((p) => typeof p.args[1] === 'string');
  const out = {
    type: 'drawingsheet',
    id: P.SheetId !== undefined ? String(P.SheetId) : String(project.args[0]),
    sheetSize: P.SheetSize !== undefined ? String(P.SheetSize) : undefined,
    drawingCode: String(sheetDoc.args[0]),
    title: String(sheetDoc.args[1]),
    projectName: project.args[2] ?? undefined,
    clientName: project.args[5] ?? undefined,
    sheetNumber: P.SheetNumber,
    sheetTotal: P.SheetTotal,
    scaleText: P.ScaleText !== undefined ? String(P.ScaleText) : undefined,
    engineer: owner?.type === 'IFCPERSON' ? owner.args[1] ?? undefined : undefined,
    drafter: drafter?.args[1] ?? undefined,
    date: dateOf(sheetDoc.args[10]),
    currentRev: unwrap(sheetDoc.args[7]) ?? undefined,
    revisions,
  };
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined));
}
