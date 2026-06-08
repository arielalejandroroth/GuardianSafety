import React from 'react';
import { Qualification, Equipment, View } from '../types';
import QualificationCard from './QualificationCard';
import Button from './common/Button';
import { TableIcon } from './IconComponents';
import Card from './common/Card';

interface QualificationCardsGalleryProps {
    qualifications: Qualification[];
    onNavigate: (view: View) => void;
}

const QualificationCardsGallery: React.FC<QualificationCardsGalleryProps> = ({ qualifications, onNavigate }) => {
    const equipmentOrder = Object.values(Equipment);

    const groupedByEquipment = qualifications.reduce((acc, q) => {
        (acc[q.equipment] = acc[q.equipment] || []).push(q);
        return acc;
    }, {} as Record<Equipment, Qualification[]>);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Galería de Carnets de Habilitación</h2>
                <Button variant="secondary" onClick={() => onNavigate(View.QUALIFICATIONS)}>
                    <TableIcon className="h-5 w-5 mr-2" />
                    Volver a la Matriz
                </Button>
            </div>

            {equipmentOrder.map(equipment => {
                const group = groupedByEquipment[equipment];
                if (!group || group.length === 0) return null;

                return (
                    <Card key={equipment} title={`Habilitaciones para: ${equipment}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                            {group.map(q => (
                                <QualificationCard key={q.id} qualification={q} />
                            ))}
                        </div>
                    </Card>
                );
            })}

            {qualifications.length === 0 && (
                <Card>
                    <div className="text-center py-16 text-slate-500">
                        <p>No hay habilitaciones registradas para mostrar.</p>
                        <Button onClick={() => onNavigate(View.QUALIFICATION_FORM)} className="mt-4">
                            Crear la primera habilitación
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default QualificationCardsGallery;
