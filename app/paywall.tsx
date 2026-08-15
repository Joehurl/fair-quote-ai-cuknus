/**
 * FairQuote AI Paywall Screen
 *
 * Presented as a formSheet modal when a user tries to analyze a quote
 * without an active subscription or credits.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PurchasesPackage } from 'react-native-purchases';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { addCredits } from '@/utils/creditsStorage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  primary: '#2B6CB0',
  primaryDark: '#1A4A8A',
  primaryLight: 'rgba(43, 108, 176, 0.12)',
  accent: '#38A169',
  accentLight: 'rgba(56, 161, 105, 0.12)',
  background: '#F0F4F8',
  surface: '#FFFFFF',
  text: '#1A202C',
  textSecondary: '#4A5568',
  textTertiary: '#718096',
  border: 'rgba(0,0,0,0.08)',
  bestValue: '#D69E2E',
  bestValueBg: 'rgba(214, 158, 46, 0.12)',
  danger: '#E53E3E',
};

const FEATURES = [
  { icon: '✓', label: 'Unlimited quote analysis' },
  { icon: '✓', label: 'Save & track your history' },
  { icon: '✓', label: 'Location-adjusted pricing' },
  { icon: '✓', label: 'Expert tips on every quote' },
];

// Static plan definitions — prices shown while RC packages load
const PLAN_DEFS = [
  {
    key: 'consumable',
    title: 'Single Analysis',
    price: '$2.00',
    period: 'one-time',
    subtitle: 'Pay per use',
    badge: null,
    rcIdentifier: '$rc_consumable',
  },
  {
    key: 'monthly',
    title: 'Monthly',
    price: '$1.99',
    period: '/month',
    subtitle: 'Billed monthly, cancel anytime',
    badge: null,
    rcIdentifier: '$rc_monthly',
  },
  {
    key: 'annual',
    title: 'Annual',
    price: '$20.00',
    period: '/year',
    subtitle: '$1.67/month',
    badge: 'Best Value',
    rcIdentifier: '$rc_annual',
  },
];

function FeatureRow({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureCheck}>
        <Text style={styles.featureCheckText}>{icon}</Text>
      </View>
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
  );
}

interface PlanCardProps {
  planKey: string;
  title: string;
  price: string;
  period: string;
  subtitle: string;
  badge: string | null;
  isSelected: boolean;
  onSelect: () => void;
}

function PlanCard({
  planKey,
  title,
  price,
  period,
  subtitle,
  badge,
  isSelected,
  onSelect,
}: PlanCardProps) {
  const isAnnual = planKey === 'annual';
  const borderColor = isSelected ? COLORS.primary : COLORS.border;
  const bgColor = isSelected ? COLORS.primaryLight : COLORS.surface;

  return (
    <AnimatedPressable
      onPress={() => {
        console.log('[Paywall] Plan selected:', planKey);
        onSelect();
      }}
      style={[
        styles.planCard,
        { borderColor, backgroundColor: bgColor },
        isSelected && styles.planCardSelected,
      ]}
    >
      {/* Best Value badge */}
      {badge && (
        <View style={styles.bestValueBadge}>
          <Text style={styles.bestValueText}>{badge}</Text>
        </View>
      )}

      <View style={styles.planCardInner}>
        {/* Left: title + subtitle */}
        <View style={styles.planInfo}>
          <Text style={[styles.planTitle, isSelected && { color: COLORS.primary }]}>
            {title}
          </Text>
          <Text style={styles.planSubtitle}>{subtitle}</Text>
        </View>

        {/* Right: price + radio */}
        <View style={styles.planRight}>
          <View style={styles.planPriceRow}>
            <Text style={[styles.planPrice, isSelected && { color: COLORS.primary }]}>
              {price}
            </Text>
            <Text style={styles.planPeriod}>{period}</Text>
          </View>
          <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
            {isSelected && <View style={styles.radioInner} />}
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

export default function PaywallScreen() {
  const router = useRouter();
  const {
    packages,
    loading,
    isSubscribed,
    isWeb,
    purchasePackage,
    restorePurchases,
    mockWebPurchase,
    mockNativePurchase,
  } = useSubscription();

  const [selectedKey, setSelectedKey] = useState<string>('annual');
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Fade-in animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleClose = () => {
    console.log('[Paywall] Dismissed via X button');
    router.back();
  };

  // Find the matching RC package for the selected plan
  const findPackage = (): PurchasesPackage | null => {
    if (!packages.length) return null;
    const def = PLAN_DEFS.find((p) => p.key === selectedKey);
    if (!def) return null;
    // Try to match by identifier or product type
    const match = packages.find(
      (pkg) =>
        pkg.identifier === def.rcIdentifier ||
        pkg.identifier.toLowerCase().includes(def.key) ||
        (def.key === 'monthly' && pkg.identifier.includes('monthly')) ||
        (def.key === 'annual' && (pkg.identifier.includes('annual') || pkg.identifier.includes('yearly'))) ||
        (def.key === 'consumable' && pkg.identifier.includes('consumable'))
    );
    return match || packages[0] || null;
  };

  const handleContinue = async () => {
    console.log('[Paywall] Continue pressed, selected plan:', selectedKey);

    if (isWeb) {
      console.log('[Paywall] Web: simulating purchase');
      mockWebPurchase();
      if (selectedKey === 'consumable') {
        await addCredits(1);
        console.log('[Paywall] Web: added 1 credit');
      }
      router.replace('/(tabs)/(analyze)');
      return;
    }

    const pkg = findPackage();

    if (!pkg) {
      // No RC packages loaded — dev mode simulation
      if (__DEV__) {
        console.log('[Paywall] DEV: simulating purchase for plan:', selectedKey);
        if (selectedKey === 'consumable') {
          await addCredits(1);
          console.log('[Paywall] DEV: added 1 credit');
          Alert.alert('Credit Added', '1 analysis credit added.', [
            { text: 'OK', onPress: () => router.replace('/(tabs)/(analyze)') },
          ]);
        } else {
          await mockNativePurchase();
          router.replace('/(tabs)/(analyze)');
        }
        return;
      }
      Alert.alert('Not Available', 'Purchases are not available right now. Please try again later.');
      return;
    }

    try {
      setPurchasing(true);
      console.log('[Paywall] Initiating purchase for package:', pkg.identifier);
      const success = await purchasePackage(pkg);
      if (success) {
        console.log('[Paywall] Purchase successful for:', pkg.identifier);
        if (selectedKey === 'consumable') {
          await addCredits(1);
          console.log('[Paywall] Added 1 credit after consumable purchase');
          Alert.alert('Credit Added!', 'You have 1 analysis credit ready to use.', [
            { text: "Let's Go!", onPress: () => router.replace('/(tabs)/(analyze)') },
          ]);
        } else {
          Alert.alert('Welcome to Pro!', 'You now have unlimited access to FairQuote AI.', [
            { text: "Let's Go!", onPress: () => router.replace('/(tabs)/(analyze)') },
          ]);
        }
      }
    } catch (error: any) {
      console.error('[Paywall] Purchase failed:', error);
      Alert.alert('Purchase Failed', error.message || 'Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    console.log('[Paywall] Restore Purchases tapped');
    try {
      setRestoring(true);
      const restored = await restorePurchases();
      if (restored) {
        console.log('[Paywall] Purchases restored successfully');
        Alert.alert('Restored!', 'Your subscription has been restored.', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/(analyze)') },
        ]);
      } else {
        console.log('[Paywall] No purchases found to restore');
        Alert.alert('No Purchases Found', "We couldn't find any previous purchases to restore.");
      }
    } catch (error: any) {
      console.error('[Paywall] Restore failed:', error);
      Alert.alert('Restore Failed', error.message || 'Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  // Get live price from RC packages if available
  const getLivePrice = (planKey: string): string | null => {
    if (!packages.length) return null;
    const def = PLAN_DEFS.find((p) => p.key === planKey);
    if (!def) return null;
    const pkg = packages.find(
      (p) =>
        p.identifier === def.rcIdentifier ||
        p.identifier.toLowerCase().includes(planKey) ||
        (planKey === 'annual' && (p.identifier.includes('annual') || p.identifier.includes('yearly')))
    );
    return pkg?.product?.priceString || null;
  };

  const selectedPlan = PLAN_DEFS.find((p) => p.key === selectedKey)!;
  const livePrice = getLivePrice(selectedKey);
  const displayPrice = livePrice || selectedPlan.price;
  const continueLabel = purchasing
    ? 'Processing...'
    : selectedKey === 'consumable'
    ? `Get 1 Analysis — ${displayPrice}`
    : `Start Pro — ${displayPrice}${selectedPlan.period}`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Close button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleClose}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.animatedContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header */}
          <View style={styles.header}>
            {/* App icon area */}
            <View style={styles.iconContainer}>
              <Text style={styles.iconEmoji}>⚖️</Text>
            </View>
            <Text style={styles.title}>Unlock FairQuote AI</Text>
            <Text style={styles.subtitle}>Get fair price analysis instantly</Text>
          </View>

          {/* Feature list */}
          <View style={styles.featuresCard}>
            {FEATURES.map((f, i) => (
              <FeatureRow key={i} icon={f.icon} label={f.label} />
            ))}
          </View>

          {/* Plan cards */}
          <View style={styles.plansContainer}>
            {PLAN_DEFS.map((plan) => {
              const live = getLivePrice(plan.key);
              const price = live || plan.price;
              return (
                <PlanCard
                  key={plan.key}
                  planKey={plan.key}
                  title={plan.title}
                  price={price}
                  period={plan.period}
                  subtitle={plan.subtitle}
                  badge={plan.badge}
                  isSelected={selectedKey === plan.key}
                  onSelect={() => setSelectedKey(plan.key)}
                />
              );
            })}
          </View>

          {/* No packages notice (Expo Go) */}
          {!isWeb && packages.length === 0 && !loading && (
            <View style={styles.noPackagesNote}>
              <Text style={styles.noPackagesText}>
                Live pricing requires a dev or production build.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom actions */}
        <View style={styles.bottomActions}>
          {/* Continue button */}
          <AnimatedPressable
            onPress={handleContinue}
            disabled={purchasing}
            style={[styles.continueButton, purchasing && styles.buttonDisabled]}
          >
            {purchasing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.continueButtonText}>{continueLabel}</Text>
            )}
          </AnimatedPressable>

          {/* Restore */}
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={restoring}
          >
            {restoring ? (
              <ActivityIndicator color={COLORS.textTertiary} size="small" />
            ) : (
              <Text style={styles.restoreText}>Restore Purchases</Text>
            )}
          </TouchableOpacity>

          {/* Legal */}
          <Text style={styles.legalText}>
            No hassle cancellation · Secure payment via{' '}
            {Platform.OS === 'ios' ? 'Apple' : 'Google'}
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  closeButton: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  animatedContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 20,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: 8,
    gap: 8,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(43, 108, 176, 0.2)',
  },
  iconEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Features card
  featuresCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCheckText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
  },
  featureLabel: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },

  // Plans
  plansContainer: {
    gap: 10,
  },
  planCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'visible',
  },
  planCardSelected: {
    shadowColor: COLORS.primary,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  planCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planInfo: {
    flex: 1,
    gap: 2,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  planSubtitle: {
    fontSize: 13,
    color: COLORS.textTertiary,
  },
  planRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  planPeriod: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    right: 14,
    backgroundColor: COLORS.bestValue,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 1,
  },
  bestValueText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // No packages
  noPackagesNote: {
    backgroundColor: 'rgba(214, 158, 46, 0.1)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(214, 158, 46, 0.25)',
  },
  noPackagesText: {
    fontSize: 13,
    color: '#92400E',
    textAlign: 'center',
  },

  // Bottom actions
  bottomActions: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  restoreText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    textDecorationLine: 'underline',
  },
  legalText: {
    fontSize: 11,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
