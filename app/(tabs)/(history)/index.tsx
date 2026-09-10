import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Animated,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Clock, Trash2, CheckCircle, AlertCircle, HelpCircle, TrendingDown, ClipboardList, ArrowUpDown } from 'lucide-react-native';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { loadQuotes, deleteQuote, SavedQuote } from '@/utils/storage';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COLORS = {
  background: '#F0F4F8',
  surface: '#FFFFFF',
  surfaceSecondary: '#EDF2F7',
  text: '#1A202C',
  textSecondary: '#4A5568',
  textTertiary: '#A0AEC0',
  primary: '#2B6CB0',
  primaryMuted: 'rgba(43, 108, 176, 0.1)',
  accent: '#38A169',
  warning: '#D69E2E',
  danger: '#E53E3E',
  border: 'rgba(0,0,0,0.06)',
  divider: 'rgba(0,0,0,0.04)',
  fair: '#38A169',
  fairMuted: 'rgba(56, 161, 105, 0.12)',
  overpriced: '#E53E3E',
  overpricedMuted: 'rgba(229, 62, 62, 0.12)',
  uncertain: '#D69E2E',
  uncertainMuted: 'rgba(214, 158, 46, 0.12)',
};

type FilterKey = 'All' | 'Fair' | 'Overpriced' | 'Good Deal' | 'Uncertain';
type SortOrder = 'newest' | 'oldest';

const FILTER_OPTIONS: FilterKey[] = ['All', 'Fair', 'Overpriced', 'Good Deal', 'Uncertain'];

function verdictConfig(verdict: SavedQuote['verdict']) {
  return {
    fair: { label: 'Fair Price', color: COLORS.fair, bg: COLORS.fairMuted, Icon: CheckCircle },
    underpriced: { label: 'Good Deal', color: COLORS.fair, bg: COLORS.fairMuted, Icon: TrendingDown },
    overpriced: { label: 'Overpriced', color: COLORS.overpriced, bg: COLORS.overpricedMuted, Icon: AlertCircle },
    uncertain: { label: 'Uncertain', color: COLORS.uncertain, bg: COLORS.uncertainMuted, Icon: HelpCircle },
  }[verdict];
}

function matchesFilter(quote: SavedQuote, filter: FilterKey): boolean {
  if (filter === 'All') return true;
  if (filter === 'Fair') return quote.verdict === 'fair';
  if (filter === 'Overpriced') return quote.verdict === 'overpriced';
  if (filter === 'Good Deal') return quote.verdict === 'underpriced';
  if (filter === 'Uncertain') return quote.verdict === 'uncertain';
  return true;
}

function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function AnimatedListItem({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

function UndoToast({ onUndo, onDismiss }: { onUndo: () => void; onDismiss: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: true }),
      ]).start(() => onDismiss());
    }, 3500);

    return () => clearTimeout(timer);
  }, [opacity, translateY, onDismiss]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 100,
        left: 16,
        right: 16,
        opacity,
        transform: [{ translateY }],
        zIndex: 100,
      }}
    >
      <View
        style={{
          backgroundColor: COLORS.text,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500' }}>
          Quote deleted
        </Text>
        <TouchableOpacity onPress={() => {
          console.log('[HistoryScreen] Undo delete pressed');
          onUndo();
        }}>
          <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: '700' }}>
            Undo
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [pendingDelete, setPendingDelete] = useState<SavedQuote | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  useFocusEffect(
    useCallback(() => {
      console.log('[HistoryScreen] Screen focused — loading quotes');
      loadQuotes().then(setQuotes);
    }, [])
  );

  const handleDelete = useCallback((quote: SavedQuote) => {
    console.log('[HistoryScreen] Delete pressed for quote:', quote.id);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setQuotes((prev) => prev.filter((q) => q.id !== quote.id));
    setPendingDelete(quote);
    setShowToast(true);
    deleteQuote(quote.id);
  }, []);

  const handleUndo = useCallback(() => {
    if (!pendingDelete) return;
    console.log('[HistoryScreen] Undo delete for quote:', pendingDelete.id);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setQuotes((prev) => [pendingDelete, ...prev]);
    // Re-save the quote
    import('@/utils/storage').then(({ saveQuote }) => saveQuote(pendingDelete));
    setPendingDelete(null);
    setShowToast(false);
  }, [pendingDelete]);

  const handleToastDismiss = useCallback(() => {
    setShowToast(false);
    setPendingDelete(null);
  }, []);

  const handleItemPress = useCallback((quote: SavedQuote) => {
    console.log('[HistoryScreen] Quote item pressed:', quote.id);
    router.push({
      pathname: '/quote-detail',
      params: { quoteId: quote.id, quoteData: JSON.stringify(quote) },
    });
  }, [router]);

  const handleFilterPress = useCallback((filter: FilterKey) => {
    console.log('[HistoryScreen] Filter pressed:', filter);
    setActiveFilter(filter);
  }, []);

  const handleSortToggle = useCallback(() => {
    setSortOrder((prev) => {
      const next = prev === 'newest' ? 'oldest' : 'newest';
      console.log('[HistoryScreen] Sort order toggled to:', next);
      return next;
    });
  }, []);

  // Apply filter and sort
  const filteredQuotes = quotes
    .filter((q) => matchesFilter(q, activeFilter))
    .sort((a, b) => {
      const timeA = new Date(a.analyzedAt).getTime();
      const timeB = new Date(b.analyzedAt).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

  const renderItem = useCallback(({ item, index }: { item: SavedQuote; index: number }) => {
    const config = verdictConfig(item.verdict);
    const Icon = config.Icon;
    const dateText = formatRelativeDate(item.analyzedAt);
    const amountText = `$${Number(item.amount).toLocaleString()}`;

    return (
      <AnimatedListItem index={index}>
        <AnimatedPressable
          onPress={() => handleItemPress(item)}
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: 14,
            padding: 16,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: COLORS.border,
            boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            {/* Icon */}
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

            {/* Content */}
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                style={{ fontSize: 15, fontWeight: '600', color: COLORS.text }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.description}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    backgroundColor: config.bg,
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    borderRadius: 5,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: config.color }}>
                    {config.label}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: COLORS.textTertiary }}>
                  {dateText}
                </Text>
              </View>
            </View>

            {/* Amount + Delete */}
            <View style={{ alignItems: 'flex-end', gap: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text }}>
                {amountText}
              </Text>
              <AnimatedPressable
                onPress={() => handleDelete(item)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: 'rgba(229, 62, 62, 0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trash2 size={15} color={COLORS.danger} />
              </AnimatedPressable>
            </View>
          </View>
        </AnimatedPressable>
      </AnimatedListItem>
    );
  }, [handleItemPress, handleDelete]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Filter + Sort Bar */}
      <View
        style={{
          paddingTop: 8,
          paddingBottom: 4,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          backgroundColor: COLORS.background,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 12 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            style={{ flex: 1 }}
          >
            {FILTER_OPTIONS.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => handleFilterPress(filter)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: isActive ? COLORS.primary : COLORS.surface,
                    borderWidth: 1,
                    borderColor: isActive ? COLORS.primary : COLORS.border,
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: isActive ? '#FFFFFF' : COLORS.textSecondary,
                    }}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Sort toggle */}
          <TouchableOpacity
            onPress={handleSortToggle}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: COLORS.surface,
              borderWidth: 1,
              borderColor: COLORS.border,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 4,
            }}
            activeOpacity={0.8}
          >
            <ArrowUpDown size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Sort label */}
        <Text
          style={{
            fontSize: 11,
            color: COLORS.textTertiary,
            paddingHorizontal: 16,
            paddingTop: 4,
            paddingBottom: 6,
          }}
        >
          {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
          {activeFilter !== 'All' ? ` · ${filteredQuotes.length} result${filteredQuotes.length !== 1 ? 's' : ''}` : ''}
        </Text>
      </View>

      <FlatList
        data={filteredQuotes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 120,
          paddingTop: 8,
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 80,
              gap: 12,
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                backgroundColor: COLORS.primaryMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ClipboardList size={32} color={COLORS.primary} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>
              {activeFilter === 'All' ? 'No quotes yet' : `No ${activeFilter} quotes`}
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: COLORS.textSecondary,
                textAlign: 'center',
                maxWidth: 260,
                lineHeight: 22,
              }}
            >
              {activeFilter === 'All'
                ? 'Your analyzed quotes will appear here for quick reference'
                : `No quotes with "${activeFilter}" verdict found`}
            </Text>
          </View>
        }
      />

      {showToast && (
        <UndoToast onUndo={handleUndo} onDismiss={handleToastDismiss} />
      )}
    </View>
  );
}
