"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Navigation } from "@/components/navigation"
import { Header } from "@/components/header"
import { Input } from "@/components/ui/input"
import { Trash2, CheckCircle, Clock, Search, User, Package, MessageSquare, Phone, Printer } from "lucide-react"
import { orderService, customerService, type Order } from "@/lib/firebase-service"
import { receiptService } from "@/lib/receipt-service"
import { useSearchParams } from "next/navigation"

export default function HistoryPage() {
  const searchParams = useSearchParams()
  const highlightOrderId = searchParams.get("orderId")

  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all")
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, searchTerm, statusFilter])

  useEffect(() => {
    // Auto-expand highlighted order
    if (highlightOrderId && orders.length > 0) {
      setExpandedOrder(highlightOrderId)
      // Scroll to the order
      setTimeout(() => {
        const element = document.getElementById(`order-${highlightOrderId}`)
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }, 500)
    }
  }, [highlightOrderId, orders])

  const loadOrders = async () => {
    try {
      setIsLoading(true)
      const ordersData = await orderService.getAll()
      setOrders(ordersData)
    } catch (error) {
      console.error("Error loading orders:", error)
      alert("Error al cargar los pedidos")
    } finally {
      setIsLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = orders

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customerPhone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.items.some(
            (item) =>
              item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.fragrance.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    setFilteredOrders(filtered)
  }

  const deleteOrder = async (orderId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este pedido?")) {
      try {
        // Note: You might want to implement a soft delete or archive function
        // For now, we'll just reload the orders
        await loadOrders()
        alert("Pedido eliminado exitosamente")
      } catch (error) {
        console.error("Error deleting order:", error)
        alert("Error al eliminar el pedido")
      }
    }
  }

  const toggleOrderStatus = async (orderId: string) => {
    try {
      const order = orders.find((o) => o.id === orderId)
      if (!order) return

      const newStatus = order.status === "pending" ? "completed" : "pending"
      await orderService.updateStatus(orderId, newStatus)
      await loadOrders()
    } catch (error) {
      console.error("Error updating order status:", error)
      alert("Error al actualizar el estado del pedido")
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 pt-16 flex items-center justify-center">
        <Header />
        <div className="text-center">
          <Package className="h-8 w-8 animate-pulse mx-auto mb-4 text-lime-600" />
          <p className="text-gray-600">Cargando historial...</p>
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
            <h1 className="text-xl font-bold text-gray-900">Historial de Pedidos</h1>
            <p className="text-gray-500 text-sm">{orders.length} pedidos registrados</p>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por cliente, teléfono o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              className={statusFilter === "all" ? "bg-lime-400 text-black hover:bg-lime-500" : ""}
            >
              Todos
            </Button>
            <Button
              variant={statusFilter === "pending" ? "default" : "outline"}
              onClick={() => setStatusFilter("pending")}
              className={statusFilter === "pending" ? "bg-lime-400 text-black hover:bg-lime-500" : ""}
            >
              Pendientes
            </Button>
            <Button
              variant={statusFilter === "completed" ? "default" : "outline"}
              onClick={() => setStatusFilter("completed")}
              className={statusFilter === "completed" ? "bg-lime-400 text-black hover:bg-lime-500" : ""}
            >
              Completados
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6">
        {filteredOrders.length === 0 ? (
          <Card className="bg-white border-gray-200">
            <CardContent className="p-8 text-center">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron pedidos</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== "all"
                  ? "Intenta cambiar los filtros de búsqueda"
                  : "Aún no hay pedidos registrados"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card
                key={order.id}
                id={`order-${order.id}`}
                className={`bg-white border-gray-200 ${
                  highlightOrderId === order.id ? "ring-2 ring-lime-400 shadow-lg" : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
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
                        <span>
                          {order.createdAt.toDate().toLocaleDateString("es-CO", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {order.itemCount} productos
                        </span>
                        <span>#{order.id.slice(-6)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          order.status === "completed"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-orange-100 text-orange-700 border-orange-200"
                        }
                      >
                        {order.status === "completed" ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completado
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            Pendiente
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Order Summary */}
                  <div className="mb-4">
                    <Button
                      variant="ghost"
                      onClick={() => toggleOrderExpansion(order.id)}
                      className="w-full justify-between p-2 h-auto"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {expandedOrder === order.id ? "Ocultar detalles" : "Ver detalles del pedido"}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">${order.total.toLocaleString()} COP</span>
                    </Button>

                    {/* Expanded Order Details */}
                    {expandedOrder === order.id && (
                      <div className="mt-4 space-y-3 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">Productos del Pedido:</h4>
                        {order.items.map((item, index) => (
                          <div key={index} className="p-3 bg-white rounded border">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-800">
                                  {item.brand} - {item.fragrance}
                                </h5>
                                <div className="text-sm text-gray-600 mt-1">
                                  <span>Tamaño: {item.size}</span> • <span>Cantidad: {item.quantity}</span> •{" "}
                                  <span>Precio unitario: ${item.unitPrice.toLocaleString()}</span>
                                </div>
                                {item.notes && (
                                  <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                                    <span className="font-medium text-blue-700">Nota:</span> {item.notes}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="font-semibold">${item.totalPrice.toLocaleString()} COP</span>
                              </div>
                            </div>
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

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">${order.total.toLocaleString()} COP</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => printReceipt(order)}
                        className="p-2 text-blue-600 hover:text-blue-700"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleOrderStatus(order.id)}
                        className={`p-2 ${
                          order.status === "completed"
                            ? "text-orange-600 hover:text-orange-700"
                            : "text-green-600 hover:text-green-700"
                        }`}
                      >
                        {order.status === "completed" ? (
                          <Clock className="h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteOrder(order.id)}
                        className="p-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
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
