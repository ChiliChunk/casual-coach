import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrainingSchedule, Exercise, Session, Week } from '../services/storageService';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';

interface TrainingActivitiesProps {
  trainingSchedule: TrainingSchedule;
  onToggleDone: (weekNumber: number, sessionNumber: number) => void;
}

interface SessionCardProps {
  session: Session;
  weekNumber: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onToggleDone: () => void;
  getIntensityColor: (intensity: string) => string;
}

function SessionCard({ session, weekNumber, isExpanded, onToggleExpanded, onToggleDone, getIntensityColor }: SessionCardProps) {
  const animatedValue = useRef(new Animated.Value(session.done ? 1 : 0)).current;
  const expandAnimation = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: session.done ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [session.done]);

  useEffect(() => {
    Animated.timing(expandAnimation, {
      toValue: isExpanded ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

  const animatedHeight = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, contentHeight],
  });

  const animatedOpacity = expandAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.card, colors.backgroundSecondary],
  });

  const borderColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.success],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.7],
  });

  return (
    <Animated.View style={[
      session.optional && styles.sessionCardOptional,
      styles.sessionCard,
      { backgroundColor, borderColor, opacity },
    ]}>
      <TouchableOpacity 
        onPress={onToggleExpanded}
        onLongPress={onToggleDone}
        delayLongPress={300}
        activeOpacity={0.7}
      >
        <View style={styles.sessionHeader}>
          <View style={styles.sessionTitleRow}>
            <View style={styles.sessionTitleLeft}>
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  onToggleDone();
                }}
                style={styles.checkboxContainer}
              >
                <Ionicons
                  name={session.done ? "checkmark-circle" : "ellipse-outline"}
                  size={24}
                  color={session.done ? colors.success : colors.textMuted}
                />
              </TouchableOpacity>
              <Text style={[styles.sessionNumber, session.done && styles.sessionNumberDone]}>
                Séance {session.session_number}
              </Text>
            </View>
            <View style={styles.sessionTitleRowRight}>
              <View style={[styles.intensityBadge, { backgroundColor: getIntensityColor(session.intensity) }]}>
                <Text style={styles.intensityText}>{session.intensity}</Text>
              </View>
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.textSecondary}
              />
            </View>
          </View>
          <Text style={[styles.sessionTitle, session.done && styles.sessionTitleDone]}>{session.title}</Text>
          <Text style={styles.sessionDescription} numberOfLines={isExpanded ? undefined : 2}>
            {session.description}
          </Text>
        </View>

        <View style={styles.exercisesWrapper}>
          <View
            style={[styles.exercisesMeasure, { position: 'absolute', opacity: 0 }]}
            onLayout={(e) => {
              const height = e.nativeEvent.layout.height;
              if (height > 0 && height !== contentHeight) {
                setContentHeight(height);
              }
            }}
          >
            {session.exercises.map((exercise, index) => (
              <View key={`measure-${index}`} style={styles.exerciseItem}>
                <Ionicons name="fitness-outline" size={16} color={colors.accent} />
                <View style={styles.exerciseContent}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseDetails}>{exercise.details}</Text>
                </View>
              </View>
            ))}
          </View>
          <Animated.View style={{ height: animatedHeight, opacity: animatedOpacity, overflow: 'hidden' }}>
            <View style={styles.exercisesContainer}>
              {session.exercises.map((exercise, index) => (
                <View key={`exercise-${index}`} style={styles.exerciseItem}>
                  <Ionicons name="fitness-outline" size={16} color={colors.accent} />
                  <View style={styles.exerciseContent}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseDetails}>{exercise.details}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function TrainingActivities({ trainingSchedule, onToggleDone }: TrainingActivitiesProps) {
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const getIntensityColor = (intensity: string) => {
    switch (intensity.toLowerCase()) {
      case 'élevée':
        return colors.error;
      case 'modérée':
        return colors.warning;
      case 'faible':
        return colors.success;
      default:
        return colors.textMuted;
    }
  };

  const toggleSession = (weekNumber: number, sessionNumber: number) => {
    const sessionId = `week-${weekNumber}-session-${sessionNumber}`;
    setExpandedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  const renderSession = (session: Session, weekNumber: number) => {
    const sessionId = `week-${weekNumber}-session-${session.session_number}`;
    const isExpanded = expandedSessions.has(sessionId);

    return (
      <SessionCard
        key={sessionId}
        session={session}
        weekNumber={weekNumber}
        isExpanded={isExpanded}
        onToggleExpanded={() => toggleSession(weekNumber, session.session_number)}
        onToggleDone={() => onToggleDone(weekNumber, session.session_number)}
        getIntensityColor={getIntensityColor}
      />
    );
  };

  const renderWeek = (week: Week) => {
    if (week.week_number === 1) {
      console.log('Week 1 sessions optional values:', week.sessions.map(s => ({ session: s.session_number, optional: s.optional })));
    }
    return (
      <View key={`week-${week.week_number}`} style={styles.weekContainer}>
        <View style={styles.weekHeader}>
          <Text style={styles.weekTitle}>S{week.week_number}</Text>
          <View style={styles.weekDivider} />
          <Text style={styles.weekFocus}>{week.focus}</Text>
        </View>
        {week.sessions.map((session) => renderSession(session, week.week_number))}
      </View>
    );
  };

  return (
    <View style={styles.scheduleContainer}>
      <View style={styles.scheduleHeader}>
        <Text style={styles.scheduleTitle}>Programme d'entraînement</Text>
      </View>
      {trainingSchedule.weeks.map((week) => renderWeek(week))}
    </View>
  );
}

const styles = StyleSheet.create({
  scheduleContainer: {
    marginTop: spacing.xxxl,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  scheduleTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: fonts.weights.bold,
    fontFamily: fonts.family,
    color: colors.text,
  },
  weekContainer: {
    marginBottom: spacing.xxl,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  weekTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.bold,
    fontFamily: fonts.family,
    color: colors.accent,
    minWidth: 30,
  },
  weekDivider: {
    width: 1,
    height: 14,
    backgroundColor: colors.border,
  },
  weekFocus: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.family,
    color: colors.textMuted,
    fontStyle: 'italic',
    flex: 1,
  },
  sessionCard: {
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  sessionCardOptional: {
    borderStyle: 'dashed',
  },
  sessionCardDone: {
    backgroundColor: colors.backgroundSecondary,
    borderColor: colors.success,
    opacity: 0.7,
  },
  sessionHeader: {
    marginBottom: spacing.md,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sessionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkboxContainer: {
    padding: spacing.xs,
  },
  sessionTitleRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sessionNumber: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.family,
    color: colors.textSecondary,
    fontWeight: fonts.weights.semibold,
  },
  sessionNumberDone: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  intensityBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  intensityText: {
    fontSize: fonts.sizes.xs,
    fontFamily: fonts.family,
    color: colors.textInverse,
    fontWeight: fonts.weights.semibold,
    textTransform: 'capitalize',
  },
  sessionTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.bold,
    fontFamily: fonts.family,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sessionTitleDone: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  sessionDescription: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.family,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  exercisesWrapper: {
    position: 'relative',
  },
  exercisesMeasure: {
    gap: spacing.md,
  },
  exercisesContainer: {
    gap: spacing.md,
  },
  exerciseItem: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.semibold,
    fontFamily: fonts.family,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  exerciseDetails: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.family,
    color: colors.textSecondary,
    lineHeight: 17,
  },
});
