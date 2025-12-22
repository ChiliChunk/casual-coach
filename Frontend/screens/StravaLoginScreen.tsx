import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import stravaService from '../services/stravaService';
import { STRAVA_CONFIG } from '../config/strava.config';

WebBrowser.maybeCompleteAuthSession();

type StravaLoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'StravaLogin'
>;

type Props = {
  navigation: StravaLoginScreenNavigationProp;
};

export default function StravaLoginScreen({ navigation }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Utilise le proxy Expo pour gérer le callback OAuth
  // Le proxy transforme l'URL HTTPS en deep link pour l'app
  const redirectUri = AuthSession.makeRedirectUri({
    path: 'exchange_token'
  });

  // Afficher l'URI pour debug
  console.log('Redirect URI:', redirectUri);

  const discovery = {
    authorizationEndpoint: STRAVA_CONFIG.AUTHORIZATION_ENDPOINT,
  };

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: STRAVA_CONFIG.CLIENT_ID,
      scopes: STRAVA_CONFIG.SCOPES,
      redirectUri: redirectUri,
      responseType: AuthSession.ResponseType.Code,
      extraParams: {
        approval_prompt: 'force', // Force la demande d'autorisation même si déjà autorisé
      },
    },
    discovery
  );

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      handleAuthorizationCode(code);
    } else if (response?.type === 'error') {
      Alert.alert('Erreur', 'Échec de la connexion à Strava');
      setIsLoading(false);
    } else if (response?.type === 'dismiss') {
      setIsLoading(false);
    }
  }, [response]);

  const checkAuthentication = async () => {
    setIsCheckingAuth(true);
    const isAuth = await stravaService.isAuthenticated();
    if (isAuth) {
      navigation.replace('StravaProfile');
    }
    setIsCheckingAuth(false);
  };

  const handleAuthorizationCode = async (code: string) => {
    setIsLoading(true);
    try {
      const tokenResponse = await stravaService.exchangeCodeForToken(code);
      if (tokenResponse) {
        navigation.replace('StravaProfile');
      } else {
        Alert.alert('Erreur', 'Impossible d\'obtenir le token d\'accès');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la connexion');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await promptAsync();
    } catch (error) {
      console.error('Error during login:', error);
      Alert.alert('Erreur', 'Impossible de se connecter à Strava');
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FC4C02" />
        <Text style={styles.loadingText}>Vérification de l'authentification...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>STRAVA</Text>
        <Text style={styles.title}>Connectez-vous à Strava</Text>
        <Text style={styles.subtitle}>
          Accédez à votre profil et vos activités
        </Text>
        <Text style={styles.debugText}>Redirect URI: {redirectUri}</Text>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading || !request}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Se connecter avec Strava</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '80%',
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FC4C02',
    marginBottom: 20,
    letterSpacing: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FC4C02',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    width: '100%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  debugText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
    textAlign: 'center',
  },
});
