import React, { useEffect, useState } from 'react';
import { FlatList, Text, ActivityIndicator } from 'react-native';
import { Card } from '../components';
import { useTheme } from '../theme';
import { getFacilities } from '../api';

export default function FacilitiesScreen() {
  const { colors } = useTheme();
  const [items, setItems] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { getFacilities().then(setItems).catch((e) => setErr(e.message)); }, []);

  if (err) return <Text style={{ padding: 16, color: colors.accent }}>{err}</Text>;
  if (!items) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16 }}
      data={items}
      keyExtractor={(f, i) => String(i)}
      renderItem={({ item }) => (
        <Card>
          <Text style={{ fontWeight: '700', fontSize: 16, color: colors.text }}>{item.name}</Text>
          <Text style={{ color: colors.muted, marginTop: 4 }}>{item.description}</Text>
        </Card>
      )}
    />
  );
}
