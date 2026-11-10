import React, { useState } from 'react';
import { ScrollView, Text, Image, TouchableOpacity, Platform, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button, Field, Segment } from '../components';
import { useTheme } from '../theme';
import { registerCustomer } from '../api';
import { notify } from '../notify';
import { isValidAadhaar, isValidPan, isValidPhone, ageFromDob, toYMD } from '../validators';

export default function RegisterScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const plan = route.params?.plan || null;
  const [f, setF] = useState({
    name: '', phone: '', email: '', address: '', aadhaar: '', pan: '',
    patientType: 'N', cardType: 'I',
  });
  const [dob, setDob] = useState(null);
  const [showDob, setShowDob] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  async function pickPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [3, 4], quality: 0.5, base64: true,
    });
    if (!res.canceled) setPhoto(res.assets[0]);
  }

  function validate() {
    const e = {};
    if (f.name.trim().length < 2) e.name = 'Enter full name';
    if (!isValidPhone(f.phone)) e.phone = 'Enter a valid 10-digit mobile number';
    if (!dob) e.dob = 'Select date of birth';
    if (!isValidAadhaar(f.aadhaar)) e.aadhaar = 'Aadhaar is compulsory and must be a valid 12-digit number';
    if (f.pan && !isValidPan(f.pan)) e.pan = 'PAN format: ABCDE1234F';
    if (!photo) e.photo = 'Please add a photo';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setLoading(true);
    try {
      const age = ageFromDob(dob);
      const customer = {
        ...f,
        aadhaar: f.aadhaar.replace(/\s/g, ''),
        pan: f.pan.toUpperCase(),
        dob: toYMD(dob),
        age,
        planId: plan?.id || '',
        photoBase64: photo.base64,
        photoMime: photo.mimeType || 'image/jpeg',
      };
      const out = await registerCustomer(customer); // { customerId, idNumber }
      if (plan) navigation.replace('Payment', { plan, customerId: out.customerId, idNumber: out.idNumber });
      else navigation.replace('IdCard', { idNumber: out.idNumber });
    } catch (e) {
      notify('Could not register', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      {plan && <Text style={{ marginBottom: 12, color: colors.primary, fontWeight: '700' }}>Plan: {plan.name} (₹{plan.price})</Text>}

      <Field label="Full name *" value={f.name} onChangeText={set('name')} error={errors.name} />
      <Field label="Mobile number *" keyboardType="number-pad" maxLength={10} value={f.phone} onChangeText={set('phone')} error={errors.phone} />
      <Field label="Email" keyboardType="email-address" autoCapitalize="none" value={f.email} onChangeText={set('email')} />
      <Field label="Address" multiline value={f.address} onChangeText={set('address')} />

      <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 4 }}>Date of birth *</Text>
      {Platform.OS === 'web' ? (
        React.createElement('input', {
          type: 'date',
          max: toYMD(new Date()),
          value: dob ? toYMD(dob) : '',
          onChange: (ev) => { const v = ev.target.value; setDob(v ? new Date(v + 'T00:00:00') : null); },
          style: {
            width: '100%', boxSizing: 'border-box', padding: 12, fontSize: 16, borderRadius: 8, marginBottom: 12,
            border: `1px solid ${errors.dob ? colors.accent : colors.border}`,
            background: colors.input, color: colors.text, colorScheme: isDark ? 'dark' : 'light',
          },
        })
      ) : (
        <TouchableOpacity onPress={() => setShowDob(true)} style={{ borderWidth: 1, borderColor: errors.dob ? colors.accent : colors.border, borderRadius: 8, padding: 12, backgroundColor: colors.input, marginBottom: 12 }}>
          <Text style={{ color: dob ? colors.text : colors.muted }}>{dob ? dob.toDateString() : 'Tap to select'}</Text>
        </TouchableOpacity>
      )}
      {!!errors.dob && <Text style={{ color: colors.accent, fontSize: 12, marginTop: -8, marginBottom: 8 }}>{errors.dob}</Text>}
      {Platform.OS !== 'web' && showDob && (
        <DateTimePicker
          value={dob || new Date(1990, 0, 1)}
          mode="date"
          themeVariant={isDark ? 'dark' : 'light'}
          maximumDate={new Date()}
          onChange={(_, d) => { setShowDob(Platform.OS === 'ios'); if (d) setDob(d); }}
        />
      )}

      <Segment label="Patient type" value={f.patientType} onChange={set('patientType')}
        options={[{ value: 'N', label: 'New' }, { value: 'O', label: 'Old' }]} />
      <Segment label="Card type" value={f.cardType} onChange={set('cardType')}
        options={[{ value: 'I', label: 'IPD' }, { value: 'M', label: 'Mediclaim' }]} />

      <Field label="Aadhaar number * (compulsory)" keyboardType="number-pad" maxLength={14} value={f.aadhaar} onChangeText={set('aadhaar')} error={errors.aadhaar} />
      <Field label="PAN number" autoCapitalize="characters" maxLength={10} value={f.pan} onChangeText={set('pan')} error={errors.pan} />

      <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 4 }}>Photo *</Text>
      <TouchableOpacity onPress={pickPhoto} style={{ height: 150, width: 120, borderWidth: 1, borderStyle: 'dashed', borderColor: errors.photo ? colors.accent : colors.muted, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 12, overflow: 'hidden' }}>
        {photo ? <Image source={{ uri: photo.uri }} style={{ width: '100%', height: '100%' }} /> : <Text style={{ color: colors.muted }}>Add photo</Text>}
      </TouchableOpacity>
      {!!errors.photo && <Text style={{ color: colors.accent, fontSize: 12, marginBottom: 8 }}>{errors.photo}</Text>}

      <Button title={plan ? 'Continue to payment' : 'Generate e-ID card'} onPress={submit} loading={loading} />
    </ScrollView>
  );
}
