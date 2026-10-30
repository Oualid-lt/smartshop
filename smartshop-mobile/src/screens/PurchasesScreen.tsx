import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';
import { errorMessage } from '../api/errors';
import type { Purchase } from '../api/types';
import PrimaryButton from '../components/PrimaryButton';
import { formatDate, formatMoney } from '../format';
import type { PurchasesStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<PurchasesStackParamList, 'PurchasesList'>;

export default function PurchasesScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [unpaidOnly, setUnpaidOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await api<Purchase[]>(unpaidOnly ? '/api/purchases/unpaid' : '/api/purchases');
      setPurchases(data);
    } catch (e) {
      setError(errorMessage(e, t));
    }
  }, [t, unpaidOnly]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load().finally(() => setLoading(false));
    }, [load]),
  );

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const totalDue = purchases.reduce((sum, p) => sum + Math.max(0, p.remaining), 0);

  function renderItem({ item }: { item: Purchase }) {
    const due = item.remaining > 0;
    return (
      <Pressable
        onPress={() => navigation.navigate('PurchaseDetail', { purchase: item })}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <View style={styles.flex}>
          <Text style={styles.name}>{item.supplierName ?? t('purchases.noSupplier')}</Text>
          <Text style={styles.muted}>{formatDate(item.purchaseDate)}</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.total}>{formatMoney(item.total)}</Text>
          {due ? (
            <Text style={styles.badgeDue}>
              {t('purchases.due')} {formatMoney(item.remaining)}
            </Text>
          ) : (
            <Text style={styles.badgePaid}>{t('purchases.paid')}</Text>
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <View style={styles.top}>
        <PrimaryButton
          title={`+ ${t('purchases.add')}`}
          onPress={() => navigation.navigate('PurchaseForm')}
        />
        <PrimaryButton
          title={`+ ${t('purchases.addSupplier')}`}
          onPress={() => navigation.navigate('SupplierForm')}
          variant="outline"
        />

        <View style={styles.totalBox}>
          <Text style={styles.muted}>{t('purchases.totalDue')}</Text>
          <Text style={styles.totalValue}>{formatMoney(totalDue)}</Text>
        </View>

        <View style={styles.chips}>
          <Chip label={t('purchases.all')} active={!unpaidOnly} onPress={() => setUnpaidOnly(false)} />
          <Chip label={t('purchases.unpaid')} active={unpaidOnly} onPress={() => setUnpaidOnly(true)} />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <PrimaryButton title={t('common.retry')} onPress={() => void load()} variant="outline" />
        </View>
      ) : (
        <FlatList
          data={purchases}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListEmptyComponent={<Text style={styles.empty}>{t('purchases.empty')}</Text>}
        />
      )}
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  top: { padding: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
  totalBox: {
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalValue: { fontSize: 18, fontWeight: '800', color: colors.danger },
  chips: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 14 },
  chipTextActive: { color: colors.onPrimary, fontWeight: '700' },
  loader: { marginTop: spacing.xl },
  center: { padding: spacing.lg },
  error: {
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    padding: spacing.sm,
    borderRadius: radius,
    marginBottom: spacing.md,
  },
  list: { padding: spacing.md, paddingTop: spacing.sm, gap: spacing.sm },
  empty: { textAlign: 'center', color: colors.muted, marginTop: spacing.xl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  pressed: { opacity: 0.7 },
  right: { alignItems: 'flex-end', gap: 4 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted, fontSize: 13 },
  total: { fontSize: 15, fontWeight: '700', color: colors.text },
  badgeDue: {
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  badgePaid: {
    color: colors.success,
    backgroundColor: colors.successBg,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
});