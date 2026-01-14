import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList } from '../App';
import stravaService, { StravaAthlete, StravaActivity } from '../services/stravaService';

type StravaProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Profile'>,
  NativeStackNavigationProp<any>
>;

type Props = {
  navigation: StravaProfileScreenNavigationProp;
};

export default function StravaProfileScreen({ navigation }: Props) {
  const [athlete, setAthlete] = useState<StravaAthlete | null>(null);
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStravaLinked, setIsStravaLinked] = useState(false);

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
      Alert.alert('Erreur', 'Impossible de charger les données');
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
    Alert.alert(
      'Connecter Strava',
      'Connectez votre compte Strava pour synchroniser vos activités',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Connecter',
          onPress: () => {
            Alert.alert('Info', 'Fonctionnalité de connexion Strava à venir');
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter de Strava?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await stravaService.logout();
            navigation.navigate('StravaLogin');
          },
        },
      ]
    );
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
        <ActivityIndicator size="large" color="#FC4C02" />
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#b0b0b0',
  },
  notLinkedContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  notLinkedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notLinkedTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
    textAlign: 'center',
  },
  notLinkedText: {
    fontSize: 16,
    color: '#b0b0b0',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  linkButton: {
    backgroundColor: 'rgba(252, 76, 2, 0.9)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#FC4C02',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,
    width: '90%',
    alignItems: 'center',
  },
  linkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  profileSection: {
    backgroundColor: 'rgba(45, 45, 45, 0.8)',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(252, 76, 2, 0.3)',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.5)',
  },
  athleteName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  athleteLocation: {
    fontSize: 16,
    color: '#b0b0b0',
    marginBottom: 15,
  },
  logoutButton: {
    backgroundColor: 'rgba(199, 62, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  activitiesSection: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  noActivitiesText: {
    fontSize: 16,
    color: '#b0b0b0',
    textAlign: 'center',
    marginTop: 20,
  },
  activityCard: {
    backgroundColor: 'rgba(45, 45, 45, 0.7)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(252, 76, 2, 0.2)',
    elevation: 2,
    shadowColor: '#FC4C02',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1.41,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  activityName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  activityType: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
    backgroundColor: 'rgba(252, 76, 2, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activityDate: {
    fontSize: 14,
    color: '#808080',
    marginBottom: 10,
  },
  activityStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#b0b0b0',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  elevationText: {
    fontSize: 14,
    color: '#b0b0b0',
    marginTop: 10,
  },
  backButton: {
    backgroundColor: 'rgba(252, 76, 2, 0.9)',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
