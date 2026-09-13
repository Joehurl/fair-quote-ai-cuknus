import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { CheckCircle, AlertCircle, HelpCircle, TrendingDown, Trophy } from 'lucide-react-native';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { analyzeQuote, AnalysisResult } from '@/utils/quoteAnalyzer';
import { saveQuote, SavedQuote } from '@/utils/storage';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getCredits, deductCredit } from '@/utils/creditsStorage';

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

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonLine({ width, height = 14 }: { width: number | string; height?: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  React.useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);
  const widthValue = typeof width === 'number' ? width : undefined;
  const widthPercent = typeof width === 'string' ? (width as `${number}%`) : undefined;

  return (
    <Animated.View
      style={{
        width: widthValue ?? widthPercent,
        height,
        borderRadius: height / 2,
        backgroundColor: COLORS.surfaceSecondary,
        opacity,
      }}
    />
  );
}

function AnalysisSkeleton() {
  return (
    <View
      style={{
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <SkeletonLine width={80} height={28} />
        <SkeletonLine width={120} height={16} />
      </View>
      <View style={{ gap: 8 }}>
        <SkeletonLine width="100%" height={12} />
        <SkeletonLine width="85%" height={12} />
        <SkeletonLine width="70%" height={12} />
      </View>
      <View style={{ gap: 8 }}>
        <SkeletonLine width={100} height={14} />
        <SkeletonLine width="90%" height={10} />
        <SkeletonLine width="80%" height={10} />
        <SkeletonLine width="75%" height={10} />
      </View>
    </View>
  );
}

// ─── Verdict Badge ────────────────────────────────────────────────────────────

function VerdictBadge({ verdict }: { verdict: AnalysisResult['verdict'] }) {
  const config = {
    fair: { label: 'FAIR PRICE', color: COLORS.fair, bg: COLORS.fairMuted, icon: CheckCircle },
    underpriced: { label: 'GOOD DEAL', color: COLORS.fair, bg: COLORS.fairMuted, icon: TrendingDown },
    overpriced: { label: 'OVERPRICED', color: COLORS.overpriced, bg: COLORS.overpricedMuted, icon: AlertCircle },
    uncertain: { label: 'UNCERTAIN', color: COLORS.uncertain, bg: COLORS.uncertainMuted, icon: HelpCircle },
  }[verdict];

  const Icon = config.icon;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: config.bg,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
      }}
    >
      <Icon size={14} color={config.color} />
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: config.color,
          letterSpacing: 0.8,
        }}
      >
        {config.label}
      </Text>
    </View>
  );
}

// ─── Confidence Bar ───────────────────────────────────────────────────────────

function ConfidenceBar({ confidence, verdict }: { confidence: number; verdict: AnalysisResult['verdict'] }) {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const barColor =
    verdict === 'fair' || verdict === 'underpriced'
      ? COLORS.fair
      : verdict === 'overpriced'
      ? COLORS.overpriced
      : COLORS.uncertain;

  React.useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: confidence / 100,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [confidence, fillAnim]);

  const widthInterpolated = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' }}>
          Confidence
        </Text>
        <Text style={{ fontSize: 13, fontWeight: '700', color: barColor }}>
          {confidence}%
        </Text>
      </View>
      <View
        style={{
          height: 6,
          backgroundColor: COLORS.surfaceSecondary,
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={{
            height: '100%',
            width: widthInterpolated,
            backgroundColor: barColor,
            borderRadius: 3,
          }}
        />
      </View>
    </View>
  );
}

// ─── Result Card ──────────────────────────────────────────────────────────────

function ResultCard({
  result,
  amount,
  description,
  location,
  details,
  onSave,
  onAnalyzeAnother,
  savedId,
  label,
  isWinner,
}: {
  result: AnalysisResult;
  amount: number;
  description: string;
  location: string;
  details: string;
  onSave: () => void;
  onAnalyzeAnother: () => void;
  savedId: string | null;
  label?: string;
  isWinner?: boolean;
}) {
  const slideAnim = useRef(new Animated.Value(20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [opacityAnim, slideAnim]);

  const rangeText =
    result.estimatedLow > 0
      ? `$${result.estimatedLow.toLocaleString()} – $${result.estimatedHigh.toLocaleString()}`
      : 'Not available';

  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <View
        style={{
          backgroundColor: COLORS.surface,
          borderRadius: 16,
          padding: 20,
          borderWidth: isWinner ? 2 : 1,
          borderColor: isWinner ? COLORS.fair : COLORS.border,
          gap: 16,
        }}
      >
        {/* Winner badge */}
        {isWinner && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: COLORS.fairMuted,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 8,
              alignSelf: 'flex-start',
            }}
          >
            <Trophy size={13} color={COLORS.fair} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.fair, letterSpacing: 0.5 }}>
              BETTER PRICE
            </Text>
          </View>
        )}

        {/* Label (Quote A / Quote B) */}
        {label ? (
          <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.primary, letterSpacing: 0.3 }}>
            {label}
          </Text>
        ) : null}

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <VerdictBadge verdict={result.verdict} />
          <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.text }}>
            ${Number(amount).toLocaleString()}
          </Text>
        </View>

        {/* Category */}
        <Text style={{ fontSize: 13, color: COLORS.textTertiary, fontWeight: '500', marginTop: -8 }}>
          {result.category}
        </Text>

        {/* Confidence */}
        <ConfidenceBar confidence={result.confidence} verdict={result.verdict} />

        {/* Typical Range */}
        {result.estimatedLow > 0 && (
          <View
            style={{
              backgroundColor: COLORS.surfaceSecondary,
              borderRadius: 10,
              padding: 12,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' }}>
              Typical range
            </Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }}>
              {rangeText}
            </Text>
          </View>
        )}

        {/* Explanation */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text }}>
            Analysis
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: COLORS.textSecondary,
              lineHeight: 21,
            }}
          >
            {result.explanation}
          </Text>
        </View>

        {/* Tips */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text }}>
            Tips
          </Text>
          {result.tips.map((tip, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
              <CheckCircle size={15} color={COLORS.primary} style={{ marginTop: 2 }} />
              <Text style={{ fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, flex: 1 }}>
                {tip}
              </Text>
            </View>
          ))}
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: COLORS.divider }} />

        {/* Actions */}
        <View style={{ gap: 10 }}>
          {!savedId ? (
            <AnimatedPressable
              onPress={() => {
                console.log('[AnalyzeScreen] Save to History pressed', label ?? 'single');
                onSave();
              }}
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 12,
                height: 48,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
                Save to History
              </Text>
            </AnimatedPressable>
          ) : (
            <View
              style={{
                backgroundColor: COLORS.fairMuted,
                borderRadius: 12,
                height: 48,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
              }}
            >
              <CheckCircle size={16} color={COLORS.fair} />
              <Text style={{ color: COLORS.fair, fontSize: 15, fontWeight: '600' }}>
                Saved to History
              </Text>
            </View>
          )}
          <AnimatedPressable
            onPress={() => {
              console.log('[AnalyzeScreen] Analyze Another pressed');
              onAnalyzeAnother();
            }}
            style={{
              backgroundColor: COLORS.surfaceSecondary,
              borderRadius: 12,
              height: 48,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: COLORS.primary, fontSize: 15, fontWeight: '600' }}>
              Analyze Another
            </Text>
          </AnimatedPressable>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ isSubscribed, credits }: { isSubscribed: boolean; credits: number }) {
  if (isSubscribed) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: 'rgba(56, 161, 105, 0.12)',
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 8,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.accent, letterSpacing: 0.5 }}>
          PRO
        </Text>
      </View>
    );
  }
  if (credits > 0) {
    const creditLabel = credits === 1 ? '1 credit' : `${credits} credits`;
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: COLORS.primaryMuted,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 8,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.primary, letterSpacing: 0.3 }}>
          {creditLabel}
        </Text>
      </View>
    );
  }
  return null;
}

// ─── Compare Mode Toggle ──────────────────────────────────────────────────────

function CompareModeToggle({
  compareMode,
  onToggle,
}: {
  compareMode: boolean;
  onToggle: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: COLORS.surfaceSecondary,
        borderRadius: 10,
        padding: 3,
        alignSelf: 'flex-start',
      }}
    >
      <AnimatedPressable
        onPress={() => {
          if (compareMode) {
            console.log('[AnalyzeScreen] Switched to Single mode');
            onToggle();
          }
        }}
        style={{
          paddingHorizontal: 14,
          paddingVertical: 6,
          borderRadius: 8,
          backgroundColor: !compareMode ? COLORS.surface : 'transparent',
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: !compareMode ? COLORS.primary : COLORS.textTertiary,
          }}
        >
          Single
        </Text>
      </AnimatedPressable>
      <AnimatedPressable
        onPress={() => {
          if (!compareMode) {
            console.log('[AnalyzeScreen] Switched to Compare mode');
            onToggle();
          }
        }}
        style={{
          paddingHorizontal: 14,
          paddingVertical: 6,
          borderRadius: 8,
          backgroundColor: compareMode ? COLORS.surface : 'transparent',
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: compareMode ? COLORS.primary : COLORS.textTertiary,
          }}
        >
          Compare
        </Text>
      </AnimatedPressable>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AnalyzeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSubscribed, loading: subLoading } = useSubscription();

  const [compareMode, setCompareMode] = useState(false);

  const [description, setDescription] = useState('');
  const [amountText, setAmountText] = useState('');
  const [amountTextB, setAmountTextB] = useState('');
  const [location, setLocation] = useState('');
  const [details, setDetails] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [resultB, setResultB] = useState<AnalysisResult | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedIdB, setSavedIdB] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);

  // Tracks whether we should auto-run analysis when the screen regains focus
  const pendingAnalysis = useRef(false);

  // Load credits on mount and when subscription changes
  useEffect(() => {
    if (!subLoading) {
      console.log('[AnalyzeScreen] Loading credits, isSubscribed:', isSubscribed);
      getCredits().then((c) => {
        setCredits(c);
        console.log('[AnalyzeScreen] Credits loaded:', c);
      });
    }
  }, [subLoading, isSubscribed]);

  const handleToggleCompareMode = useCallback(() => {
    setCompareMode((prev) => !prev);
    setResult(null);
    setResultB(null);
    setSavedId(null);
    setSavedIdB(null);
    setAmountTextB('');
  }, []);

  const handleAnalyze = useCallback(async () => {
    const amount = parseFloat(amountText.replace(/[^0-9.]/g, ''));
    const amountB = compareMode ? parseFloat(amountTextB.replace(/[^0-9.]/g, '')) : NaN;

    console.log('[AnalyzeScreen] Analyze Quote pressed', {
      description,
      amount,
      amountB: compareMode ? amountB : undefined,
      location,
      details,
      compareMode,
    });

    if (!description.trim()) {
      console.log('[AnalyzeScreen] Validation failed: no description');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      console.log('[AnalyzeScreen] Validation failed: invalid amount A');
      return;
    }
    if (compareMode && (isNaN(amountB) || amountB <= 0)) {
      console.log('[AnalyzeScreen] Validation failed: invalid amount B');
      return;
    }

    // Gate on access — redirect to paywall if no subscription and no credits
    const hasAccess = isSubscribed || credits > 0;
    console.log('[AnalyzeScreen] Access check — hasAccess:', hasAccess, 'isSubscribed:', isSubscribed, 'credits:', credits);

    if (!hasAccess) {
      console.log('[AnalyzeScreen] No access — setting pendingAnalysis and navigating to paywall');
      pendingAnalysis.current = true;
      router.push('/paywall');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setResultB(null);
    setSavedId(null);
    setSavedIdB(null);

    // Simulate a brief "thinking" delay for UX
    await new Promise((resolve) => setTimeout(resolve, 900));

    const analysisResult = analyzeQuote(description, amount, location, details);
    console.log('[AnalyzeScreen] Analysis A complete, verdict:', analysisResult.verdict);
    setResult(analysisResult);

    if (compareMode) {
      const analysisResultB = analyzeQuote(description, amountB, location, details);
      console.log('[AnalyzeScreen] Analysis B complete, verdict:', analysisResultB.verdict);
      setResultB(analysisResultB);
    }

    setIsAnalyzing(false);
  }, [description, amountText, amountTextB, location, details, isSubscribed, credits, compareMode, router]);

  // When the screen regains focus (e.g. after returning from paywall), auto-run
  // the pending analysis if the user now has access.
  useFocusEffect(
    useCallback(() => {
      if (!pendingAnalysis.current) return;

      getCredits().then((freshCredits) => {
        setCredits(freshCredits);
        const nowHasAccess = isSubscribed || freshCredits > 0;
        console.log('[AnalyzeScreen] Screen focused after paywall — nowHasAccess:', nowHasAccess, 'isSubscribed:', isSubscribed, 'credits:', freshCredits);

        if (nowHasAccess) {
          pendingAnalysis.current = false;
          console.log('[AnalyzeScreen] Auto-running pending analysis after paywall return');
          handleAnalyze();
        } else {
          console.log('[AnalyzeScreen] Still no access after returning from paywall — clearing pending flag');
          pendingAnalysis.current = false;
        }
      });
    }, [isSubscribed, handleAnalyze])
  );

  const handleSave = useCallback(async (which: 'A' | 'B' = 'A') => {
    const targetResult = which === 'A' ? result : resultB;
    if (!targetResult) return;
    const rawAmount = which === 'A' ? amountText : amountTextB;
    const amount = parseFloat(rawAmount.replace(/[^0-9.]/g, ''));
    const id = `quote_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const quote: SavedQuote = {
      id,
      description,
      amount,
      location,
      details,
      verdict: targetResult.verdict,
      confidence: targetResult.confidence,
      explanation: targetResult.explanation,
      tips: targetResult.tips,
      estimatedLow: targetResult.estimatedLow,
      estimatedHigh: targetResult.estimatedHigh,
      category: targetResult.category,
      analyzedAt: new Date().toISOString(),
    };
    console.log('[AnalyzeScreen] Saving quote to history:', id, 'which:', which);
    await saveQuote(quote);
    if (which === 'A') {
      setSavedId(id);
    } else {
      setSavedIdB(id);
    }
  }, [result, resultB, description, amountText, amountTextB, location, details]);

  const handleAnalyzeAnother = useCallback(() => {
    console.log('[AnalyzeScreen] Clearing form for new analysis');
    setDescription('');
    setAmountText('');
    setAmountTextB('');
    setLocation('');
    setDetails('');
    setResult(null);
    setResultB(null);
    setSavedId(null);
    setSavedIdB(null);
  }, []);

  const inputStyle = (field: string) => ({
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1.5,
    borderColor: focusedField === field ? COLORS.primary : 'transparent',
    borderCurve: 'continuous' as const,
  });

  const amountA = parseFloat(amountText.replace(/[^0-9.]/g, ''));
  const amountBVal = parseFloat(amountTextB.replace(/[^0-9.]/g, ''));
  const isFormValid = description.trim().length > 0 &&
    !isNaN(amountA) && amountA > 0 &&
    (!compareMode || (!isNaN(amountBVal) && amountBVal > 0));
  const hasAccess = isSubscribed || credits > 0;

  // Analyze button label — always shows action, never "Unlock"
  const analyzeButtonLabel = isAnalyzing
    ? 'Analyzing...'
    : compareMode
    ? 'Compare Quotes'
    : 'Analyze Quote';

  // Determine winner in compare mode
  const getWinner = (): 'A' | 'B' | null => {
    if (!result || !resultB) return null;
    // Lower amount with better verdict wins; use confidence as tiebreaker
    const scoreMap: Record<string, number> = { underpriced: 3, fair: 2, uncertain: 1, overpriced: 0 };
    const scoreA = scoreMap[result.verdict] ?? 0;
    const scoreB = scoreMap[resultB.verdict] ?? 0;
    if (scoreA > scoreB) return 'A';
    if (scoreB > scoreA) return 'B';
    // Same verdict — lower price wins
    if (amountA < amountBVal) return 'A';
    if (amountBVal < amountA) return 'B';
    return null;
  };

  const winner = getWinner();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 120,
          gap: 16,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Subtitle row with status badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <Text style={{ fontSize: 15, color: COLORS.textSecondary }}>
            Is your quote fair?
          </Text>
          {!subLoading && (
            <StatusBadge isSubscribed={isSubscribed} credits={credits} />
          )}
        </View>

        {/* Compare Mode Toggle */}
        <CompareModeToggle compareMode={compareMode} onToggle={handleToggleCompareMode} />

        {/* Form Card */}
        <View
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
            gap: 16,
          }}
        >
          {/* Description */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, letterSpacing: 0.2 }}>
              What are you getting quoted for?
            </Text>
            <TextInput
              style={[inputStyle('description'), { minHeight: 88, textAlignVertical: 'top', paddingTop: 12 }]}
              placeholder="e.g. Replace kitchen faucet, fix AC unit, paint living room..."
              placeholderTextColor={COLORS.textTertiary}
              value={description}
              onChangeText={(t) => {
                console.log('[AnalyzeScreen] Description changed');
                setDescription(t);
              }}
              onFocus={() => setFocusedField('description')}
              onBlur={() => setFocusedField(null)}
              multiline
              numberOfLines={4}
              returnKeyType="next"
            />
          </View>

          {/* Amount(s) */}
          {compareMode ? (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {/* Quote A */}
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, letterSpacing: 0.2 }}>
                  Quote A
                </Text>
                <View style={{ position: 'relative' }}>
                  <View
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: 0,
                      bottom: 0,
                      justifyContent: 'center',
                      zIndex: 1,
                    }}
                  >
                    <Text style={{ fontSize: 16, color: COLORS.textSecondary, fontWeight: '500' }}>$</Text>
                  </View>
                  <TextInput
                    style={[inputStyle('amountA'), { paddingLeft: 28 }]}
                    placeholder="0.00"
                    placeholderTextColor={COLORS.textTertiary}
                    value={amountText}
                    onChangeText={(t) => {
                      console.log('[AnalyzeScreen] Amount A changed:', t);
                      setAmountText(t);
                    }}
                    onFocus={() => setFocusedField('amountA')}
                    onBlur={() => setFocusedField(null)}
                    keyboardType="decimal-pad"
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Quote B */}
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, letterSpacing: 0.2 }}>
                  Quote B
                </Text>
                <View style={{ position: 'relative' }}>
                  <View
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: 0,
                      bottom: 0,
                      justifyContent: 'center',
                      zIndex: 1,
                    }}
                  >
                    <Text style={{ fontSize: 16, color: COLORS.textSecondary, fontWeight: '500' }}>$</Text>
                  </View>
                  <TextInput
                    style={[inputStyle('amountB'), { paddingLeft: 28 }]}
                    placeholder="0.00"
                    placeholderTextColor={COLORS.textTertiary}
                    value={amountTextB}
                    onChangeText={(t) => {
                      console.log('[AnalyzeScreen] Amount B changed:', t);
                      setAmountTextB(t);
                    }}
                    onFocus={() => setFocusedField('amountB')}
                    onBlur={() => setFocusedField(null)}
                    keyboardType="decimal-pad"
                    returnKeyType="next"
                  />
                </View>
              </View>
            </View>
          ) : (
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, letterSpacing: 0.2 }}>
                Quote amount
              </Text>
              <View style={{ position: 'relative' }}>
                <View
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    zIndex: 1,
                  }}
                >
                  <Text style={{ fontSize: 16, color: COLORS.textSecondary, fontWeight: '500' }}>$</Text>
                </View>
                <TextInput
                  style={[inputStyle('amount'), { paddingLeft: 28 }]}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textTertiary}
                  value={amountText}
                  onChangeText={(t) => {
                    console.log('[AnalyzeScreen] Amount changed:', t);
                    setAmountText(t);
                  }}
                  onFocus={() => setFocusedField('amount')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                />
              </View>
            </View>
          )}

          {/* Location */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, letterSpacing: 0.2 }}>
              Location
              <Text style={{ fontWeight: '400', color: COLORS.textTertiary }}> (optional)</Text>
            </Text>
            <TextInput
              style={inputStyle('location')}
              placeholder="e.g. New York, NY"
              placeholderTextColor={COLORS.textTertiary}
              value={location}
              onChangeText={(t) => {
                console.log('[AnalyzeScreen] Location changed');
                setLocation(t);
              }}
              onFocus={() => setFocusedField('location')}
              onBlur={() => setFocusedField(null)}
              returnKeyType="next"
            />
          </View>

          {/* Details */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, letterSpacing: 0.2 }}>
              Additional details
              <Text style={{ fontWeight: '400', color: COLORS.textTertiary }}> (optional)</Text>
            </Text>
            <TextInput
              style={[inputStyle('details'), { minHeight: 64, textAlignVertical: 'top', paddingTop: 12 }]}
              placeholder="e.g. 2-story house, 3 bedrooms, urgent job..."
              placeholderTextColor={COLORS.textTertiary}
              value={details}
              onChangeText={(t) => {
                console.log('[AnalyzeScreen] Details changed');
                setDetails(t);
              }}
              onFocus={() => setFocusedField('details')}
              onBlur={() => setFocusedField(null)}
              multiline
              numberOfLines={2}
              returnKeyType="done"
            />
          </View>

          {/* Analyze Button */}
          <AnimatedPressable
            onPress={handleAnalyze}
            disabled={!isFormValid || isAnalyzing}
            style={{
              backgroundColor: isFormValid ? COLORS.primary : COLORS.textTertiary,
              borderRadius: 12,
              height: 52,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
            }}
          >
            {isAnalyzing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : null}
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
              {analyzeButtonLabel}
            </Text>
          </AnimatedPressable>

          {/* No-access hint */}
          {!subLoading && !hasAccess && (
            <Text style={{ fontSize: 12, color: COLORS.textTertiary, textAlign: 'center', marginTop: -8 }}>
              from $4.99/month or $5.99 per analysis
            </Text>
          )}
        </View>

        {/* Loading Skeleton */}
        {isAnalyzing && <AnalysisSkeleton />}

        {/* Single Mode Result */}
        {!compareMode && result && !isAnalyzing && (
          <ResultCard
            result={result}
            amount={parseFloat(amountText.replace(/[^0-9.]/g, ''))}
            description={description}
            location={location}
            details={details}
            onSave={() => handleSave('A')}
            onAnalyzeAnother={handleAnalyzeAnother}
            savedId={savedId}
          />
        )}

        {/* Compare Mode Results */}
        {compareMode && result && resultB && !isAnalyzing && (
          <View style={{ gap: 12 }}>
            <ResultCard
              result={result}
              amount={parseFloat(amountText.replace(/[^0-9.]/g, ''))}
              description={description}
              location={location}
              details={details}
              onSave={() => handleSave('A')}
              onAnalyzeAnother={handleAnalyzeAnother}
              savedId={savedId}
              label="Quote A"
              isWinner={winner === 'A'}
            />
            <ResultCard
              result={resultB}
              amount={parseFloat(amountTextB.replace(/[^0-9.]/g, ''))}
              description={description}
              location={location}
              details={details}
              onSave={() => handleSave('B')}
              onAnalyzeAnother={handleAnalyzeAnother}
              savedId={savedIdB}
              label="Quote B"
              isWinner={winner === 'B'}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
