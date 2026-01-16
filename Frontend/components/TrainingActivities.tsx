import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrainingSchedule, Exercise, Session, Week } from '../services/storageService';

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

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: session.done ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [session.done]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(45, 45, 45, 0.7)', 'rgba(30, 40, 60, 0.5)'],
  });

  const borderColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(252, 76, 2, 0.2)', 'rgba(33, 150, 243, 0.3)'],
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
                  color={session.done ? "#4CAF50" : "#666"} 
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
                color="#b0b0b0" 
              />
            </View>
          </View>
          <Text style={[styles.sessionTitle, session.done && styles.sessionTitleDone]}>{session.title}</Text>
          <Text style={styles.sessionDescription} numberOfLines={isExpanded ? undefined : 2}>
            {session.description}
          </Text>
        </View>

        {isExpanded && (
          <View style={styles.exercisesContainer}>
            {session.exercises.map((exercise, index) => (
              <View key={`exercise-${index}`} style={styles.exerciseItem}>
                <Ionicons name="fitness-outline" size={16} color="#FF6B35" />
                <View style={styles.exerciseContent}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseDetails}>{exercise.details}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function TrainingActivities({ trainingSchedule, onToggleDone }: TrainingActivitiesProps) {
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const getIntensityColor = (intensity: string) => {
    switch (intensity.toLowerCase()) {
      case 'élevée':
        return '#FF6B35';
      case 'modérée':
        return '#FFA500';
      case 'faible':
        return '#4CAF50';
      default:
        return '#999';
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
    marginTop: 30,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(252, 76, 2, 0.3)',
  },
  scheduleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  weekContainer: {
    marginBottom: 25,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(252, 76, 2, 0.2)',
  },
  weekTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B35',
    minWidth: 30,
  },
  weekDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(252, 76, 2, 0.3)',
  },
  weekFocus: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    flex: 1,
  },
  sessionCard: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
  },
  sessionCardOptional: {
    borderStyle: 'dashed'
  },
  sessionCardDone: {
    backgroundColor: 'rgba(30, 40, 60, 0.5)',
    borderColor: 'rgba(33, 150, 243, 0.3)',
    opacity: 0.7,
  },
  sessionHeader: {
    marginBottom: 12,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxContainer: {
    padding: 4,
  },
  sessionTitleRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionNumber: {
    fontSize: 12,
    color: '#b0b0b0',
    fontWeight: '600',
  },
  sessionNumberDone: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  intensityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  intensityText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  sessionTitleDone: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  sessionDescription: {
    fontSize: 13,
    color: '#b0b0b0',
    lineHeight: 18,
  },
  exercisesContainer: {
    gap: 10,
  },
  exerciseItem: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(252, 76, 2, 0.1)',
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B35',
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: 12,
    color: '#d0d0d0',
    lineHeight: 17,
  },
});
