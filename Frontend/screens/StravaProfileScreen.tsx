import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList } from '../App';
import stravaService, { StravaAthlete, StravaActivity } from '../services/stravaService';
import Popup from '../components/Popup';
import { colors, fonts, spacing, borderRadius, shadows } from '../constants/theme';

type StravaProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Profile'>,
  NativeStackNavigationProp<any>
>;

type Props = {
  navigation: StravaProfileScreenNavigationProp;
};

interface PopupState {
  visible: boolean;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmText?: string;
  showCancel?: boolean;
}

export default function StravaProfileScreen({ navigation }: Props) {
  const [athlete, setAthlete] = useState<StravaAthlete | null>(null);
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStravaLinked, setIsStravaLinked] = useState(false);
  const [popup, setPopup] = useState<PopupState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showPopup = (config: Omit<PopupState, 'visible'>) => {
    setPopup({ ...config, visible: true });
  };

  const hidePopup = () => {
    setPopup(prev => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    checkStravaConnection();
  }, []);

  const checkStravaConnection = async () => {
    try {
      const isLinked = await stravaService.isAuthenticated();
      console.log('Strava connection status:', isLinked);
      setIsStravaLinked(isLinked);
      if (isLinked) {
        await loadData();
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error checking Strava connection:', error);
      setIsStravaLinked(false);
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [athleteData, activitiesData] = await Promise.all([
        stravaService.getAthlete(),
        stravaService.getActivities(1, 10),
      ]);

      if (athleteData) {
        setAthlete(athleteData);
      }

      if (activitiesData) {
        setActivities(activitiesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showPopup({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de charger les données',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await checkStravaConnection();
    setIsRefreshing(false);
  };

  const handleLinkStrava = () => {
    showPopup({
      type: 'info',
      title: 'Connecter Strava',
      message: 'Connectez votre compte Strava pour synchroniser vos activités',
      showCancel: true,
      confirmText: 'Connecter',
      onConfirm: () => {
        hidePopup();
        showPopup({
          type: 'info',
          title: 'Info',
          message: 'Fonctionnalité de connexion Strava à venir',
        });
      },
    });
  };

  const handleLogout = () => {
    showPopup({
      type: 'warning',
      title: 'Déconnexion',
      message: 'Voulez-vous vraiment vous déconnecter de Strava?',
      showCancel: true,
      confirmText: 'Déconnexion',
      onConfirm: async () => {
        await stravaService.logout();
        hidePopup();
        navigation.navigate('StravaLogin');
      },
    });
  };

  const formatDistance = (meters: number): string => {
    const km = meters / 1000;
    return `${km.toFixed(2)} km`;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  const formatSpeed = (metersPerSecond: number): string => {
    const kmPerHour = metersPerSecond * 3.6;
    return `${kmPerHour.toFixed(1)} km/h`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {!isStravaLinked ? (
        <View style={styles.notLinkedContainer}>
          <View style={styles.notLinkedContent}>
            <Ionicons name="alert-circle-outline" size={80} color={colors.textMuted} style={styles.notLinkedIcon} />
            <Text style={styles.notLinkedTitle}>Compte Strava non connecté</Text>
            <Text style={styles.notLinkedText}>
              Connectez votre compte Strava pour synchroniser et voir vos activités
            </Text>
          </View>
          <TouchableOpacity style={styles.linkButton} onPress={handleLinkStrava}>
            <Text style={styles.linkButtonText}>Connecter Strava</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {athlete && (
            <View style={styles.profileSection}>
              <Image
                source={{ uri: athlete.profile }}
                style={styles.profileImage}
              />
              <Text style={styles.athleteName}>
                {athlete.firstname} {athlete.lastname}
              </Text>
              {athlete.city && athlete.country && (
                <Text style={styles.athleteLocation}>
                  {athlete.city}, {athlete.country}
                </Text>
              )}
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Déconnexion</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.activitiesSection}>
            <Text style={styles.sectionTitle}>Activités récentes</Text>
            {activities.length === 0 ? (
              <Text style={styles.noActivitiesText}>Aucune activité trouvée</Text>
            ) : (
              activities.map((activity) => (
                <View key={activity.id} style={styles.activityCard}>
                  <View style={styles.activityHeader}>
                    <Text style={styles.activityName}>{activity.name}</Text>
                    <Text style={styles.activityType}>{activity.sport_type}</Text>
                  </View>
                  <Text style={styles.activityDate}>
                    {formatDate(activity.start_date_local)}
                  </Text>
                  <View style={styles.activityStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Distance</Text>
                      <Text style={styles.statValue}>
                        {formatDistance(activity.distance)}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Durée</Text>
                      <Text style={styles.statValue}>
                        {formatDuration(activity.moving_time)}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Vitesse moy.</Text>
                      <Text style={styles.statValue}>
                        {formatSpeed(activity.average_speed)}
                      </Text>
                    </View>
                    {activity.average_heartrate && (
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>FC moy.</Text>
                        <Text style={styles.statValue}>
                          {Math.round(activity.average_heartrate)} bpm
                        </Text>
                      </View>
                    )}
                  </View>
                  {activity.total_elevation_gain > 0 && (
                    <Text style={styles.elevationText}>
                      Dénivelé: {Math.round(activity.total_elevation_gain)}m
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
        </>
      )}

      <Popup
        visible={popup.visible}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={hidePopup}
        onConfirm={popup.onConfirm}
        confirmText={popup.confirmText}
        showCancel={popup.showCancel}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.family,
    color: colors.textSecondary,
  },
  notLinkedContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  notLinkedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notLinkedIcon: {
    marginBottom: spacing.xl,
  },
  notLinkedTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: fonts.weights.bold,
    fontFamily: fonts.family,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  notLinkedText: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.family,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxxl,
    lineHeight: 24,
  },
  linkButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    width: '90%',
    alignItems: 'center',
    ...shadows.md,
  },
  linkButtonText: {
    color: colors.textInverse,
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.family,
    fontWeight: fonts.weights.semibold,
  },
  profileSection: {
    backgroundColor: colors.card,
    padding: spacing.xl,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  athleteName: {
    fontSize: fonts.sizes.xxl,
    fontWeight: fonts.weights.bold,
    fontFamily: fonts.family,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  athleteLocation: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.family,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  logoutButton: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
  },
  logoutButtonText: {
    color: colors.textInverse,
    fontSize: fonts.sizes.md,
    fontFamily: fonts.family,
    fontWeight: fonts.weights.semibold,
  },
  activitiesSection: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: fonts.weights.bold,
    fontFamily: fonts.family,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  noActivitiesText: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.family,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  activityCard: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  activityName: {
    fontSize: fonts.sizes.xl,
    fontWeight: fonts.weights.semibold,
    fontFamily: fonts.family,
    color: colors.text,
    flex: 1,
  },
  activityType: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.family,
    color: colors.accent,
    fontWeight: fonts.weights.semibold,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  activityDate: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.family,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  activityStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.family,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.semibold,
    fontFamily: fonts.family,
    color: colors.accent,
  },
  elevationText: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.family,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  backButton: {
    backgroundColor: colors.primary,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.md,
  },
  backButtonText: {
    color: colors.textInverse,
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.family,
    fontWeight: fonts.weights.semibold,
  },
});
