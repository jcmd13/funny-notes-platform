/**
 * Cross-platform notification adapter interface
 * Abstracts push notifications, local notifications, and system integration
 */
export interface INotificationAdapter {
  // Permission management
  getNotificationPermission(): Promise<PermissionResult>
  requestNotificationPermission(): Promise<PermissionResult>
  
  // Local notifications
  scheduleLocalNotification(notification: LocalNotification): Promise<string>
  cancelLocalNotification(id: string): Promise<void>
  cancelAllLocalNotifications(): Promise<void>
  getScheduledNotifications(): Promise<LocalNotification[]>
  
  // Push notifications
  registerForPushNotifications(): Promise<PushRegistrationResult>
  unregisterFromPushNotifications(): Promise<void>
  getPushToken(): Promise<string | null>
  
  // Notification handling
  onNotificationReceived(callback: (notification: ReceivedNotification) => void): void
  onNotificationClicked(callback: (notification: ReceivedNotification) => void): void
  
  // Badge management (mobile platforms)
  setBadgeCount(count: number): Promise<void>
  getBadgeCount(): Promise<number>
  clearBadge(): Promise<void>
  
  // System integration
  createNotificationChannel(channel: NotificationChannel): Promise<void>
  updateNotificationChannel(channel: NotificationChannel): Promise<void>
  deleteNotificationChannel(channelId: string): Promise<void>
}

export interface LocalNotification {
  id?: string
  title: string
  body: string
  data?: Record<string, any>
  
  // Scheduling
  scheduledTime?: Date
  repeatInterval?: RepeatInterval
  
  // Appearance
  icon?: string
  image?: string
  badge?: number
  sound?: string | boolean
  
  // Behavior
  silent?: boolean
  priority?: NotificationPriority
  category?: string
  channelId?: string
  
  // Actions
  actions?: NotificationAction[]
}

export interface NotificationAction {
  id: string
  title: string
  icon?: string
  destructive?: boolean
  requiresAuthentication?: boolean
}

export interface ReceivedNotification extends LocalNotification {
  id: string
  receivedAt: Date
  fromPush: boolean
  actionId?: string // If triggered by action
}

export interface PushRegistrationResult {
  success: boolean
  token?: string
  error?: string
}

export interface NotificationChannel {
  id: string
  name: string
  description?: string
  importance?: NotificationImportance
  sound?: string
  vibration?: boolean
  lights?: boolean
  badge?: boolean
}

export type RepeatInterval = 
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'year'

export type NotificationPriority = 
  | 'min'
  | 'low'
  | 'default'
  | 'high'
  | 'max'

export type NotificationImportance = 
  | 'none'
  | 'min'
  | 'low'
  | 'default'
  | 'high'

export interface PermissionResult {
  granted: boolean
  canRequestAgain: boolean
  reason?: string
}