import React, { createContext, useReducer, useContext, useEffect, useRef } from 'react';
import { AppState, Action, ActionType } from '../types';
import {
  loadState,
  saveState,
  saveCompanyStateToFirestore,
  subscribeCompanyState
} from '../utils/storage';
import { useAuth } from './AuthContext';

const initialState: AppState = {
  findings: [],
  observations: [],
  audits: [],
  accidents: [],
  dialogues: [],
  qualifications: [],
  forkliftChecklists: [],
  riskEvaluations: [],
  isInitialized: false,
};

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case ActionType.INITIALIZE_STATE:
      return { ...action.payload, isInitialized: true };

    case ActionType.RESET_COMPANY_STATE:
      return { ...action.payload, isInitialized: true };

    case ActionType.ADD_FINDING:
      return { ...state, findings: [action.payload, ...state.findings] };

    case ActionType.UPDATE_FINDING:
      return {
        ...state,
        findings: state.findings.map(f => f.id === action.payload.id ? action.payload : f)
      };

    case ActionType.DELETE_FINDING:
      return {
        ...state,
        findings: state.findings.filter(f => f.id !== action.payload)
      };

    case ActionType.SET_FINDINGS:
      return { ...state, findings: action.payload };

    case ActionType.ADD_OBSERVATION:
      return { ...state, observations: [action.payload, ...state.observations] };

    case ActionType.DELETE_OBSERVATION:
      return {
        ...state,
        observations: state.observations.filter(o => o.id !== action.payload && o.date !== action.payload)
      };

    case ActionType.ADD_AUDIT:
      return { ...state, audits: [action.payload, ...state.audits] };

    case ActionType.DELETE_AUDIT:
      return {
        ...state,
        audits: state.audits.filter(a => a.id !== action.payload)
      };

    case ActionType.ADD_ACCIDENT:
      return { ...state, accidents: [action.payload, ...state.accidents] };

    case ActionType.UPDATE_ACCIDENT:
      return {
        ...state,
        accidents: state.accidents.map(a => a.id === action.payload.id ? action.payload : a)
      };

    case ActionType.DELETE_ACCIDENT:
      return {
        ...state,
        accidents: state.accidents.filter(a => a.id !== action.payload),
      };

    case ActionType.SET_ACCIDENTS:
      return { ...state, accidents: action.payload };

    case ActionType.ADD_DIALOGUE:
      return { ...state, dialogues: [action.payload, ...state.dialogues] };

    case ActionType.DELETE_DIALOGUE:
      return {
        ...state,
        dialogues: state.dialogues.filter(d => d.id !== action.payload)
      };

    case ActionType.ADD_QUALIFICATION:
      return { ...state, qualifications: [action.payload, ...state.qualifications] };

    case ActionType.UPDATE_QUALIFICATION:
      return {
        ...state,
        qualifications: state.qualifications.map(q => q.id === action.payload.id ? action.payload : q)
      };

    case ActionType.DELETE_QUALIFICATION:
      return {
        ...state,
        qualifications: state.qualifications.filter(q => q.id !== action.payload)
      };

    case ActionType.ADD_FORKLIFT_CHECKLIST:
      return { ...state, forkliftChecklists: [action.payload, ...state.forkliftChecklists] };

    case ActionType.DELETE_FORKLIFT_CHECKLIST:
      return {
        ...state,
        forkliftChecklists: state.forkliftChecklists.filter(f => f.id !== action.payload)
      };

    case ActionType.ADD_RISK_EVALUATION:
      return { ...state, riskEvaluations: [action.payload, ...state.riskEvaluations] };

    case ActionType.UPDATE_RISK_EVALUATION:
      return {
        ...state,
        riskEvaluations: state.riskEvaluations.map(e => e.id === action.payload.id ? action.payload : e)
      };

    case ActionType.DELETE_RISK_EVALUATION:
      return {
        ...state,
        riskEvaluations: state.riskEvaluations.filter(e => e.id !== action.payload)
      };

    default:
      return state;
  }
};

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> }>({
  state: initialState,
  dispatch: () => null,
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { user, loading: authLoading } = useAuth();
  const isRemoteUpdateRef = useRef(false);

  // Real-time synchronization with Centralized Company Firestore
  useEffect(() => {
    if (authLoading) return;

    let unsubscribeCompany: (() => void) | null = null;

    if (user) {
      try {
        unsubscribeCompany = subscribeCompanyState(
          (remoteState) => {
            isRemoteUpdateRef.current = true;
            dispatch({
              type: ActionType.INITIALIZE_STATE,
              payload: remoteState,
            });
          },
          (err) => {
            console.warn("Falling back to local state cache due to firestore error:", err);
            const loaded = loadState();
            dispatch({
              type: ActionType.INITIALIZE_STATE,
              payload: loaded,
            });
          }
        );
      } catch (err) {
        console.warn("Could not subscribe to company state:", err);
        const loaded = loadState();
        dispatch({
          type: ActionType.INITIALIZE_STATE,
          payload: loaded,
        });
      }
    } else {
      const loadedState = loadState();
      dispatch({
        type: ActionType.INITIALIZE_STATE,
        payload: loadedState,
      });
    }

    return () => {
      if (unsubscribeCompany) {
        unsubscribeCompany();
      }
    };
  }, [user, authLoading]);

  // Clean obsolete mock tags if any
  useEffect(() => {
    if (state.isInitialized && state.accidents.some(a => a.id.includes('IMP-'))) {
      const newAccidents = state.accidents.filter(a => !a.id.includes('IMP-'));
      dispatch({ type: ActionType.SET_ACCIDENTS, payload: newAccidents });
    }
  }, [state.isInitialized, state.accidents]);

  // Save changes to Centralized Firestore Database and Local Cache
  useEffect(() => {
    if (!state.isInitialized) return;

    // If change was triggered by incoming snapshot from Firestore, don't echo write back
    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    if (user) {
      saveCompanyStateToFirestore(state, user.email || 'usuario').catch(err => {
        console.error("Error saving state to company Firestore:", err);
      });
    } else {
      saveState(state);
    }
  }, [state, user]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);