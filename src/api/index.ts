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
