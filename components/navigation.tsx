"use client"

import { useState, useEffect } from "react"
import { Home, History, BarChart3, Plus, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Navigation() {
  const [pendingCount, setPendingCount] = useState(0)
  const pathname = usePathname()

  useEffect(() => {
    const orders = JSON.parse(localStorage.getItem("orders") || "[]")
    const pending = orders.filter((order: any) => order.status !== "completed").length
    setPendingCount(pending)
  }, [])

  const navItems = [
    { href: "/", icon: Home, label: "Inicio", badge: pendingCount > 0 ? pendingCount : null },
    { href: "/history", icon: History, label: "Historial" },
    { href: "/statistics", icon: BarChart3, label: "Estadísticas" },
    { href: "/products", icon: Package, label: "Productos" },
    { href: "/orders", icon: Plus, label: "Nuevo" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 relative ${
                isActive ? "bg-lime-400 text-black" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
              {item.badge && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
