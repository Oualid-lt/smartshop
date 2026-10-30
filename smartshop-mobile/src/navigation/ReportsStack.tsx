import React from 'react';
import { Pressable } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import ExpenseFormScreen from '../screens/ExpenseFormScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import HomeScreen from '../screens/HomeScreen';
import ReportsScreen from '../screens/ReportsScreen';
import { colors } from '../theme';
import type { ReportsStackParamList } from './types';

const Stack = createNativeStackNavigator<ReportsStackParamList>();

export default function ReportsStack() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Reports"
        component={ReportsScreen}
        options={({ navigation }) => ({
          title: t('tabs.reports'),
          headerRight: () => (
            <Pressable onPress={() => navigation.navigate('Settings')} hitSlop={10}>
              <Ionicons name="settings-outline" size={24} color={colors.text} />
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{ title: t('expenses.title') }}
      />
      <Stack.Screen
        name="ExpenseForm"
        component={ExpenseFormScreen}
        options={{ title: t('expenses.newTitle') }}
      />
      <Stack.Screen
        name="Settings"
        component={HomeScreen}
        options={{ title: t('tabs.settings') }}
      />
    </Stack.Navigator>
  );
}