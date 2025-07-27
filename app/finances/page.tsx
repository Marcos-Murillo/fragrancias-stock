"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Calendar, Eye } from "lucide-react"
import Link from "next/link"

interface Order {
  id: string
  items: Array<{
    product: { brand: string; fragrance: string }
    size: string
    quantity: number
    price: number
  }>
  total: number
  date: string
}

interface MonthlyData {
  month: string
  year: number
  totalRevenue: number
  investment: number
  netRevenue: number
  orderCount: number
  orders: Order[]
}

export default function FinancesPage() {
  const [monthlyInvestment, setMonthlyInvestment] = useState("")
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [selectedMonth, setSelectedMonth] = useState<MonthlyData | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)

  useEffect(() => {
    loadFinancialData()
  }, [])

  const loadFinancialData = () => {
    const orders: Order[] = JSON.parse(localStorage.getItem("orders") || "[]")
    const investments = JSON.parse(localStorage.getItem("investments") || "{}")

    // Group orders by month
    const monthlyGroups: { [key: string]: Order[] } = {}

    orders.forEach((order) => {
      const date = new Date(order.date)
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`
      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = []
      }
      monthlyGroups[monthKey].push(order)
    })

    // Create monthly data
    const data: MonthlyData[] = Object.entries(monthlyGroups)
      .map(([monthKey, monthOrders]) => {
        const [year, month] = monthKey.split("-").map(Number)
        const monthName = new Date(year, month).toLocaleDateString("es-CO", { month: "long", year: "numeric" })
        const totalRevenue = monthOrders.reduce((sum, order) => sum + order.total, 0)
        const investment = investments[monthKey] || 0

        return {
          month: monthName,
          year,
          totalRevenue,
          investment,
          netRevenue: totalRevenue - investment,
          orderCount: monthOrders.length,
          orders: monthOrders,
        }
      })
      .sort((a, b) => b.year - a.year)

    setMonthlyData(data)
    if (data.length > 0) {
      setSelectedMonth(data[0]) // Select current month by default
    }
  }

  const saveInvestment = () => {
    if (!selectedMonth || !monthlyInvestment) return

    const investments = JSON.parse(localStorage.getItem("investments") || "{}")
    const monthKey = `${selectedMonth.year}-${new Date().getMonth()}`
    investments[monthKey] = Number.parseFloat(monthlyInvestment)
    localStorage.setItem("investments", JSON.stringify(investments))

    setMonthlyInvestment("")
    loadFinancialData()
  }

  const currentMonth = monthlyData[0] || {
    month: new Date().toLocaleDateString("es-CO", { month: "long", year: "numeric" }),
    year: new Date().getFullYear(),
    totalRevenue: 0,
    investment: 0,
    netRevenue: 0,
    orderCount: 0,
    orders: [],
  }

  if (showOrderDetails && selectedMonth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              onClick={() => setShowOrderDetails(false)}
              className="p-2 hover:bg-white/50 rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Detalle de Ventas - {selectedMonth.month}
            </h1>
          </div>

          <div className="grid gap-6">
            {selectedMonth.orders.map((order, index) => (
              <Card key={order.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Pedido #{order.id}</CardTitle>
                    <Badge className="bg-green-100 text-green-700">${order.total.toLocaleString()} COP</Badge>
                  </div>
                  <CardDescription>
                    {new Date(order.date).toLocaleDateString("es-CO", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                        <div>
                          <h4 className="font-medium">
                            {item.product.brand} - {item.product.fragrance}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {item.size} × {item.quantity} unidades
                          </p>
                        </div>
                        <span className="font-semibold">${(item.price * item.quantity).toLocaleString()} COP</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" className="p-2 hover:bg-white/50 rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Gestión Financiera
          </h1>
        </div>

        {/* Current Month Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="h-4 w-4" />
                Recaudo Real
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${currentMonth.totalRevenue.toLocaleString()} COP</div>
              <p className="text-green-100 text-sm">{currentMonth.month}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingDown className="h-4 w-4" />
                Inversión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${currentMonth.investment.toLocaleString()} COP</div>
              <p className="text-red-100 text-sm">{currentMonth.month}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4" />
                Recaudo Neto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${currentMonth.netRevenue.toLocaleString()} COP</div>
              <p className="text-blue-100 text-sm">{currentMonth.month}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentMonth.orderCount}</div>
              <p className="text-purple-100 text-sm">{currentMonth.month}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Investment Input */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Registrar Inversión Mensual</CardTitle>
              <CardDescription>Ingresa el costo de inversión para {currentMonth.month}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="investment">Monto de Inversión (COP)</Label>
                <Input
                  id="investment"
                  type="number"
                  placeholder="Ej: 500000"
                  value={monthlyInvestment}
                  onChange={(e) => setMonthlyInvestment(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <Button
                onClick={saveInvestment}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 rounded-xl shadow-lg"
              >
                Guardar Inversión
              </Button>
            </CardContent>
          </Card>

          {/* Monthly History */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Historial Mensual</CardTitle>
              <CardDescription>Resumen financiero por mes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {monthlyData.map((month, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setSelectedMonth(month)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">{month.month}</h3>
                      <Badge
                        className={month.netRevenue >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                      >
                        {month.netRevenue >= 0 ? "+" : ""}${month.netRevenue.toLocaleString()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span>Recaudo: </span>
                        <span className="font-medium">${month.totalRevenue.toLocaleString()}</span>
                      </div>
                      <div>
                        <span>Pedidos: </span>
                        <span className="font-medium">{month.orderCount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Month Details */}
        {selectedMonth && (
          <Card className="mt-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Detalle de {selectedMonth.month}</CardTitle>
                  <CardDescription>{selectedMonth.orderCount} pedidos realizados</CardDescription>
                </div>
                <Button
                  onClick={() => setShowOrderDetails(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalles
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <h3 className="text-lg font-semibold text-green-700">Recaudo Real</h3>
                  <p className="text-2xl font-bold text-green-600">
                    ${selectedMonth.totalRevenue.toLocaleString()} COP
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-xl">
                  <h3 className="text-lg font-semibold text-red-700">Inversión</h3>
                  <p className="text-2xl font-bold text-red-600">${selectedMonth.investment.toLocaleString()} COP</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <h3 className="text-lg font-semibold text-blue-700">Recaudo Neto</h3>
                  <p
                    className={`text-2xl font-bold ${selectedMonth.netRevenue >= 0 ? "text-blue-600" : "text-red-600"}`}
                  >
                    ${selectedMonth.netRevenue.toLocaleString()} COP
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
