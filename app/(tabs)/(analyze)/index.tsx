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
import { useRouter } from 'expo-router';
import { CheckCircle, AlertCircle, HelpCircle, TrendingDown } from 'lucide-react-native';
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
}: {
  result: AnalysisResult;
  amount: number;
  description: string;
  location: string;
  details: string;
  onSave: () => void;
  onAnalyzeAnother: () => void;
  savedId: string | null;
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
          borderWidth: 1,
          borderColor: COLORS.border,
          gap: 16,
        }}
      >
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
                console.log('[AnalyzeScreen] Save to History pressed');
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AnalyzeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSubscribed, loading: subLoading } = useSubscription();

  const [description, setDescription] = useState('');
  const [amountText, setAmountText] = useState('');
  const [location, setLocation] = useState('');
  const [details, setDetails] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);

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

  const handleAnalyze = useCallback(async () => {
    const amount = parseFloat(amountText.replace(/[^0-9.]/g, ''));
    console.log('[AnalyzeScreen] Analyze Quote pressed', { description, amount, location, details });

    if (!description.trim()) {
      console.log('[AnalyzeScreen] Validation failed: no description');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      console.log('[AnalyzeScreen] Validation failed: invalid amount');
      return;
    }

    // Gating check
    if (!isSubscribed && credits <= 0) {
      console.log('[AnalyzeScreen] No access — redirecting to paywall');
      router.push('/paywall');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setSavedId(null);

    // Deduct credit if not subscribed
    if (!isSubscribed && credits > 0) {
      console.log('[AnalyzeScreen] Deducting 1 credit for analysis');
      const remaining = await deductCredit();
      setCredits(remaining);
      console.log('[AnalyzeScreen] Credits remaining after deduction:', remaining);
    }

    // Simulate a brief "thinking" delay for UX
    await new Promise((resolve) => setTimeout(resolve, 900));

    const analysisResult = analyzeQuote(description, amount, location, details);
    console.log('[AnalyzeScreen] Analysis complete, verdict:', analysisResult.verdict);
    setResult(analysisResult);
    setIsAnalyzing(false);
  }, [description, amountText, location, details, isSubscribed, credits, router]);

  const handleSave = useCallback(async () => {
    if (!result) return;
    const amount = parseFloat(amountText.replace(/[^0-9.]/g, ''));
    const id = `quote_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const quote: SavedQuote = {
      id,
      description,
      amount,
      location,
      details,
      verdict: result.verdict,
      confidence: result.confidence,
      explanation: result.explanation,
      tips: result.tips,
      estimatedLow: result.estimatedLow,
      estimatedHigh: result.estimatedHigh,
      category: result.category,
      analyzedAt: new Date().toISOString(),
    };
    console.log('[AnalyzeScreen] Saving quote to history:', id);
    await saveQuote(quote);
    setSavedId(id);
  }, [result, description, amountText, location, details]);

  const handleAnalyzeAnother = useCallback(() => {
    console.log('[AnalyzeScreen] Clearing form for new analysis');
    setDescription('');
    setAmountText('');
    setLocation('');
    setDetails('');
    setResult(null);
    setSavedId(null);
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

  const isFormValid = description.trim().length > 0 && parseFloat(amountText) > 0;
  const hasAccess = isSubscribed || credits > 0;

  // Determine analyze button label
  const analyzeButtonLabel = isAnalyzing
    ? 'Analyzing...'
    : !hasAccess
    ? 'Analyze Quote — Unlock'
    : 'Analyze Quote';

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

          {/* Amount */}
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
              Tap to unlock — from $1.99/month or $2.00 per analysis
            </Text>
          )}
        </View>

        {/* Loading Skeleton */}
        {isAnalyzing && <AnalysisSkeleton />}

        {/* Result Card */}
        {result && !isAnalyzing && (
          <ResultCard
            result={result}
            amount={parseFloat(amountText.replace(/[^0-9.]/g, ''))}
            description={description}
            location={location}
            details={details}
            onSave={handleSave}
            onAnalyzeAnother={handleAnalyzeAnother}
            savedId={savedId}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
