import { registerForPushNotificationsAsync, updateUserPushToken } from '@/utils/notifications'
import { useUser } from '@clerk/clerk-expo'
import { useEffect } from 'react'

export function PushNotificationHandler() {
  const { user } = useUser()

  useEffect(() => {
    if (!user?.id) return

    const setupPushNotifications = async () => {
      try {
        const pushToken = await registerForPushNotificationsAsync()
        if (pushToken) {
          await updateUserPushToken(user.id, pushToken)
          console.log('Push notifications registered for user:', user.id)
        }
      } catch (error) {
        console.error('Failed to setup push notifications:', error)
      }
    }

    setupPushNotifications()
  }, [user?.id])

  return null
}