import { collection, query, where, orderBy, getDocs, Timestamp, addDoc } from "firebase/firestore"
import { db } from "./firebase"
import type { Order, Product, Customer } from "./firebase-service"

export interface DashboardStats {
  totalSales: number
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  totalCustomers: number
  vipCustomers: number
  lowStockProducts: number
  criticalStockProducts: number
}

export interface ProductSalesData {
  productId: string
  productName: string
  brand: string
  fragrance: string
  totalQuantity: number
  totalRevenue: number
  averagePrice: number
  size1ozSold: number
  size2ozSold: number
}

export interface CustomerAnalytics {
  customerId: string
  customerName: string
  totalOrders: number
  totalSpent: number
  averageOrderValue: number
  lastOrderDate: Date
  isVip: boolean
}

export interface SalesReport {
  period: "daily" | "weekly" | "monthly"
  startDate: Date
  endDate: Date
  totalSales: number
  totalOrders: number
  averageOrderValue: number
  topProducts: ProductSalesData[]
  topCustomers: CustomerAnalytics[]
  salesByDay: Array<{
    date: string
    sales: number
    orders: number
  }>
}

export const reportsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    // Get all orders
    const ordersSnapshot = await getDocs(collection(db, "orders"))
    const orders = ordersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Order)

    // Get all customers
    const customersSnapshot = await getDocs(collection(db, "customers"))
    const customers = customersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Customer)

    // Get all products
    const productsSnapshot = await getDocs(collection(db, "products"))
    const products = productsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Product)

    const completedOrders = orders.filter((o) => o.status === "completed")
    const pendingOrders = orders.filter((o) => o.status === "pending")
    const vipCustomers = customers.filter((c) => c.isVip)
    const lowStockProducts = products.filter((p) => p.stock1oz <= p.minStock || p.stock2oz <= p.minStock)
    const criticalStockProducts = products.filter((p) => p.stock1oz === 0 || p.stock2oz === 0)

    return {
      totalSales: completedOrders.reduce((sum, order) => sum + order.total, 0),
      totalOrders: orders.length,
      pendingOrders: pendingOrders.length,
      completedOrders: completedOrders.length,
      totalCustomers: customers.length,
      vipCustomers: vipCustomers.length,
      lowStockProducts: lowStockProducts.length,
      criticalStockProducts: criticalStockProducts.length,
    }
  },

  async getProductSalesReport(startDate: Date, endDate: Date): Promise<ProductSalesData[]> {
    const start = Timestamp.fromDate(startDate)
    const end = Timestamp.fromDate(endDate)

    const ordersSnapshot = await getDocs(
      query(
        collection(db, "orders"),
        where("status", "==", "completed"),
        where("completedAt", ">=", start),
        where("completedAt", "<=", end),
      ),
    )

    const orders = ordersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Order)
    const productSales: { [key: string]: ProductSalesData } = {}

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.productId
        if (!productSales[key]) {
          productSales[key] = {
            productId: item.productId,
            productName: `${item.brand} - ${item.fragrance}`,
            brand: item.brand,
            fragrance: item.fragrance,
            totalQuantity: 0,
            totalRevenue: 0,
            averagePrice: 0,
            size1ozSold: 0,
            size2ozSold: 0,
          }
        }

        productSales[key].totalQuantity += item.quantity
        productSales[key].totalRevenue += item.totalPrice

        if (item.size === "1oz") {
          productSales[key].size1ozSold += item.quantity
        } else {
          productSales[key].size2ozSold += item.quantity
        }
      })
    })

    // Calculate average prices
    Object.values(productSales).forEach((product) => {
      product.averagePrice = product.totalRevenue / product.totalQuantity
    })

    return Object.values(productSales).sort((a, b) => b.totalRevenue - a.totalRevenue)
  },

  async getCustomerAnalytics(): Promise<CustomerAnalytics[]> {
    const customersSnapshot = await getDocs(query(collection(db, "customers"), orderBy("totalSpent", "desc")))

    return customersSnapshot.docs.map((doc) => {
      const customer = { id: doc.id, ...doc.data() } as Customer
      return {
        customerId: customer.id,
        customerName: customer.name,
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent,
        averageOrderValue: customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0,
        lastOrderDate: customer.lastOrderDate?.toDate() || new Date(),
        isVip: customer.isVip,
      }
    })
  },

  async getSalesReport(period: "daily" | "weekly" | "monthly", startDate: Date, endDate: Date): Promise<SalesReport> {
    const start = Timestamp.fromDate(startDate)
    const end = Timestamp.fromDate(endDate)

    const ordersSnapshot = await getDocs(
      query(
        collection(db, "orders"),
        where("status", "==", "completed"),
        where("completedAt", ">=", start),
        where("completedAt", "<=", end),
      ),
    )

    const orders = ordersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Order)
    const totalSales = orders.reduce((sum, order) => sum + order.total, 0)
    const averageOrderValue = orders.length > 0 ? totalSales / orders.length : 0

    // Get top products and customers
    const topProducts = await this.getProductSalesReport(startDate, endDate)
    const topCustomers = await this.getCustomerAnalytics()

    // Generate sales by day
    const salesByDay: Array<{ date: string; sales: number; orders: number }> = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(currentDate)
      dayEnd.setHours(23, 59, 59, 999)

      const dayOrders = orders.filter((order) => {
        const orderDate = order.completedAt?.toDate()
        return orderDate && orderDate >= dayStart && orderDate <= dayEnd
      })

      salesByDay.push({
        date: currentDate.toISOString().split("T")[0],
        sales: dayOrders.reduce((sum, order) => sum + order.total, 0),
        orders: dayOrders.length,
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return {
      period,
      startDate,
      endDate,
      totalSales,
      totalOrders: orders.length,
      averageOrderValue,
      topProducts: topProducts.slice(0, 10),
      topCustomers: topCustomers.slice(0, 10),
      salesByDay,
    }
  },

  async generateMonthlyReport(year: number, month: number): Promise<void> {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const report = await this.getSalesReport("monthly", startDate, endDate)

    // Save report to Firebase
    await addDoc(collection(db, "sales_reports"), {
      ...report,
      createdAt: Timestamp.now(),
    })
  },
}
