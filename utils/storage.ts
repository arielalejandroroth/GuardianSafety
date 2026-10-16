import { AppState, AuthorizedUser } from '../types';
import { initialFindings } from '../data/findings';
import { initialQualifications } from '../data/qualifications';
import { newAccidentData } from '../data/accidents';
import { contractorAccidentData } from '../data/contractorAccidents';
import { mapRawAccidentToReport, mapRawContractorAccidentToReport } from './dataMappers';
import { db, auth } from '../firebaseConfig';
import {
  doc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';

export const SUPER_ADMIN_EMAIL = 'arielalejandroroth@gmail.com';
export const COMPANY_WORKSPACE_ID = 'mainState';
export const CANONICAL_SHARED_URL = 'https://ais-pre-4najuzmwdeq7dywhmyx6y5-130171764875.us-west2.run.app';

export function getAppShareUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // When running in local development or AI Studio dev mode, use the preview or canonical URL
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('-dev-')) {
      return CANONICAL_SHARED_URL;
    }
    // When running on production (Hostinger, custom domain, or ais-pre), use the live origin URL
    return `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
  }
  return CANONICAL_SHARED_URL;
}

const APP_STORAGE_PREFIX = 'safetyguardpro_';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const stripBase64Data = (obj: any): any => {
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

// ==========================================
// LOCAL STORAGE CACHE
// ==========================================
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
    defaultState.accidents.forEach((a: any) => accidentMap.set(a.id, a));
    if (parsedState.accidents) {
      parsedState.accidents.forEach((a: any) => accidentMap.set(a.id, a));
    }
    mergedState.accidents = Array.from(accidentMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Merge qualifications by ID
    const qualificationMap = new Map();
    if (parsedState.qualifications) {
      parsedState.qualifications.forEach((q: any) => qualificationMap.set(q.id, q));
    }
    defaultState.qualifications.forEach((q: any) => qualificationMap.set(q.id, q));
    mergedState.qualifications = Array.from(qualificationMap.values());

    return mergedState;
  } catch (error) {
    console.error("Could not load state from localStorage, using default state:", error);
    return getDefaultState();
  }
};

export const getDefaultState = (): Omit<AppState, 'isInitialized'> => {
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

// ==========================================
// CENTRALIZED COMPANY DATA IN FIRESTORE
// ==========================================
export const saveCompanyStateToFirestore = async (state: AppState, userEmail?: string) => {
  const path = `companyData/${COMPANY_WORKSPACE_ID}`;
  try {
    const stateToSave = stripBase64Data(state);
    delete stateToSave.isInitialized;
    await setDoc(doc(db, 'companyData', COMPANY_WORKSPACE_ID), {
      data: JSON.stringify(stateToSave),
      updatedAt: new Date().toISOString(),
      updatedBy: userEmail || auth.currentUser?.email || 'sistema'
    });
    // Also update localStorage as cache
    saveState(state);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const loadCompanyStateFromFirestore = async (): Promise<Omit<AppState, 'isInitialized'>> => {
  const path = `companyData/${COMPANY_WORKSPACE_ID}`;
  try {
    const docRef = doc(db, 'companyData', COMPANY_WORKSPACE_ID);
    const docSnap = await getDocFromServer(docRef);
    if (docSnap.exists()) {
      const dataStr = docSnap.data().data;
      if (dataStr) {
        const parsedState = JSON.parse(dataStr);
        const defaultState = getDefaultState();
        return { ...defaultState, ...parsedState };
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
  return getDefaultState();
};

export const subscribeCompanyState = (
  onUpdate: (state: Omit<AppState, 'isInitialized'>) => void,
  onError?: (error: any) => void
): Unsubscribe => {
  const path = `companyData/${COMPANY_WORKSPACE_ID}`;
  const docRef = doc(db, 'companyData', COMPANY_WORKSPACE_ID);

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const rawData = docSnap.data();
        if (rawData && rawData.data) {
          try {
            const parsedState = JSON.parse(rawData.data);
            const defaultState = getDefaultState();
            const merged = { ...defaultState, ...parsedState };
            onUpdate(merged);
            return;
          } catch (e) {
            console.error("Error parsing company state from firestore:", e);
          }
        }
      } else {
        // First boot: Initialize company state in firestore
        const defaultState = loadState();
        saveCompanyStateToFirestore({ ...defaultState, isInitialized: true } as AppState)
          .catch((err) => console.warn("Auto-seeding company state failed:", err));
        onUpdate(defaultState);
      }
    },
    (error) => {
      console.warn("Firestore company state snapshot error:", error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

export const PRE_AUTHORIZED_USERS: AuthorizedUser[] = [
  {
    id: 'arielalejandroroth_gmail_com',
    email: 'arielalejandroroth@gmail.com',
    displayName: 'Ariel Roth (Administrador Creador)',
    role: 'admin',
    status: 'active',
    createdAt: '2026-10-16T00:00:00.000Z',
    updatedAt: '2026-10-16T00:00:00.000Z',
  },
  {
    id: 'carlafernandxz_gmail_com',
    email: 'carlafernandxz@gmail.com',
    displayName: 'Carla Fernández',
    role: 'supervisor',
    status: 'active',
    createdAt: '2026-10-16T00:00:00.000Z',
    updatedAt: '2026-10-16T00:00:00.000Z',
  }
];

export const cleanEmailKey = (email: string): string => {
  return email.toLowerCase().trim().replace(/[^a-zA-Z0-9_-]/g, '_');
};

export const subscribeAuthorizedUsers = (
  onUpdate: (users: AuthorizedUser[]) => void,
  onError?: (error: any) => void
): Unsubscribe => {
  const path = 'authorizedUsers';
  const colRef = collection(db, path);

  return onSnapshot(
    colRef,
    (snapshot) => {
      const users: AuthorizedUser[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as AuthorizedUser;
        users.push({
          ...data,
          id: d.id,
        });
      });
      onUpdate(users);
    },
    (error) => {
      console.warn("Error subscribing to authorized users:", error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

export const saveAuthorizedUser = async (user: AuthorizedUser): Promise<void> => {
  const docId = cleanEmailKey(user.email);
  const path = `authorizedUsers/${docId}`;
  try {
    await setDoc(doc(db, 'authorizedUsers', docId), {
      ...user,
      id: docId,
      email: user.email.toLowerCase().trim(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const requestUserAccess = async (email: string, displayName: string): Promise<void> => {
  const docId = cleanEmailKey(email);
  try {
    const docRef = doc(db, 'authorizedUsers', docId);
    await setDoc(docRef, {
      id: docId,
      email: email.toLowerCase().trim(),
      displayName: displayName || email.split('@')[0],
      role: 'lector',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      requestedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.warn("Could not submit pending access request:", error);
  }
};

export const deleteAuthorizedUser = async (email: string): Promise<void> => {
  const docId = cleanEmailKey(email);
  const path = `authorizedUsers/${docId}`;
  try {
    await deleteDoc(doc(db, 'authorizedUsers', docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Individual fallback
export const saveStateToFirestore = async (userId: string, state: AppState) => {
  const path = `users/${userId}/appData/state`;
  try {
    const stateToSave = stripBase64Data(state);
    delete stateToSave.isInitialized;
    await setDoc(doc(db, path), { data: JSON.stringify(stateToSave) });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const loadStateFromFirestore = async (userId: string): Promise<Omit<AppState, 'isInitialized'>> => {
  const path = `users/${userId}/appData/state`;
  try {
    const docRef = doc(db, path);
    const docSnap = await getDocFromServer(docRef);
    if (docSnap.exists()) {
      const dataStr = docSnap.data().data;
      if (dataStr) {
        const parsedState = JSON.parse(dataStr);
        const defaultState = getDefaultState();
        return { ...defaultState, ...parsedState };
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
  return getDefaultState();
};
