"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Navigation } from "@/components/navigation"
import { Header } from "@/components/header"
import { TrendingUp, DollarSign, Package, BarChart3 } from "lucide-react"
import { reportsService, type DashboardStats, type ProductSalesData } from "@/lib/reports-service"

export default function StatisticsPage() {
  const [monthlyInvestment, setMonthlyInvestment] = useState("")
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [topProducts, setTopProducts] = useState<ProductSalesData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      setIsLoading(true)
      const [dashboardStats, productSales] = await Promise.all([
        reportsService.getDashboardStats(),
        reportsService.getProductSalesReport(
          new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
          new Date(), // Today
        ),
      ])

      setStats(dashboardStats)
      setTopProducts(productSales.slice(0, 10))
    } catch (error) {
      console.error("Error loading statistics:", error)
      alert("Error al cargar las estadísticas")
    } finally {
      setIsLoading(false)
    }
  }

  const saveInvestment = async () => {
    if (!monthlyInvestment) return

    try {
      // Save investment to localStorage for now
      const investments = JSON.parse(localStorage.getItem("monthly_investments") || "{}")
      const currentMonth = `${new Date().getFullYear()}-${new Date().getMonth()}`
      investments[currentMonth] = Number.parseFloat(monthlyInvestment)
      localStorage.setItem("monthly_investments", JSON.stringify(investments))

      setMonthlyInvestment("")
      alert("Inversión guardada exitosamente")
      await loadStatistics()
    } catch (error) {
      console.error("Error saving investment:", error)
      alert("Error al guardar la inversión")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 pt-16 flex items-center justify-center">
        <Header />
        <div className="text-center">
          <BarChart3 className="h-8 w-8 animate-pulse mx-auto mb-4 text-lime-600" />
          <p className="text-gray-600">Cargando estadísticas...</p>
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
            <TrendingUp className="h-6 w-6 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Estadísticas Financieras</h1>
            <p className="text-gray-500 text-sm">Análisis de rendimiento del negocio</p>
          </div>
        </div>

        {/* Current Month Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-lime-50 border-lime-200">
              <CardContent className="p-4 text-center">
                <DollarSign className="h-5 w-5 text-lime-600 mx-auto mb-2" />
                <p className="text-lg font-bold text-lime-700">${(stats.totalSales / 1000).toFixed(0)}K</p>
                <p className="text-xs text-lime-600">Ventas Totales</p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <Package className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                <p className="text-lg font-bold text-blue-700">{stats.completedOrders}</p>
                <p className="text-xs text-blue-600">Completados</p>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-5 w-5 text-orange-600 mx-auto mb-2" />
                <p className="text-lg font-bold text-orange-700">{stats.pendingOrders}</p>
                <p className="text-xs text-orange-600">Pendientes</p>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <Package className="h-5 w-5 text-purple-600 mx-auto mb-2" />
                <p className="text-lg font-bold text-purple-700">{stats.lowStockProducts}</p>
                <p className="text-xs text-purple-600">Stock Bajo</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="px-6 space-y-6">
        {/* Investment Input */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-base">Registrar Inversión Mensual</CardTitle>
            <CardDescription>Ingresa el costo de inversión para el mes actual</CardDescription>
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
                className="mt-2"
              />
            </div>
            <Button
              onClick={saveInvestment}
              className="w-full bg-lime-400 hover:bg-lime-500 text-black font-semibold py-3"
            >
              Guardar Inversión
            </Button>
          </CardContent>
        </Card>

        {/* Sales Chart - Simple Bar Chart */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-base">Productos Más Vendidos</CardTitle>
            <CardDescription>Ranking de productos por cantidad vendida este mes</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay datos de ventas disponibles</p>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product, index) => {
                  const maxQuantity = Math.max(...topProducts.map((p) => p.totalQuantity))
                  const percentage = (product.totalQuantity / maxQuantity) * 100

                  return (
                    <div key={product.productId} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              index === 0
                                ? "bg-lime-400 text-black"
                                : index === 1
                                  ? "bg-gray-300 text-gray-700"
                                  : index === 2
                                    ? "bg-orange-300 text-orange-700"
                                    : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{product.productName}</p>
                            <p className="text-sm text-gray-500">${product.totalRevenue.toLocaleString()} COP</p>
                          </div>
                        </div>
                        <Badge variant="outline">{product.totalQuantity} vendidos</Badge>
                      </div>

                      {/* Simple bar chart */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            index === 0
                              ? "bg-lime-400"
                              : index === 1
                                ? "bg-gray-400"
                                : index === 2
                                  ? "bg-orange-400"
                                  : "bg-gray-300"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-xs text-gray-500">
                        <span>1oz: {product.size1ozSold}</span>
                        <span>2oz: {product.size2ozSold}</span>
                        <span>Promedio: ${product.averagePrice.toLocaleString()}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        {stats && (
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-base">Resumen Ejecutivo</CardTitle>
              <CardDescription>Métricas clave del negocio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="font-bold text-lg text-blue-600">${(stats.totalSales / 1000).toFixed(0)}K</p>
                  <p className="text-blue-600">Ventas Totales</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="font-bold text-lg text-green-600">{stats.completedOrders}</p>
                  <p className="text-green-600">Pedidos Completados</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="font-bold text-lg text-purple-600">{stats.vipCustomers}</p>
                  <p className="text-purple-600">Clientes VIP</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="font-bold text-lg text-orange-600">
                    ${stats.completedOrders > 0 ? (stats.totalSales / stats.completedOrders / 1000).toFixed(1) : 0}K
                  </p>
                  <p className="text-orange-600">Ticket Promedio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Navigation />
    </div>
  )
}
