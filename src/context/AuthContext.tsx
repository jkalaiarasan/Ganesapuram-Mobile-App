import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { registerPushToken } from '../api';

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

  // Restore session from storage on app start
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(data => {
      if (!data) return;
      const parsed = JSON.parse(data);
      const required = ['contentVersionId', 'work', 'location', 'dateOfBirth', 'phone'];
      if (required.some(k => !(k in parsed))) {
        AsyncStorage.removeItem(STORAGE_KEY);
        return;
      }
      setMember(parsed);
    });
  }, []);

  // Register push token whenever member is set (login OR session restore)
  useEffect(() => {
    if (!member) return;
    registerDevicePushToken(member.id);
  }, [member?.id]);

  const registerDevicePushToken = async (memberId: string) => {
    if (Platform.OS === 'web') return;
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[PushToken] Permission not granted');
        return;
      }
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '07ef6392-df4d-4474-8bb4-dcec0beb6cbf',
      });
      console.log('[PushToken] Got token:', tokenData.data);
      await registerPushToken(memberId, tokenData.data);
      console.log('[PushToken] Saved to Salesforce for member:', memberId);
    } catch (err) {
      console.error('[PushToken] Failed to register push token:', err);
    }
  };

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
