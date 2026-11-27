import {
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { DocumentBlock, ImageTranslationResult } from '../types/document';
import { getLanguageLabel } from './documentParser';

function base64ToUint8Array(base64: string): Uint8Array {
  if (typeof globalThis.atob === 'function') {
    const binary = globalThis.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  return Uint8Array.from(Buffer.from(base64, 'base64'));
}

function buildDocxChildrenFromBlocks(blocks: DocumentBlock[]): Array<Paragraph | Table> {
  const children: Array<Paragraph | Table> = [];

  for (const block of blocks) {
    if (block.type === 'table') {
      if (block.rows.length === 0) continue;
      const columnCount = Math.max(1, ...block.rows.map((r) => r.length));
      const cellWidthPct = Math.floor(100 / columnCount);

      const tableRows = block.rows.map((row, rowIndex) => {
        const isHeader = rowIndex === 0;
        const cells = row.map(
          (cellText) =>
            new TableCell({
              width: { size: cellWidthPct, type: WidthType.PERCENTAGE },
              shading: isHeader
                ? { type: ShadingType.CLEAR, fill: 'EFF6FF', color: 'auto' }
                : undefined,
              margins: { top: 100, bottom: 100, left: 140, right: 140 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cellText,
                      bold: isHeader,
                      font: 'Calibri',
                      size: 22,
                      color: isHeader ? '0F172A' : '1E293B',
                    }),
                  ],
                }),
              ],
            }),
        );
        return new TableRow({ children: cells, tableHeader: isHeader });
      });

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
            left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
            right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
            insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
          },
          rows: tableRows,
        }),
      );
      children.push(new Paragraph({ spacing: { after: 140 } }));
      continue;
    }

    if (block.type === 'heading1') {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
          children: [
            new TextRun({
              text: block.text,
              bold: true,
              font: 'Calibri',
              size: 32,
              color: '0F172A',
            }),
          ],
        }),
      );
      continue;
    }

    if (block.type === 'heading2') {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
          children: [
            new TextRun({
              text: block.text,
              bold: true,
              font: 'Calibri',
              size: 26,
              color: '1E293B',
            }),
          ],
        }),
      );
      continue;
    }

    if (block.type === 'heading3') {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 160, after: 80 },
          children: [
            new TextRun({
              text: block.text,
              bold: true,
              font: 'Calibri',
              size: 24,
              color: '334155',
            }),
          ],
        }),
      );
      continue;
    }

    if (block.type === 'bullet') {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: block.text,
              font: 'Calibri',
              size: 22,
              color: '1E293B',
            }),
          ],
        }),
      );
      continue;
    }

    children.push(
      new Paragraph({
        spacing: { after: 140, line: 320 },
        children: [
          new TextRun({
            text: block.text,
            font: 'Calibri',
            size: 22,
            color: '1E293B',
          }),
        ],
      }),
    );
  }

  return children;
}

export async function buildDocxFromBlocks(
  title: string,
  blocks: DocumentBlock[],
): Promise<Uint8Array> {
  const children = buildDocxChildrenFromBlocks(blocks);

  if (children.length === 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: title || 'Tài liệu trống', font: 'Calibri', size: 22 })],
      }),
    );
  }

  const doc = new Document({
    title: title || 'Tài liệu Word',
    creator: 'SmartStudy',
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 },
          },
        },
        children,
      },
    ],
  });

  const base64 = await Packer.toBase64String(doc);
  return base64ToUint8Array(base64);
}

export async function buildDocxFromImageTranslation(
  result: ImageTranslationResult,
  includeBilingual: boolean,
): Promise<Uint8Array> {
  const children: Array<Paragraph | Table> = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: `Bản dịch hình ảnh — ${result.sourceLabel}`,
          bold: true,
          font: 'Calibri',
          size: 30,
          color: '0F172A',
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 220 },
      children: [
        new TextRun({
          text: `Ngôn ngữ nguồn: ${result.detectedLanguage}  ·  Ngôn ngữ đích: ${getLanguageLabel(result.targetLanguage)}`,
          font: 'Calibri',
          size: 20,
          color: '475569',
        }),
      ],
    }),
  ];

  if (includeBilingual && result.segments.length > 0) {
    const headerRow = new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: 'F1F5F9', color: 'auto' },
          margins: { top: 100, bottom: 100, left: 140, right: 140 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Văn bản gốc (${result.detectedLanguage})`,
                  bold: true,
                  font: 'Calibri',
                  size: 22,
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: 'EFF6FF', color: 'auto' },
          margins: { top: 100, bottom: 100, left: 140, right: 140 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Bản dịch (${getLanguageLabel(result.targetLanguage)})`,
                  bold: true,
                  font: 'Calibri',
                  size: 22,
                }),
              ],
            }),
          ],
        }),
      ],
    });

    const dataRows = result.segments.map(
      (seg) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              margins: { top: 100, bottom: 100, left: 140, right: 140 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: seg.original, font: 'Calibri', size: 22 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              margins: { top: 100, bottom: 100, left: 140, right: 140 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: seg.translated, font: 'Calibri', size: 22 })],
                }),
              ],
            }),
          ],
        }),
    );

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
          left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
          right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
          insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
        },
        rows: [headerRow, ...dataRows],
      }),
    );
  } else {
    const paragraphs = result.translatedText
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of paragraphs) {
      children.push(
        new Paragraph({
          spacing: { after: 140, line: 320 },
          children: [new TextRun({ text: line, font: 'Calibri', size: 22, color: '0F172A' })],
        }),
      );
    }
  }

  const doc = new Document({
    title: `Bản dịch — ${result.sourceLabel}`,
    creator: 'SmartStudy',
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 },
          },
        },
        children,
      },
    ],
  });

  const base64 = await Packer.toBase64String(doc);
  return base64ToUint8Array(base64);
}

export function triggerDocxDownload(bytes: Uint8Array, fileName: string): void {
  const safeBuffer = bytes.slice().buffer;
  const blob = new Blob([safeBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
