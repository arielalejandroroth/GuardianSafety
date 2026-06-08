import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { AppState, Action, ActionType } from '../types';
import { loadState, saveState, loadStateFromFirestore, saveStateToFirestore } from '../utils/storage';
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
        case ActionType.ADD_FINDING:
            return { ...state, findings: [action.payload, ...state.findings] };
        case ActionType.UPDATE_FINDING:
            return { ...state, findings: state.findings.map(f => f.id === action.payload.id ? action.payload : f) };
        case ActionType.SET_FINDINGS:
            return { ...state, findings: action.payload };
        case ActionType.ADD_OBSERVATION:
            return { ...state, observations: [...state.observations, action.payload] };
        case ActionType.ADD_AUDIT:
            return { ...state, audits: [action.payload, ...state.audits] };
        case ActionType.ADD_ACCIDENT:
            return { ...state, accidents: [action.payload, ...state.accidents] };
        case ActionType.UPDATE_ACCIDENT:
            return { ...state, accidents: state.accidents.map(a => a.id === action.payload.id ? action.payload : a) };
        case ActionType.DELETE_ACCIDENT:
            return {
                ...state,
                accidents: state.accidents.filter(a => a.id !== action.payload),
            };
        case ActionType.SET_ACCIDENTS:
            return { ...state, accidents: action.payload };
        case ActionType.ADD_DIALOGUE:
            return { ...state, dialogues: [action.payload, ...state.dialogues] };
        case ActionType.ADD_QUALIFICATION:
            return { ...state, qualifications: [action.payload, ...state.qualifications] };
        case ActionType.UPDATE_QUALIFICATION:
            return { ...state, qualifications: state.qualifications.map(q => q.id === action.payload.id ? action.payload : q) };
        case ActionType.ADD_FORKLIFT_CHECKLIST:
            return { ...state, forkliftChecklists: [action.payload, ...state.forkliftChecklists] };
        case ActionType.ADD_RISK_EVALUATION:
            return { ...state, riskEvaluations: [action.payload, ...state.riskEvaluations] };
        case ActionType.UPDATE_RISK_EVALUATION:
            return { ...state, riskEvaluations: state.riskEvaluations.map(e => e.id === action.payload.id ? action.payload : e) };
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

    useEffect(() => {
        if (authLoading) return;

        const loadData = async () => {
            if (user) {
                // Try reading from firestore first
                const dbState = await loadStateFromFirestore(user.uid);
                // Simple check: if dbState doesn't map to much, it might be new.
                dispatch({
                    type: ActionType.INITIALIZE_STATE,
                    payload: dbState,
                });
            } else {
                // Fallback to local
                const loadedState = loadState();
                dispatch({
                    type: ActionType.INITIALIZE_STATE,
                    payload: loadedState,
                });
            }
        };
        
        loadData();
    }, [user, authLoading]);

    useEffect(() => {
        if (state.isInitialized && state.accidents.some(a => a.id.includes('IMP-'))) {
            const newAccidents = state.accidents.filter(a => !a.id.includes('IMP-'));
            dispatch({ type: ActionType.SET_ACCIDENTS, payload: newAccidents });
        }
    }, [state.isInitialized, state.accidents]);

    useEffect(() => {
        if (state.isInitialized) {
            if (user) {
                saveStateToFirestore(user.uid, state);
            } else {
                saveState(state);
            }
        }
    }, [state, user]);


    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);