import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';
import { errorMessage } from '../api/errors';
import { useAuth } from '../auth/AuthContext';
import PrimaryButton from '../components/PrimaryButton';
import Screen from '../components/Screen';
import { formatMoney } from '../format';
import { colors, radius, spacing } from '../theme';

interface TopProductDto {
  productId: string;
  name: string;
  quantitySold: number;
  revenue: number;
}

interface TodayReport {
  salesCount: number;
  revenue: number;
  grossProfit: number;
  netProfit: number;
  cashCollected: number;
  topProducts: TopProductDto[];
  totalCustomerDebt: number;
  stockValue: number;
  lowStockCount: number;
}

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export default function DashboardScreen() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const isAr = !!i18n.language && i18n.language.startsWith('ar');

  const [report, setReport] = useState<TodayReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api<TodayReport>('/api/reports/today');
      setReport(data);
    } catch (e) {
      setError(errorMessage(e, t));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Recharge à chaque fois qu'on revient sur l'accueil
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const newSaleLabel = t('sales.new', { defaultValue: isAr ? 'عملية بيع جديدة' : 'Nouvelle vente' });

  return (
    <Screen>
      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.hello}>{t('home.welcome', { name: user?.name ?? '' })}</Text>
          <Text style={styles.subtitle}>{t('reports.today')}</Text>
        </View>
        <Pressable
          style={styles.iconButton}
          onPress={() => navigation.navigate('ReportsTab', { screen: 'Settings' })}
          hitSlop={8}
        >
          <Ionicons name="settings-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      {/* Bouton principal */}
      <PrimaryButton
        title={`🛒  ${newSaleLabel}`}
        onPress={() => navigation.navigate('Sales')}
      />

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <PrimaryButton title={t('common.retry')} onPress={() => void load()} variant="outline" />
        </View>
      ) : report ? (
        <>
          {/* Chiffres du jour */}
          <View style={styles.grid}>
            <StatCard
              icon="cash-outline"
              label={t('reports.revenue')}
              value={formatMoney(report.revenue)}
              hint={t('reports.salesCount', { n: report.salesCount })}
            />
            <StatCard
              icon="trending-up-outline"
              label={t('reports.netProfit')}
              value={formatMoney(report.netProfit)}
              valueColor={report.netProfit < 0 ? colors.danger : colors.success}
            />
            <StatCard
              icon="wallet-outline"
              label={t('reports.cashCollected')}
              value={formatMoney(report.cashCollected)}
            />
            <StatCard
              icon="stats-chart-outline"
              label={t('reports.grossProfit')}
              value={formatMoney(report.grossProfit)}
            />
          </View>

          {/* Situation actuelle */}
          <Text style={styles.section}>{t('reports.now')}</Text>
          <View style={styles.card}>
            <Row
              icon="people-outline"
              label={t('reports.customerDebt')}
              value={formatMoney(report.totalCustomerDebt)}
              onPress={() => navigation.navigate('Customers')}
            />
            <View style={styles.divider} />
            <Row
              icon="alert-circle-outline"
              label={t('reports.lowStock')}
              value={String(report.lowStockCount)}
              valueColor={report.lowStockCount > 0 ? colors.danger : undefined}
              onPress={() => navigation.navigate('Products')}
            />
            <View style={styles.divider} />
            <Row
              icon="cube-outline"
              label={t('reports.stockValue')}
              value={formatMoney(report.stockValue)}
            />
          </View>

          {/* Top produits */}
          <Text style={styles.section}>{t('reports.topProducts')}</Text>
          <View style={styles.card}>
            {report.topProducts.length === 0 ? (
              <Text style={styles.empty}>{t('reports.noTop')}</Text>
            ) : (
              report.topProducts.slice(0, 3).map((p, i) => (
                <View key={p.productId}>
                  {i > 0 ? <View style={styles.divider} /> : null}
                  <View style={styles.topRow}>
                    <Text style={styles.rank}>{i + 1}</Text>
                    <View style={styles.topInfo}>
                      <Text style={styles.topName} numberOfLines={1}>
                        {p.name}
                      </Text>
                      <Text style={styles.topSub}>
                        {p.quantitySold} {t('reports.sold')}
                      </Text>
                    </View>
                    <Text style={styles.topValue}>{formatMoney(p.revenue)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  valueColor,
}: {
  icon: IconName;
  label: string;
  value: string;
  hint?: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.stat}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, valueColor ? { color: valueColor } : null]} numberOfLines={1}>
        {value}
      </Text>
      {hint ? <Text style={styles.statHint}>{hint}</Text> : null}
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  valueColor,
  onPress,
}: {
  icon: IconName;
  label: string;
  value: string;
  valueColor?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={!onPress}>
      <Ionicons name={icon} size={20} color={colors.muted} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  headerText: { flex: 1 },
  hello: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { marginTop: 2, fontSize: 14, color: colors.muted, fontWeight: '600' },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loader: { marginTop: spacing.xl },
  errorBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius,
    backgroundColor: colors.dangerBg,
    gap: spacing.md,
  },
  errorText: { color: colors.danger },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  stat: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutralBg,
    marginBottom: spacing.sm,
  },
  statLabel: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  statValue: { marginTop: 2, fontSize: 20, fontWeight: '800', color: colors.text },
  statHint: { marginTop: 2, fontSize: 12, color: colors.muted },
  section: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  divider: { height: 1, backgroundColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  rowLabel: { flex: 1, fontSize: 15, color: colors.text },
  rowValue: { fontSize: 15, fontWeight: '700', color: colors.text },
  empty: { paddingVertical: spacing.md, color: colors.muted },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  rank: { width: 22, fontSize: 16, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  topInfo: { flex: 1 },
  topName: { fontSize: 15, fontWeight: '600', color: colors.text },
  topSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  topValue: { fontSize: 15, fontWeight: '700', color: colors.text },
});