import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';
import { errorMessage } from '../api/errors';
import type { Customer, Product } from '../api/types';
import PrimaryButton from '../components/PrimaryButton';
import TextField from '../components/TextField';
import { formatMoney, parseNumber } from '../format';
import { colors, radius, spacing } from '../theme';

interface CartLine {
  product: Product;
  quantity: number;
}

export default function SaleScreen() {
  const { t } = useTranslation();

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState('');
  const [paid, setPaid] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([
        api<Product[]>('/api/products'),
        api<Customer[]>('/api/customers'),
      ]);
      setProducts(p.filter((item) => item.active));
      setCustomers(c);
    } catch (e) {
      setError(errorMessage(e, t));
    }
  }, [t]);

  // Recharge produits (stock à jour) et clients à chaque retour sur l'écran
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load().finally(() => setLoading(false));
    }, [load]),
  );

  const matches = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(query) || p.reference.toLowerCase().includes(query))
      .slice(0, 6);
  }, [products, search]);

  const subtotal = cart.reduce((sum, line) => sum + line.product.salePrice * line.quantity, 0);
  const discountValue = parseNumber(discount) ?? 0;
  const total = Math.max(0, subtotal - discountValue);
  const paidValue = parseNumber(paid);
  const remaining = paidValue === null ? 0 : Math.max(0, total - paidValue);

  function addProduct(product: Product) {
    setSuccess(false);
    setError(null);
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      if (existing) {
        return current.map((line) =>
          line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [...current, { product, quantity: 1 }];
    });
    setSearch('');
  }

  function changeQuantity(productId: string, delta: number) {
    setCart((current) =>
      current
        .map((line) =>
          line.product.id === productId ? { ...line, quantity: line.quantity + delta } : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  async function submit() {
    if (cart.length === 0 || discountValue < 0 || discountValue > subtotal) {
      setError(t('sales.invalid'));
      return;
    }
    if (paid.trim() !== '' && (paidValue === null || paidValue < 0)) {
      setError(t('sales.invalid'));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api('/api/sales', {
        method: 'POST',
        body: {
          customerId,
          discount: discountValue,
          amountPaid: paidValue,
          lines: cart.map((line) => ({
            productId: line.product.id,
            quantity: line.quantity,
          })),
        },
      });
      setCart([]);
      setDiscount('');
      setPaid('');
      setCustomerId(null);
      setSearch('');
      setSuccess(true);
      await load();
    } catch (e) {
      setError(errorMessage(e, t));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder={t('sales.searchProduct')}
          placeholderTextColor={colors.muted}
          autoCorrect={false}
        />

        {search.trim() !== '' ? (
          <View style={styles.results}>
            {matches.length === 0 ? (
              <Text style={styles.muted}>{t('sales.noProducts')}</Text>
            ) : (
              matches.map((p) => (
                <Pressable key={p.id} style={styles.resultRow} onPress={() => addProduct(p)}>
                  <View style={styles.flex}>
                    <Text style={styles.name}>{p.name}</Text>
                    <Text style={styles.muted}>
                      {p.reference} · {t('products.stock')} : {p.stockQuantity}
                    </Text>
                  </View>
                  <Text style={styles.price}>{formatMoney(p.salePrice)}</Text>
                </Pressable>
              ))
            )}
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>{t('sales.cart')}</Text>
        {cart.length === 0 ? (
          <Text style={styles.muted}>{t('sales.cartEmpty')}</Text>
        ) : (
          cart.map((line) => (
            <View key={line.product.id} style={styles.cartRow}>
              <View style={styles.flex}>
                <Text style={styles.name}>{line.product.name}</Text>
                <Text style={styles.muted}>
                  {formatMoney(line.product.salePrice)} × {line.quantity} ={' '}
                  {formatMoney(line.product.salePrice * line.quantity)}
                </Text>
              </View>
              <View style={styles.qty}>
                <Pressable style={styles.qtyButton} onPress={() => changeQuantity(line.product.id, -1)}>
                  <Text style={styles.qtyText}>−</Text>
                </Pressable>
                <Text style={styles.qtyValue}>{line.quantity}</Text>
                <Pressable style={styles.qtyButton} onPress={() => changeQuantity(line.product.id, 1)}>
                  <Text style={styles.qtyText}>+</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        {cart.length > 0 ? (
          <View style={styles.summary}>
            <TextField
              label={t('sales.discount')}
              value={discount}
              onChangeText={setDiscount}
              keyboardType="decimal-pad"
            />

            <View style={styles.totalRow}>
              <Text style={styles.muted}>{t('sales.subtotal')}</Text>
              <Text style={styles.text}>{formatMoney(subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('sales.total')}</Text>
              <Text style={styles.totalValue}>{formatMoney(total)}</Text>
            </View>

            <TextField
              label={t('sales.amountPaid')}
              hint={t('sales.amountPaidHint')}
              value={paid}
              onChangeText={setPaid}
              keyboardType="decimal-pad"
            />

            {remaining > 0 ? (
              <Text style={styles.kridi}>
                {t('sales.remaining')} : {formatMoney(remaining)}
              </Text>
            ) : null}

            <Text style={styles.label}>{t('sales.customer')}</Text>
            <View style={styles.chips}>
              <Chip
                label={t('sales.walkIn')}
                active={customerId === null}
                onPress={() => setCustomerId(null)}
              />
              {customers.map((c) => (
                <Chip
                  key={c.id}
                  label={c.name}
                  active={customerId === c.id}
                  onPress={() => setCustomerId(c.id)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{t('sales.success')}</Text> : null}

        {cart.length > 0 ? (
          <PrimaryButton title={t('sales.save')} onPress={submit} loading={saving} />
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  loader: { marginTop: spacing.xl },
  content: { padding: spacing.md, paddingBottom: spacing.xl, width: '100%', maxWidth: 560, alignSelf: 'center' },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  results: {
    marginTop: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  price: { fontSize: 15, fontWeight: '700', color: colors.primary },
  text: { color: colors.text, fontSize: 15 },
  muted: { color: colors.muted, fontSize: 13 },
  qty: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  qtyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { fontSize: 20, color: colors.primary, fontWeight: '700' },
  qtyValue: { fontSize: 16, fontWeight: '700', minWidth: 24, textAlign: 'center', color: colors.text },
  summary: { marginTop: spacing.md },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  totalLabel: { fontSize: 18, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 18, fontWeight: '800', color: colors.primary },
  kridi: {
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    padding: spacing.sm,
    borderRadius: radius,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
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
  error: {
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    padding: spacing.sm,
    borderRadius: radius,
    marginVertical: spacing.md,
  },
  success: {
    color: colors.success,
    backgroundColor: colors.successBg,
    padding: spacing.sm,
    borderRadius: radius,
    marginVertical: spacing.md,
    fontWeight: '700',
  },
});