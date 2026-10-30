import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import DashboardScreen from '../screens/DashboardScreen';
import { colors } from '../theme';
import CustomersStack from './CustomersStack';
import ProductsStack from './ProductsStack';
import PurchasesStack from './PurchasesStack';
import ReportsStack from './ReportsStack';
import SalesStack from './SalesStack';

const Tab = createBottomTabNavigator();

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabDef {
  name: string;
  component: React.ComponentType<any>;
  labelKey: string;
  labelFr: string;
  labelAr: string;
  icon: IconName;
  iconActive: IconName;
}

// Ordre fixe, de gauche à droite : Accueil ... Rapports
const TABS: TabDef[] = [
  { name: 'Home', component: DashboardScreen, labelKey: 'tabs.home', labelFr: 'Accueil', labelAr: 'الرئيسية', icon: 'home-outline', iconActive: 'home' },
  { name: 'Sales', component: SalesStack, labelKey: 'tabs.sales', labelFr: 'Vente', labelAr: 'البيع', icon: 'cart-outline', iconActive: 'cart' },
  { name: 'Products', component: ProductsStack, labelKey: 'tabs.products', labelFr: 'Produits', labelAr: 'المنتجات', icon: 'cube-outline', iconActive: 'cube' },
  { name: 'Customers', component: CustomersStack, labelKey: 'tabs.customers', labelFr: 'Clients', labelAr: 'الزبناء', icon: 'people-outline', iconActive: 'people' },
  { name: 'Purchases', component: PurchasesStack, labelKey: 'tabs.purchases', labelFr: 'Achats', labelAr: 'المشتريات', icon: 'receipt-outline', iconActive: 'receipt' },
  { name: 'ReportsTab', component: ReportsStack, labelKey: 'tabs.reports', labelFr: 'Rapports', labelAr: 'التقارير', icon: 'stats-chart-outline', iconActive: 'stats-chart' },
];

export default function AppTabs() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const isAr = !!i18n.language && i18n.language.startsWith('ar');

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          direction: 'ltr', // ordre identique en français et en arabe
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 58 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 6,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            title: t(tab.labelKey, { defaultValue: isAr ? tab.labelAr : tab.labelFr }),
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? tab.iconActive : tab.icon} color={color} size={size + 2} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}