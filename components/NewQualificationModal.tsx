import React, { useRef } from 'react';
import { Qualification } from '../types';
import Modal from './common/Modal';
import Button from './common/Button';
import QualificationCard from './QualificationCard';
import { PrintIcon } from './IconComponents';

interface NewQualificationModalProps {
    qualification: Qualification;
    onClose: () => void;
}

const NewQualificationModal: React.FC<NewQualificationModalProps> = ({ qualification, onClose }) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const node = cardRef.current;
        if (node) {
            // Find the actual card body inside the wrapper to print
            const cardToPrint = node.querySelector('.qualification-card-body');
            if (cardToPrint) {
                cardToPrint.classList.add('printable-area');
                window.print();
                cardToPrint.classList.remove('printable-area');
            }
        }
    };
    
    return (
        <Modal isOpen={true} onClose={onClose} title="Habilitación Generada con Éxito">
            <div className="flex flex-col items-center">
                <p className="text-center text-gray-600 mb-4">Se ha registrado una nueva habilitación. Puede imprimir el carnet a continuación.</p>
                <div ref={cardRef}>
                    <QualificationCard qualification={qualification} />
                </div>
                <div className="flex justify-end space-x-4 pt-6 w-full max-w-sm">
                    <Button variant="secondary" onClick={onClose}>Cerrar</Button>
                    <Button variant="primary" onClick={handlePrint}>
                        <PrintIcon className="w-5 h-5 mr-2" />
                        Imprimir Carnet
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default NewQualificationModal;