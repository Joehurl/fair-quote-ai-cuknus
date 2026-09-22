import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Modal,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { ChevronRight, Info, Star, Trash2, X, CheckCircle, BarChart2, Shield, Crown, RefreshCw, XCircle, Copyright, ShieldCheck, MessageCircle } from 'lucide-react-native';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { clearAllQuotes } from '@/utils/storage';
import { getCredits } from '@/utils/creditsStorage';
import { useSubscription } from '@/contexts/SubscriptionContext';
import Constants from 'expo-constants';

const COLORS = {
  background: '#F0F4F8',
  surface: '#FFFFFF',
  surfaceSecondary: '#EDF2F7',
  text: '#1A202C',
  textSecondary: '#4A5568',
  textTertiary: '#A0AEC0',
  primary: '#2B6CB0',
  primaryMuted: 'rgba(43, 108, 176, 0.1)',
  border: 'rgba(0,0,0,0.06)',
  divider: 'rgba(0,0,0,0.04)',
  danger: '#E53E3E',
  dangerMuted: 'rgba(229, 62, 62, 0.08)',
  success: '#38A169',
  successMuted: 'rgba(56, 161, 105, 0.1)',
};

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  destructive,
  showChevron = true,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  showChevron?: boolean;
}) {
  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={!onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: destructive ? COLORS.dangerMuted : COLORS.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <Text
        style={{
          flex: 1,
          fontSize: 15,
          color: destructive ? COLORS.danger : COLORS.text,
          fontWeight: '500',
        }}
      >
        {label}
      </Text>
      {value ? (
        <Text style={{ fontSize: 14, color: COLORS.textTertiary }}>{value}</Text>
      ) : null}
      {showChevron && onPress ? (
        <ChevronRight size={16} color={COLORS.textTertiary} />
      ) : null}
    </AnimatedPressable>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 4 }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: COLORS.textTertiary,
          letterSpacing: 0.6,
          paddingHorizontal: 4,
          marginBottom: 4,
        }}
      >
        {title.toUpperCase()}
      </Text>
      <View
        style={{
          backgroundColor: COLORS.surface,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: COLORS.border,
          overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        {children}
      </View>
    </View>
  );
}

function Divider() {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: COLORS.divider,
        marginLeft: 60,
      }}
    />
  );
}

function HowItWorksModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 12,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>
            How It Works
          </Text>
          <AnimatedPressable
            onPress={() => {
              console.log('[Settings] How It Works modal closed');
              onClose();
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: COLORS.surfaceSecondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} color={COLORS.textSecondary} />
          </AnimatedPressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {[
            {
              step: '1',
              title: 'Describe your quote',
              body: 'Enter what service or product you received a quote for, along with the quoted price and your location.',
            },
            {
              step: '2',
              title: 'Heuristic analysis',
              body: 'FairQuote AI uses a built-in database of national average prices for common services — plumbing, electrical, HVAC, painting, auto repair, and more.',
            },
            {
              step: '3',
              title: 'Location adjustment',
              body: 'Prices are adjusted based on your location. High cost-of-living cities like New York or San Francisco typically run 20–30% higher than national averages.',
            },
            {
              step: '4',
              title: 'Verdict & tips',
              body: 'You receive a verdict (Fair, Overpriced, Good Deal, or Uncertain) along with a confidence score and actionable tips to help you negotiate or verify the quote.',
            },
          ].map((item) => (
            <View
              key={item.step}
              style={{
                backgroundColor: COLORS.surface,
                borderRadius: 14,
                padding: 16,
                borderWidth: 1,
                borderColor: COLORS.border,
                flexDirection: 'row',
                gap: 14,
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: COLORS.primaryMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.primary }}>
                  {item.step}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.text }}>
                  {item.title}
                </Text>
                <Text style={{ fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 }}>
                  {item.body}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

function ClearHistoryModal({ visible, onConfirm, onCancel }: { visible: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 340,
            gap: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}
        >
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>
              Clear all history?
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 }}>
              This will permanently delete all your saved quotes. This action cannot be undone.
            </Text>
          </View>
          <View style={{ gap: 10 }}>
            <AnimatedPressable
              onPress={() => {
                console.log('[Settings] Clear history confirmed');
                onConfirm();
              }}
              style={{
                backgroundColor: COLORS.danger,
                borderRadius: 12,
                height: 48,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
                Delete all history
              </Text>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={() => {
                console.log('[Settings] Clear history cancelled');
                onCancel();
              }}
              style={{
                backgroundColor: COLORS.surfaceSecondary,
                borderRadius: 12,
                height: 48,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: COLORS.text, fontSize: 15, fontWeight: '600' }}>
                Cancel
              </Text>
            </AnimatedPressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function SettingsScreen() {
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [credits, setCredits] = useState(0);

  const { isSubscribed, restorePurchases } = useSubscription();
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  useEffect(() => {
    console.log('[Settings] Loading credits on mount');
    getCredits().then((c) => {
      console.log('[Settings] Credits loaded:', c);
      setCredits(c);
    });
  }, []);

  const storeSubscriptionUrl =
    Platform.OS === 'ios'
      ? 'https://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions?sku=fairquote_monthly&package=com.fairquoteai.app';

  const handlePrivacyPolicy = () => {
    console.log('[Settings] Privacy Policy pressed');
    Linking.openURL('https://www.freeprivacypolicy.com/live/8131ee49-0d98-4da3-8251-f90b129ff81b').catch(() => {
      console.log('[Settings] Could not open privacy policy URL');
    });
  };

  const handleRateApp = () => {
    console.log('[Settings] Rate app pressed');
    const url = Platform.OS === 'ios'
      ? 'itms-apps://itunes.apple.com/app/id6810721327?action=write-review'
      : 'https://play.google.com/store/apps/details?id=com.fairquoteai';
    Linking.openURL(url).catch(() => {
      console.log('[Settings] Could not open app store URL');
    });
  };

  const handleClearHistory = async () => {
    await clearAllQuotes();
    setCleared(true);
    setShowClearConfirm(false);
    setTimeout(() => setCleared(false), 3000);
  };

  const handleManageSubscription = () => {
    console.log('[Settings] Manage Subscription pressed');
    Linking.openURL(storeSubscriptionUrl).catch(() => {
      console.log('[Settings] Could not open subscription management URL');
    });
  };

  const handleCancelSubscription = () => {
    console.log('[Settings] Cancel Subscription pressed');
    Alert.alert(
      'Cancel Subscription',
      "To cancel, you'll be taken to your store's subscription management page. Cancel there to stop future charges.",
      [
        {
          text: 'Open Store',
          onPress: () => {
            console.log('[Settings] Cancel subscription — opening store');
            Linking.openURL(storeSubscriptionUrl).catch(() => {
              console.log('[Settings] Could not open store for cancellation');
            });
          },
        },
        {
          text: 'Not Now',
          style: 'cancel',
          onPress: () => {
            console.log('[Settings] Cancel subscription dismissed');
          },
        },
      ]
    );
  };

  const handleRestorePurchases = async () => {
    console.log('[Settings] Restore Purchases pressed');
    try {
      const restored = await restorePurchases();
      if (restored) {
        console.log('[Settings] Purchases restored successfully');
        Alert.alert('Restored!', 'Your subscription has been restored.');
      } else {
        console.log('[Settings] No purchases found to restore');
        Alert.alert('No Purchases Found', "We couldn't find any previous purchases to restore.");
      }
    } catch (error: any) {
      console.error('[Settings] Restore failed:', error);
      Alert.alert('Restore Failed', error.message || 'Please try again.');
    }
  };

  // Subscription status display
  const subscriptionStatusLabel = isSubscribed
    ? 'Pro — Active'
    : credits > 0
    ? `${credits} credit${credits === 1 ? '' : 's'} remaining`
    : 'Free — No active plan';

  const subscriptionStatusColor = isSubscribed
    ? COLORS.success
    : credits > 0
    ? COLORS.primary
    : COLORS.textTertiary;

  const subscriptionStatusBg = isSubscribed
    ? COLORS.successMuted
    : credits > 0
    ? COLORS.primaryMuted
    : 'rgba(0,0,0,0.04)';

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 120,
          paddingTop: 8,
          gap: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Subscription */}
        <SectionCard title="Subscription">
          {/* Status row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
              gap: 12,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: subscriptionStatusBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Crown size={16} color={subscriptionStatusColor} />
            </View>
            <Text style={{ flex: 1, fontSize: 15, color: subscriptionStatusColor, fontWeight: '600' }}>
              {subscriptionStatusLabel}
            </Text>
          </View>

          <Divider />

          <SettingsRow
            icon={<RefreshCw size={16} color={COLORS.primary} />}
            label="Manage Subscription"
            onPress={handleManageSubscription}
          />

          <Divider />

          <SettingsRow
            icon={<RefreshCw size={16} color={COLORS.primary} />}
            label="Restore Purchases"
            onPress={handleRestorePurchases}
          />

          <Divider />

          <SettingsRow
            icon={<XCircle size={16} color={COLORS.danger} />}
            label="Cancel Subscription"
            onPress={handleCancelSubscription}
            destructive
          />
        </SectionCard>

        {/* About */}
        <SectionCard title="About">
          <SettingsRow
            icon={<Info size={16} color={COLORS.primary} />}
            label="App version"
            value={appVersion}
            showChevron={false}
          />
          <Divider />
          <SettingsRow
            icon={<BarChart2 size={16} color={COLORS.primary} />}
            label="How it works"
            onPress={() => {
              console.log('[Settings] How it works pressed');
              setShowHowItWorks(true);
            }}
          />
          <Divider />
          <SettingsRow
            icon={<Shield size={16} color={COLORS.primary} />}
            label="Privacy Policy"
            onPress={handlePrivacyPolicy}
          />
          <Divider />
          <SettingsRow
            icon={<MessageCircle size={16} color={COLORS.primary} />}
            label="Contact Support"
            onPress={() => {
              console.log('[Settings] Contact Support pressed');
              Linking.openURL('https://forms.gle/support').catch(() => {
                console.log('[Settings] Could not open support URL');
              });
            }}
          />
          <Divider />
          <SettingsRow
            icon={<Copyright size={16} color={COLORS.primary} />}
            label="Copyright"
            value="© 2025 Joseph Hurley"
            showChevron={false}
            onPress={() => {
              console.log('[Settings] Copyright pressed');
              Alert.alert('Copyright', '© 2025 Joseph Hurley. All rights reserved.');
            }}
          />
          <Divider />
          <SettingsRow
            icon={<ShieldCheck size={16} color={COLORS.primary} />}
            label="No Harmful Content"
            onPress={() => {
              console.log('[Settings] No Harmful Content pressed');
              Alert.alert(
                'No Harmful Content',
                'FairQuote AI does not contain any of the following:\n\n• No hate speech or discriminatory content\n• No violent, graphic, or disturbing content\n• No adult or sexually explicit content\n• No content targeting or harmful to minors\n• No misleading, deceptive, or fraudulent content\n• No malware, spyware, or malicious code\n• No unauthorized data collection or privacy violations\n• No content that promotes illegal activity\n\nThis app is a consumer tool designed solely to help users evaluate whether service quotes are fair based on market data.'
              );
            }}
          />
          <Divider />
          <SettingsRow
            icon={<Star size={16} color={COLORS.primary} />}
            label="Rate the app"
            onPress={handleRateApp}
          />
        </SectionCard>

        {/* Data */}
        <SectionCard title="Data">
          {cleared ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 14,
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: 'rgba(56, 161, 105, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle size={16} color="#38A169" />
              </View>
              <Text style={{ fontSize: 15, color: '#38A169', fontWeight: '500' }}>
                History cleared
              </Text>
            </View>
          ) : (
            <SettingsRow
              icon={<Trash2 size={16} color={COLORS.danger} />}
              label="Clear all history"
              onPress={() => {
                console.log('[Settings] Clear all history pressed');
                setShowClearConfirm(true);
              }}
              destructive
            />
          )}
        </SectionCard>

        {/* Disclaimer */}
        <View
          style={{
            backgroundColor: COLORS.primaryMuted,
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(43, 108, 176, 0.15)',
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.primary, letterSpacing: 0.5, marginBottom: 6 }}>
            DISCLAIMER
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 }}>
            FairQuote AI provides estimates based on national averages. Prices vary by location, contractor experience, and market conditions. Always get multiple quotes.
          </Text>
        </View>
      </ScrollView>

      <HowItWorksModal
        visible={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
      />
      <ClearHistoryModal
        visible={showClearConfirm}
        onConfirm={handleClearHistory}
        onCancel={() => setShowClearConfirm(false)}
      />
    </View>
  );
}
