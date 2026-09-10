import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  CheckCircle,
  AlertCircle,
  HelpCircle,
  TrendingDown,
  BarChart2,
  Percent,
  Tag,
} from 'lucide-react-native';
import { loadQuotes, SavedQuote } from '@/utils/storage';

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
  fair: '#38A169',
  fairMuted: 'rgba(56, 161, 105, 0.12)',
  overpriced: '#E53E3E',
  overpricedMuted: 'rgba(229, 62, 62, 0.12)',
  uncertain: '#D69E2E',
  uncertainMuted: 'rgba(214, 158, 46, 0.12)',
};

const SERVICE_CATEGORIES = [
  'Plumbing', 'Electrical', 'HVAC', 'Painting', 'Roofing',
  'Auto', 'Flooring', 'Cleaning', 'Moving', 'Pest Control',
  'Tree', 'Fence', 'Deck', 'Drywall', 'Tile', 'Landscaping', 'Windows',
];

function verdictConfig(verdict: SavedQuote['verdict']) {
  return {
    fair: { label: 'Fair Price', color: COLORS.fair, bg: COLORS.fairMuted, Icon: CheckCircle },
    underpriced: { label: 'Good Deal', color: COLORS.fair, bg: COLORS.fairMuted, Icon: TrendingDown },
    overpriced: { label: 'Overpriced', color: COLORS.overpriced, bg: COLORS.overpricedMuted, Icon: AlertCircle },
    uncertain: { label: 'Uncertain', color: COLORS.uncertain, bg: COLORS.uncertainMuted, Icon: HelpCircle },
  }[verdict];
}

function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function computeStats(quotes: SavedQuote[]) {
  const total = quotes.length;
  if (total === 0) {
    return { total: 0, fairPercent: 0, topCategory: '—' };
  }
  const fairCount = quotes.filter((q) => q.verdict === 'fair' || q.verdict === 'underpriced').length;
  const fairPercent = Math.round((fairCount / total) * 100);

  const catCounts: Record<string, number> = {};
  for (const q of quotes) {
    const cat = q.category || 'Unknown';
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  }
  const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  return { total, fairPercent, topCategory };
}

export default function HomeScreen() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      console.log('[HomeScreen] Screen focused — reloading quotes');
      setLoading(true);
      loadQuotes().then((q) => {
        console.log('[HomeScreen] Loaded', q.length, 'quotes');
        setQuotes(q);
        setLoading(false);
      });
    }, [])
  );

  const recentQuotes = quotes.slice(0, 3);
  const stats = computeStats(quotes);

  const handleAnalyzeCTA = () => {
    console.log('[HomeScreen] Analyze a Quote CTA pressed');
    router.push('/(tabs)/(analyze)');
  };

  const handleQuotePress = (quote: SavedQuote) => {
    console.log('[HomeScreen] Recent quote pressed:', quote.id);
    router.push({
      pathname: '/quote-detail',
      params: { quoteId: quote.id, quoteData: JSON.stringify(quote) },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 120,
          paddingTop: 8,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            backgroundColor: COLORS.primary,
            borderRadius: 20,
            padding: 24,
            gap: 6,
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 }}>
            FairQuote AI
          </Text>
          <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: '400' }}>
            Know before you pay.
          </Text>
          <TouchableOpacity
            onPress={handleAnalyzeCTA}
            style={{
              marginTop: 12,
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              height: 48,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.85}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.primary }}>
              Analyze a Quote
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={{ gap: 8 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: COLORS.textTertiary,
              letterSpacing: 0.6,
              paddingHorizontal: 4,
            }}
          >
            QUICK STATS
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {/* Total */}
            <View
              style={{
                flex: 1,
                backgroundColor: COLORS.surface,
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: COLORS.border,
                alignItems: 'center',
                gap: 6,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: COLORS.primaryMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BarChart2 size={18} color={COLORS.primary} />
              </View>
              <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text }}>
                {stats.total}
              </Text>
              <Text style={{ fontSize: 11, color: COLORS.textTertiary, textAlign: 'center' }}>
                Analyses
              </Text>
            </View>

            {/* Fair % */}
            <View
              style={{
                flex: 1,
                backgroundColor: COLORS.surface,
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: COLORS.border,
                alignItems: 'center',
                gap: 6,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: COLORS.fairMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Percent size={18} color={COLORS.fair} />
              </View>
              <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text }}>
                {stats.fairPercent}
                <Text style={{ fontSize: 14, fontWeight: '600' }}>%</Text>
              </Text>
              <Text style={{ fontSize: 11, color: COLORS.textTertiary, textAlign: 'center' }}>
                Fair Price
              </Text>
            </View>

            {/* Top Category */}
            <View
              style={{
                flex: 1,
                backgroundColor: COLORS.surface,
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: COLORS.border,
                alignItems: 'center',
                gap: 6,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: COLORS.uncertainMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Tag size={18} color={COLORS.uncertain} />
              </View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '800',
                  color: COLORS.text,
                  textAlign: 'center',
                  numberOfLines: 2,
                } as any}
                numberOfLines={2}
              >
                {stats.topCategory}
              </Text>
              <Text style={{ fontSize: 11, color: COLORS.textTertiary, textAlign: 'center' }}>
                Top Category
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Quotes */}
        <View style={{ gap: 8 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: COLORS.textTertiary,
              letterSpacing: 0.6,
              paddingHorizontal: 4,
            }}
          >
            RECENT QUOTES
          </Text>

          {loading ? (
            <View
              style={{
                backgroundColor: COLORS.surface,
                borderRadius: 14,
                padding: 24,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : recentQuotes.length === 0 ? (
            <View
              style={{
                backgroundColor: COLORS.surface,
                borderRadius: 14,
                padding: 28,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: COLORS.border,
                gap: 8,
              }}
            >
              <Text style={{ fontSize: 32 }}>📋</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.text }}>
                No quotes yet
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: COLORS.textSecondary,
                  textAlign: 'center',
                  lineHeight: 19,
                }}
              >
                Tap "Analyze a Quote" above to get started
              </Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {recentQuotes.map((quote) => {
                const config = verdictConfig(quote.verdict);
                const Icon = config.Icon;
                const dateText = formatRelativeDate(quote.analyzedAt);
                const amountText = `$${Number(quote.amount).toLocaleString()}`;
                return (
                  <TouchableOpacity
                    key={quote.id}
                    onPress={() => handleQuotePress(quote)}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: COLORS.surface,
                      borderRadius: 14,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        backgroundColor: config.bg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={18} color={config.color} />
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text
                        style={{ fontSize: 14, fontWeight: '600', color: COLORS.text }}
                        numberOfLines={1}
                      >
                        {quote.description}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View
                          style={{
                            backgroundColor: config.bg,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 5,
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: '600', color: config.color }}>
                            {config.label}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 11, color: COLORS.textTertiary }}>
                          {dateText}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }}>
                      {amountText}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Covered Services */}
        <View style={{ gap: 8 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: COLORS.textTertiary,
              letterSpacing: 0.6,
              paddingHorizontal: 4,
            }}
          >
            COVERED SERVICES
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
          >
            {SERVICE_CATEGORIES.map((cat) => (
              <View
                key={cat}
                style={{
                  backgroundColor: COLORS.surface,
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.textSecondary }}>
                  {cat}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}
