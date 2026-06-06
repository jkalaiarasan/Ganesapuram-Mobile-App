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
  x: Math.random() * width,
  y: Math.random() * height,
  size: randomBetween(1, 3.5),
  delay: Math.random() * 3000,
  duration: randomBetween(2000, 5000),
}));

const Star = memo(({ x, y, size, delay, duration, color }: any) => {
  const opacity = useRef(new Animated.Value(Math.random())).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.1, duration: duration * 0.4, delay, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: duration * 0.3, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: duration * 0.3, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
      }}
    />
  );
});

export default function StarBackground() {
  const { isDark } = useTheme();
  const starColor = isDark ? '#F5D06E' : '#C9A227';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map(s => (
        <Star key={s.id} {...s} color={starColor} />
      ))}
    </View>
  );
}
