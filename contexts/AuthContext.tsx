import React, { createContext, useContext, useState } from 'react';
import { User } from 'firebase/auth';
import { loginWithGoogle, logout } from '../firebaseConfig';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: Error | null;
    login: (username?: string, password?: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    error: null,
    login: async () => {},
    logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [loading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const handleLogin = async (username?: string, password?: string) => {
        if (username === 'Safety' && password === 'Roth1234') {
            setUser({ uid: 'Safety_user', email: 'safety@guardian.com' });
            setError(null);
        } else {
            throw new Error('Credenciales incorrectas. Verifique usuario y contraseña.');
        }
    };

    const handleLogout = async () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, error, login: handleLogin, logout: handleLogout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
