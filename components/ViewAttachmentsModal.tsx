
import React from 'react';
import { Attachment } from '../types';
import Modal from './common/Modal';
import { FileTextIcon } from './IconComponents';

interface ViewAttachmentsModalProps {
    attachments: Attachment[];
    onClose: () => void;
}

const ViewAttachmentsModal: React.FC<ViewAttachmentsModalProps> = ({ attachments, onClose }) => {
    return (
        <Modal isOpen={true} onClose={onClose} title="Archivos Adjuntos">
            <div className="max-h-[60vh] overflow-y-auto">
                <ul className="space-y-4">
                    {attachments.map((file, index) => (
                        <li key={index} className="border p-4 rounded-lg">
                            <p className="font-semibold text-gray-800 break-all">{file.name}</p>
                            {file.type.startsWith('image/') ? (
                                <img
                                    src={`data:${file.type};base64,${file.data}`}
                                    alt={file.name}
                                    className="mt-2 max-w-full h-auto rounded-md"
                                />
                            ) : (
                                <div className="mt-2 flex items-center space-x-3">
                                    <FileTextIcon className="h-10 w-10 text-gray-400" />
                                    <a
                                        href={`data:${file.type};base64,${file.data}`}
                                        download={file.name}
                                        className="text-brand-primary hover:underline font-medium"
                                    >
                                        Descargar {file.name}
                                    </a>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </Modal>
    );
};

export default ViewAttachmentsModal;
