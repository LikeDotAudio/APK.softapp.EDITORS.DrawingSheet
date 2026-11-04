// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

export const SHEET_SIZES = {
  ANSI_B: { label: 'ANSI B (11 x 17 in / Tabloid)', width_in: 17, height_in: 11, width_mm: 431.8, height_mm: 279.4 },
  ANSI_C: { label: 'ANSI C (17 x 22 in)', width_in: 22, height_in: 17, width_mm: 558.8, height_mm: 431.8 },
  ANSI_D: { label: 'ANSI D (22 x 34 in / Architectural D)', width_in: 34, height_in: 22, width_mm: 863.6, height_mm: 558.8 },
  ISO_A3: { label: 'ISO A3 (297 x 420 mm)', width_in: 16.54, height_in: 11.69, width_mm: 420, height_mm: 297 },
  ISO_A1: { label: 'ISO A1 (594 x 841 mm)', width_in: 33.11, height_in: 23.39, width_mm: 841, height_mm: 594 },
};

export class SheetModel {
  constructor(initialData = null) {
    this.id = initialData?.id || `sheet_${Date.now()}`;
    this.sheetSize = initialData?.sheetSize || 'ANSI_B';
    this.drawingCode = initialData?.drawingCode || 'TA01-C101';
    this.title = initialData?.title || 'AUDIO SYSTEM SCHEMATIC — CONTROL ROOM & STUDIO A';
    this.projectName = initialData?.projectName || 'BROADCAST PRODUCTION FACILITY';
    this.clientName = initialData?.clientName || 'APK.audio Production Center';
    this.sheetNumber = initialData?.sheetNumber || 1;
    this.sheetTotal = initialData?.sheetTotal || 8;
    this.scaleText = initialData?.scaleText || 'N.T.S.';
    this.engineer = initialData?.engineer || 'A. Kuzub';
    this.drafter = initialData?.drafter || 'System Engineering';
    this.date = initialData?.date || new Date().toISOString().split('T')[0];
    this.currentRev = initialData?.currentRev || 'C';

    this.revisions = initialData?.revisions || [
      { rev: 'A', date: '2026-08-15', desc: 'Initial Schematic Issue', by: 'AK' },
      { rev: 'B', date: '2026-09-20', desc: 'Added Dante Network Routing', by: 'AK' },
      { rev: 'C', date: '2026-10-30', desc: 'Updated SMPTE ST 2110 IP Media Feeds', by: 'AK' },
    ];
  }

  setSheetSize(key) {
    if (!SHEET_SIZES[key]) return false;
    this.sheetSize = key;
    return true;
  }

  addRevision(rev, desc, by = this.engineer) {
    const newRev = {
      rev,
      date: new Date().toISOString().split('T')[0],
      desc,
      by,
    };
    this.revisions.push(newRev);
    this.currentRev = rev;
    return newRev;
  }

  toJSON() {
    return {
      type: 'drawingsheet',
      id: this.id,
      sheetSize: this.sheetSize,
      drawingCode: this.drawingCode,
      title: this.title,
      projectName: this.projectName,
      clientName: this.clientName,
      sheetNumber: this.sheetNumber,
      sheetTotal: this.sheetTotal,
      scaleText: this.scaleText,
      engineer: this.engineer,
      drafter: this.drafter,
      date: this.date,
      currentRev: this.currentRev,
      revisions: this.revisions,
    };
  }
}
