import { createContext, useState, useEffect, useContext } from 'react';
import { googleLogout } from '@react-oauth/google';
import { googleAuth, manualLogin, manualSignup } from '../services/api';

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
            const userData = await googleAuth(idToken);

            setUser(userData);
            setToken(idToken);
            localStorage.setItem('serpent_user', JSON.stringify(userData));
            localStorage.setItem('serpent_token', idToken);
            return userData;
        } catch (error) {
            console.error("Login failed:", error);
            logout();
            throw error;
        }
    };

    const manualLoginUser = async (username, password) => {
        try {
            const userData = await manualLogin(username, password);
            setUser(userData);
            localStorage.setItem('serpent_user', JSON.stringify(userData));
            return userData;
        } catch (error) {
            console.error("Manual login failed:", error);
            throw error;
        }
    };

    const signupUser = async (username, password, name, country) => {
        try {
            const userData = await manualSignup(username, password, name, country);
            setUser(userData);
            localStorage.setItem('serpent_user', JSON.stringify(userData));
            return userData;
        } catch (error) {
            console.error("Signup failed:", error);
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
        <AuthContext.Provider value={{ user, token, login, logout, manualLoginUser, signupUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
