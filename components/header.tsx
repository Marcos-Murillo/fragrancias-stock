"use client"

import { useState, useEffect } from "react"
import { Bell, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { realtimeService, type Order } from "@/lib/firebase-service"
import { useRouter } from "next/navigation"

interface Notification {
  id: string
  orderId: string
  customerName: string
  message: string
  timestamp: Date
  isRead: boolean
}

export function Header() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Load existing notifications from localStorage
    const savedNotifications = JSON.parse(localStorage.getItem("notifications") || "[]")
    setNotifications(savedNotifications)
    setUnreadCount(savedNotifications.filter((n: Notification) => !n.isRead).length)

    // Listen for new orders
    const unsubscribe = realtimeService.onOrdersChange((orders: Order[]) => {
      // Check for new orders (created in the last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      const newOrders = orders.filter((order) => {
        const orderDate = order.createdAt.toDate()
        return orderDate > fiveMinutesAgo && order.status === "pending"
      })

      // Create notifications for new orders
      const existingNotifications = JSON.parse(localStorage.getItem("notifications") || "[]")
      const existingOrderIds = existingNotifications.map((n: Notification) => n.orderId)

      const newNotifications = newOrders
        .filter((order) => !existingOrderIds.includes(order.id))
        .map((order) => ({
          id: `notif-${order.id}`,
          orderId: order.id,
          customerName: order.customerName,
          message: `Nuevo pedido de ${order.customerName} por $${order.total.toLocaleString()} COP`,
          timestamp: order.createdAt.toDate(),
          isRead: false,
        }))

      if (newNotifications.length > 0) {
        const updatedNotifications = [...newNotifications, ...existingNotifications].slice(0, 20) // Keep only last 20
        localStorage.setItem("notifications", JSON.stringify(updatedNotifications))
        setNotifications(updatedNotifications)
        setUnreadCount(updatedNotifications.filter((n) => !n.isRead).length)
      }
    })

    return () => unsubscribe()
  }, [])

  const markAsRead = (notificationId: string) => {
    const updatedNotifications = notifications.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    setNotifications(updatedNotifications)
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications))
    setUnreadCount(updatedNotifications.filter((n) => !n.isRead).length)
  }

  const goToOrder = (orderId: string, notificationId: string) => {
    markAsRead(notificationId)
    router.push(`/history?orderId=${orderId}`)
  }

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map((n) => ({ ...n, isRead: true }))
    setNotifications(updatedNotifications)
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications))
    setUnreadCount(0)
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-6 py-3 z-40">
      <div className="flex justify-between items-center">
        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-lime-400 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-black" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Administrador</p>
            <p className="text-xs text-gray-500">LotionPro System</p>
          </div>
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative p-2">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-3 border-b">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Notificaciones</h3>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                    Marcar todas como leídas
                  </Button>
                )}
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No hay notificaciones</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    onClick={() => goToOrder(notification.orderId, notification.id)}
                    className={`p-3 cursor-pointer ${!notification.isRead ? "bg-blue-50" : ""}`}
                  >
                    <div className="w-full">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-medium text-sm">{notification.customerName}</p>
                        {!notification.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{notification.message}</p>
                      <p className="text-xs text-gray-400">
                        {notification.timestamp.toLocaleDateString("es-CO", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
