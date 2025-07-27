"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Navigation } from "@/components/navigation"
import { Header } from "@/components/header"
import {
  Database,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  Settings,
  Download,
  RefreshCw,
  Bell,
  BarChart3,
} from "lucide-react"
import { seedDatabase } from "@/lib/seed-data"
import { reportsService, type DashboardStats } from "@/lib/reports-service"
import { inventoryService, type InventoryAlert } from "@/lib/firebase-service"

export default function AdminPage() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [alerts, setAlerts] = useState<InventoryAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      const [dashboardStats, inventoryAlerts] = await Promise.all([
        reportsService.getDashboardStats(),
        inventoryService.getAlerts(),
      ])

      setStats(dashboardStats)
      setAlerts(inventoryAlerts.filter((alert) => !alert.isRead))
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSeedDatabase = async () => {
    setIsSeeding(true)
    try {
      const success = await seedDatabase()
      if (success) {
        alert("Base de datos poblada exitosamente!")
        await loadDashboardData()
      } else {
        alert("Error al poblar la base de datos")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al poblar la base de datos")
    } finally {
      setIsSeeding(false)
    }
  }

  const handleCheckInventory = async () => {
    try {
      await inventoryService.checkAndCreateAlerts()
      await loadDashboardData()
      alert("Verificación de inventario completada")
    } catch (error) {
      console.error("Error checking inventory:", error)
      alert("Error al verificar inventario")
    }
  }

  const generateMonthlyReport = async () => {
    try {
      const now = new Date()
      await reportsService.generateMonthlyReport(now.getFullYear(), now.getMonth() + 1)
      alert("Reporte mensual generado exitosamente")
    } catch (error) {
      console.error("Error generating report:", error)
      alert("Error al generar reporte")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 pt-16 flex items-center justify-center">
        <Header />
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-lime-600" />
          <p className="text-gray-600">Cargando datos del sistema...</p>
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
            <Settings className="h-6 w-6 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Panel de Administración</h1>
            <p className="text-gray-500 text-sm">Gestión del sistema y reportes</p>
          </div>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                <p className="text-lg font-bold text-blue-700">${(stats.totalSales / 1000).toFixed(0)}K</p>
                <p className="text-xs text-blue-600">Ventas Totales</p>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <Package className="h-5 w-5 text-green-600 mx-auto mb-2" />
                <p className="text-lg font-bold text-green-700">{stats.totalOrders}</p>
                <p className="text-xs text-green-600">Pedidos Totales</p>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <Users className="h-5 w-5 text-purple-600 mx-auto mb-2" />
                <p className="text-lg font-bold text-purple-700">{stats.totalCustomers}</p>
                <p className="text-xs text-purple-600">Clientes</p>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-5 w-5 text-orange-600 mx-auto mb-2" />
                <p className="text-lg font-bold text-orange-700">{stats.lowStockProducts}</p>
                <p className="text-xs text-orange-600">Stock Bajo</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <Bell className="h-5 w-5" />
                Alertas de Inventario ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex justify-between items-center p-2 bg-white rounded border">
                    <div>
                      <span className="font-medium">{alert.productName}</span>
                      <span className="text-sm text-gray-600 ml-2">({alert.size})</span>
                    </div>
                    <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"}>
                      {alert.currentStock} restantes
                    </Badge>
                  </div>
                ))}
                {alerts.length > 3 && (
                  <p className="text-sm text-gray-600 text-center">+{alerts.length - 3} alertas más</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="px-6">
        <Tabs defaultValue="system" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="system">Sistema</TabsTrigger>
            <TabsTrigger value="inventory">Inventario</TabsTrigger>
            <TabsTrigger value="reports">Reportes</TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Gestión de Base de Datos
                </CardTitle>
                <CardDescription>Herramientas para inicializar y mantener la base de datos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2">Poblar Base de Datos</h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    Agrega productos y clientes de ejemplo para comenzar a usar el sistema. Solo ejecutar una vez al
                    configurar por primera vez.
                  </p>
                  <Button
                    onClick={handleSeedDatabase}
                    disabled={isSeeding}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    {isSeeding ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Poblando...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        Poblar Base de Datos
                      </>
                    )}
                  </Button>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">Actualizar Dashboard</h4>
                  <p className="text-sm text-blue-700 mb-3">Recarga las estadísticas y datos del panel de control.</p>
                  <Button
                    onClick={loadDashboardData}
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100 bg-transparent"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualizar Datos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Control de Inventario
                </CardTitle>
                <CardDescription>Herramientas para gestionar el stock y generar alertas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-orange-800 mb-2">Verificar Stock</h4>
                    <p className="text-sm text-orange-700 mb-3">
                      Revisa el inventario y genera alertas para productos con stock bajo.
                    </p>
                    <Button
                      onClick={handleCheckInventory}
                      className="bg-orange-600 hover:bg-orange-700 text-white w-full"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Verificar Inventario
                    </Button>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">Estado Actual</h4>
                    {stats && (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Stock Bajo:</span>
                          <Badge variant="outline">{stats.lowStockProducts}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Stock Crítico:</span>
                          <Badge variant="destructive">{stats.criticalStockProducts}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Alertas Activas:</span>
                          <Badge variant="secondary">{alerts.length}</Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Generación de Reportes
                </CardTitle>
                <CardDescription>Crea reportes detallados de ventas y análisis de negocio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-2">Reporte Mensual</h4>
                    <p className="text-sm text-purple-700 mb-3">Genera un reporte completo de ventas del mes actual.</p>
                    <Button
                      onClick={generateMonthlyReport}
                      className="bg-purple-600 hover:bg-purple-700 text-white w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generar Reporte
                    </Button>
                  </div>

                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <h4 className="font-semibold text-indigo-800 mb-2">Análisis Avanzado</h4>
                    <p className="text-sm text-indigo-700 mb-3">
                      Accede a reportes detallados y análisis de tendencias.
                    </p>
                    <Button
                      variant="outline"
                      className="border-indigo-300 text-indigo-700 hover:bg-indigo-100 w-full bg-transparent"
                      onClick={() => window.open("/statistics", "_blank")}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Ver Reportes
                    </Button>
                  </div>
                </div>

                {stats && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3">Resumen Ejecutivo</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-bold text-lg text-blue-600">${(stats.totalSales / 1000).toFixed(0)}K</p>
                        <p className="text-gray-600">Ventas Totales</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-lg text-green-600">{stats.completedOrders}</p>
                        <p className="text-gray-600">Pedidos Completados</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-lg text-purple-600">{stats.vipCustomers}</p>
                        <p className="text-gray-600">Clientes VIP</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-lg text-orange-600">
                          ${stats.totalOrders > 0 ? (stats.totalSales / stats.completedOrders / 1000).toFixed(1) : 0}K
                        </p>
                        <p className="text-gray-600">Ticket Promedio</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Navigation />
    </div>
  )
}
