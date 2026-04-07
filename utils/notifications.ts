import { supabase } from '@/lib/supabase'
import * as Notifications from 'expo-notifications'

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

// Request permissions and get push token
export async function registerForPushNotificationsAsync() {
  let token

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.warn('Failed to get push token for push notification!')
    return null
  }

  try {
    token = (await Notifications.getExpoPushTokenAsync()).data
    console.log('Push token:', token)
  } catch (error) {
    console.error('Error getting push token:', error)
    return null
  }

  return token
}

// Store push token in user profile
export async function updateUserPushToken(userId: string, pushToken: string | null) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ push_token: pushToken })
      .eq('id', userId)

    if (error) {
      console.error('Error updating push token:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating push token:', error)
    return false
  }
}

// Send push notification to a user
export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: any
) {
  const message = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data: data || {},
  }

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    const result = await response.json()
    console.log('Push notification sent:', result)

    return result
  } catch (error) {
    console.error('Error sending push notification:', error)
    return null
  }
}

// Get user push token from database
export async function getUserPushToken(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('push_token')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error getting push token:', error)
      return null
    }

    return data?.push_token || null
  } catch (error) {
    console.error('Error getting push token:', error)
    return null
  }
}