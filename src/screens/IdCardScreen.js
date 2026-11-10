import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Image, ActivityIndicator } from 'react-native';
import { Banner } from '../components';
import { HOSPITAL } from '../config';
import { useTheme, BRAND } from '../theme';
import { getIdCard } from '../api';

const CARD_LABEL = { I: 'IPD', M: 'MEDICLAIM' };
const AGE_LABEL = { S: 'Student / Under 21', A: 'Adult 21-60', E: 'Elder 60+' };

export default function IdCardScreen({ route }) {
  const { colors } = useTheme();
  const { idNumber } = route.params;
  const [c, setC] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { getIdCard(idNumber).then(setC).catch((e) => setErr(e.message)); }, [idNumber]);

  if (err) return <Text style={{ padding: 16, color: colors.accent }}>{err}</Text>;
  if (!c) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }}>
      {/* The card keeps the brand navy in every theme so it looks the same when shown or screenshotted */}
      <View style={{ backgroundColor: BRAND.navy, borderRadius: 16, padding: 16 }}>
        <Banner height={64} style={{ marginBottom: 12 }} />
        <Text style={{ color: '#CFD8F3', marginBottom: 12, fontWeight: '700' }}>{CARD_LABEL[c.cardType]} e-ID Card</Text>

        <View style={{ flexDirection: 'row' }}>
          {!!c.photoUrl && <Image source={{ uri: c.photoUrl }} style={{ width: 90, height: 120, borderRadius: 8, backgroundColor: '#fff' }} />}
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>{c.name}</Text>
            <Text style={{ color: '#CFD8F3', marginTop: 4 }}>DOB: {c.dob}</Text>
            <Text style={{ color: '#CFD8F3' }}>{AGE_LABEL[c.ageCode]}</Text>
            <Text style={{ color: '#CFD8F3' }}>{c.patientType === 'N' ? 'New patient' : 'Old patient'}</Text>
            <Text style={{ color: '#CFD8F3' }}>Aadhaar: XXXX XXXX {c.aadhaarLast4}</Text>
          </View>
        </View>

        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 2, marginTop: 16 }}>{c.idNumber}</Text>
        <Text style={{ color: '#CFD8F3', fontSize: 12, marginTop: 6 }}>Emergency: {HOSPITAL.emergencyNumber}</Text>
      </View>
    </ScrollView>
  );
}
