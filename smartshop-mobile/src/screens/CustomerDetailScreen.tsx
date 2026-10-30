import React, { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';
import { errorMessage } from '../api/errors';
import type { Customer } from '../api/types';
import PrimaryButton from '../components/PrimaryButton';
import Screen from '../components/Screen';
import TextField from '../components/TextField';
import { formatMoney, parseNumber } from '../format';
import type { CustomersStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<CustomersStackParamList, 'CustomerDetail'>;

export default function CustomerDetailScreen({ route }: Props) {
  const { t } = useTranslation();
  const [customer, setCustomer] = useState<Customer>(route.params.customer);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const inDebt = customer.balance > 0;

  async function pay() {
    const value = parseNumber(amount);
    if (value === null || value <= 0) {
      setError(t('customers.invalid'));
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const updated = await api<Customer>(`/api/customers/${customer.id}/payments`, {
        method: 'POST',
        body: { amount: value },
      });
      setCustomer(updated);
      setAmount('');
      setSuccess(true);
    } catch (e) {
      setError(errorMessage(e, t));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.name}>{customer.name}</Text>
        {customer.phone ? <Text style={styles.muted}>{customer.phone}</Text> : null}
        {customer.creditLimit !== null ? (
          <Text style={styles.muted}>
            {t('customers.creditLimit')} : {formatMoney(customer.creditLimit)}
          </Text>
        ) : null}

        <Text style={styles.label}>{t('customers.balance')}</Text>
        <Text style={[styles.balance, inDebt ? styles.debt : styles.ok]}>
          {inDebt ? formatMoney(customer.balance) : t('customers.noDebt')}
        </Text>
      </View>

      {customer.phone ? (
        <View style={styles.block}>
          <PrimaryButton
            title={t('customers.call')}
            onPress={() => void Linking.openURL(`tel:${customer.phone}`)}
            variant="outline"
          />
        </View>
      ) : null}

      {inDebt ? (
        <View style={styles.block}>
          <Text style={styles.section}>{t('customers.payment')}</Text>
          <TextField
            label={t('customers.amount')}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton title={t('customers.pay')} onPress={pay} loading={saving} />
        </View>
      ) : null}

      {success ? <Text style={styles.success}>{t('customers.paySuccess')}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  name: { fontSize: 22, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted, marginTop: 2 },
  label: { marginTop: spacing.md, color: colors.muted, fontSize: 13 },
  balance: { fontSize: 26, fontWeight: '800', marginTop: 2 },
  debt: { color: colors.danger },
  ok: { color: colors.success },
  block: { marginTop: spacing.lg },
  section: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  error: {
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    padding: spacing.sm,
    borderRadius: radius,
    marginBottom: spacing.md,
  },
  success: {
    marginTop: spacing.md,
    color: colors.success,
    backgroundColor: colors.successBg,
    padding: spacing.sm,
    borderRadius: radius,
    fontWeight: '700',
  },
});