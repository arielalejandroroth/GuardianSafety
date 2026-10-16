import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle, logout as firebaseLogout } from '../firebaseConfig';
import { AuthorizedUser, UserRole, UserStatus } from '../types';
import {
  SUPER_ADMIN_EMAIL,
  PRE_AUTHORIZED_USERS,
  subscribeAuthorizedUsers,
  saveAuthorizedUser,
  requestUserAccess,
  deleteAuthorizedUser as removeUserFromDb,
  cleanEmailKey
} from '../utils/storage';

export interface UserLike {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  authProvider?: 'google' | 'direct';
}

interface AuthContextType {
  user: UserLike | null;
  loading: boolean;
  error: Error | null;
  role: UserRole;
  userStatus: UserStatus;
  isAdmin: boolean;
  isSupervisorOrAdmin: boolean;
  isAuthorized: boolean;
  authorizedUsers: AuthorizedUser[];
  login: () => Promise<void>;
  loginWithEmailDirect: (email: string) => Promise<{ success: boolean; message: string; role?: UserRole }>;
  logout: () => Promise<void>;
  addUser: (email: string, displayName: string, role: UserRole, plant?: string, sector?: string) => Promise<void>;
  updateUserRole: (email: string, role: UserRole) => Promise<void>;
  revokeUserAccess: (email: string) => Promise<void>;
  activateUserAccess: (email: string) => Promise<void>;
  deleteUser: (email: string) => Promise<void>;
}

const SESSION_STORAGE_KEY = 'safetyguard_active_session_v2';

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  role: 'lector',
  userStatus: 'pending',
  isAdmin: false,
  isSupervisorOrAdmin: false,
  isAuthorized: false,
  authorizedUsers: [],
  login: async () => {},
  loginWithEmailDirect: async () => ({ success: false, message: '' }),
  logout: async () => {},
  addUser: async () => {},
  updateUserRole: async () => {},
  revokeUserAccess: async () => {},
  activateUserAccess: async () => {},
  deleteUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserLike | null>(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not read saved session:", e);
    }
    return null;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>([]);

  // Always subscribe to authorized users directory so it's live before and after login
  useEffect(() => {
    let unsubscribeUsers: (() => void) | null = null;
    try {
      unsubscribeUsers = subscribeAuthorizedUsers(
        (users) => {
          setAuthorizedUsers(users);
        },
        (err) => {
          console.warn("Could not subscribe to authorized users:", err);
        }
      );
    } catch (err) {
      console.warn("Failed to set up authorized users listener:", err);
    }

    return () => {
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, []);

  // Listen to Google Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && currentUser.email) {
        const emailLower = currentUser.email.toLowerCase().trim();
        const appUser: UserLike = {
          uid: currentUser.uid,
          email: emailLower,
          displayName: currentUser.displayName || emailLower.split('@')[0],
          photoURL: currentUser.photoURL,
          authProvider: 'google',
        };
        setUser(appUser);
        try {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(appUser));
        } catch (e) {
          console.warn("Could not store session in localStorage:", e);
        }

        // If current user is the super admin, ensure they and pre-authorized users are registered in Firestore
        if (emailLower === SUPER_ADMIN_EMAIL.toLowerCase()) {
          try {
            await saveAuthorizedUser({
              id: emailLower,
              uid: currentUser.uid,
              email: emailLower,
              displayName: currentUser.displayName || 'Administrador Creador',
              role: 'admin',
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            });

            // Ensure pre-authorized team members like carlafernandxz@gmail.com are seeded
            for (const pre of PRE_AUTHORIZED_USERS) {
              if (pre.email.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
                await saveAuthorizedUser({
                  ...pre,
                  updatedAt: new Date().toISOString(),
                });
              }
            }
          } catch (e) {
            console.warn("Super admin auto-registration warning:", e);
          }
        }
      } else {
        // If Firebase says not signed in, check if we have a direct session stored
        const saved = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!saved) {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Determine current user's role and status
  const userEmail = user?.email?.toLowerCase().trim() || '';
  const isSuperAdminEmail = userEmail === SUPER_ADMIN_EMAIL.toLowerCase();

  const matchedUser = authorizedUsers.find(
    (u) => u.email.toLowerCase().trim() === userEmail
  );

  const matchedPreUser = PRE_AUTHORIZED_USERS.find(
    (u) => u.email.toLowerCase().trim() === userEmail
  );

  let role: UserRole = 'lector';
  let userStatus: UserStatus = 'pending';
  let isAuthorized = false;

  if (isSuperAdminEmail) {
    role = 'admin';
    userStatus = 'active';
    isAuthorized = true;
  } else if (matchedUser) {
    role = matchedUser.role;
    userStatus = matchedUser.status;
    isAuthorized = matchedUser.status === 'active';
  } else if (matchedPreUser) {
    role = matchedPreUser.role;
    userStatus = matchedPreUser.status;
    isAuthorized = matchedPreUser.status === 'active';
  } else if (user) {
    // If logged in with an email not yet in the list, auto-register as pending request
    userStatus = 'pending';
    isAuthorized = false;
    if (user.email) {
      requestUserAccess(user.email, user.displayName || '').catch((e) =>
        console.warn("Auto request user access warning:", e)
      );
    }
  }

  const isAdmin = isSuperAdminEmail || (isAuthorized && role === 'admin');
  const isSupervisorOrAdmin = isAdmin || (isAuthorized && role === 'supervisor');

  const handleLogin = async () => {
    try {
      setError(null);
      await loginWithGoogle();
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  const loginWithEmailDirect = async (rawEmail: string) => {
    const cleanEmail = rawEmail.toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Ingresa un correo electrónico válido.' };
    }

    const isSuper = cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase();
    const foundAuth = authorizedUsers.find((u) => u.email.toLowerCase().trim() === cleanEmail);
    const foundPre = PRE_AUTHORIZED_USERS.find((u) => u.email.toLowerCase().trim() === cleanEmail);

    let assignedRole: UserRole = 'lector';
    let assignedStatus: UserStatus = 'pending';
    let name = cleanEmail.split('@')[0];

    if (isSuper) {
      assignedRole = 'admin';
      assignedStatus = 'active';
      name = 'Ariel Roth (Administrador Creador)';
    } else if (foundAuth) {
      assignedRole = foundAuth.role;
      assignedStatus = foundAuth.status;
      name = foundAuth.displayName || name;
    } else if (foundPre) {
      assignedRole = foundPre.role;
      assignedStatus = foundPre.status;
      name = foundPre.displayName || name;
    } else {
      // Register pending request
      await requestUserAccess(cleanEmail, name);
    }

    const sessionUser: UserLike = {
      uid: `direct_${cleanEmailKey(cleanEmail)}`,
      email: cleanEmail,
      displayName: name,
      authProvider: 'direct',
    };

    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser));
    } catch (e) {
      console.warn("Could not save session to localStorage:", e);
    }

    setUser(sessionUser);

    if (assignedStatus === 'active') {
      return {
        success: true,
        message: `¡Bienvenido/a ${name}! Acceso concedido con perfil de ${assignedRole.toUpperCase()}.`,
        role: assignedRole,
      };
    } else if (assignedStatus === 'revoked') {
      return {
        success: false,
        message: 'Tu acceso a la plataforma fue revocado por el administrador.',
      };
    } else {
      return {
        success: false,
        message: 'Solicitud de acceso enviada al administrador Ariel Roth. Te notificaremos cuando sea aprobada.',
      };
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      await firebaseLogout();
      setUser(null);
    } catch (err: any) {
      console.error("Error signing out", err);
      setUser(null);
    }
  };

  const addUser = async (
    email: string,
    displayName: string,
    newRole: UserRole,
    plant?: string,
    sector?: string
  ) => {
    const cleanEmail = email.toLowerCase().trim();
    const newUser: AuthorizedUser = {
      id: cleanEmail,
      email: cleanEmail,
      displayName: displayName || cleanEmail.split('@')[0],
      role: newRole,
      status: 'active',
      plant: plant || '',
      sector: sector || '',
      assignedBy: user?.email || 'Admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveAuthorizedUser(newUser);
  };

  const updateUserRole = async (email: string, newRole: UserRole) => {
    const cleanEmail = email.toLowerCase().trim();
    const existing = authorizedUsers.find((u) => u.email.toLowerCase().trim() === cleanEmail);
    if (existing) {
      await saveAuthorizedUser({
        ...existing,
        role: newRole,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await addUser(cleanEmail, cleanEmail.split('@')[0], newRole);
    }
  };

  const revokeUserAccess = async (email: string) => {
    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      alert("No se puede revocar el acceso al Administrador Creador principal.");
      return;
    }
    const existing = authorizedUsers.find((u) => u.email.toLowerCase().trim() === cleanEmail);
    if (existing) {
      await saveAuthorizedUser({
        ...existing,
        status: 'revoked',
        updatedAt: new Date().toISOString(),
      });
    } else {
      const newUser: AuthorizedUser = {
        id: cleanEmail,
        email: cleanEmail,
        displayName: cleanEmail.split('@')[0],
        role: 'lector',
        status: 'revoked',
        assignedBy: user?.email || 'Admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveAuthorizedUser(newUser);
    }
  };

  const activateUserAccess = async (email: string) => {
    const cleanEmail = email.toLowerCase().trim();
    const existing = authorizedUsers.find((u) => u.email.toLowerCase().trim() === cleanEmail);
    if (existing) {
      await saveAuthorizedUser({
        ...existing,
        status: 'active',
        updatedAt: new Date().toISOString(),
      });
    } else {
      await addUser(cleanEmail, cleanEmail.split('@')[0], 'supervisor');
    }
  };

  const deleteUser = async (email: string) => {
    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      alert("No se puede eliminar al Administrador Creador principal.");
      return;
    }
    await removeUserFromDb(cleanEmail);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        role,
        userStatus,
        isAdmin,
        isSupervisorOrAdmin,
        isAuthorized,
        authorizedUsers,
        login: handleLogin,
        loginWithEmailDirect,
        logout: handleLogout,
        addUser,
        updateUserRole,
        revokeUserAccess,
        activateUserAccess,
        deleteUser,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
