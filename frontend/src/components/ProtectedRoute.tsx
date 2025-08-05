import { Navigate } from 'react-router-dom';
import { jwtDecode, type JwtPayload } from 'jwt-decode';
import api from '../api';
import { REFRESH_TOKEN, ACCESS_TOKEN } from '../constants';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

interface CustomJwtPayload extends JwtPayload {
    exp: number;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        auth().catch(() => {
            setIsAuthorized(false);
        });
    }, []);

    const refreshToken = async (): Promise<void> => {
        const refreshTokenValue: string | null = localStorage.getItem(REFRESH_TOKEN);
        if (!refreshTokenValue) {
            setIsAuthorized(false);
            return;
        }
        
        try { 
            const res = await api.post('/api/token/refresh/', {
                refresh: refreshTokenValue,
            });
            if (res.status === 200) {
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                setIsAuthorized(true);
            } else {
                setIsAuthorized(false);
            }
        } catch (error) {
            console.error(error);
            setIsAuthorized(false);
        }
    };

    const auth = async (): Promise<void> => {
        const token: string | null = localStorage.getItem(ACCESS_TOKEN);
        if (!token) {
            setIsAuthorized(false);
            return;
        }
        
        try {
            const decoded: CustomJwtPayload = jwtDecode<CustomJwtPayload>(token);
            const tokenExp: number = decoded.exp;
            const now: number = Date.now() / 1000;
            
            if (tokenExp < now) {
                await refreshToken();
            } else {
                setIsAuthorized(true);
            }
        } catch (error) {
            console.error('Token decode error:', error);
            setIsAuthorized(false);
        }
    };

    if (isAuthorized === null) {
        return <div>Loading...</div>;
    }

    return isAuthorized ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
