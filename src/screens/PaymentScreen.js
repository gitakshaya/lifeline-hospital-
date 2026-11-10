import React, { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { openCheckout } from '../razorpay';
import { notify } from '../notify';
import { Button, Card, Field } from '../components';
import { HOSPITAL } from '../config';
import { useTheme, BRAND } from '../theme';
import { validateDiscount, createOrder, confirmPayment } from '../api';

export default function PaymentScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const { plan, customerId, idNumber } = route.params;
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState(null); // { code, discount, final }
  const [loading, setLoading] = useState(false);

  const total = applied ? applied.final : plan.price;

  async function apply() {
    if (!code.trim()) return;
    try {
      const r = await validateDiscount(code.trim(), plan.price);
      setApplied({ code: code.trim().toUpperCase(), ...r });
    } catch (e) {
      setApplied(null);
      notify('Invalid code', e.message);
    }
  }

  async function pay() {
    setLoading(true);
    try {
      // Server computes the final amount again, so the app cannot tamper with the price
      const order = await createOrder(plan.id, applied?.code || '', customerId);
      const result = await openCheckout({
        key: HOSPITAL.razorpayKeyId,
        amount: order.amountPaise,
        currency: 'INR',
        order_id: order.orderId,
        name: HOSPITAL.name,
        description: plan.name,
        theme: { color: BRAND.navy },
      });
      await confirmPayment({
        customerId, planId: plan.id, discountCode: applied?.code || '',
        orderId: result.razorpay_order_id,
        paymentId: result.razorpay_payment_id,
        signature: result.razorpay_signature,
      });
      navigation.replace('IdCard', { idNumber });
    } catch (e) {
      notify('Payment not completed', e?.description || e?.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Card>
        <Text style={{ fontWeight: '800', fontSize: 18, color: colors.text }}>{plan.name}</Text>
        <Text style={{ color: colors.muted }}>Price: ₹{plan.price}</Text>
        {applied && <Text style={{ color: isDark ? '#66BB6A' : '#2E7D32' }}>Discount ({applied.code}): -₹{applied.discount}</Text>}
        <Text style={{ fontWeight: '800', fontSize: 20, marginTop: 6, color: colors.text }}>Total: ₹{total}</Text>
      </Card>

      <Field label="Discount code" autoCapitalize="characters" value={code} onChangeText={setCode} />
      <Button title="Apply code" color="#455A64" onPress={apply} />
      <Button title={`Pay ₹${total}`} onPress={pay} loading={loading} />
    </ScrollView>
  );
}
