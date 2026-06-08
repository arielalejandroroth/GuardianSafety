import { AppState } from '../types';
import { initialFindings } from '../data/findings';
import { initialQualifications } from '../data/qualifications';
import { newAccidentData } from '../data/accidents';
import { contractorAccidentData } from '../data/contractorAccidents';
import { mapRawAccidentToReport, mapRawContractorAccidentToReport } from './dataMappers';
import { db } from '../firebaseConfig';
import { doc, getDocFromServer, setDoc } from 'firebase/firestore';

const APP_STORAGE_PREFIX = 'safetyguardpro_';

const stripBase64Data = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(item => stripBase64Data(item));
    }
    if (obj !== null && typeof obj === 'object') {
        if (obj.hasOwnProperty('data') && obj.hasOwnProperty('name') && obj.hasOwnProperty('type')) {
            return { name: obj.name, type: obj.type, data: '' };
        }
        const newObj: { [key: string]: any } = {};
        for (const prop in obj) {
            newObj[prop] = stripBase64Data(obj[prop]);
        }
        return newObj;
    }
    return obj;
};

export const saveState = (state: AppState) => {
    try {
        const stateToSave = stripBase64Data(state);
        const serializedState = JSON.stringify(stateToSave);
        localStorage.setItem(`${APP_STORAGE_PREFIX}appState`, serializedState);
    } catch (error) {
        console.error("Could not save state to localStorage:", error);
    }
};

export const loadState = (): Omit<AppState, 'isInitialized'> => {
    try {
        const serializedState = localStorage.getItem(`${APP_STORAGE_PREFIX}appState`);
        if (serializedState === null) {
            return getDefaultState();
        }
        let parsedState = JSON.parse(serializedState);
        
        // One-time deletion of previously loaded accidents
        if (!localStorage.getItem(`${APP_STORAGE_PREFIX}accidents_cleared_v5`)) {
            parsedState.accidents = [];
            localStorage.setItem(`${APP_STORAGE_PREFIX}accidents_cleared_v5`, 'true');
        }

        if (!localStorage.getItem(`${APP_STORAGE_PREFIX}accidents_cleared_imp_v2`)) {
            if (parsedState.accidents) {
                parsedState.accidents = parsedState.accidents.filter((acc: any) => !acc.id.includes('IMP-'));
            }
            localStorage.setItem(`${APP_STORAGE_PREFIX}accidents_cleared_imp_v2`, 'true');
        }

        const defaultState = getDefaultState();
        const mergedState = { ...defaultState, ...parsedState };
        
        // Merge accidents by ID
        const accidentMap = new Map();
        defaultState.accidents.forEach(a => accidentMap.set(a.id, a));
        if (parsedState.accidents) {
            parsedState.accidents.forEach((a: any) => accidentMap.set(a.id, a));
        }
        mergedState.accidents = Array.from(accidentMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Ensure all keys from the initial state exist to prevent app crashes on data model updates.
        return mergedState;
    } catch (error) {
        console.error("Could not load state from localStorage, using default state:", error);
        return getDefaultState();
    }
};

export const saveStateToFirestore = async (userId: string, state: AppState) => {
    try {
        const stateToSave = stripBase64Data(state);
        delete stateToSave.isInitialized;
        await setDoc(doc(db, `users/${userId}/appData/state`), { data: JSON.stringify(stateToSave) });
    } catch (error) {
        console.error("Could not save state to Firestore:", error);
    }
};

export const loadStateFromFirestore = async (userId: string): Promise<Omit<AppState, 'isInitialized'>> => {
    try {
        const docRef = doc(db, `users/${userId}/appData/state`);
        const docSnap = await getDocFromServer(docRef);
        if (docSnap.exists()) {
            const dataStr = docSnap.data().data;
            if (dataStr) {
                 const parsedState = JSON.parse(dataStr);
                 
                 const defaultState = getDefaultState();
                 const mergedState = { ...defaultState, ...parsedState };
                 
                 // Merge accidents by ID
                 const accidentMap = new Map();
                 defaultState.accidents.forEach(a => accidentMap.set(a.id, a));
                 if (parsedState.accidents) {
                     parsedState.accidents.forEach((a: any) => accidentMap.set(a.id, a));
                 }
                 mergedState.accidents = Array.from(accidentMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                 return mergedState;
            }
        }
    } catch (error) {
        console.error("Error loading state from Firestore, falling back to default:", error);
    }
    return getDefaultState();
};

const getDefaultState = (): Omit<AppState, 'isInitialized'> => {
    return {
        findings: initialFindings,
        observations: [],
        audits: [],
        accidents: [
            ...newAccidentData.map(mapRawAccidentToReport),
            ...contractorAccidentData.map(mapRawContractorAccidentToReport)
        ],
        dialogues: [],
        qualifications: initialQualifications,
        forkliftChecklists: [],
        riskEvaluations: [],
    };
};
