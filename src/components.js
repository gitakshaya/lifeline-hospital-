import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { BANNER, BANNER_RATIO } from './config';
import { useTheme } from './theme';

// Logo banner on a light plate so it stays readable in dark mode
export const Banner = ({ height = 110, style }) => {
  const { colors } = useTheme();
  return (
    <View style={[{ backgroundColor: colors.logoBg, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 }, style]}>
      <Image source={BANNER} resizeMode="contain" style={{ height, width: height * BANNER_RATIO }} />
    </View>
  );
};

export const Card = ({ children, style }) => {
  const { colors } = useTheme();
  return <View style={[s.card, { backgroundColor: colors.card }, style]}>{children}</View>;
};

export const Button = ({ title, onPress, color, disabled, loading }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[s.btn, { backgroundColor: color || colors.primary, opacity: disabled || loading ? 0.5 : 1 }]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{title}</Text>}
    </TouchableOpacity>
  );
};

export const Field = ({ label, error, ...props }) => {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={[s.label, { color: colors.muted }]}>{label}</Text>
      <TextInput
        style={[s.input, { borderColor: error ? colors.accent : colors.border, backgroundColor: colors.input, color: colors.text }]}
        placeholderTextColor={colors.muted}
        {...props}
      />
      {!!error && <Text style={[s.error, { color: colors.accent }]}>{error}</Text>}
    </View>
  );
};

export const Segment = ({ label, options, value, onChange }) => {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={[s.label, { color: colors.muted }]}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {options.map((o) => (
          <TouchableOpacity
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[s.seg, { backgroundColor: value === o.value ? colors.primary : colors.chip }]}
          >
            <Text style={{ color: value === o.value ? '#fff' : colors.text }}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  card: { borderRadius: 12, padding: 14, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
  btn: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginVertical: 6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  label: { marginBottom: 4, fontSize: 13 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10 },
  error: { fontSize: 12, marginTop: 2 },
  seg: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
});
