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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import stravaService, { StravaAthlete, StravaActivity } from '../services/stravaService';

type StravaProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'StravaProfile'
>;

type Props = {
  navigation: StravaProfileScreenNavigationProp;
};

export default function StravaProfileScreen({ navigation }: Props) {
  const [athlete, setAthlete] = useState<StravaAthlete | null>(null);
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

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
    await loadData();
    setIsRefreshing(false);
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
            navigation.replace('StravaLogin');
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
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {athlete && (
        <View style={styles.profileSection}>
          <Image
            source={{ uri: athlete.profile_medium }}
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

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.backButtonText}>Retour à l'accueil</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  profileSection: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  athleteName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  athleteLocation: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
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
    color: '#333',
    marginBottom: 15,
  },
  noActivitiesText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  activityCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
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
    color: '#333',
    flex: 1,
  },
  activityType: {
    fontSize: 12,
    color: '#FC4C02',
    fontWeight: '600',
    backgroundColor: '#FFE8E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activityDate: {
    fontSize: 14,
    color: '#999',
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
    color: '#666',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  elevationText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  backButton: {
    backgroundColor: '#007AFF',
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
