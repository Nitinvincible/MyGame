import { createContext, useState, useEffect, useContext } from 'react';
import { googleLogout } from '@react-oauth/google';


const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    // Restore session on load
    useEffect(() => {
        const storedUser = localStorage.getItem('serpent_user');
        const storedToken = localStorage.getItem('serpent_token');
        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
        }
    }, []);

    const login = async (credentialResponse) => {
        try {
            const idToken = credentialResponse.credential;

            // Backend verification
            const response = await fetch('http://localhost:8000/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: idToken })
            });

            if (!response.ok) throw new Error('Login failed');

            const userData = await response.json();

            setUser(userData);
            setToken(idToken);
            localStorage.setItem('serpent_user', JSON.stringify(userData));
            localStorage.setItem('serpent_token', idToken);

            return userData;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = () => {
        googleLogout();
        setUser(null);
        setToken(null);
        localStorage.removeItem('serpent_user');
        localStorage.removeItem('serpent_token');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
