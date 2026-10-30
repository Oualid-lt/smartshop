import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../theme';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline';
}

export default function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}: Props) {
  const outline = variant === 'outline';
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        outline ? styles.outline : styles.filled,
        (pressed || inactive) && styles.dimmed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={outline ? colors.primary : colors.onPrimary} />
      ) : (
        <Text style={[styles.text, outline ? styles.textOutline : styles.textFilled]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: radius,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  filled: { backgroundColor: colors.primary },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
  dimmed: { opacity: 0.6 },
  text: { fontSize: 16, fontWeight: '700' },
  textFilled: { color: colors.onPrimary },
  textOutline: { color: colors.primary },
});