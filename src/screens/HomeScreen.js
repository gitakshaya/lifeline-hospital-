import React, { useEffect, useState } from 'react';
import { ScrollView, Text, Image, Linking, FlatList } from 'react-native';
import { Banner, Button, Card } from '../components';
import { HOSPITAL } from '../config';
import { useTheme } from '../theme';
import { getGallery } from '../api';

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const [photos, setPhotos] = useState([]);
  useEffect(() => { getGallery().then(setPhotos).catch(() => {}); }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }}>
      <Banner height={120} style={{ marginBottom: 12 }} />

      <Button title="Emergency: Call Now" color={colors.accent} onPress={() => Linking.openURL(`tel:${HOSPITAL.emergencyNumber}`)} />
      <Button title="Ambulance" color="#F57C00" onPress={() => Linking.openURL(`tel:${HOSPITAL.ambulanceNumber}`)} />

      {photos.length > 0 && (
        <FlatList
          horizontal
          data={photos}
          keyExtractor={(p, i) => String(i)}
          renderItem={({ item }) => (
            <Image source={{ uri: item.url }} style={{ width: 260, height: 160, borderRadius: 12, marginRight: 10 }} />
          )}
          style={{ marginVertical: 12 }}
          showsHorizontalScrollIndicator={false}
        />
      )}

      <Card>
        <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 6, color: colors.text }}>Get your e-ID card</Text>
        <Text style={{ color: colors.muted, marginBottom: 8 }}>Register with Aadhaar, choose a plan and receive your digital health ID.</Text>
        <Button title="Register & Get e-ID" onPress={() => navigation.navigate('Register')} />
      </Card>
    </ScrollView>
  );
}
