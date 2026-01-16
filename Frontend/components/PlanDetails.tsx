import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrainingPlan } from '../services/storageService';
import { colors, fonts, spacing, borderRadius, shadows } from '../constants/theme';

interface PlanDetailsProps {
  planData: TrainingPlan;
  hasSchedule: boolean;
  generatingWorkouts: boolean;
  onGenerateWorkouts: () => void;
  onDelete: () => void;
}

export default function PlanDetails({ planData, hasSchedule, generatingWorkouts, onGenerateWorkouts, onDelete }: PlanDetailsProps) {
  const [isPlanExpanded, setIsPlanExpanded] = useState(!hasSchedule);
  const [contentHeight, setContentHeight] = useState(0);
  const expandAnimation = useRef(new Animated.Value(isPlanExpanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(expandAnimation, {
      toValue: isPlanExpanded ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isPlanExpanded]);

  const animatedHeight = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, contentHeight],
  });

  const getLabel = (key: string, value: string) => {
    const labels: Record<string, Record<string, string>> = {
      course_type: {
        road_running: 'Course sur route',
        trail: 'Trail',
      },
      frequency: {
        '2+1': '2 + 1 optionnel',
        '3': '3',
        '3+1': '3 + 1 optionnel',
        '4': '4',
        '4+1': '4 + 1 optionnel',
      },
    };
    return labels[key]?.[value] || value;
  };

  const renderExpandedContent = () => (
    <>
      <View style={styles.divider} />
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Ionicons name="bicycle-outline" size={20} color={colors.accent} />
          <Text style={styles.infoLabel}>Type</Text>
          <Text style={styles.infoValue}>{getLabel('course_type', planData.course_type)}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="resize-outline" size={20} color={colors.accent} />
          <Text style={styles.infoLabel}>Distance</Text>
          <Text style={styles.infoValue}>{planData.course_km} km</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="trending-up-outline" size={20} color={colors.accent} />
          <Text style={styles.infoLabel}>D+</Text>
          <Text style={styles.infoValue}>{planData.course_elevation} m</Text>
        </View>
      </View>
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={20} color={colors.accent} />
          <Text style={styles.infoLabel}>Fréquence</Text>
          <Text style={styles.infoValue}>{getLabel('frequency', planData.frequency)}/sem</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={20} color={colors.accent} />
          <Text style={styles.infoLabel}>Durée</Text>
          <Text style={styles.infoValue}>{planData.duration} sem.</Text>
        </View>
        <View style={styles.infoItem} />
      </View>
      <View style={styles.dateSection}>
        <Ionicons name="checkmark-circle" size={16} color={colors.textMuted} />
        <Text style={styles.dateText}>
          Créé le {new Date(planData.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </Text>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
        <Ionicons name="trash-outline" size={20} color={colors.error} />
        <Text style={styles.deleteButtonText}>Supprimer le plan</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <View>
      <TouchableOpacity
        style={styles.compactCard}
        onPress={() => setIsPlanExpanded(!isPlanExpanded)}
        activeOpacity={1}
      >
        <View style={styles.courseTitleSection}>
          <Ionicons name="trophy" size={24} color={colors.accent} />
          <Text style={styles.courseTitle}>{planData.course_label}</Text>
          <Ionicons
            name={isPlanExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color={colors.textSecondary}
          />
        </View>

        <View style={styles.expandWrapper}>
          <View
            style={[styles.expandMeasure, { position: 'absolute', opacity: 0 }]}
            onLayout={(e) => {
              const height = e.nativeEvent.layout.height;
              if (height > 0 && Math.abs(height - contentHeight) > 1) {
                setContentHeight(height);
              }
            }}
          >
            {renderExpandedContent()}
          </View>
          <Animated.View style={{ height: animatedHeight, overflow: 'hidden' }}>
            {renderExpandedContent()}
          </Animated.View>
        </View>
      </TouchableOpacity>

      {!hasSchedule && (
        <TouchableOpacity
          style={[styles.createNewButton, generatingWorkouts && styles.buttonDisabled]}
          onPress={onGenerateWorkouts}
          disabled={generatingWorkouts}
        >
          {generatingWorkouts ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Ionicons name="sparkles-outline" size={20} color={colors.textInverse} />
          )}
          <Text style={styles.createNewButtonText}>
            {generatingWorkouts ? 'Génération...' : 'Generer les Scéances'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  compactCard: {
    backgroundColor: colors.card,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  courseTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  courseTitle: {
    fontSize: fonts.sizes.xl,
    fontFamily: fonts.family,
    color: colors.text,
    fontWeight: fonts.weights.bold,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoLabel: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.family,
    color: colors.textSecondary,
    fontWeight: fonts.weights.medium,
  },
  infoValue: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.family,
    color: colors.text,
    fontWeight: fonts.weights.semibold,
    textAlign: 'center',
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  dateText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.family,
    color: colors.textMuted,
  },
  createNewButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxxl,
    gap: spacing.md,
    ...shadows.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  createNewButtonText: {
    color: colors.textInverse,
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.family,
    fontWeight: fonts.weights.semibold,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: fonts.sizes.md,
    fontFamily: fonts.family,
    fontWeight: fonts.weights.semibold,
  },
  expandWrapper: {
    position: 'relative',
  },
  expandMeasure: {
  },
});
