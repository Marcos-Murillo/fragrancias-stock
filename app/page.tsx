"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Navigation } from "@/components/navigation"
import { Header } from "@/components/header"
import { Clock, CheckCircle, AlertCircle, User, Package, MessageSquare, Phone, Printer } from "lucide-react"
import { orderService, customerService, type Order } from "@/lib/firebase-service"
import { receiptService } from "@/lib/receipt-service"

export default function HomePage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState({
    pending: 0,
    completed: 0,
    totalRevenue: 0,
  })
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setIsLoading(true)
      const ordersData = await orderService.getAll()
      setOrders(ordersData)

      const pending = ordersData.filter((order) => order.status !== "completed").length
      const completed = ordersData.filter((order) => order.status === "completed").length
      const totalRevenue = ordersData
        .filter((order) => order.status === "completed")
        .reduce((sum, order) => sum + order.total, 0)

      setStats({ pending, completed, totalRevenue })
    } catch (error) {
      console.error("Error loading orders:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsCompleted = async (orderId: string) => {
    try {
      await orderService.updateStatus(orderId, "completed")
      await loadOrders()
    } catch (error) {
      console.error("Error updating order:", error)
      alert("Error al actualizar el pedido")
    }
  }

  const printReceipt = async (order: Order) => {
    try {
      const customer = await customerService.getById(order.customerId)

      const receiptData = {
        order,
        customer,
        businessInfo: {
          name: "LotionPro",
          address: "Calle Principal #123, Ciudad",
          phone: "300-123-4567",
          email: "info@lotionpro.com",
        },
        receiptNumber: `R-${order.id.slice(-8).toUpperCase()}`,
        printDate: new Date(),
      }

      receiptService.printReceipt(receiptData)
    } catch (error) {
      console.error("Error printing receipt:", error)
      alert("Error al imprimir el recibo")
    }
  }

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId)
  }

  const pendingOrders = orders.filter((order) => order.status !== "completed")

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 pt-16 flex items-center justify-center">
        <Header />
        <div className="text-center">
          <Package className="h-8 w-8 animate-pulse mx-auto mb-4 text-lime-600" />
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-16">
      <Header />
      <div className="bg-white px-6 pt-6 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-lime-400 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-black" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Bienvenido de vuelta</p>
            <h1 className="text-xl font-bold text-gray-900">Administrador</h1>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-lime-50 border-lime-200">
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 text-lime-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-lime-700">{stats.pending}</p>
              <p className="text-xs text-lime-600">Pendientes</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
              <p className="text-xs text-green-600">Completados</p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <AlertCircle className="h-5 w-5 text-blue-600 mx-auto mb-2" />
              <p className="text-lg font-bold text-blue-700">${(stats.totalRevenue / 1000).toFixed(0)}K</p>
              <p className="text-xs text-blue-600">Ingresos</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="px-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Pedidos Pendientes</h2>
          {stats.pending > 0 && (
            <Badge className="bg-lime-400 text-black hover:bg-lime-500">{stats.pending} activos</Badge>
          )}
        </div>

        {pendingOrders.length === 0 ? (
          <Card className="bg-white border-gray-200">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">¡Todo al día!</h3>
              <p className="text-gray-500">No tienes pedidos pendientes</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingOrders.map((order) => (
              <Card key={order.id} className="bg-white border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base font-semibold text-gray-900">{order.customerName}</CardTitle>
                        {order.customerPhone && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Phone className="h-3 w-3" />
                            {order.customerPhone}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{order.createdAt.toDate().toLocaleDateString("es-CO")}</span>
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {order.itemCount} productos
                        </span>
                        <span>#{order.id.slice(-6)}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">
                      Pendiente
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Quick Preview */}
                  <div className="mb-4">
                    <Button
                      variant="ghost"
                      onClick={() => toggleOrderExpansion(order.id)}
                      className="w-full justify-between p-2 h-auto text-left"
                    >
                      <div>
                        <div className="text-sm text-gray-600 mb-1">
                          {expandedOrder === order.id ? "Ocultar detalles" : "Ver productos del pedido"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.items.slice(0, 2).map((item, index) => (
                            <span key={index}>
                              {item.brand} - {item.fragrance} ({item.size}) ×{item.quantity}
                              {index < Math.min(order.items.length, 2) - 1 && ", "}
                            </span>
                          ))}
                          {order.items.length > 2 && ` +${order.items.length - 2} más`}
                        </div>
                      </div>
                      <span className="text-lg font-bold text-gray-900">${order.total.toLocaleString()} COP</span>
                    </Button>

                    {/* Expanded Details */}
                    {expandedOrder === order.id && (
                      <div className="mt-4 space-y-3 p-4 bg-gray-50 rounded-lg">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-start p-3 bg-white rounded border">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-800">
                                {item.brand} - {item.fragrance}
                              </h4>
                              <div className="text-sm text-gray-600 mt-1">
                                <span>Tamaño: {item.size}</span> • <span>Cantidad: {item.quantity}</span> •{" "}
                                <span>Precio: ${item.unitPrice.toLocaleString()} c/u</span>
                              </div>
                              {item.notes && (
                                <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                                  <span className="font-medium text-blue-700">Nota:</span> {item.notes}
                                </div>
                              )}
                            </div>
                            <span className="font-semibold">${item.totalPrice.toLocaleString()}</span>
                          </div>
                        ))}

                        {order.notes && (
                          <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="h-4 w-4 text-yellow-600 mt-0.5" />
                              <div>
                                <span className="font-medium text-yellow-800">Instrucciones Especiales:</span>
                                <p className="text-yellow-700 mt-1">{order.notes}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">${order.total.toLocaleString()} COP</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => printReceipt(order)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => markAsCompleted(order.id)}
                        className="bg-lime-400 hover:bg-lime-500 text-black font-medium"
                      >
                        Marcar Completado
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Navigation />
    </div>
  )
}
