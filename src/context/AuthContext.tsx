import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MemberProfile {
  id: string;
  name: string;
  email: string;
  uprId: string;
  position: string;
  department: string;
  username: string;
  profileImageUrl: string | null;
  contentVersionId: string | null;
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
      if (data) setMember(JSON.parse(data));
    });
  }, []);

  const login = async (memberData: MemberProfile) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memberData));
    setMember(memberData);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setMember(null);
  };

  return (
    <AuthContext.Provider value={{ member, isLoggedIn: !!member, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
