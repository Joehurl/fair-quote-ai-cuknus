import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { CheckCircle, AlertCircle, HelpCircle, TrendingDown, X } from 'lucide-react-native';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { SavedQuote } from '@/utils/storage';

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
  fair: '#38A169',
  fairMuted: 'rgba(56, 161, 105, 0.12)',
  overpriced: '#E53E3E',
  overpricedMuted: 'rgba(229, 62, 62, 0.12)',
  uncertain: '#D69E2E',
  uncertainMuted: 'rgba(214, 158, 46, 0.12)',
};

function verdictConfig(verdict: SavedQuote['verdict']) {
  return {
    fair: { label: 'FAIR PRICE', color: COLORS.fair, bg: COLORS.fairMuted, Icon: CheckCircle },
    underpriced: { label: 'GOOD DEAL', color: COLORS.fair, bg: COLORS.fairMuted, Icon: TrendingDown },
    overpriced: { label: 'OVERPRICED', color: COLORS.overpriced, bg: COLORS.overpricedMuted, Icon: AlertCircle },
    uncertain: { label: 'UNCERTAIN', color: COLORS.uncertain, bg: COLORS.uncertainMuted, Icon: HelpCircle },
  }[verdict];
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function QuoteDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ quoteData: string }>();

  let quote: SavedQuote | null = null;
  try {
    quote = JSON.parse(params.quoteData ?? '{}') as SavedQuote;
  } catch {
    console.error('[QuoteDetail] Failed to parse quote data');
  }

  if (!quote || !quote.id) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }}>
        <Text style={{ color: COLORS.textSecondary }}>Quote not found</Text>
      </View>
    );
  }

  const config = verdictConfig(quote.verdict);
  const Icon = config.Icon;
  const rangeText = quote.estimatedLow > 0
    ? `$${quote.estimatedLow.toLocaleString()} – $${quote.estimatedHigh.toLocaleString()}`
    : 'Not available';
  const dateText = formatDate(quote.analyzedAt);
  const amountText = `$${Number(quote.amount).toLocaleString()}`;

  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'formSheet',
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.6, 1.0],
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        {/* Header */}
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
            Quote Details
          </Text>
          <AnimatedPressable
            onPress={() => {
              console.log('[QuoteDetail] Close pressed');
              router.back();
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
          {/* Verdict + Amount */}
          <View
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: COLORS.border,
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              gap: 12,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: config.bg,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                }}
              >
                <Icon size={13} color={config.color} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: config.color, letterSpacing: 0.8 }}>
                  {config.label}
                </Text>
              </View>
              <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.text }}>
                {amountText}
              </Text>
            </View>

            <View style={{ height: 1, backgroundColor: COLORS.divider }} />

            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: COLORS.textTertiary }}>Category</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text }}>{quote.category}</Text>
              </View>
              {quote.estimatedLow > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: COLORS.textTertiary }}>Typical range</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text }}>{rangeText}</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: COLORS.textTertiary }}>Confidence</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: config.color }}>{quote.confidence}%</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: COLORS.textTertiary }}>Analyzed</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text }}>{dateText}</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: COLORS.border,
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textTertiary, letterSpacing: 0.3 }}>
              DESCRIPTION
            </Text>
            <Text style={{ fontSize: 15, color: COLORS.text, lineHeight: 22 }}>
              {quote.description}
            </Text>
            {quote.location ? (
              <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>
                📍 {quote.location}
              </Text>
            ) : null}
            {quote.details ? (
              <Text style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 }}>
                {quote.details}
              </Text>
            ) : null}
          </View>

          {/* Analysis */}
          <View
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: COLORS.border,
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textTertiary, letterSpacing: 0.3 }}>
              ANALYSIS
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.textSecondary, lineHeight: 21 }}>
              {quote.explanation}
            </Text>
          </View>

          {/* Tips */}
          <View
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: COLORS.border,
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              gap: 10,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textTertiary, letterSpacing: 0.3 }}>
              TIPS
            </Text>
            {quote.tips.map((tip, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                <CheckCircle size={15} color={COLORS.primary} style={{ marginTop: 2 }} />
                <Text style={{ fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, flex: 1 }}>
                  {tip}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </>
  );
}
