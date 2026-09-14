/**
 * Énumération des niveaux d'abonnement
 */
export enum SubscriptionTier {
  GRATUIT = 'GRATUIT',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
}

/**
 * Énumération des types d'abonnement
 */
export enum SubscriptionType {
  PRODUCTEUR = 'PRODUCTEUR',
  ACHETEUR = 'ACHETEUR',
}

/**
 * Énumération des statuts d'abonnement
 */
export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
}

/**
 * Énumération des canaux de notification
 */
export enum NotificationChannel {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  APP = 'APP',
  WHATSAPP = 'WHATSAPP',
  CALL = 'CALL',
}

/**
 * Énumération de la fréquence de notification
 */
export enum NotificationFrequency {
  REALTIME = 'REALTIME',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

/**
 * Énumération des types de paiement
 */
export enum PaymentMethod {
  MOBILE_MONEY = 'MOBILE_MONEY',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CRYPTO = 'CRYPTO',
  CASH = 'CASH',
}

/**
 * Énumération des statuts de paiement
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

/**
 * Énumération des fonctionnalités (pour usage tracking)
 */
export enum FeatureKey {
  MAX_ANNOUNCEMENTS = 'MAX_ANNOUNCEMENTS',
  MAX_SMS_PER_MONTH = 'MAX_SMS_PER_MONTH',
  MAX_RELATIONSHIPS_PER_MONTH = 'MAX_RELATIONSHIPS_PER_MONTH',
  PRICE_HISTORY_DAYS = 'PRICE_HISTORY_DAYS',
  MATURITY_REMINDERS = 'MATURITY_REMINDERS',
  PRICE_REMINDERS = 'PRICE_REMINDERS',
  WHATSAPP_ENABLED = 'WHATSAPP_ENABLED',
  CALLS_ENABLED = 'CALLS_ENABLED',
  API_ACCESS = 'API_ACCESS',
  ADVANCED_FILTERS = 'ADVANCED_FILTERS',
  EXPORT_DATA = 'EXPORT_DATA',
  SUPPORT_PRIORITY = 'SUPPORT_PRIORITY',
}
