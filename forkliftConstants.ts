import { ForkliftChecklistItem } from './types';

// Group items logically under categories from the form.
export const FORKLIFT_CHECKLIST_STRUCTURE = [
    {
        category: "CONTROLAR CORRECTO ESTADO DE:",
        items: [
            { id: 'carnet', text: 'Posee carnet habilitante' },
            { id: 'freno_pie', text: 'Estado adecuado de Freno - De pie' },
            { id: 'freno_mano', text: 'Estado adecuado de Freno - De mano' },
            { id: 'ruedas_desgaste', text: 'Estado adecuado de Ruedas - Desgaste' },
            { id: 'ruedas_presion', text: 'Estado adecuado de Ruedas - Presión' },
            { id: 'fugas_hidraulico', text: 'Estado de Fugas de fluidos - Circuito hidráulico' },
            { id: 'fugas_conexiones', text: 'Estado de Fugas de fluidos - Conexiones' },
            { id: 'fugas_mangueras', text: 'Estado de Fugas de fluidos - Mangueras' },
            { id: 'unas', text: 'Estado de Fijación/estado de las uñas' },
            { id: 'aceite', text: 'Niveles de aceites' },
            { id: 'mandos', text: 'Mandos en servicio' },
            { id: 'bocina', text: 'Bocina' },
            { id: 'luces', text: 'Luces' },
            { id: 'retroceso', text: 'Aviso de retroceso' },
            { id: 'espejos', text: 'Estado de Espejos' },
            { id: 'extintor', text: 'Extintor' },
            { id: 'cinturon', text: 'Cinturón de seguridad' },
            { id: 'transmision', text: 'Sistema de transmisión' },
            { id: 'asiento', text: 'Asiento del conductor' },
        ]
    }
];

// This function will flatten the structure for the initial state in the form component.
export const getInitialForkliftChecklistItems = (): ForkliftChecklistItem[] => {
    return FORKLIFT_CHECKLIST_STRUCTURE.flatMap(section =>
        section.items.map(item => ({
            id: item.id,
            category: section.category,
            item: item.text,
            status: '',
            observation: '',
            attachments: [],
        }))
    );
};
