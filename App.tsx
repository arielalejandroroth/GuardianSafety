import React, { useState, useCallback, useEffect } from 'react';
import { Finding, ObservationFormState, InternalAuditFormState, View, RiskLevel, FindingSource, DialogueFormState, ForkliftChecklist, RiskEvaluation, Qualification, FindingStatus, AccidentReport, CauseTreeAnalysis, ActionType, AccidentFormState } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ObservationForm from './components/ObservationForm';
import FindingsMatrix from './components/FindingsMatrix';
import InternalAuditForm from './components/InternalAuditForm';
import AuditsMatrix from './components/AuditsMatrix';
import AccidentForm from './components/AccidentForm';
import DialogueForm from './components/DialogueForm';
import QRCodeModal from './components/QRCodeModal';
import QualificationsMatrix from './components/QualificationsMatrix';
import QualificationForm from './components/QualificationForm';
import NewQualificationModal from './components/NewQualificationModal';
import QualificationDetailView from './components/QualificationDetailView';
import EditQualificationModal from './components/EditQualificationModal';
import AccidentsMatrix from './components/AccidentsMatrix';
import DialoguesMatrix from './components/DialoguesMatrix';
import ForkliftChecklistForm from './components/ForkliftChecklistForm';
import ForkliftChecklistMatrix from './components/ForkliftChecklistMatrix';
import SeguritoVision from './components/SeguritoVision';
import EvaluationHistory from './components/EvaluationHistory';
import QualificationCardsGallery from './components/QualificationCardsGallery';
import PpeMatrix from './components/PpeMatrix';
import { ChatBotIcon } from './components/IconComponents';
import SegurinoAssistant from './components/SegurinoAssistant';
import { useAppContext } from './contexts/AppContext';
import { useAuth } from './contexts/AuthContext';
import Footer from './components/Footer';
import { generateCauseTreeAnalysis } from './services/geminiService';
import ImageGenerator from './components/ImageGenerator';
import Login from './components/Login';

const App: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { user, loading: authLoading } = useAuth();
  const { findings, dialogues, qualifications, observations, forkliftChecklists, accidents, riskEvaluations, audits, isInitialized } = state;

  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [isQRModalOpen, setQRModalOpen] = useState(false);
  const [editingQualification, setEditingQualification] = useState<Qualification | null>(null);
  const [newlyCreatedQualification, setNewlyCreatedQualification] = useState<Qualification | null>(null);
  const [standaloneQualification, setStandaloneQualification] = useState<Qualification | null>(null);
  const [isSegurinoOpen, setIsSegurinoOpen] = useState(false);

  useEffect(() => {
    if (isInitialized) {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      const id = params.get('id');
      if (view === 'qualification_details' && id) {
        const found = qualifications.find(q => q.id === id);
        if (found) {
          setStandaloneQualification(found);
        }
      }
    }
  }, [isInitialized, qualifications]);


  const handleNavigate = useCallback((view: View) => {
    setCurrentView(view);
    window.scrollTo(0, 0);
  }, []);

  const handleObservationSubmit = (data: ObservationFormState) => {
    dispatch({ type: ActionType.ADD_OBSERVATION, payload: data });

    if (data.observationResult === 'C/Desvío') {
        const newFinding: Finding = {
            id: `F-${String(Date.now()).slice(-4)}`,
            plant: data.plant,
            detectionDate: data.date,
            source: FindingSource.OBSERVACION,
            sector: data.sector,
            area: data.area,
            puesto: data.puesto,
            deviation: data.deviationObserved,
            riskLevel: data.riskPerception as RiskLevel,
            correctiveAction: data.immediateCorrection,
            sectorResponsible: '', // Needs to be determined or assigned
            actionResponsible: data.responsibleSector,
            status: FindingStatus.ABIERTO,
            observations: `Hallazgo generado desde la observación de comportamiento por ${data.observerName}.`,
            attachments: data.attachments,
        };
        dispatch({ type: ActionType.ADD_FINDING, payload: newFinding });
    }
    handleNavigate(View.DASHBOARD);
  };

  const handleAuditSubmit = (data: InternalAuditFormState) => {
    dispatch({ type: ActionType.ADD_AUDIT, payload: data });
    
    const newFindings: Finding[] = data.checklist
      .filter(item => item.status === 'No' && item.comment)
      .map(item => ({
        id: `F-${String(Date.now()).slice(-4)}-${item.id}`,
        plant: data.plant,
        detectionDate: data.date,
        source: FindingSource.AUDITORIA_INTERNA,
        sector: data.sector,
        area: data.area,
        puesto: data.puesto,
        deviation: item.comment,
        riskLevel: RiskLevel.MEDIO, // Default risk, can be changed later
        correctiveAction: 'Definir acción correctiva.',
        sectorResponsible: data.supervisor, // Assuming sector supervisor is responsible
        actionResponsible: data.supervisor,
        status: FindingStatus.ABIERTO,
        observations: `Hallazgo de Auditoría Interna (Ítem: ${item.question}). Auditor Líder: ${data.auditLead}`,
        attachments: item.attachments,
      }));

    if (newFindings.length > 0) {
        newFindings.forEach(finding => dispatch({ type: ActionType.ADD_FINDING, payload: finding }));
    }
    handleNavigate(View.AUDITS_MATRIX);
  };
  
  const handleAccidentSubmit = async (data: AccidentFormState) => {
    const newAccidentId = `A-${Date.now()}`;
    
    const tempReportForAnalysis: AccidentReport = {
        ...data,
        id: newAccidentId,
        correctiveActions: data.correctiveActions.map((a) => a.description).join('; '),
    };

    let analysis: CauseTreeAnalysis | undefined = undefined;
    try {
        analysis = await generateCauseTreeAnalysis(tempReportForAnalysis);
    } catch (error) {
        console.error("Failed to generate cause tree analysis:", error);
        alert("El informe del incidente se guardó, pero no se pudo generar el análisis de árbol de causas automáticamente. Podrá generarlo manually desde la matriz.");
    }
    
    const newReport: AccidentReport = {
        ...tempReportForAnalysis,
        causeTreeAnalysis: analysis,
    };
    
    dispatch({ type: ActionType.ADD_ACCIDENT, payload: newReport });

    const newFindings: Finding[] = data.correctiveActions.map((action, index: number) => ({
        id: `F-${newAccidentId}-${index + 1}`,
        plant: data.planta,
        detectionDate: data.date,
        source: FindingSource.ACCIDENTE_INCIDENTE,
        sector: data.sector,
        area: data.area,
        puesto: data.puesto,
        deviation: `Incidente ${newAccidentId} (${data.clasificacionART}): ${data.collaboratorName} (Legajo: ${data.legajo}) sufrió una ${data.tipoLesion} en ${data.parteCuerpoAfectada}. Causa: ${data.causal}. Tarea: ${data.tareaRutinaria}.`,
        riskLevel: RiskLevel.ALTO, // Default for accidents
        correctiveAction: action.description,
        sectorResponsible: data.supervisor,
        actionResponsible: action.responsible,
        plannedDate: action.date,
        status: FindingStatus.ABIERTO,
        observations: `Acción correctiva generada por el incidente ${newAccidentId}.`,
        attachments: data.attachments,
    }));

    if (newFindings.length > 0) {
        newFindings.forEach(finding => dispatch({ type: ActionType.ADD_FINDING, payload: finding }));
    }
    handleNavigate(View.ACCIDENTS_MATRIX);
  };
  
  const handleDialogueSubmit = (data: DialogueFormState) => {
      dispatch({ type: ActionType.ADD_DIALOGUE, payload: data });
      handleNavigate(View.DIALOGUES_MATRIX);
  };

  const handleQualificationSubmit = (data: Omit<Qualification, 'id'>) => {
    const newQualification = { ...data, id: `Q-${Date.now()}` };
    dispatch({ type: ActionType.ADD_QUALIFICATION, payload: newQualification });
    setNewlyCreatedQualification(newQualification);
    handleNavigate(View.QUALIFICATIONS);
  };
  
  const handleEditQualification = (qualification: Qualification) => {
      setEditingQualification(qualification);
  };
  
  const handleSaveQualification = (updatedQualification: Qualification) => {
      dispatch({ type: ActionType.UPDATE_QUALIFICATION, payload: updatedQualification });
      setEditingQualification(null);
  };

  const handleForkliftChecklistSubmit = (data: Omit<ForkliftChecklist, 'id'>) => {
    const newChecklist: ForkliftChecklist = {
        ...data,
        id: `C-${Date.now()}`,
    };
    dispatch({ type: ActionType.ADD_FORKLIFT_CHECKLIST, payload: newChecklist });
    handleNavigate(View.DASHBOARD);
  };

  const handleSaveEvaluation = (evaluation: Omit<RiskEvaluation, 'id'>) => {
      const newEvaluation = { ...evaluation, id: `E-${Date.now()}`};
      dispatch({ type: ActionType.ADD_RISK_EVALUATION, payload: newEvaluation });
      handleNavigate(View.EVALUATION_HISTORY);
  };
  
  const handleUpdateEvaluation = (updatedEvaluation: RiskEvaluation) => {
      dispatch({ type: ActionType.UPDATE_RISK_EVALUATION, payload: updatedEvaluation });
  };


  const isSharedMode = window.location.hostname.includes('-pre-');

  const renderView = () => {
    switch(currentView) {
      case View.DASHBOARD:
        return <Dashboard findings={findings} dialogues={dialogues} qualifications={qualifications} observations={observations} onNavigate={handleNavigate} />;
      case View.MATRIX:
        return <FindingsMatrix findings={findings} />;
      case View.FORM:
        return <ObservationForm onSubmit={handleObservationSubmit} onCancel={() => handleNavigate(View.DASHBOARD)} />;
      case View.AUDIT_FORM:
        return <InternalAuditForm onSubmit={handleAuditSubmit} onCancel={() => handleNavigate(View.AUDITS_MATRIX)} />;
      case View.AUDITS_MATRIX:
        return <AuditsMatrix audits={audits} onNavigate={handleNavigate} />;
      case View.ACCIDENT_FORM:
        return <AccidentForm onSubmit={handleAccidentSubmit} onCancel={() => handleNavigate(View.DASHBOARD)} />;
      case View.ACCIDENTS_MATRIX:
        return <AccidentsMatrix accidents={accidents} onNavigate={handleNavigate} />;
      case View.DIALOGUE_FORM:
        return <DialogueForm onSubmit={handleDialogueSubmit} onCancel={() => handleNavigate(View.DASHBOARD)} />;
      case View.DIALOGUES_MATRIX:
          return <DialoguesMatrix dialogues={dialogues} />;
      case View.PPE_MATRIX:
        return <PpeMatrix />;
      case View.QUALIFICATIONS:
        return <QualificationsMatrix qualifications={qualifications} onNavigate={handleNavigate} onEdit={handleEditQualification} />;
      case View.QUALIFICATION_FORM:
        return <QualificationForm onSubmit={handleQualificationSubmit} onCancel={() => handleNavigate(View.QUALIFICATIONS)} />;
      case View.QUALIFICATION_CARDS_GALLERY:
        return <QualificationCardsGallery qualifications={qualifications} onNavigate={handleNavigate} />;
      case View.FORKLIFT_CHECKLIST_FORM:
        return <ForkliftChecklistForm onSubmit={handleForkliftChecklistSubmit} onCancel={() => handleNavigate(View.DASHBOARD)} />;
      case View.FORKLIFT_CHECKLIST_MATRIX:
        return <ForkliftChecklistMatrix checklists={forkliftChecklists} onNavigate={handleNavigate} />;
      case View.SEGURITO_VISION:
        return <SeguritoVision onSave={handleSaveEvaluation} onNavigate={handleNavigate} />;
      case View.IMAGE_GENERATOR:
        return <ImageGenerator />;
      case View.EVALUATION_HISTORY:
        return <EvaluationHistory evaluations={riskEvaluations} onUpdate={handleUpdateEvaluation} onNavigate={handleNavigate} />;
      default:
        return <Dashboard findings={findings} dialogues={dialogues} qualifications={qualifications} observations={observations} onNavigate={handleNavigate} />;
    }
  }

  if (standaloneQualification) {
    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
             <QualificationDetailView qualification={standaloneQualification} />
        </div>
    );
  }
  
  if (!isInitialized || authLoading) {
      return (
          <div className="min-h-screen bg-slate-100 flex items-center justify-center">
              <div className="flex flex-col items-center">
                  <svg className="animate-spin h-10 w-10 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="mt-4 text-slate-600">Cargando datos de la aplicación...</p>
              </div>
          </div>
      );
  }

  if (!user && !standaloneQualification) {
      return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Header currentView={currentView} onNavigate={handleNavigate} onShareClick={() => setQRModalOpen(true)}/>
      <main className="flex-grow max-w-full xl:max-w-8xl mx-auto py-6 px-4 sm:px-6 lg:px-8 w-full">
        {renderView()}
      </main>
      
      {!isSharedMode && (
        <button
            onClick={() => setIsSegurinoOpen(true)}
            className="fixed bottom-20 md:bottom-6 right-6 bg-brand-primary text-white p-4 rounded-full shadow-lg hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-transform hover:scale-110 z-50"
            title="Pregúntale a Segurino IA"
        >
            <ChatBotIcon className="h-8 w-8" />
        </button>
      )}

      {isSegurinoOpen && (
        <SegurinoAssistant
            isOpen={isSegurinoOpen}
            onClose={() => setIsSegurinoOpen(false)}
            appData={{
                findings,
                accidents,
                qualifications,
                dialogues,
                observations,
                forkliftChecklists
            }}
        />
      )}

      {isQRModalOpen && <QRCodeModal onClose={() => setQRModalOpen(false)} />}
      {newlyCreatedQualification && (
          <NewQualificationModal qualification={newlyCreatedQualification} onClose={() => setNewlyCreatedQualification(null)} />
      )}
      {editingQualification && (
        <EditQualificationModal
            qualification={editingQualification}
            onClose={() => setEditingQualification(null)}
            onSave={handleSaveQualification}
        />
      )}
       <Footer />
       <div className="pb-16 md:pb-0"></div>
    </div>
  );
};

export default App;