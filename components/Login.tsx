import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
    const { login, error: globalError } = useAuth();
    const [localError, setLocalError] = useState<string | null>(null);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        if (globalError) {
            handleErrorDisplay(globalError);
        }
    }, [globalError]);

    const handleErrorDisplay = (err: any) => {
        if (err?.message) {
            setLocalError(`Error al iniciar sesión: ${err.message}`);
        } else {
            setLocalError("Ocurrió un error inesperado al intentar iniciar sesión.");
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLocalError(null);
            setIsAuthenticating(true);
            await login(username, password);
        } catch (err: any) {
            console.error("Login failed", err);
            setIsAuthenticating(false);
            handleErrorDisplay(err);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Guardian Safety</h1>
                    <p className="text-gray-600">Inicia sesión para acceder a la plataforma</p>
                </div>

                {localError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start text-left text-red-700 text-sm">
                        <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                        <span>{localError}</span>
                    </div>
                )}
                
                <form onSubmit={handleLogin} className="space-y-5 text-left">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                        <input 
                            type="text" 
                            name="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full border border-gray-300 rounded-md py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Ingresa tu usuario"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                        <input 
                            type="password" 
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded-md py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Ingresa tu contraseña"
                            required
                        />
                    </div>
                    
                    <button 
                        type="submit"
                        disabled={isAuthenticating}
                        className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white font-medium py-3 px-4 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 mt-4"
                    >
                        {isAuthenticating ? (
                             <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            'Iniciar Sesión'
                        )}
                    </button>
                </form>
            </div>
            
            <div className="mt-8 text-center text-sm text-gray-500">
                <p>GuardianSafetyPro</p>
                <p>&copy; {new Date().getFullYear()} Todos los derechos reservados.</p>
            </div>
        </div>
    );
};

export default Login;
