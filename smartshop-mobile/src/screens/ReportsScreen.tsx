import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
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
import type { ReportSummary } from '../api/types';
import PrimaryButton from '../components/PrimaryButton';
import { formatDate, formatMoney } from '../format';
import type { ReportsStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<ReportsStackParamList, 'Reports'>;
type Period = 'today' | 'week' | 'month';

const ENDPOINTS: Record<Period, string> = {
  today: '/api/reports/today',
  week: '/api/reports/this-week',
  month: '/api/reports/this-month',
};

export default function ReportsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>('today');
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await api<ReportSummary>(ENDPOINTS[period]);
      setReport(data);
    } catch (e) {
      setError(errorMessage(e, t));
    }
  }, [period, t]);

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

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <View style={styles.chips}>
          <Chip label={t('reports.today')} active={period === 'today'} onPress={() => setPeriod('today')} />
          <Chip label={t('reports.week')} active={period === 'week'} onPress={() => setPeriod('week')} />
          <Chip label={t('reports.month')} active={period === 'month'} onPress={() => setPeriod('month')} />
        </View>

        <PrimaryButton
          title={t('reports.openExpenses')}
          onPress={() => navigation.navigate('Expenses')}
          variant="outline"
        />

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : error ? (
          <View style={styles.block}>
            <Text style={styles.error}>{error}</Text>
            <PrimaryButton title={t('common.retry')} onPress={() => void load()} variant="outline" />
          </View>
        ) : report ? (
          <>
            <Text style={styles.range}>
              {formatDate(report.from)} → {formatDate(report.to)} ·{' '}
              {t('reports.salesCount', { n: report.salesCount })}
            </Text>

            <View style={styles.grid}>
              <Kpi label={t('reports.revenue')} value={formatMoney(report.revenue)} />
              <Kpi label={t('reports.grossProfit')} value={formatMoney(report.grossProfit)} />
              <Kpi label={t('reports.expenses')} value={formatMoney(report.expenses)} tone="bad" />
              <Kpi
                label={t('reports.netProfit')}
                value={formatMoney(report.netProfit)}
                tone={report.netProfit >= 0 ? 'good' : 'bad'}
                strong
              />
            </View>

            <Text style={styles.section}>{t('reports.cash')}</Text>
            <View style={styles.grid}>
              <Kpi label={t('reports.cashCollected')} value={formatMoney(report.cashCollected)} />
              <Kpi label={t('reports.paidToSuppliers')} value={formatMoney(report.paidToSuppliers)} />
              <Kpi label={t('reports.purchasesTotal')} value={formatMoney(report.purchasesTotal)} />
              <Kpi
                label={t('reports.netCashFlow')}
                value={formatMoney(report.netCashFlow)}
                tone={report.netCashFlow >= 0 ? 'good' : 'bad'}
              />
            </View>

            <Text style={styles.section}>{t('reports.topProducts')}</Text>
            <View style={styles.card}>
              {report.topProducts.length === 0 ? (
                <Text style={styles.muted}>{t('reports.noTop')}</Text>
              ) : (
                report.topProducts.map((p, index) => (
                  <View key={p.productId} style={styles.topRow}>
                    <Text style={styles.rank}>{index + 1}</Text>
                    <View style={styles.flex}>
                      <Text style={styles.name}>{p.name}</Text>
                      <Text style={styles.muted}>
                        {p.quantitySold} {t('reports.sold')}
                      </Text>
                    </View>
                    <Text style={styles.value}>{formatMoney(p.revenue)}</Text>
                  </View>
                ))
              )}
            </View>

            <Text style={styles.section}>{t('reports.now')}</Text>
            <View style={styles.grid}>
              <Kpi
                label={t('reports.customerDebt')}
                value={formatMoney(report.totalCustomerDebt)}
                tone={report.totalCustomerDebt > 0 ? 'bad' : undefined}
              />
              <Kpi
                label={t('reports.supplierDebt')}
                value={formatMoney(report.totalSupplierDebt)}
                tone={report.totalSupplierDebt > 0 ? 'bad' : undefined}
              />
              <Kpi label={t('reports.stockValue')} value={formatMoney(report.stockValue)} />
              <Kpi
                label={t('reports.lowStock')}
                value={String(report.lowStockCount)}
                tone={report.lowStockCount > 0 ? 'bad' : undefined}
              />
            </View>
          </>
        ) : null}
      </ScrollView>
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

function Kpi({
  label,
  value,
  tone,
  strong,
}: {
  label: string;
  value: string;
  tone?: 'good' | 'bad';
  strong?: boolean;
}) {
  return (
    <View style={[styles.kpi, strong && styles.kpiStrong]}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text
        style={[
          styles.kpiValue,
          tone === 'good' && styles.good,
          tone === 'bad' && styles.bad,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
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
  block: { marginTop: spacing.md },
  error: {
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    padding: spacing.sm,
    borderRadius: radius,
    marginBottom: spacing.md,
  },
  range: { color: colors.muted, fontSize: 13, marginTop: spacing.sm },
  section: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  kpi: {
    width: '48.5%',
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  kpiStrong: { borderColor: colors.primary, borderWidth: 2 },
  kpiLabel: { color: colors.muted, fontSize: 13 },
  kpiValue: { marginTop: 4, fontSize: 18, fontWeight: '800', color: colors.text },
  good: { color: colors.success },
  bad: { color: colors.danger },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rank: { width: 22, fontWeight: '800', color: colors.primary, fontSize: 16 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted, fontSize: 13 },
  value: { fontWeight: '700', color: colors.text },
});