import React, { useRef } from 'react';
import { Qualification } from '../types';
import Modal from './common/Modal';
import Button from './common/Button';
import QualificationCard from './QualificationCard';
import { PrintIcon } from './IconComponents';

interface ViewQualificationCardModalProps {
    qualification: Qualification;
    onClose: () => void;
}

const ViewQualificationCardModal: React.FC<ViewQualificationCardModalProps> = ({ qualification, onClose }) => {
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
        <Modal isOpen={true} onClose={onClose} title={`Carnet Habilitante: ${qualification.personnelName}`}>
            <div className="flex flex-col items-center">
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

export default ViewQualificationCardModal;