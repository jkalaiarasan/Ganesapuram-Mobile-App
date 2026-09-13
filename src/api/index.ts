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

export async function clearPushToken(memberId: string) {
  try {
    await api.delete('/api/member/push-token', { data: { memberId } });
  } catch {
    // best-effort; logout must not block
  }
}

// Online presence heartbeat — fire-and-forget, must never break the app
export async function sendHeartbeat(memberId: string) {
  try {
    await api.post('/api/member/heartbeat', { memberId });
  } catch {
    // silent — presence is best-effort
  }
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

// ── Community: events, calendar, news, trips ─────────────────────────────────

// Certificates and tickets are Visualforce pages rendered as PDF on the public
// site. Both are guest-readable by record id, so the app links straight to them
// rather than re-implementing the document.
const SITE_URL = 'https://account-dev-ed.develop.my.site.com/upr/apex';

// Takes a CompetitionMember__c id — the same page serves prize winners and
// participants, styled by Prize__c.
export function certificateUrl(competitionMemberId: string) {
  return `${SITE_URL}/eventCertificate?id=${competitionMemberId}`;
}

// Takes a TripMember__c id.
export function tripTicketUrl(tripMemberId: string) {
  return `${SITE_URL}/tripTicket?id=${tripMemberId}`;
}

// Event and member photos are both ContentVersions behind the same proxy.
// BASE_URL carries a trailing slash, which axios normalises but string
// concatenation does not — the resulting // makes the host answer 308.
export function imageUrl(versionId: string) {
  return `${BASE_URL.replace(/\/+$/, '')}/api/member/image/${versionId}`;
}

export async function fetchEvents(tripsOnly = false) {
  const res = await api.get('/api/community/events', {
    params: tripsOnly ? { trip: 'true' } : {},
  });
  return res.data;
}

export async function fetchEventDetail(eventId: string) {
  const res = await api.get(`/api/community/events/${eventId}`);
  return res.data;
}

export async function fetchTodaysBirthdays() {
  const res = await api.get('/api/community/birthdays/today');
  return res.data;
}

export async function fetchCalendar() {
  const res = await api.get('/api/community/calendar');
  return res.data;
}

export async function fetchNews() {
  const res = await api.get('/api/community/news');
  return res.data;
}

export async function fetchTrip(eventId: string) {
  const res = await api.get(`/api/community/trip/${eventId}`);
  return res.data;
}

export async function registerTripMember(
  eventId: string,
  payload: { name: string; mobile: string; email?: string },
) {
  const res = await api.post(`/api/community/trip/${eventId}/register`, payload);
  return res.data;
}

// ── Quiz ─────────────────────────────────────────────────────────────────────

export async function quizLogin(userId: string, loginCode: string) {
  const res = await api.post('/api/quiz/login', { userId, loginCode });
  return res.data;
}

export async function registerQuizUser(name: string, email: string) {
  const res = await api.post('/api/quiz/register', { name, email });
  return res.data;
}

export async function fetchQuizResults(quizId: string) {
  const res = await api.get(`/api/quiz/${quizId}/results`);
  return res.data;
}

export async function fetchQuizQuestions(quizId: string) {
  const res = await api.get(`/api/quiz/${quizId}/questions`);
  return res.data;
}

export async function submitQuiz(
  memberId: string,
  answers: Record<string, string>,
  warningCount: number,
) {
  const res = await api.post('/api/quiz/submit', { memberId, answers, warningCount });
  return res.data;
}

// Fire-and-forget: a lost warning must not interrupt the quiz.
export async function reportQuizWarning(memberId: string) {
  try {
    await api.post('/api/quiz/warning', { memberId });
  } catch {
    // ignored
  }
}

export async function fetchAnswerSheet(memberId: string) {
  const res = await api.get(`/api/quiz/answersheet/${memberId}`);
  return res.data;
}

// Error logging — fire-and-forget, silently ignores failures
export async function logError(name: string, description: string, memberId?: string | null) {
  try {
    await api.post('/api/member/error-log', { name, description, memberId: memberId ?? null });
  } catch {
    // logging must never break the app
  }
}
