import React, { useEffect, useRef, memo } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ACCENT, DEEP } from '../theme';

const { width, height } = Dimensions.get('window');

const STAR_COUNT = 60;

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

const stars = Array.from({ length: STAR_COUNT }, (_, i) => ({
  id: i,
  x:        Math.random() * width,
  y:        Math.random() * height,
  size:     randomBetween(1, 3.5),
  delay:    Math.random() * 3000,
  duration: randomBetween(2000, 5000),
}));

interface StarProps {
  x: number; y: number; size: number;
  delay: number; duration: number;
  color: string; minOpacity: number;
}

const Star = memo(({ x, y, size, delay, duration, color, minOpacity }: StarProps) => {
  const opacity = useRef(new Animated.Value(Math.random() * 0.5 + minOpacity)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: minOpacity,       duration: duration * 0.4, delay, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1,                duration: duration * 0.3, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: minOpacity + 0.2, duration: duration * 0.3, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [minOpacity]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x, top: y,
        width: size, height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
      }}
    />
  );
});

export default function StarBackground() {
  const { isDark } = useTheme();

  const starColor  = isDark ? ACCENT.light : DEEP.primary;
  const minOpacity = isDark ? 0.06       : 0.11;
  const lineColor = isDark ? 'rgba(217,119,87,0.10)' : 'rgba(58,46,40,0.07)';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.diagonal, styles.diagonalOne, { backgroundColor: lineColor }]} />
      <View style={[styles.diagonal, styles.diagonalTwo, { backgroundColor: lineColor }]} />
      <View style={[styles.glassBand, { borderColor: lineColor }]} />
      {stars.map(s => (
        <Star key={s.id} {...s} color={starColor} minOpacity={minOpacity} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  diagonal: {
    position: 'absolute',
    width: width * 1.4,
    height: 1,
    left: -width * 0.2,
    transform: [{ rotate: '-18deg' }],
  },
  diagonalOne: {
    top: height * 0.18,
  },
  diagonalTwo: {
    top: height * 0.62,
  },
  glassBand: {
    position: 'absolute',
    top: height * 0.08,
    left: width * 0.08,
    right: width * 0.08,
    height: height * 0.82,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    opacity: 0.7,
  },
});
