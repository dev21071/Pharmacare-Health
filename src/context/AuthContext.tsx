import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, AuthSession } from '../types.ts';
import { authService } from '../services/auth.ts';
import { storage } from '../services/storage.ts';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (session: AuthSession) => void;
  logout: () => void;
  updateUser: (updated: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => storage.getProfile());
  const [token, setToken] = useState<string | null>(() => storage.getToken());

  useEffect(() => {
    const session = authService.getSession();
    if (session) {
      setUser(session.user);
      setToken(session.token);
    }
  }, []);

  const login = (session: AuthSession) => {
    setUser(session.user);
    setToken(session.token);
    storage.setToken(session.token);
    storage.saveProfile(session.user);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    authService.logout();
  };

  const updateUser = (updated: Partial<UserProfile>) => {
    if (!user) return;
    const merged = { ...user, ...updated };
    setUser(merged);
    authService.updateProfile(updated);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn: !!user?.isLoggedIn, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
