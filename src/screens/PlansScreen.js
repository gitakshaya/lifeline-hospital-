import React, { useEffect, useState } from 'react';
import { FlatList, Text, ActivityIndicator } from 'react-native';
import { Card, Button } from '../components';
import { useTheme } from '../theme';
import { getPlans } from '../api';

export default function PlansScreen({ navigation }) {
  const { colors } = useTheme();
  const [plans, setPlans] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { getPlans().then(setPlans).catch((e) => setErr(e.message)); }, []);

  if (err) return <Text style={{ padding: 16, color: colors.accent }}>{err}</Text>;
  if (!plans) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16 }}
      data={plans}
      keyExtractor={(p) => String(p.id)}
      renderItem={({ item }) => (
        <Card>
          <Text style={{ fontWeight: '800', fontSize: 18, color: colors.text }}>{item.name}</Text>
          <Text style={{ color: colors.primary, fontSize: 20, fontWeight: '700', marginVertical: 4 }}>
            ₹{item.price} / year
          </Text>
          <Text style={{ color: colors.muted }}>Cover: ₹{item.cover}</Text>
          <Text style={{ color: colors.muted, marginBottom: 8 }}>{item.benefits}</Text>
          <Button title="Buy this plan" onPress={() => navigation.navigate('Register', { plan: item })} />
        </Card>
      )}
    />
  );
}
