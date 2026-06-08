import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Finding, AccidentReport, Qualification, DialogueFormState, ObservationFormState, ForkliftChecklist } from '../types';
import Modal from './common/Modal';
import Button from './common/Button';
import Input from './common/Input';
import { chatWithSegurino } from '../services/geminiService';
import { UserCircleIcon, ChatBotIcon } from './IconComponents';

interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

interface SegurinoAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    appData: {
        findings: Finding[];
        accidents: AccidentReport[];
        qualifications: Qualification[];
        dialogues: DialogueFormState[];
        observations: ObservationFormState[];
        forkliftChecklists: ForkliftChecklist[];
    };
}

const SegurinoAssistant: React.FC<SegurinoAssistantProps> = ({ isOpen, onClose, appData }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setMessages([
                { role: 'model', content: `¡Hola! Soy Segurino, tu asistente de IA para SafetyGuard Pro. Estoy aquí para ayudarte a analizar todos los datos de seguridad cargados en la aplicación.\n\nPuedes preguntarme cosas como:\n- "¿Cuáles son los 5 hallazgos más antiguos sin resolver?"\n- "Resume los accidentes ocurridos en el sector 'Picada' el último mes."\n- "¿Qué habilitaciones están próximas a vencer?"` }
            ]);
            setUserInput('');
        }
    }, [isOpen]);

    useEffect(() => {
        chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
    }, [messages]);

    const handleSendMessage = useCallback(async () => {
        if (!userInput.trim() || isLoading) return;

        const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userInput }];
        setMessages(newMessages);
        setUserInput('');
        setIsLoading(true);

        try {
            const response = await chatWithSegurino(userInput, appData);
            setMessages([...newMessages, { role: 'model', content: response }]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Ocurrió un error inesperado.";
            setMessages([...newMessages, { role: 'model', content: `Lo siento, hubo un error al procesar tu solicitud: ${errorMessage}` }]);
        } finally {
            setIsLoading(false);
        }
    }, [userInput, isLoading, messages, appData]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Asistente IA Segurino" size="lg">
            <div className="flex flex-col h-[70vh]">
                <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 bg-slate-50 rounded-lg space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center"><ChatBotIcon className="w-5 h-5" /></div>}
                            <div className={`max-w-prose p-3 rounded-lg ${msg.role === 'model' ? 'bg-white shadow-sm' : 'bg-brand-primary text-white'}`}>
                                <p className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }}></p>
                            </div>
                            {msg.role === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center"><UserCircleIcon className="w-5 h-5" /></div>}
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center"><ChatBotIcon className="w-5 h-5 animate-pulse" /></div>
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
                            label="Tu pregunta:"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                            placeholder="Pregúntale a Segurino..."
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

export default SegurinoAssistant;
