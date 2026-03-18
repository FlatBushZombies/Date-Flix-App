import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { AppNotification } from "@/types"
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/utils/supabase-helpers"

export function useNotifications(userId?: string) {
  const [items, setItems] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const channelName = useMemo(() => (userId ? `notifications:${userId}` : null), [userId])

  const refresh = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const [list, count] = await Promise.all([
        getNotifications(userId),
        getUnreadNotificationCount(userId),
      ])
      setItems(list)
      setUnreadCount(count)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [userId])

  useEffect(() => {
    if (!userId || !channelName) return

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const n = payload.new as AppNotification
          setItems((prev) => [n, ...prev])
          setUnreadCount((c) => c + 1)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as AppNotification
          setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, channelName])

  const markAllRead = async () => {
    if (!userId) return false
    const ok = await markAllNotificationsRead(userId)
    if (ok) {
      setUnreadCount(0)
      setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })))
    }
    return ok
  }

  const markRead = async (id: string) => {
    const ok = await markNotificationRead(id)
    if (ok) {
      setItems((prev) =>
        prev.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: new Date().toISOString() } : n)),
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    }
    return ok
  }

  return { items, unreadCount, loading, refresh, markAllRead, markRead }
}

