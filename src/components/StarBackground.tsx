import React, { useEffect, useRef, memo } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';

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

  // Dark mode: bright gold on near-black — subtle shimmer
  // Light mode: rich dark-gold on white — visible twinkle
  const starColor  = isDark ? '#F5D06E' : '#7A5010';
  const minOpacity = isDark ? 0.10       : 0.28;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map(s => (
        <Star key={s.id} {...s} color={starColor} minOpacity={minOpacity} />
      ))}
    </View>
  );
}
