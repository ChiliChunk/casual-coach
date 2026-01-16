import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius, shadows } from '../constants/theme';

type PopupType = 'success' | 'error' | 'info' | 'warning';

interface PopupProps {
  visible: boolean;
  onClose: () => void;
  type?: PopupType;
  title: string;
  message: string;
  buttonText?: string;
  onConfirm?: () => void;
  confirmText?: string;
  showCancel?: boolean;
  cancelText?: string;
}

const getIconConfig = (type: PopupType) => {
  switch (type) {
    case 'success':
      return { name: 'checkmark-circle' as const, color: colors.success };
    case 'error':
      return { name: 'close-circle' as const, color: colors.error };
    case 'warning':
      return { name: 'warning' as const, color: colors.warning };
    case 'info':
    default:
      return { name: 'information-circle' as const, color: colors.primary };
  }
};

export default function Popup({
  visible,
  onClose,
  type = 'info',
  title,
  message,
  buttonText = 'OK',
  onConfirm,
  confirmText,
  showCancel = false,
  cancelText = 'Annuler',
}: PopupProps) {
  const iconConfig = getIconConfig(type);
  const hasConfirmAction = onConfirm !== undefined;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Ionicons name={iconConfig.name} size={48} color={iconConfig.color} />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            <View style={styles.buttonContainer}>
              {(showCancel || hasConfirmAction) && (
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>{cancelText}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.button,
                  type === 'error' && styles.buttonError,
                  (showCancel || hasConfirmAction) && styles.buttonFlex,
                ]}
                onPress={hasConfirmAction ? onConfirm : onClose}
              >
                <Text style={styles.buttonText}>
                  {hasConfirmAction ? confirmText || buttonText : buttonText}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    ...shadows.lg,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fonts.sizes.xl,
    fontWeight: fonts.weights.bold,
    fontFamily: fonts.family,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: fonts.sizes.md,
    fontFamily: fonts.family,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    width: '100%',
    alignItems: 'center',
  },
  buttonFlex: {
    flex: 1,
    width: 'auto',
  },
  buttonError: {
    backgroundColor: colors.error,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    color: colors.textInverse,
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.family,
    fontWeight: fonts.weights.semibold,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.family,
    fontWeight: fonts.weights.semibold,
  },
});
