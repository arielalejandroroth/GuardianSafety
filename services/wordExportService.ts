import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  HeadingLevel,
  ShadingType,
  Footer,
  PageNumber,
  ImageRun
} from 'docx';
import { AccidentReport, CauseTreeAnalysis } from '../types';
import { minervaLogoBase64 } from '../assets/logo';
import { getLegendItemsFromTreeText } from '../components/CauseTreeDiagram';

// Helper to convert base64 image (with or without data URI prefix) into Uint8Array
const base64ToUint8Array = (base64Str: string): Uint8Array => {
  const cleanBase64 = base64Str.replace(/^data:image\/\w+;base64,/, '');
  const binaryString = atob(cleanBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Formateo de fechas consistente
const formatDateEs = (dateStr?: string): string => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('es-AR');
};

const BORDER_COLOR = 'CBD5E1';
const thinBorder = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: BORDER_COLOR,
};

const noBorder = {
  style: BorderStyle.NONE,
  size: 0,
  color: 'auto',
};

const cellBordersAll = {
  top: thinBorder,
  bottom: thinBorder,
  left: thinBorder,
  right: thinBorder,
};

const cellBordersNone = {
  top: noBorder,
  bottom: noBorder,
  left: noBorder,
  right: noBorder,
};

// Creates a section header paragraph matching the PDF style exactly
const createSectionHeading = (title: string): Paragraph => {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 100 },
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: 10,
        color: '00529B',
      },
    },
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 21, // ~10.5pt
        color: '003F7A',
        font: 'Arial',
      }),
    ],
  });
};

// Helper for label/value cells in general info table
const createLabelCell = (text: string, widthPercent: number = 18): TableCell => {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    borders: cellBordersAll,
    shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
    margins: { top: 70, bottom: 70, left: 90, right: 90 },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: true,
            size: 17, // 8.5pt
            color: '334155',
            font: 'Arial',
          }),
        ],
      }),
    ],
  });
};

const createValueCell = (
  text: string,
  widthPercent: number = 32,
  options?: { bold?: boolean; color?: string; fill?: string; columnSpan?: number }
): TableCell => {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    borders: cellBordersAll,
    columnSpan: options?.columnSpan,
    shading: options?.fill
      ? { fill: options.fill, type: ShadingType.CLEAR }
      : { fill: 'FFFFFF', type: ShadingType.CLEAR },
    margins: { top: 70, bottom: 70, left: 90, right: 90 },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: text || 'N/A',
            bold: options?.bold || false,
            size: 17, // 8.5pt
            color: options?.color || '1E293B',
            font: 'Arial',
          }),
        ],
      }),
    ],
  });
};

interface ExportWordOptions {
  accident: AccidentReport;
  analysis: CauseTreeAnalysis;
  diagramImageBase64?: string | null;
  diagramImageDimensions?: { width: number; height: number } | null;
}

export const generateIncidentWordDocument = async ({
  accident,
  analysis,
  diagramImageBase64,
  diagramImageDimensions,
}: ExportWordOptions): Promise<Blob> => {
  const children: (Paragraph | Table)[] = [];

  // ==========================================
  // 1. ENCABEZADO CORPORATIVO CON LOGO (Idéntico a PDF)
  // ==========================================
  let logoImageRun: ImageRun | null = null;
  try {
    const logoBytes = base64ToUint8Array(minervaLogoBase64);
    logoImageRun = new ImageRun({
      data: logoBytes,
      transformation: {
        width: 140,
        height: 38,
      },
      type: 'png',
    });
  } catch (err) {
    console.warn('No se pudo procesar el logo de Minerva Foods para Word', err);
  }

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: cellBordersNone,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 28, type: WidthType.PERCENTAGE },
            borders: cellBordersNone,
            margins: { top: 20, bottom: 20, left: 0, right: 60 },
            children: [
              logoImageRun
                ? new Paragraph({ children: [logoImageRun] })
                : new Paragraph({
                    children: [
                      new TextRun({
                        text: 'MINERVA FOODS',
                        bold: true,
                        size: 22,
                        color: '002A50',
                        font: 'Arial',
                      }),
                    ],
                  }),
            ],
          }),
          new TableCell({
            width: { size: 72, type: WidthType.PERCENTAGE },
            borders: cellBordersNone,
            margins: { top: 20, bottom: 20, left: 60, right: 0 },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'Informe de Investigación de Accidente / Incidente',
                    bold: true,
                    size: 23, // ~11.5pt
                    color: '002A50',
                    font: 'Arial',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 30 },
                children: [
                  new TextRun({
                    text: 'Análisis Causa Raíz - Metodología Árbol de Causas',
                    size: 16, // 8pt
                    color: '64748B',
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  children.push(headerTable);

  // Línea divisoria azul institucional (Idéntico a PDF: borderBottom: 2px solid #00529B)
  children.push(
    new Paragraph({
      spacing: { before: 60, after: 140 },
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 14,
          color: '00529B',
        },
      },
      children: [],
    })
  );

  // ==========================================
  // 2. TABLA DE DATOS DEL INCIDENTE (Idéntico a PDF)
  // ==========================================
  const generalInfoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      // Fila 1: Incidente ID | Fecha y Hora
      new TableRow({
        children: [
          createLabelCell('Incidente ID:', 18),
          createValueCell(accident.id, 32, { bold: true }),
          createLabelCell('Fecha y Hora:', 18),
          createValueCell(
            `${formatDateEs(accident.date)} ${accident.time ? `- ${accident.time}` : ''}`,
            32
          ),
        ],
      }),
      // Fila 2: Planta / Sector | Supervisor
      new TableRow({
        children: [
          createLabelCell('Planta / Sector:', 18),
          createValueCell(`${accident.planta || 'Swift'} / ${accident.sector || 'N/A'}`, 32),
          createLabelCell('Supervisor:', 18),
          createValueCell(accident.supervisor || 'N/A', 32),
        ],
      }),
      // Fila 3: Colaborador | Tipo Empleado
      new TableRow({
        children: [
          createLabelCell('Colaborador:', 18),
          createValueCell(
            `${accident.collaboratorName || 'N/A'} (${accident.legajo || 'S/L'})`,
            32,
            { bold: true }
          ),
          createLabelCell('Tipo Empleado:', 18),
          createValueCell(
            `${accident.employeeType || 'Propio'} ${
              accident.contractorCompany ? `(${accident.contractorCompany})` : ''
            }`,
            32
          ),
        ],
      }),
      // Fila 4: Hecho Último (destacado en rojo claro, colSpan 3)
      new TableRow({
        children: [
          createLabelCell('Hecho Último:', 18),
          new TableCell({
            columnSpan: 3,
            width: { size: 82, type: WidthType.PERCENTAGE },
            borders: cellBordersAll,
            shading: { fill: 'FFF1F2', type: ShadingType.CLEAR },
            margins: { top: 70, bottom: 70, left: 90, right: 90 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: analysis.hechoUltimo || 'No especificado',
                    bold: true,
                    size: 17,
                    color: 'BE123C',
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  children.push(generalInfoTable);

  // ==========================================
  // 3. DESCRIPCIÓN DE LO SUCEDIDO (Idéntico a PDF)
  // ==========================================
  children.push(createSectionHeading('Descripción de lo Sucedido'));

  const descriptionTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: cellBordersAll,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cellBordersAll,
            shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
            margins: { top: 90, bottom: 90, left: 110, right: 110 },
            children: [
              new Paragraph({
                spacing: { line: 250 },
                children: [
                  new TextRun({
                    text: accident.description || 'Sin descripción detallada.',
                    size: 17, // 8.5pt
                    color: '1E293B',
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  children.push(descriptionTable);

  // ==========================================
  // 4. DIAGRAMA DE ÁRBOL DE CAUSAS Y REFERENCIAS (Idéntico a PDF)
  // ==========================================
  children.push(createSectionHeading('Diagrama de Árbol de Causas'));

  // 4.1. Incrustación de la imagen del Árbol de Causas (grande, nítido y recortado)
  if (diagramImageBase64) {
    try {
      const diagramBytes = base64ToUint8Array(diagramImageBase64);
      
      // Ancho imprimible óptimo en página A4 Word (~470 pt)
      const maxDocWidth = 475;
      const maxDocHeight = 320;
      let imgWidth = maxDocWidth;
      let imgHeight = 220;

      if (diagramImageDimensions && diagramImageDimensions.width > 0 && diagramImageDimensions.height > 0) {
        const aspect = diagramImageDimensions.height / diagramImageDimensions.width;
        
        // Ajuste proporcional para que el árbol no se vea chico
        if (aspect <= 0.65) {
          imgWidth = maxDocWidth;
          imgHeight = Math.round(imgWidth * aspect);
          if (imgHeight > maxDocHeight) {
            imgHeight = maxDocHeight;
            imgWidth = Math.round(imgHeight / aspect);
          }
        } else {
          imgHeight = maxDocHeight;
          imgWidth = Math.min(maxDocWidth, Math.round(imgHeight / aspect));
        }

        // Si el árbol es estrecho, garantizar que mantenga buen tamaño
        if (imgWidth < 340 && (340 * aspect) <= maxDocHeight) {
          imgWidth = 340;
          imgHeight = Math.round(imgWidth * aspect);
        }
      }

      const diagramImageRun = new ImageRun({
        data: diagramBytes,
        transformation: {
          width: imgWidth,
          height: imgHeight,
        },
        type: 'png',
      });

      const diagramFrameTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: cellBordersAll,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: cellBordersAll,
                shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
                margins: { top: 90, bottom: 90, left: 80, right: 80 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [diagramImageRun],
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      children.push(diagramFrameTable);
    } catch (err) {
      console.warn('No se pudo incrustar la imagen del diagrama en el Word', err);
    }
  }

  // 4.2. Listado de Referencias con número correspondiente (Idéntico a PDF Referencias)
  const legendItems = getLegendItemsFromTreeText(analysis.analisis || '');

  children.push(
    new Paragraph({
      spacing: { before: 120, after: 60 },
      children: [
        new TextRun({
          text: 'Referencias',
          bold: true,
          size: 19, // ~9.5pt
          color: '003F7A',
          font: 'Arial',
        }),
      ],
    })
  );

  if (legendItems.length > 0) {
    const legendRows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            width: { size: 7, type: WidthType.PERCENTAGE },
            borders: cellBordersAll,
            shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
            margins: { top: 60, bottom: 60, left: 40, right: 40 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Nº',
                    bold: true,
                    size: 16,
                    color: '334155',
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 93, type: WidthType.PERCENTAGE },
            borders: cellBordersAll,
            shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Descripción de la Causa / Hecho',
                    bold: true,
                    size: 16,
                    color: '334155',
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ];

    legendItems.forEach((item, index) => {
      const isEven = index % 2 === 0;
      const rowFill = isEven ? 'FFFFFF' : 'F8FAFC';

      legendRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 7, type: WidthType.PERCENTAGE },
              borders: cellBordersAll,
              shading: { fill: rowFill, type: ShadingType.CLEAR },
              margins: { top: 50, bottom: 50, left: 40, right: 40 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: `${item.id}`,
                      bold: true,
                      size: 17,
                      color: '00529B',
                      font: 'Arial',
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 93, type: WidthType.PERCENTAGE },
              borders: cellBordersAll,
              shading: { fill: rowFill, type: ShadingType.CLEAR },
              margins: { top: 50, bottom: 50, left: 80, right: 80 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: item.text,
                      size: 17,
                      color: '1E293B',
                      font: 'Arial',
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      );
    });

    const legendTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: legendRows,
    });

    children.push(legendTable);
  } else if (analysis.analisis) {
    // Respaldo de texto plano si no se detectó estructura
    const treeLines = analysis.analisis.split('\n').filter((l) => l.trim().length > 0);
    treeLines.forEach((line) => {
      children.push(
        new Paragraph({
          spacing: { before: 20, after: 20 },
          bullet: { level: 0 },
          children: [
            new TextRun({
              text: line.replace(/^[-*•\d\.)]+\s*/, ''),
              size: 17,
              color: '1E293B',
              font: 'Arial',
            }),
          ],
        })
      );
    });
  }

  // ==========================================
  // 5. CAUSAS RAÍZ IDENTIFICADAS (Idéntico a PDF)
  // ==========================================
  children.push(createSectionHeading('Causas Raíz Identificadas'));

  const causasRaiz = analysis.causasRaiz || [];
  if (causasRaiz.length === 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'No se identificaron causas raíz específicas.',
            italics: true,
            size: 17,
            color: '64748B',
            font: 'Arial',
          }),
        ],
      })
    );
  } else {
    causasRaiz.forEach((causa) => {
      children.push(
        new Paragraph({
          spacing: { before: 30, after: 30 },
          bullet: { level: 0 },
          children: [
            new TextRun({
              text: causa,
              size: 17, // 8.5pt
              color: '1E293B',
              font: 'Arial',
            }),
          ],
        })
      );
    });
  }

  // ==========================================
  // 6. PLAN DE ACCIÓN CORRECTIVA (Idéntico a PDF)
  // ==========================================
  children.push(createSectionHeading('Plan de Acción Correctiva'));

  const acciones = analysis.accionesCorrectivas || [];
  const actionRows: TableRow[] = [
    // Encabezado de la tabla de acciones (Idéntico a PDF: background: #f1f5f9, color: #334155, bold)
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 55, type: WidthType.PERCENTAGE },
          borders: cellBordersAll,
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
          margins: { top: 70, bottom: 70, left: 90, right: 90 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Acción Propuesta',
                  bold: true,
                  size: 17,
                  color: '334155',
                  font: 'Arial',
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: cellBordersAll,
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
          margins: { top: 70, bottom: 70, left: 90, right: 90 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Responsable',
                  bold: true,
                  size: 17,
                  color: '334155',
                  font: 'Arial',
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          borders: cellBordersAll,
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
          margins: { top: 70, bottom: 70, left: 80, right: 80 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'Fecha Planificada',
                  bold: true,
                  size: 17,
                  color: '334155',
                  font: 'Arial',
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ];

  if (acciones.length === 0) {
    actionRows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 3,
            borders: cellBordersAll,
            margins: { top: 80, bottom: 80, left: 90, right: 90 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'No se registraron acciones correctivas pendientes.',
                    italics: true,
                    size: 17,
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );
  } else {
    acciones.forEach((action, idx) => {
      const isEven = idx % 2 === 0;
      const rowFill = isEven ? 'FFFFFF' : 'F8FAFC';

      actionRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 55, type: WidthType.PERCENTAGE },
              borders: cellBordersAll,
              shading: { fill: rowFill, type: ShadingType.CLEAR },
              margins: { top: 60, bottom: 60, left: 90, right: 90 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: action.description || 'N/A',
                      size: 17,
                      color: '1E293B',
                      font: 'Arial',
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              borders: cellBordersAll,
              shading: { fill: rowFill, type: ShadingType.CLEAR },
              margins: { top: 60, bottom: 60, left: 90, right: 90 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: action.responsible || 'N/A',
                      size: 17,
                      color: '334155',
                      font: 'Arial',
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 20, type: WidthType.PERCENTAGE },
              borders: cellBordersAll,
              shading: { fill: rowFill, type: ShadingType.CLEAR },
              margins: { top: 60, bottom: 60, left: 80, right: 80 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: formatDateEs(action.plannedDate),
                      size: 17,
                      color: '334155',
                      font: 'Arial',
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      );
    });
  }

  const actionsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: actionRows,
  });

  children.push(actionsTable);

  // ==========================================
  // 7. BLOQUE DE FIRMAS Y VALIDACIONES
  // ==========================================
  children.push(createSectionHeading('Validación y Firmas de Autorización'));

  const signaturesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: cellBordersNone,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 32, type: WidthType.PERCENTAGE },
            borders: cellBordersNone,
            margins: { top: 260, bottom: 60, left: 30, right: 30 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: {
                  top: { style: BorderStyle.SINGLE, size: 6, color: '64748B' },
                },
                spacing: { before: 60 },
                children: [
                  new TextRun({
                    text: 'Responsable de Seguridad e Higiene',
                    bold: true,
                    size: 15,
                    color: '1E293B',
                    font: 'Arial',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Firma y Aclaración',
                    size: 13,
                    color: '64748B',
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 2, type: WidthType.PERCENTAGE },
            borders: cellBordersNone,
            children: [new Paragraph({})],
          }),
          new TableCell({
            width: { size: 32, type: WidthType.PERCENTAGE },
            borders: cellBordersNone,
            margins: { top: 260, bottom: 60, left: 30, right: 30 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: {
                  top: { style: BorderStyle.SINGLE, size: 6, color: '64748B' },
                },
                spacing: { before: 60 },
                children: [
                  new TextRun({
                    text: 'Supervisor / Jefe de Sector',
                    bold: true,
                    size: 15,
                    color: '1E293B',
                    font: 'Arial',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Firma y Aclaración',
                    size: 13,
                    color: '64748B',
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 2, type: WidthType.PERCENTAGE },
            borders: cellBordersNone,
            children: [new Paragraph({})],
          }),
          new TableCell({
            width: { size: 32, type: WidthType.PERCENTAGE },
            borders: cellBordersNone,
            margins: { top: 260, bottom: 60, left: 30, right: 30 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: {
                  top: { style: BorderStyle.SINGLE, size: 6, color: '64748B' },
                },
                spacing: { before: 60 },
                children: [
                  new TextRun({
                    text: 'Gerente / Responsable de Planta',
                    bold: true,
                    size: 15,
                    color: '1E293B',
                    font: 'Arial',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Firma y Aclaración',
                    size: 13,
                    color: '64748B',
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  children.push(signaturesTable);

  // ==========================================
  // CONSTRUCCIÓN DEL DOCUMENTO DOCX
  // ==========================================
  const doc = new Document({
    creator: 'Minerva Foods - SafetyGuard Pro',
    title: `Informe de Investigación ${accident.id}`,
    description: 'Informe de Investigación de Accidente con Metodología Árbol de Causas',
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000, // ~1.76 cm
              bottom: 1000,
              left: 1000,
              right: 1000,
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                border: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                },
                spacing: { before: 80 },
                children: [
                  new TextRun({
                    text: `Informe Confidencial | Incidente #${accident.id} | Minerva Foods`,
                    size: 15,
                    color: '94A3B8',
                    font: 'Arial',
                  }),
                  new TextRun({
                    text: '\t\tPágina ',
                    size: 15,
                    color: '94A3B8',
                    font: 'Arial',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 15,
                    color: '94A3B8',
                    font: 'Arial',
                  }),
                  new TextRun({
                    text: ' de ',
                    size: 15,
                    color: '94A3B8',
                    font: 'Arial',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 15,
                    color: '94A3B8',
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
};

export const downloadIncidentWordDocument = async (options: ExportWordOptions): Promise<void> => {
  const blob = await generateIncidentWordDocument(options);
  const fileName = `Informe_Investigacion_${options.accident.id}.docx`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};
