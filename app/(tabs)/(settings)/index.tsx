import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import { ChevronRight, Info, Star, Trash2, X, CheckCircle, BarChart2 } from 'lucide-react-native';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { clearAllQuotes } from '@/utils/storage';
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

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const handleRateApp = () => {
    console.log('[Settings] Rate app pressed');
    const url = Platform.OS === 'ios'
      ? 'https://apps.apple.com/app/id0000000000'
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
