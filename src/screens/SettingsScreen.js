import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Banner, Card } from '../components';
import { HOSPITAL } from '../config';
import { useTheme, THEMES } from '../theme';

const OPTIONS = [
  { value: 'system', label: 'System default', hint: 'Follows your phone setting' },
  { value: 'light', label: 'Light', hint: 'Bright and clean' },
  { value: 'dark', label: 'Dark', hint: 'Easy on the eyes at night' },
];

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }}>
      <Banner height={90} style={{ marginBottom: 16 }} />
      <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 8 }}>Theme</Text>
      {OPTIONS.map((o) => {
        const sample = THEMES[o.value === 'dark' ? 'dark' : 'light'];
        const selected = mode === o.value;
        return (
          <TouchableOpacity key={o.value} onPress={() => setMode(o.value)}>
            <Card style={{ borderWidth: 2, borderColor: selected ? colors.primary : 'transparent', flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: sample.bg, borderWidth: 1, borderColor: colors.border, marginRight: 12, justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: 22, height: 10, borderRadius: 4, backgroundColor: sample.primary }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>{o.label}</Text>
                <Text style={{ color: colors.muted }}>{o.hint}</Text>
              </View>
              {selected && <Text style={{ color: colors.primary, fontWeight: '800' }}>✓</Text>}
            </Card>
          </TouchableOpacity>
        );
      })}
      <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 12 }}>{HOSPITAL.name} · {HOSPITAL.tagline}</Text>
    </ScrollView>
  );
}
