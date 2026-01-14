import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrainingPlan } from '../services/storageService';

interface PlanDetailsProps {
  planData: TrainingPlan;
  hasSchedule: boolean;
  generatingWorkouts: boolean;
  onGenerateWorkouts: () => void;
  onDelete: () => void;
}

export default function PlanDetails({ planData, hasSchedule, generatingWorkouts, onGenerateWorkouts, onDelete }: PlanDetailsProps) {
  const [isPlanExpanded, setIsPlanExpanded] = useState(!hasSchedule);

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

  return (
    <View>
      <TouchableOpacity 
        style={styles.compactCard}
        onPress={() => setIsPlanExpanded(!isPlanExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.courseTitleSection}>
          <Ionicons name="trophy" size={24} color="#FF6B35" />
          <Text style={styles.courseTitle}>{planData.course_label}</Text>
          <Ionicons 
            name={isPlanExpanded ? "chevron-up" : "chevron-down"} 
            size={24} 
            color="#b0b0b0" 
          />
        </View>

        {isPlanExpanded && (
          <>
            <View style={styles.divider} />

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Ionicons name="bicycle-outline" size={20} color="#FF6B35" />
                <Text style={styles.infoLabel}>Type</Text>
                <Text style={styles.infoValue}>
                  {getLabel('course_type', planData.course_type)}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="resize-outline" size={20} color="#FF6B35" />
                <Text style={styles.infoLabel}>Distance</Text>
                <Text style={styles.infoValue}>
                  {planData.course_km} km
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="trending-up-outline" size={20} color="#FF6B35" />
                <Text style={styles.infoLabel}>D+</Text>
                <Text style={styles.infoValue}>
                  {planData.course_elevation} m
                </Text>
              </View>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={20} color="#FF6B35" />
                <Text style={styles.infoLabel}>Fréquence</Text>
                <Text style={styles.infoValue}>
                  {getLabel('frequency', planData.frequency)}/sem
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={20} color="#FF6B35" />
                <Text style={styles.infoLabel}>Durée</Text>
                <Text style={styles.infoValue}>
                  {planData.duration} sem.
                </Text>
              </View>

              <View style={styles.infoItem} />
            </View>

            <View style={styles.dateSection}>
              <Ionicons name="checkmark-circle" size={16} color="#666" />
              <Text style={styles.dateText}>
                Créé le {new Date(planData.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>

            <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
              <Ionicons name="trash-outline" size={20} color="#FF6B35" />
              <Text style={styles.deleteButtonText}>Supprimer le plan</Text>
            </TouchableOpacity>
          </>
        )}
      </TouchableOpacity>

      {!hasSchedule && (
        <TouchableOpacity
          style={[styles.createNewButton, generatingWorkouts && styles.buttonDisabled]}
          onPress={onGenerateWorkouts}
          disabled={generatingWorkouts}
        >
          {generatingWorkouts ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="sparkles-outline" size={20} color="#fff" />
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
    backgroundColor: 'rgba(45, 45, 45, 0.7)',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(252, 76, 2, 0.2)',
  },
  courseTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  courseTitle: {
    fontSize: 22,
    color: '#ffffff',
    fontWeight: 'bold',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(252, 76, 2, 0.2)',
    marginTop: 15,
    marginBottom: 15,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: '#b0b0b0',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(252, 76, 2, 0.1)',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  createNewButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(252, 76, 2, 0.9)',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  createNewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(252, 76, 2, 0.2)',
  },
  deleteButtonText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
});
