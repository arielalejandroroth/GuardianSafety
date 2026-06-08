import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AccidentReport } from '../types';
import Modal from './common/Modal';
import Button from './common/Button';
import Input from './common/Input';
import { analyzeAccidentData } from '../services/geminiService';
import { UserCircleIcon, SparklesIcon } from './IconComponents';

interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

interface DataAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    accidentsData: AccidentReport[];
}

const DataAnalysisModal: React.FC<DataAnalysisModalProps> = ({ isOpen, onClose, accidentsData }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setMessages([
                { role: 'model', content: `Hola, soy tu asistente de análisis de datos. Tienes ${accidentsData.length} registros cargados en el filtro actual. ¿Qué te gustaría saber?` }
            ]);
            setUserInput('');
        }
    }, [isOpen, accidentsData.length]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = useCallback(async () => {
        if (!userInput.trim() || isLoading) return;

        const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userInput }];
        setMessages(newMessages);
        setUserInput('');
        setIsLoading(true);

        try {
            const response = await analyzeAccidentData(userInput, accidentsData);
            setMessages([...newMessages, { role: 'model', content: response }]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Ocurrió un error inesperado.";
            setMessages([...newMessages, { role: 'model', content: `Error: ${errorMessage}` }]);
        } finally {
            setIsLoading(false);
        }
    }, [userInput, isLoading, messages, accidentsData]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Asistente de Análisis de Datos IA" size="lg">
            <div className="flex flex-col h-[60vh]">
                <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 bg-slate-50 rounded-lg space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center"><SparklesIcon className="w-5 h-5" /></div>}
                            <div className={`max-w-prose p-3 rounded-lg ${msg.role === 'model' ? 'bg-white shadow-sm' : 'bg-brand-primary text-white'}`}>
                                <p className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }}></p>
                            </div>
                            {msg.role === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center"><UserCircleIcon className="w-5 h-5" /></div>}
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center"><SparklesIcon className="w-5 h-5 animate-pulse" /></div>
                            <div className="max-w-md p-3 rounded-lg bg-white shadow-sm">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="mt-4 flex items-end gap-2">
                     <div className="flex-grow">
                        <Input
                            label="Pregunta:"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                            placeholder="Ej: ¿Cuál es el sector con más accidentes?"
                            disabled={isLoading}
                        />
                    </div>
                    <Button onClick={handleSendMessage} isLoading={isLoading} disabled={!userInput.trim() || isLoading}>
                        Enviar
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default DataAnalysisModal;