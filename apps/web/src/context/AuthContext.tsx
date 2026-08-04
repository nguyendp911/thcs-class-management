import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, setCsrfToken } from '../lib/api';
import type { ClassItem, SchoolYear, Semester, User } from '../types/app';

interface AuthContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
  currentUser: User | null;
  currentRole: User['role'] | null;
  isSuperAdmin: boolean;
  classesList: ClassItem[];
  selectedClass: ClassItem | null;
  schoolYears: SchoolYear[];
  semesters: Semester[];
  setSelectedClass: (value: ClassItem) => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshBootstrap: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [classesList, setClassesList] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClassState] = useState<ClassItem | null>(null);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  const refreshBootstrap = useCallback(async () => {
    const payload = await apiRequest<{
      success: true;
      classes: ClassItem[];
      school_years: SchoolYear[];
      semesters: Semester[];
    }>('/bootstrap');
    setClassesList(payload.classes);
    setSchoolYears(payload.school_years);
    setSemesters(payload.semesters);
    setSelectedClassState((current) => {
      if (current) {
        const fresh = payload.classes.find((item) => String(item.id) === String(current.id));
        if (fresh) return fresh;
      }
      return payload.classes[0] || null;
    });
  }, []);

  const restoreSession = useCallback(async () => {
    try {
      const payload = await apiRequest<{ success: true; user: User; csrf_token: string }>('/auth/session');
      setCsrfToken(payload.csrf_token);
      setCurrentUser(payload.user);
      await refreshBootstrap();
    } catch {
      setCsrfToken('');
      setCurrentUser(null);
      setClassesList([]);
      setSelectedClassState(null);
    } finally {
      setIsLoading(false);
    }
  }, [refreshBootstrap]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(
    async (username: string, password: string) => {
      const payload = await apiRequest<{
        success: true;
        committed: true;
        user: User;
        csrf_token: string;
      }>('/auth/login', { method: 'POST', body: { username, password }, expectCommit: true });
      setCsrfToken(payload.csrf_token);
      setCurrentUser(payload.user);
      await refreshBootstrap();
    },
    [refreshBootstrap],
  );

  const logout = useCallback(async () => {
    await apiRequest('/auth/logout', { method: 'POST', expectCommit: true });
    setCsrfToken('');
    setCurrentUser(null);
    setClassesList([]);
    setSelectedClassState(null);
  }, []);

  const setSelectedClass = useCallback((value: ClassItem) => {
    setSelectedClassState(value);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated: currentUser !== null,
      currentUser,
      currentRole: currentUser?.role || null,
      isSuperAdmin: currentUser?.role === 'superadmin' || currentUser?.role === 'admin',
      classesList,
      selectedClass,
      schoolYears,
      semesters,
      setSelectedClass,
      login,
      logout,
      refreshBootstrap,
    }),
    [
      isLoading,
      currentUser,
      classesList,
      selectedClass,
      schoolYears,
      semesters,
      setSelectedClass,
      login,
      logout,
      refreshBootstrap,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
