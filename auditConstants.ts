import { AuditChecklistItem } from './types';

// Based on R-HS-09-AR
// Fix: Removed `attachments` from the template objects and updated the type.
// Attachments should be added when the form is created, not be part of the question template. This resolves a type inference issue.
export const AUDIT_CHECKLIST_ITEMS: Omit<AuditChecklistItem, 'status' | 'comment' | 'attachments'>[] = [
  // HERRAMIENTAS
  {
    id: 'H-01',
    category: 'Herramientas',
    question: '¿Las herramientas están en estado de conservación adecuado?',
    regulation: 'Dec. 351/79 Cap.15 Art.110',
  },
  {
    id: 'H-02',
    category: 'Herramientas',
    question: '¿La empresa provee herramientas aptas y seguras?',
    regulation: 'Dec. 351/79 Cap.15 Art.103',
  },
  // MÁQUINAS
  {
    id: 'M-01',
    category: 'Máquinas',
    question: '¿Tienen las máquinas y herramientas, protecciones para evitar riesgos al trabajador?',
    regulation: 'Dec. 351/79 Cap.15 Art.103',
  },
  {
    id: 'M-02',
    category: 'Máquinas',
    question: '¿Tienen las máquinas eléctricas, sistema de puesta a tierra?',
    regulation: 'Dec. 351/79 Cap.14 Anexo VI',
  },
  // ESPACIOS DE TRABAJO
  {
    id: 'ET-01',
    category: 'Espacios de Trabajo',
    question: '¿Existe orden y limpieza en los puestos de trabajo?',
    regulation: 'Dec. 351/79 Cap.5 Art.42',
  },
  // PROTECCION CONTRA INCENDIOS
  {
    id: 'PCI-01',
    category: 'Protección Contra Incendios',
    question: '¿Existen medios o vías de escape adecuadas en caso de incendio?',
    regulation: 'Dec. 351/79 Cap.18 Art.172',
  },
  {
    id: 'PCI-02',
    category: 'Protección Contra Incendios',
    question: '¿La cantidad de matafuegos es acorde a la carga de fuego?',
    regulation: 'Dec. 351/79 Cap.18 Art.175',
  },
  // ALMACENAJE
  {
    id: 'A-01',
    category: 'Almacenaje',
    question: '¿Se almacenan los productos respetando la distancia mínima de 1m entre la estiba y el techo?',
    regulation: 'Dec. 351/79 Cap.18 Art.169',
  },
  // RIESGO ELÉCTRICO
  {
    id: 'RE-01',
    category: 'Riesgo Eléctrico',
    question: '¿Están todos los cableados eléctricos adecuadamente contenidos?',
    regulation: 'Dec. 351/79 Cap.14 Art.95',
  },
   {
    id: 'RE-02',
    category: 'Riesgo Eléctrico',
    question: '¿Las tareas de mantenimiento son efectuadas por personal capacitado?',
    regulation: 'Dec. 351/79 Cap.14 Art.98',
  },
  // E.P.P.
  {
    id: 'EPP-01',
    category: 'EPP',
    question: '¿Se provee a todos los trabajadores, de los EPP adecuados a los riesgos?',
    regulation: 'Dec. 351/79 Cap.19 Art.188',
  },
  {
    id: 'EPP-02',
    category: 'EPP',
    question: '¿Existen señalizaciones visibles sobre la obligatoriedad del uso de los EPP?',
    regulation: 'Dec. 351/79 Cap.12 Art.84',
  },
  // ILUMINACION Y COLOR
  {
    id: 'IC-01',
    category: 'Iluminación y Color',
    question: '¿Se cumple con los requisitos de iluminación de la legislación vigente?',
    regulation: 'Dec. 351/79 Cap.12 Art.71',
  },
  {
    id: 'IC-02',
    category: 'Iluminación y Color',
    question: '¿Se encuentran señalizados los caminos de evacuación en caso de peligro?',
    regulation: 'Dec. 351/79 Cap.12 Art.80',
  }
];