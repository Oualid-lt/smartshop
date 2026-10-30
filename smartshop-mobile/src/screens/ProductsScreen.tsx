import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';
import { errorMessage } from '../api/errors';
import type { Product } from '../api/types';
import PrimaryButton from '../components/PrimaryButton';
import { formatMoney } from '../format';
import type { ProductsStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<ProductsStackParamList, 'ProductsList'>;

export default function ProductsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await api<Product[]>('/api/products');
      setProducts(data);
    } catch (e) {
      setError(errorMessage(e, t));
    }
  }, [t]);

  // Recharge la liste chaque fois qu'on revient sur cet écran
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

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(query) || p.reference.toLowerCase().includes(query),
    );
  }, [products, search]);

  function renderItem({ item }: { item: Product }) {
    return (
      <Pressable
        onPress={() => navigation.navigate('ProductForm', { product: item })}
        style={({ pressed }) => [
          styles.card,
          !item.active && styles.cardInactive,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.price}>{formatMoney(item.salePrice)}</Text>
        </View>
        <Text style={styles.reference}>
          {item.reference}
          {item.categoryName ? `  ·  ${item.categoryName}` : ''}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.stock}>
            {t('products.stock')} : {item.stockQuantity}
          </Text>
          {item.lowStock ? <Text style={styles.badgeLow}>{t('products.lowStock')}</Text> : null}
          {!item.active ? <Text style={styles.badgeOff}>{t('products.inactive')}</Text> : null}
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <View style={styles.top}>
        <PrimaryButton
          title={`+ ${t('products.add')}`}
          onPress={() => navigation.navigate('ProductForm')}
        />
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder={t('products.search')}
          placeholderTextColor={colors.muted}
          autoCorrect={false}
        />
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
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {products.length === 0 ? t('products.empty') : t('products.noResult')}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  top: { padding: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
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
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardInactive: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  name: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  price: { fontSize: 16, fontWeight: '700', color: colors.primary },
  reference: { marginTop: 2, color: colors.muted, fontSize: 13 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  stock: { color: colors.text, fontSize: 14 },
  badgeLow: {
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  badgeOff: {
    color: colors.muted,
    backgroundColor: colors.neutralBg,
    fontSize: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
});