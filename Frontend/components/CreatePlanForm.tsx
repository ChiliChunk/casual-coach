import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storageService } from '../services/storageService';
import stravaService from '../services/stravaService';
import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import StravaConnectButton from './StravaConnectButton';

const { width } = Dimensions.get('window');

type Props = {
  onClose: () => void;
  onComplete: (planData: any) => void;
};

export default function CreatePlanForm({ onClose, onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isStravaConnected, setIsStravaConnected] = useState(false);
  const [formData, setFormData] = useState({
    course_label: '',
    course_type: '',
    course_km: '',
    course_elevation: '',
    frequency: '',
    duration: '',
  });

  const slideAnim = useRef(new Animated.Value(0)).current;

  const questions = [
    {
      id: 'course_label',
      question: 'Quel est le nom de la course ?',
      type: 'text' as const,
      placeholder: 'Ex: Marathon de Paris',
    },
    {
      id: 'course_type',
      question: 'Quel est le type de course?',
      type: 'choice' as const,
      options: [
        { label: 'Course sur route', value: 'road_running' },
        { label: 'Trail', value: 'trail' },
      ],
    },
     {
      id: 'course_km',
      question: 'Quel est la distance de la course? (en km)',
      type: 'number' as const,
      placeholder: 'Ex: 42.195',
    },
    {
      id: 'course_elevation',
      question: "Quel est le dénivelé de la course? (en mètres)",
      type: 'number' as const,
      placeholder: 'Ex: 500',
    },
     {
      id: 'frequency',
      question: 'Combien de séances par semaine ?',
      type: 'choice' as const,
      options: [
        { label: '2 + 1 optionnel', value: '2+1' },
        { label: '3', value: '3' },
        { label: '3 + 1 optionnel', value: '3+1' },
        { label: '4', value: '4' },
        { label: '4 + 1 optionnel', value: '4+1' },
      ],
    },
    {
      id: 'duration',
      question: "Dans combien de temps est la course? (en semaines) ?",
      type: 'number' as const,
      placeholder: 'Ex: 8',
      unit: 'semaines',
    },
    {
      id: 'strava_connect',
      question: 'Connexion à Strava',
      type: 'strava' as const,
    }
  ];

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      Animated.timing(slideAnim, {
        toValue: -(currentStep + 1) * width,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      await storageService.saveTrainingPlan(formData);
      onComplete(formData);
    } catch (error) {
      Alert.alert(
        'Erreur',
        'Impossible de sauvegarder le plan d\'entraînement. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      Animated.timing(slideAnim, {
        toValue: -(currentStep - 1) * width,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSelectOption = (questionId: string, value: string) => {
    setFormData({ ...formData, [questionId]: value });
    setTimeout(handleNext, 300);
  };

  const handleNumberInput = (questionId: string, value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    setFormData({ ...formData, [questionId]: numericValue });
  };

  const handleTextInput = (questionId: string, value: string) => {
    setFormData({ ...formData, [questionId]: value });
  };

  const handleStravaConnected = () => {
    setIsStravaConnected(true);
    setTimeout(handleNext, 500);
  };

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
  const canProceed = 
    currentQuestion.type === 'strava' 
      ? isStravaConnected 
      : formData[currentQuestion.id as keyof typeof formData];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#FF6B35" />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          {questions.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index <= currentStep && styles.progressDotActive,
              ]}
            />
          ))}
        </View>
      </View>

      <Animated.View
        style={[
          styles.slidesContainer,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        {questions.map((question, index) => (
          <View key={question.id} style={styles.slide}>
            <Text style={styles.questionNumber}>
              Question {index + 1}/{questions.length}
            </Text>
            <Text style={styles.questionText}>{question.question}</Text>

            {question.type === 'strava' && (
              <View style={styles.stravaContainer}>
                <StravaConnectButton
                  onAuthSuccess={handleStravaConnected}
                  onAuthError={(error) => {
                    Alert.alert('Erreur de connexion', error);
                  }}
                />
              </View>
            )}

            {question.type === 'choice' && question.options && (
              <View style={styles.optionsContainer}>
                {question.options.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      formData[question.id as keyof typeof formData] ===
                        option.value && styles.optionButtonSelected,
                    ]}
                    onPress={() => handleSelectOption(question.id, option.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        formData[question.id as keyof typeof formData] ===
                          option.value && styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {question.type === 'number' && (
              <View style={styles.numberInputContainer}>
                <TextInput
                  style={styles.numberInput}
                  placeholder={question.placeholder || 'Entrez un nombre'}
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={formData[question.id as keyof typeof formData]}
                  onChangeText={(value) => handleNumberInput(question.id, value)}
                  maxLength={question.id === 'course_elevation' ? 5 : 3}
                />
                {question.unit && formData[question.id as keyof typeof formData] && (
                  <Text style={styles.unitText}>{question.unit}</Text>
                )}
              </View>
            )}

            {question.type === 'text' && (
              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder={question.placeholder || 'Entrez votre réponse'}
                  placeholderTextColor="#666"
                  value={formData[question.id as keyof typeof formData]}
                  onChangeText={(value) => handleTextInput(question.id, value)}
                  maxLength={50}
                  autoCapitalize="words"
                />
              </View>
            )}
          </View>
        ))}
      </Animated.View>

      <View style={styles.navigation}>
        {currentStep > 0 && (
          <TouchableOpacity
            onPress={handlePrevious}
            style={styles.navButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FF6B35" />
            <Text style={styles.navButtonText}>Précédent</Text>
          </TouchableOpacity>
        )}
        
        <View style={{ flex: 1 }} />
        
        {canProceed && (
          <TouchableOpacity
            onPress={handleNext}
            style={[styles.navButton, styles.nextButton]}
          >
            <Text style={styles.nextButtonText}>
              {isLastStep ? 'Créer le plan' : 'Suivant'}
            </Text>
            <Ionicons name="arrow-forward" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 107, 53, 0.3)',
  },
  progressDotActive: {
    backgroundColor: '#FF6B35',
  },
  slidesContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  slide: {
    width: width,
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  questionNumber: {
    fontSize: 14,
    color: '#b0b0b0',
    marginBottom: 10,
  },
  questionText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 40,
  },
  optionsContainer: {
    gap: 15,
  },
  optionButton: {
    backgroundColor: 'rgba(45, 45, 45, 0.7)',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(252, 76, 2, 0.2)',
  },
  optionButtonSelected: {
    backgroundColor: 'rgba(252, 76, 2, 0.2)',
    borderColor: '#FF6B35',
  },
  optionText: {
    fontSize: 18,
    color: '#b0b0b0',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  navButtonText: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: 'rgba(252, 76, 2, 0.9)',
    borderRadius: 10,
    paddingHorizontal: 20,
  },
  nextButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  numberInputContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  numberInput: {
    backgroundColor: 'rgba(45, 45, 45, 0.7)',
    borderWidth: 2,
    borderColor: 'rgba(252, 76, 2, 0.2)',
    borderRadius: 12,
    padding: 20,
    fontSize: 32,
    color: '#FF6B35',
    fontWeight: 'bold',
    textAlign: 'center',
    minWidth: 150,
  },
  unitText: {
    fontSize: 18,
    color: '#b0b0b0',
    marginTop: 15,
    fontWeight: '500',
  },
  textInputContainer: {
    marginTop: 20,
  },
  textInput: {
    backgroundColor: 'rgba(45, 45, 45, 0.7)',
    borderWidth: 2,
    borderColor: 'rgba(252, 76, 2, 0.2)',
    borderRadius: 12,
    padding: 20,
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '500',
  },
  stravaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
