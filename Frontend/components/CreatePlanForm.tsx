import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storageService } from '../services/storageService';
import stravaService from '../services/stravaService';
import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import StravaConnectButton from './StravaConnectButton';
import { colors, fonts, spacing, borderRadius, shadows } from '../constants/theme';

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
    user_presentation: '',
  });

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const currentQuestion = questions[currentStep];
    if (currentQuestion.type === 'choice' || currentQuestion.type === 'strava') {
      Keyboard.dismiss();
    }
  }, [currentStep]);

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
      id: 'user_presentation',
      question: 'Présentez-vous en quelques mots',
      type: 'multiline' as const,
      placeholder: 'Mon temps au semi est 2h10, je m\'entraine depuis 2 ans...',
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={colors.primary} />
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
                  placeholderTextColor={colors.textMuted}
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
                  placeholderTextColor={colors.textMuted}
                  value={formData[question.id as keyof typeof formData]}
                  onChangeText={(value) => handleTextInput(question.id, value)}
                  maxLength={50}
                  autoCapitalize="words"
                />
              </View>
            )}

            {question.type === 'multiline' && (
              <View style={styles.textInputContainer}>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  placeholder={question.placeholder || 'Entrez votre réponse'}
                  placeholderTextColor={colors.textMuted}
                  value={formData[question.id as keyof typeof formData]}
                  onChangeText={(value) => handleTextInput(question.id, value)}
                  maxLength={300}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
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
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
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
            <Ionicons name="arrow-forward" size={24} color={colors.textInverse} />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  slidesContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  slide: {
    width: width,
    paddingHorizontal: spacing.xxxl,
    paddingTop: spacing.xxxl,
  },
  questionNumber: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.family,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  questionText: {
    fontSize: fonts.sizes.xxl,
    fontWeight: fonts.weights.bold,
    fontFamily: fonts.family,
    color: colors.text,
    marginBottom: spacing.xxxl,
  },
  optionsContainer: {
    gap: spacing.lg,
  },
  optionButton: {
    backgroundColor: colors.card,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.sm,
  },
  optionButtonSelected: {
    backgroundColor: colors.backgroundSecondary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: fonts.sizes.xl,
    fontFamily: fonts.family,
    color: colors.textSecondary,
    fontWeight: fonts.weights.medium,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: fonts.weights.semibold,
  },
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    alignItems: 'center',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  navButtonText: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.family,
    color: colors.primary,
    fontWeight: fonts.weights.semibold,
  },
  nextButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xl,
    ...shadows.md,
  },
  nextButtonText: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.family,
    color: colors.textInverse,
    fontWeight: fonts.weights.semibold,
  },
  numberInputContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  numberInput: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    fontSize: fonts.sizes.xxxl,
    fontFamily: fonts.family,
    color: colors.accent,
    fontWeight: fonts.weights.bold,
    textAlign: 'center',
    minWidth: 150,
    ...shadows.sm,
  },
  unitText: {
    fontSize: fonts.sizes.xl,
    fontFamily: fonts.family,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    fontWeight: fonts.weights.medium,
  },
  textInputContainer: {
    marginTop: spacing.xl,
  },
  textInput: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    fontSize: fonts.sizes.xl,
    fontFamily: fonts.family,
    color: colors.text,
    fontWeight: fonts.weights.medium,
    ...shadows.sm,
  },
  multilineInput: {
    minHeight: 150,
    paddingTop: spacing.xl,
  },
  stravaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
