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
      console.log('[Auth] Session restored for member:', parsed.id);
      setMember(parsed);
    });
  }, []);

  // Register push token whenever member is set (login OR session restore)
  useEffect(() => {
    if (!member) return;
    registerDevicePushToken(member.id);
  }, [member?.id]);

  const registerDevicePushToken = async (memberId: string) => {
    console.log('[PushToken] ── Starting registration ──────────────────────');
    console.log('[PushToken] Member ID:', memberId);
    console.log('[PushToken] Platform:', Platform.OS);

    if (Platform.OS === 'web') {
      console.log('[PushToken] Skipping — web platform does not support push');
      return;
    }

    try {
      // ── Android: set notification channel first ──────────────────────────
      if (Platform.OS === 'android') {
        console.log('[PushToken] Setting Android notification channel...');
        await Notifications.setNotificationChannelAsync('default', {
          name: 'UPR Ganesapuram',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#C9A227',
        });
        console.log('[PushToken] ✅ Android channel ready');
      }

      // ── Request permission ───────────────────────────────────────────────
      console.log('[PushToken] Requesting notification permission...');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('[PushToken] Existing permission status:', existingStatus);

      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('[PushToken] Permission after request:', finalStatus);
      }

      if (finalStatus !== 'granted') {
        console.warn('[PushToken] ❌ Permission DENIED — push notifications will not work');
        console.warn('[PushToken]    User must enable notifications in device settings');
        return;
      }
      console.log('[PushToken] ✅ Permission granted');

      // ── Get Expo push token ──────────────────────────────────────────────
      console.log('[PushToken] Fetching Expo push token (projectId: 07ef6392-df4d-4474-8bb4-dcec0beb6cbf)...');
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '07ef6392-df4d-4474-8bb4-dcec0beb6cbf',
      });
      const token = tokenData.data;
      console.log('[PushToken] ✅ Token received:', token);
      console.log('[PushToken] Token type:', tokenData.type);

      // ── Save to server → Salesforce ──────────────────────────────────────
      console.log('[PushToken] Sending to server (POST /api/member/push-token)...');
      console.log('[PushToken] Payload: memberId =', memberId, '| token =', token);

      const result = await registerPushToken(memberId, token);
      console.log('[PushToken] ✅ Server response:', JSON.stringify(result));
      console.log('[PushToken] Token saved to Salesforce Member__c.ExpoPushToken__c ✅');
      console.log('[PushToken] ─────────────────────────────────────────────────');

    } catch (err: any) {
      console.error('[PushToken] ❌ Registration FAILED');
      console.error('[PushToken] Error message   :', err?.message ?? String(err));
      console.error('[PushToken] HTTP status      :', err?.response?.status ?? 'no response');
      console.error('[PushToken] Server response  :', JSON.stringify(err?.response?.data ?? null));
      console.error('[PushToken] Full error       :', JSON.stringify(err, Object.getOwnPropertyNames(err)));
      console.error('[PushToken] ─────────────────────────────────────────────────');
    }
  };

  const login = async (memberData: MemberProfile) => {
    console.log('[Auth] Login success for:', memberData.name, '| id:', memberData.id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memberData));
    setMember(memberData);
  };

  const logout = async () => {
    console.log('[Auth] Logout');
    setMember(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ member, isLoggedIn: !!member, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
