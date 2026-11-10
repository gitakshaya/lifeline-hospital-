import React, { useEffect, useState } from 'react';
import { FlatList, Text, ActivityIndicator, View } from 'react-native';
import { Card } from '../components';
import { useTheme } from '../theme';
import { getReviews } from '../api';

export default function ReviewsScreen() {
  const { colors } = useTheme();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { getReviews().then(setData).catch((e) => setErr(e.message)); }, []);

  if (err) return <Text style={{ padding: 16, color: colors.accent }}>{err}</Text>;
  if (!data) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16 }}
      data={data.reviews}
      keyExtractor={(r, i) => String(i)}
      ListHeaderComponent={
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>{data.rating} ★</Text>
          <Text style={{ color: colors.muted }}>{data.total} Google reviews</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Card>
          <Text style={{ fontWeight: '700', color: colors.text }}>{item.author} · {'★'.repeat(Math.round(item.rating))}</Text>
          <Text style={{ color: colors.muted, marginTop: 4 }}>{item.text}</Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{item.when}</Text>
        </Card>
      )}
    />
  );
}
