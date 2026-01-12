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
import stravaService, { StravaConfig } from '../services/stravaService';

WebBrowser.maybeCompleteAuthSession();

type Props = {
  onAuthSuccess: () => void;
  onAuthError?: (error: string) => void;
};

export default function StravaConnectButton({ onAuthSuccess, onAuthError }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [stravaConfig, setStravaConfig] = useState<StravaConfig | null>(null);

  const redirectUri = AuthSession.makeRedirectUri({
    path: 'exchange_token'
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const config = await stravaService.getConfig();
      setStravaConfig(config);
    } catch (error) {
      Alert.alert(
        'Erreur de connexion',
        'Impossible de se connecter au backend. Vérifiez que le serveur est démarré et que vous êtes sur le même réseau WiFi.'
      );
    }
  };

  const discovery = {
    authorizationEndpoint: stravaConfig?.authorizationEndpoint || 'https://www.strava.com/oauth/mobile/authorize',
  };

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: stravaConfig?.clientId || '',
      scopes: stravaConfig?.scopes || [],
      redirectUri: redirectUri,
      responseType: AuthSession.ResponseType.Code,
      extraParams: {
        approval_prompt: 'force',
      },
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      handleAuthorizationCode(code);
    } else if (response?.type === 'error') {
      Alert.alert('Erreur', 'Échec de la connexion à Strava');
      setIsLoading(false);
      onAuthError?.('Échec de la connexion à Strava');
    } else if (response?.type === 'dismiss') {
      setIsLoading(false);
    }
  }, [response]);

  const handleAuthorizationCode = async (code: string) => {
    setIsLoading(true);
    try {
      const tokenResponse = await stravaService.exchangeCodeForToken(code);
      if (tokenResponse) {
        onAuthSuccess();
      } else {
        Alert.alert('Erreur', 'Impossible d\'obtenir le token d\'accès');
        onAuthError?.('Impossible d\'obtenir le token d\'accès');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la connexion');
      onAuthError?.('Une erreur est survenue lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await promptAsync();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de se connecter à Strava');
      setIsLoading(false);
      onAuthError?.('Impossible de se connecter à Strava');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>STRAVA</Text>
      <Text style={styles.title}>Connectez-vous à Strava</Text>
      <Text style={styles.subtitle}>
        Accédez à votre profil et vos activités
      </Text>

      <TouchableOpacity
        style={[styles.button, (isLoading || !stravaConfig) && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={isLoading || !request || !stravaConfig}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : !stravaConfig ? (
          <Text style={styles.buttonText}>Chargement...</Text>
        ) : (
          <Text style={styles.buttonText}>Se connecter avec Strava</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 20,
    letterSpacing: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#b0b0b0',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: 'rgba(252, 76, 2, 0.9)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    width: '100%',
    elevation: 3,
    shadowColor: '#FC4C02',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
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
});
