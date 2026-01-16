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
import { colors, fonts, spacing, borderRadius, shadows } from '../constants/theme';

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
      <Text style={styles.title}>Connectez-vous à Strava pour un plan d'entraînement personnalisé</Text>
      <Text style={styles.subtitle}>
        Connectez votre compte Strava pour synchroniser vos activités et obtenir des plans d'entraînement adaptés à votre niveau et vos objectifs.
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
    padding: spacing.xl,
  },
  logo: {
    fontSize: fonts.sizes.xxxl,
    fontWeight: fonts.weights.bold,
    fontFamily: fonts.family,
    color: colors.accent,
    marginBottom: spacing.xl,
    letterSpacing: 4,
  },
  title: {
    fontSize: fonts.sizes.xxl,
    fontWeight: fonts.weights.bold,
    fontFamily: fonts.family,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.family,
    color: colors.textSecondary,
    marginBottom: spacing.xxxl,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    width: '100%',
    ...shadows.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.textInverse,
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.semibold,
    fontFamily: fonts.family,
    textAlign: 'center',
  },
});
