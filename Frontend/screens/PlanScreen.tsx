import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import CreatePlanForm from '../components/CreatePlanForm';
import { storageService, TrainingPlan } from '../services/storageService';

export default function PlanScreen() {
  const [hasPlan, setHasPlan] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [planData, setPlanData] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    try {
      const plan = await storageService.getTrainingPlan();
      if (plan) {
        setPlanData(plan);
        setHasPlan(true);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = () => {
    setShowCreateForm(true);
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
  };

  const handlePlanComplete = (planData: any) => {
    console.log('Plan créé avec les données:', planData);
    setShowCreateForm(false);
    loadPlan();
  };

  const handleDeletePlan = async () => {
    try {
      await storageService.deleteTrainingPlan();
      setPlanData(null);
      setHasPlan(false);
    } catch (error) {
      console.error('Erreur lors de la suppression du plan:', error);
    }
  };

  if (showCreateForm) {
    return (
      <Modal
        visible={showCreateForm}
        animationType="slide"
        transparent={false}
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          <CreatePlanForm onClose={handleCloseForm} onComplete={handlePlanComplete} />
        </View>
      </Modal>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!hasPlan) {
    return (
      <View style={styles.container}>
        <AntDesign name="frown" size={80} color="#666" />
        <Text style={styles.emptyTitle}>Aucun plan d'entraînement</Text>
        <Text style={styles.emptySubtitle}>
          Créez votre premier plan pour commencer
        </Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreatePlan}>
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.createButtonText}>Créer un plan</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.planContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Mon Plan d'Entraînement</Text>
          <TouchableOpacity onPress={handleDeletePlan} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={24} color="#FF6B35" />
          </TouchableOpacity>
        </View>

        {planData && (
          <View style={styles.detailsContainer}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="trophy-outline" size={28} color="#FF6B35" />
                <Text style={styles.cardTitle}>Nom de la course</Text>
              </View>
              <Text style={styles.cardValue}>
                {planData.course_label}
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="bicycle-outline" size={28} color="#FF6B35" />
                <Text style={styles.cardTitle}>Type de course</Text>
              </View>
              <Text style={styles.cardValue}>
                {getLabel('course_type', planData.course_type)}
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="calendar-outline" size={28} color="#FF6B35" />
                <Text style={styles.cardTitle}>Fréquence</Text>
              </View>
              <Text style={styles.cardValue}>
                {getLabel('frequency', planData.frequency)} séances / semaine
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="time-outline" size={28} color="#FF6B35" />
                <Text style={styles.cardTitle}>Durée</Text>
              </View>
              <Text style={styles.cardValue}>
                {planData.duration} semaines
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="checkmark-circle-outline" size={28} color="#FF6B35" />
                <Text style={styles.cardTitle}>Créé le</Text>
              </View>
              <Text style={styles.cardValue}>
                {new Date(planData.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.createNewButton} onPress={handleCreatePlan}>
          <Ionicons name="refresh-outline" size={20} color="#fff" />
          <Text style={styles.createNewButtonText}>Créer un nouveau plan</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  planContainer: {
    padding: 20,
    paddingTop: 60,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  deleteButton: {
    padding: 8,
  },
  detailsContainer: {
    gap: 15,
  },
  card: {
    backgroundColor: 'rgba(45, 45, 45, 0.7)',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(252, 76, 2, 0.2)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    color: '#b0b0b0',
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 38,
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
  createNewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#b0b0b0',
    textAlign: 'center',
    marginBottom: 30,
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(252, 76, 2, 0.9)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#FC4C02',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
});
