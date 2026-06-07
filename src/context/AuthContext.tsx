import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MemberProfile {
  id: string;
  name: string;
  email: string;
  uprId: string;
  position: string;
  department: string;
  dateOfBirth: string | null;
  phone: string | null;
  work: string | null;
  location: string | null;
  contentVersionId: string | null;
  type?: string | null;
}

interface AuthContextType {
  member: MemberProfile | null;
  isLoggedIn: boolean;
  login: (memberData: MemberProfile) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  member: null,
  isLoggedIn: false,
  login: async () => {},
  logout: async () => {},
});

const STORAGE_KEY = 'upr_member_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<MemberProfile | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(data => {
      if (!data) return;
      const parsed = JSON.parse(data);
      // Require all current fields — any missing key means a stale session
      const required = ['contentVersionId', 'work', 'location', 'dateOfBirth', 'phone'];
      if (required.some(k => !(k in parsed))) {
        AsyncStorage.removeItem(STORAGE_KEY);
        return;
      }
      setMember(parsed);
    });
  }, []);

  const login = async (memberData: MemberProfile) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memberData));
    setMember(memberData);
  };

  const logout = async () => {
    setMember(null);                          // immediate UI update
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ member, isLoggedIn: !!member, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
