import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, SchoolYear, Semester, ClassItem, Student, RoleType } from '../types';
import { mockUsers, mockSchoolYears, mockSemesters, mockClasses, mockStudents, EMPTY_CLASS } from '../lib/mockData';
import { syncAllFromDb, saveToDb } from '../lib/dbSync';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User;
  currentRole: RoleType;
  loginAsUser: (user: User, role: RoleType) => void;
  switchUserRole: (role: RoleType) => void;
  selectedSchoolYear: SchoolYear;
  setSelectedSchoolYear: (sy: SchoolYear) => void;
  selectedSemester: Semester;
  setSelectedSemester: (sem: Semester) => void;
  classesList: ClassItem[];
  selectedClass: ClassItem;
  setSelectedClass: (cls: ClassItem) => void;
  updateClass: (cls: ClassItem) => void;
  addClass: (cls: ClassItem) => void;
  deleteClass: (id: number | string) => void;
  studentsList: Student[];
  setStudentsList: (newList: Student[]) => void;
  logout: () => void;
  updateUserPassword: (userId: number, newPassword: string) => Promise<boolean>;
  getUserPassword: (userId: number) => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Helper to read saved session synchronously on React startup
  const getSavedUser = (): User => {
    try {
      const saved = localStorage.getItem('thcs_logged_user') || sessionStorage.getItem('thcs_logged_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return mockUsers[0];
  };

  const getSavedRole = (): RoleType => {
    try {
      const saved = localStorage.getItem('thcs_logged_role') || sessionStorage.getItem('thcs_logged_role');
      if (saved) return saved as RoleType;
    } catch (e) {}
    return 'superadmin';
  };

  const getSavedAuth = (): boolean => {
    try {
      const savedUser = localStorage.getItem('thcs_logged_user') || sessionStorage.getItem('thcs_logged_user');
      const savedRole = localStorage.getItem('thcs_logged_role') || sessionStorage.getItem('thcs_logged_role');
      if (savedUser && savedRole) return true;
    } catch (e) {}
    return true; // Default stay logged in as SuperAdmin
  };

  const [currentUser, setCurrentUser] = useState<User>(getSavedUser);
  const [currentRole, setCurrentRole] = useState<RoleType>(getSavedRole);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(getSavedAuth);

  const [selectedSchoolYear, setSelectedSchoolYear] = useState<SchoolYear>(
    mockSchoolYears[0] || { id: 1, name: '2025-2026', starts_on: '2025-09-05', ends_on: '2026-05-31', is_current: true }
  );
  const [selectedSemester, setSelectedSemester] = useState<Semester>(
    mockSemesters[0] || { id: 1, code: 'HK1', name: 'Học kỳ I', school_year_id: 1, status: 'active' }
  );

  // Classes List State - Defaults to empty array []
  const [classesList, setClassesList] = useState<ClassItem[]>([]);

  // Selected Class State - Defaults to EMPTY_CLASS
  const [selectedClass, setSelectedClassState] = useState<ClassItem>(EMPTY_CLASS);

  // Global Dynamic Students List State
  const [studentsList, setStudentsListState] = useState<Student[]>([]);

  // Auto-sync all data from MySQL server on startup
  useEffect(() => {
    fetch('/thcs/api/classes')
      .then(res => res.json())
      .then(res => {
        if (res && Array.isArray(res.classes)) {
          setClassesList(res.classes);
        }
      })
      .catch(() => {});

    syncAllFromDb().then(data => {
      if (data && data.thcs_admin_classes_v2 && Array.isArray(data.thcs_admin_classes_v2)) {
        setClassesList(data.thcs_admin_classes_v2);
      }
    });
  }, []);

  // Keep mockClasses array in sync with classesList & restore last selected class
  useEffect(() => {
    mockClasses.length = 0;
    mockClasses.push(...classesList);

    if (classesList.length > 0) {
      const savedClassId = localStorage.getItem('thcs_selected_class_id');
      const found = classesList.find(c => String(c.id) === String(savedClassId));
      if (found) {
        setSelectedClassState(found);
      } else if (!selectedClass || !classesList.some(c => String(c.id) === String(selectedClass.id))) {
        setSelectedClassState(classesList[0]);
      }
    } else {
      setSelectedClassState(EMPTY_CLASS);
    }
  }, [classesList]);

  // Load students automatically per selected class with LocalStorage fallback + MySQL API fetch
  useEffect(() => {
    if (!selectedClass || !selectedClass.id || selectedClass.id === 0) {
      setStudentsListState([]);
      mockStudents.length = 0;
      return;
    }

    const classKey = `thcs_students_class_${selectedClass.id}`;
    const cached = localStorage.getItem(classKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setStudentsListState(parsed);
          mockStudents.length = 0;
          mockStudents.push(...parsed);
        }
      } catch (e) {}
    } else {
      setStudentsListState([]);
      mockStudents.length = 0;
    }

    fetch(`/thcs/api/students?class_id=${selectedClass.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.students)) {
          setStudentsListState(data.students);
          mockStudents.length = 0;
          mockStudents.push(...data.students);
          try {
            localStorage.setItem(classKey, JSON.stringify(data.students));
            localStorage.removeItem('thcs_student_avatars');
          } catch (e) {}
        }
      })
      .catch(() => {});
  }, [selectedClass?.id]);

  const setStudentsList = (newList: Student[]) => {
    setStudentsListState(newList);
    mockStudents.length = 0;
    mockStudents.push(...newList);

    if (selectedClass && selectedClass.id !== 0) {
      const classKey = `thcs_students_class_${selectedClass.id}`;
      try {
        localStorage.setItem(classKey, JSON.stringify(newList));
        localStorage.setItem('thcs_selected_class_id', String(selectedClass.id));
      } catch (e) {}

      // Update student_count in selectedClass
      const updatedClass = { ...selectedClass, student_count: newList.length };
      setSelectedClassState(updatedClass);

      const nextClasses = classesList.map(c => String(c.id) === String(updatedClass.id) ? updatedClass : c);
      setClassesList(nextClasses);
      saveToDb('thcs_admin_classes_v2', nextClasses);
      saveToDb(classKey, newList);

      // Post to Backend MySQL directly
      fetch('/thcs/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: selectedClass.id,
          students: newList,
        }),
      }).catch(() => {});
    }
  };

  const setSelectedClass = (cls: ClassItem) => {
    setSelectedClassState(cls);
    localStorage.setItem('thcs_selected_class_id', String(cls.id));
  };

  const updateClass = (updatedClass: ClassItem) => {
    const nextList = classesList.map(c => c.id === updatedClass.id ? updatedClass : c);
    setClassesList(nextList);
    saveToDb('thcs_admin_classes_v2', nextList);

    if (selectedClass.id === updatedClass.id) {
      setSelectedClassState(updatedClass);
    }

    // Sync to MySQL relational classes table directly
    fetch('/thcs/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedClass),
    }).catch(() => {});
  };

  const addClass = (newClass: ClassItem) => {
    const nextList = [...classesList, newClass];
    setClassesList(nextList);
    saveToDb('thcs_admin_classes_v2', nextList);
    setSelectedClass(newClass);

    // Sync to MySQL relational classes table directly
    fetch('/thcs/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newClass),
    }).catch(() => {});
  };

  const deleteClass = (id: number | string) => {
    const nextList = classesList.filter(c => String(c.id) !== String(id));
    setClassesList(nextList);
    saveToDb('thcs_admin_classes_v2', nextList);

    if (!selectedClass || String(selectedClass.id) === String(id)) {
      setSelectedClassState(nextList.length > 0 ? nextList[0] : EMPTY_CLASS);
    }

    // Sync DELETE to MySQL relational classes table directly
    fetch(`/thcs/api/classes?id=${id}`, {
      method: 'DELETE',
    }).catch(() => {});
  };

  const loginAsUser = (user: User, role: RoleType) => {
    setCurrentUser(user);
    setCurrentRole(role);
    setIsAuthenticated(true);
    try {
      localStorage.setItem('thcs_logged_user', JSON.stringify(user));
      localStorage.setItem('thcs_logged_role', role);
      sessionStorage.setItem('thcs_logged_user', JSON.stringify(user));
      sessionStorage.setItem('thcs_logged_role', role);
    } catch (e) {}
  };

  const switchUserRole = (role: RoleType) => {
    setCurrentRole(role);
    const found = mockUsers.find(u => u.role === role);
    if (found) {
      setCurrentUser(found);
      try {
        localStorage.setItem('thcs_logged_user', JSON.stringify(found));
        sessionStorage.setItem('thcs_logged_user', JSON.stringify(found));
      } catch (e) {}
    }
    try {
      localStorage.setItem('thcs_logged_role', role);
      sessionStorage.setItem('thcs_logged_role', role);
    } catch (e) {}
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('thcs_logged_user');
      localStorage.removeItem('thcs_logged_role');
      sessionStorage.removeItem('thcs_logged_user');
      sessionStorage.removeItem('thcs_logged_role');
    } catch (e) {}
  };

  const updateUserPassword = async (userId: number, newPassword: string): Promise<boolean> => {
    try {
      const res = await fetch('/thcs/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, password: newPassword }),
      });
      const json = await res.json();
      return !!json.success;
    } catch (e) {
      return false;
    }
  };

  const getUserPassword = (_userId: number): string | null => {
    return null; // Passwords are managed server-side only
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      currentUser,
      currentRole,
      loginAsUser,
      switchUserRole,
      selectedSchoolYear,
      setSelectedSchoolYear,
      selectedSemester,
      setSelectedSemester,
      classesList,
      selectedClass,
      setSelectedClass,
      updateClass,
      addClass,
      deleteClass,
      studentsList,
      setStudentsList,
      logout,
      updateUserPassword,
      getUserPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
