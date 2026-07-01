import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { registerPushToken, clearPushToken, refreshMemberProfile, logError, checkSession } from '../api';
import { useToast } from './ToastContext';

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
  pushTokenError: string | null;
  login: (memberData: MemberProfile, sessionToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMember: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  member: null,
  isLoggedIn: false,
  pushTokenError: null,
  login: async () => {},
  logout: async () => {},
  refreshMember: async () => {},
});

const STORAGE_KEY = 'upr_member_session';
const SESSION_TOKEN_KEY = 'upr_session_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [pushTokenError, setPushTokenError] = useState<string | null>(null);
  const { showToast } = useToast();

  const memberRef = useRef<MemberProfile | null>(null);
  useEffect(() => { memberRef.current = member; }, [member]);

  // ── Session restore on app start ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [[, data], [, sessionToken]] = await AsyncStorage.multiGet([STORAGE_KEY, SESSION_TOKEN_KEY]);
      if (!data) return;

      const parsed = JSON.parse(data);
      const required = ['contentVersionId', 'work', 'location', 'dateOfBirth', 'phone'];
      if (required.some(k => !(k in parsed))) {
        await AsyncStorage.multiRemove([STORAGE_KEY, SESSION_TOKEN_KEY]);
        return;
      }

      if (sessionToken) {
        try {
          const { valid } = await checkSession(parsed.id, sessionToken);
          if (!valid) {
            await AsyncStorage.multiRemove([STORAGE_KEY, SESSION_TOKEN_KEY]);
            showToast('வேறு சாதனத்தில் உள்நுழைந்துள்ளீர்கள். மீண்டும் உள்நுழைக.', 'error');
            return;
          }
        } catch {
          // Salesforce unreachable — restore session anyway
        }
      }

      console.log('[Auth] Session restored for member:', parsed.id);
      setMember(parsed);
      // Re-register push token silently on restore (token may have changed)
      registerDevicePushToken(parsed.id, false);
    })();
  }, []);

  // ── AppState — re-verify session when app comes to foreground ────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (nextState !== 'active') return;
      if (!memberRef.current) return;
      const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
      if (!token) return;
      try {
        const { valid } = await checkSession(memberRef.current.id, token);
        if (!valid) {
          await AsyncStorage.multiRemove([STORAGE_KEY, SESSION_TOKEN_KEY]);
          setMember(null);
          showToast('வேறு சாதனத்தில் உள்நுழைந்துள்ளீர்கள். மீண்டும் உள்நுழைக.', 'error');
        }
      } catch {
        // Server unreachable — keep session alive
      }
    });
    return () => sub.remove();
  }, []);

  // showResult gates the SUCCESS toast only — errors always show so APK failures are visible
  const registerDevicePushToken = async (memberId: string, showResult: boolean) => {
    if (Platform.OS === 'web') return;

    const fail = (label: string, detail: string, toastMsg: string) => {
      console.warn(`[PushToken] ❌ ${label}:`, detail);
      setPushTokenError(`${label}: ${detail}`);
      logError(label, `Member: ${memberId} | ${detail}`, memberId);
      showToast(toastMsg, 'error');
    };

    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'UPR Ganesapuram',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#C9A227',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        fail(
          'Push Token Permission Denied',
          `status: ${finalStatus}`,
          `⚠️ Notification permission ${finalStatus} — Settings > App > Notifications இயக்கவும்`,
        );
        return;
      }

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ?? '07ef6392-df4d-4474-8bb4-dcec0beb6cbf';

      let token: string;
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        token = tokenData.data;
        console.log('[PushToken] ✅ Token received:', token);
      } catch (tokenErr: any) {
        const msg = tokenErr?.message ?? String(tokenErr);
        fail('Push Token Fetch Failed', `projectId: ${projectId} | ${msg}`, `⚠️ Token fetch failed: ${msg.slice(0, 70)}`);
        return;
      }

      const result = await registerPushToken(memberId, token);
      if (result.success && result.verified) {
        console.log('[PushToken] ✅ Saved and verified in Salesforce');
        setPushTokenError(null);
        if (showResult) showToast('Device Registered Successfully', 'success');
      } else if (result.success && !result.verified) {
        fail(
          'Push Token Verify Failed',
          're-query mismatch after save',
          '⚠️ Device reg saved but verify failed — FAB ⚠️ tap for detail',
        );
      } else {
        const detail = result.sfDetail
          ? `SF: ${JSON.stringify(result.sfDetail)}`
          : (result.message ?? 'unknown');
        fail('Push Token Not Saved', detail, `⚠️ Server reg failed: ${detail.slice(0, 60)}`);
      }
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      fail('Push Token Failed', msg, `⚠️ Device reg error: ${msg.slice(0, 70)}`);
    }
  };

  // ── refreshMember ────────────────────────────────────────────────────────────
  const refreshMember = async () => {
    if (!member) return;
    try {
      const res = await refreshMemberProfile(member.id, member.email);
      if (res.success && res.member) {
        const updated: MemberProfile = res.member;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setMember(updated);
      }
    } catch {
      // silently fail
    }
  };

  // ── login ─────────────────────────────────────────────────────────────────────
  const login = async (memberData: MemberProfile, sessionToken?: string) => {
    console.log('[Auth] Login success for:', memberData.name, '| id:', memberData.id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memberData));
    if (sessionToken) await AsyncStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
    setMember(memberData);
    // Register and toast — called directly so showResult is always reliable
    registerDevicePushToken(memberData.id, true);
  };

  // ── logout ────────────────────────────────────────────────────────────────────
  const logout = async () => {
    console.log('[Auth] Logout');
    if (memberRef.current) {
      await clearPushToken(memberRef.current.id);
    }
    setMember(null);
    await AsyncStorage.multiRemove([STORAGE_KEY, SESSION_TOKEN_KEY]);
  };

  return (
    <AuthContext.Provider value={{ member, isLoggedIn: !!member, pushTokenError, login, logout, refreshMember }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
