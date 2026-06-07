import React, {
  createContext, useContext, useState, useRef, useEffect, useCallback,
} from 'react';
import { Animated, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GOLD, SPACING, RADIUS } from '../theme';

export type ToastType = 'error' | 'info' | 'success';

interface ToastState { message: string; type: ToastType }
interface ToastCtx  { showToast: (message: string, type?: ToastType) => void }

const ToastContext = createContext<ToastCtx>({ showToast: () => {} });
export const useToast = () => useContext(ToastContext);

// ── Individual toast bubble ───────────────────────────────────────────────────
function ToastBubble({ message, type, onDone }: {
  message: string; type: ToastType; onDone: () => void;
}) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: 280, useNativeDriver: true }),
      Animated.timing(opacity,    { toValue: 0,    duration: 200, useNativeDriver: true }),
    ]).start(() => onDone());
  }, [onDone, translateY, opacity]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, tension: 55, friction: 11, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    timerRef.current = setTimeout(dismiss, 3000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const borderColor = type === 'error' ? '#EF4444' : type === 'success' ? '#4ADE80' : GOLD.primary;
  const bgColor     = type === 'error' ? 'rgba(40,8,8,0.97)' : type === 'success' ? 'rgba(8,30,12,0.97)' : 'rgba(20,14,3,0.97)';
  const icon        = type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';

  return (
    <Animated.View style={[ts.toast, { transform: [{ translateY }], opacity }]}>
      <View style={[ts.inner, { backgroundColor: bgColor, borderColor, borderLeftColor: borderColor }]}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
        <Text style={ts.msg}>{message}</Text>
        <TouchableOpacity onPress={dismiss} activeOpacity={0.7} style={ts.closeBtn}>
          <Text style={ts.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'error') => {
    setToast({ message, type });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      <View style={{ flex: 1 }}>
        {children}
        {toast && (
          <ToastBubble
            message={toast.message}
            type={toast.type}
            onDone={() => setToast(null)}
          />
        )}
      </View>
    </ToastContext.Provider>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const ts = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 56,
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 99999,
    elevation: 999,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderLeftWidth: 4,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 999,
  },
  msg: {
    flex: 1,
    color: '#F5ECD7',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  closeIcon: {
    color: '#F5ECD7',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 14,
  },
});
