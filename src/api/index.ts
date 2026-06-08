import axios from 'axios';

const BASE_URL = 'https://ganesapuram-mobile-app-server.vercel.app/';

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

// OTP
export async function requestOtp(email: string) {
  const res = await api.post('/api/member/request-otp', { email });
  return res.data;
}

export async function verifyOtp(email: string, otp: string, token: string) {
  const res = await api.post('/api/member/verify-otp', { email, otp, token });
  return res.data;
}

// Members
export async function fetchMemberList() {
  const res = await api.get('/api/member/list');
  return res.data;
}

// Weather
export async function fetchWeather(lat?: number, lon?: number) {
  const params: Record<string, string> = {};
  if (lat !== undefined && lon !== undefined) {
    params.lat = String(lat);
    params.lon = String(lon);
  }
  const res = await api.get('/api/weather', { params });
  return res.data;
}

// Thirukural
export async function fetchKural() {
  const res = await api.get('/api/kural');
  return res.data;
}

// Push notifications
export async function registerPushToken(memberId: string, expoPushToken: string) {
  const res = await api.post('/api/member/push-token', { memberId, expoPushToken });
  return res.data;
}

// Refresh member profile (already logged in)
export async function refreshMemberProfile(memberId: string, email: string) {
  const res = await api.get('/api/member/profile', { params: { memberId, email } });
  return res.data;
}

// Session check — single device enforcement
export async function checkSession(memberId: string, sessionToken: string) {
  const res = await api.get('/api/member/session-check', { params: { memberId, sessionToken } });
  return res.data as { valid: boolean };
}

// Error logging — fire-and-forget, silently ignores failures
export async function logError(name: string, description: string, memberId?: string | null) {
  try {
    await api.post('/api/member/error-log', { name, description, memberId: memberId ?? null });
  } catch {
    // logging must never break the app
  }
}
