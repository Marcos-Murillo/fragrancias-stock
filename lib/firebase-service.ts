import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  increment,
  writeBatch,
  Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"

// Types
export interface Product {
  id: string
  brand: string
  fragrance: string
  stock1oz: number
  stock2oz: number
  price1oz: number
  price2oz: number
  minStock: number
  category: string
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  totalOrders: number
  totalSpent: number
  lastOrderDate?: Timestamp
  notes?: string
  isVip: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface OrderItem {
  productId: string
  productName: string
  brand: string
  fragrance: string
  size: "1oz" | "2oz"
  quantity: number
  unitPrice: number
  totalPrice: number
  notes?: string
}

export interface Order {
  id: string
  customerId: string
  customerName: string
  customerPhone?: string
  items: OrderItem[]
  subtotal: number
  total: number
  itemCount: number
  status: "pending" | "completed" | "cancelled"
  notes?: string
  createdAt: Timestamp
  updatedAt: Timestamp
  completedAt?: Timestamp
}

export interface InventoryAlert {
  id: string
  productId: string
  productName: string
  currentStock: number
  minStock: number
  size: "1oz" | "2oz"
  severity: "low" | "critical"
  isRead: boolean
  createdAt: Timestamp
}

export interface SalesReport {
  id: string
  period: string // 'daily' | 'weekly' | 'monthly'
  date: string
  totalSales: number
  totalOrders: number
  topProducts: Array<{
    productId: string
    productName: string
    quantity: number
    revenue: number
  }>
  createdAt: Timestamp
}

// Product Services
// Update the productService to work with localStorage instead of Firebase for now
export const productService = {
  async getAll(): Promise<Product[]> {
    try {
      const savedProducts = localStorage.getItem("products")
      if (savedProducts) {
        const products = JSON.parse(savedProducts)
        return products.filter((p: Product) => p.isActive)
      }
      return []
    } catch (error) {
      console.error("Error loading products from localStorage:", error)
      return []
    }
  },

  async getById(id: string): Promise<Product | null> {
    try {
      const products = await this.getAll()
      return products.find((p) => p.id === id) || null
    } catch (error) {
      console.error("Error getting product by id:", error)
      return null
    }
  },

  async create(product: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<string> {
    try {
      const products = JSON.parse(localStorage.getItem("products") || "[]")
      const newProduct = {
        ...product,
        id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: { toDate: () => new Date() } as any,
        updatedAt: { toDate: () => new Date() } as any,
      }
      products.push(newProduct)
      localStorage.setItem("products", JSON.stringify(products))
      return newProduct.id
    } catch (error) {
      console.error("Error creating product:", error)
      throw error
    }
  },

  async update(id: string, updates: Partial<Product>): Promise<void> {
    try {
      const products = JSON.parse(localStorage.getItem("products") || "[]")
      const updatedProducts = products.map((p: Product) =>
        p.id === id ? { ...p, ...updates, updatedAt: { toDate: () => new Date() } } : p,
      )
      localStorage.setItem("products", JSON.stringify(updatedProducts))
    } catch (error) {
      console.error("Error updating product:", error)
      throw error
    }
  },

  async updateStock(id: string, size: "1oz" | "2oz", quantity: number): Promise<void> {
    try {
      const products = JSON.parse(localStorage.getItem("products") || "[]")
      const updatedProducts = products.map((p: Product) => {
        if (p.id === id) {
          const stockField = size === "1oz" ? "stock1oz" : "stock2oz"
          return {
            ...p,
            [stockField]: Math.max(0, p[stockField] - quantity),
            updatedAt: { toDate: () => new Date() },
          }
        }
        return p
      })
      localStorage.setItem("products", JSON.stringify(updatedProducts))
    } catch (error) {
      console.error("Error updating stock:", error)
      throw error
    }
  },

  async getLowStock(): Promise<Product[]> {
    const products = await this.getAll()
    return products.filter((p) => p.stock1oz <= p.minStock || p.stock2oz <= p.minStock)
  },
}

// Customer Services
export const customerService = {
  async getAll(): Promise<Customer[]> {
    const querySnapshot = await getDocs(query(collection(db, "customers"), orderBy("totalSpent", "desc")))
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Customer)
  },

  async getById(id: string): Promise<Customer | null> {
    const docSnap = await getDoc(doc(db, "customers", id))
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Customer) : null
  },

  async findByPhone(phone: string): Promise<Customer | null> {
    const querySnapshot = await getDocs(query(collection(db, "customers"), where("phone", "==", phone), limit(1)))
    return querySnapshot.empty ? null : ({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Customer)
  },

  async create(customer: Omit<Customer, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const now = Timestamp.now()
    const docRef = await addDoc(collection(db, "customers"), {
      ...customer,
      createdAt: now,
      updatedAt: now,
    })
    return docRef.id
  },

  async update(id: string, updates: Partial<Customer>): Promise<void> {
    await updateDoc(doc(db, "customers", id), {
      ...updates,
      updatedAt: Timestamp.now(),
    })
  },

  async updateStats(id: string, orderTotal: number): Promise<void> {
    await updateDoc(doc(db, "customers", id), {
      totalOrders: increment(1),
      totalSpent: increment(orderTotal),
      lastOrderDate: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
  },

  async getVipCustomers(): Promise<Customer[]> {
    const querySnapshot = await getDocs(
      query(collection(db, "customers"), where("isVip", "==", true), orderBy("totalSpent", "desc")),
    )
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Customer)
  },
}

// Order Services
export const orderService = {
  async getAll(): Promise<Order[]> {
    const querySnapshot = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc")))
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Order)
  },

  async getById(id: string): Promise<Order | null> {
    const docSnap = await getDoc(doc(db, "orders", id))
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Order) : null
  },

  async create(order: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const batch = writeBatch(db)
    const now = Timestamp.now()

    // Create order
    const orderRef = doc(collection(db, "orders"))
    const orderData = {
      ...order,
      createdAt: now,
      updatedAt: now,
    }
    batch.set(orderRef, orderData)

    // Update product stock
    for (const item of order.items) {
      const productRef = doc(db, "products", item.productId)
      const stockField = item.size === "1oz" ? "stock1oz" : "stock2oz"
      batch.update(productRef, {
        [stockField]: increment(-item.quantity),
        updatedAt: now,
      })
    }

    // Update customer stats if customer exists
    if (order.customerId) {
      const customerRef = doc(db, "customers", order.customerId)
      batch.update(customerRef, {
        totalOrders: increment(1),
        totalSpent: increment(order.total),
        lastOrderDate: now,
        updatedAt: now,
      })
    }

    await batch.commit()
    return orderRef.id
  },

  async updateStatus(id: string, status: Order["status"]): Promise<void> {
    const updates: any = {
      status,
      updatedAt: Timestamp.now(),
    }

    if (status === "completed") {
      updates.completedAt = Timestamp.now()
    }

    await updateDoc(doc(db, "orders", id), updates)
  },

  async getPending(): Promise<Order[]> {
    const querySnapshot = await getDocs(
      query(collection(db, "orders"), where("status", "==", "pending"), orderBy("createdAt", "desc")),
    )
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Order)
  },

  async getByCustomer(customerId: string): Promise<Order[]> {
    const querySnapshot = await getDocs(
      query(collection(db, "orders"), where("customerId", "==", customerId), orderBy("createdAt", "desc")),
    )
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Order)
  },
}

// Inventory Alert Services
export const inventoryService = {
  async checkAndCreateAlerts(): Promise<void> {
    const lowStockProducts = await productService.getLowStock()
    const batch = writeBatch(db)

    for (const product of lowStockProducts) {
      // Check 1oz stock
      if (product.stock1oz <= product.minStock) {
        const alertRef = doc(collection(db, "inventory_alerts"))
        batch.set(alertRef, {
          productId: product.id,
          productName: `${product.brand} - ${product.fragrance}`,
          currentStock: product.stock1oz,
          minStock: product.minStock,
          size: "1oz",
          severity: product.stock1oz === 0 ? "critical" : "low",
          isRead: false,
          createdAt: Timestamp.now(),
        })
      }

      // Check 2oz stock
      if (product.stock2oz <= product.minStock) {
        const alertRef = doc(collection(db, "inventory_alerts"))
        batch.set(alertRef, {
          productId: product.id,
          productName: `${product.brand} - ${product.fragrance}`,
          currentStock: product.stock2oz,
          minStock: product.minStock,
          size: "2oz",
          severity: product.stock2oz === 0 ? "critical" : "low",
          isRead: false,
          createdAt: Timestamp.now(),
        })
      }
    }

    await batch.commit()
  },

  async getAlerts(): Promise<InventoryAlert[]> {
    const querySnapshot = await getDocs(query(collection(db, "inventory_alerts"), orderBy("createdAt", "desc")))
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as InventoryAlert)
  },

  async markAsRead(id: string): Promise<void> {
    await updateDoc(doc(db, "inventory_alerts", id), {
      isRead: true,
    })
  },
}

// Real-time listeners
export const realtimeService = {
  onOrdersChange(callback: (orders: Order[]) => void) {
    return onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc")), (snapshot) => {
      const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Order)
      callback(orders)
    })
  },

  onInventoryAlertsChange(callback: (alerts: InventoryAlert[]) => void) {
    return onSnapshot(
      query(collection(db, "inventory_alerts"), where("isRead", "==", false), orderBy("createdAt", "desc")),
      (snapshot) => {
        const alerts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as InventoryAlert)
        callback(alerts)
      },
    )
  },
}
