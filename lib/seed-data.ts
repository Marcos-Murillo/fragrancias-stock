import { collection, addDoc, Timestamp } from "firebase/firestore"
import { db } from "./firebase"

const SAMPLE_PRODUCTS = [
  { brand: "Paco Rabanne", fragrance: "1 million", category: "Masculino", stock1oz: 50, stock2oz: 30, minStock: 5 },
  {
    brand: "Paco Rabanne",
    fragrance: "1 million Lucky",
    category: "Masculino",
    stock1oz: 25,
    stock2oz: 15,
    minStock: 5,
  },
  { brand: "Carolina Herrera", fragrance: "212", category: "Unisex", stock1oz: 40, stock2oz: 25, minStock: 5 },
  { brand: "Carolina Herrera", fragrance: "212 Sexy", category: "Femenino", stock1oz: 35, stock2oz: 20, minStock: 5 },
  { brand: "Carolina Herrera", fragrance: "212 VIP", category: "Masculino", stock1oz: 30, stock2oz: 18, minStock: 5 },
  { brand: "Carolina Herrera", fragrance: "Bad Boy", category: "Masculino", stock1oz: 45, stock2oz: 28, minStock: 5 },
  { brand: "Versace", fragrance: "Eros", category: "Masculino", stock1oz: 38, stock2oz: 22, minStock: 5 },
  { brand: "Versace", fragrance: "Dylan Blue", category: "Masculino", stock1oz: 42, stock2oz: 26, minStock: 5 },
  { brand: "Hugo Boss", fragrance: "Boss", category: "Masculino", stock1oz: 33, stock2oz: 19, minStock: 5 },
  { brand: "Dior", fragrance: "Fahrenheit", category: "Masculino", stock1oz: 28, stock2oz: 16, minStock: 5 },
  { brand: "Chanel", fragrance: "Allure Sport", category: "Masculino", stock1oz: 22, stock2oz: 14, minStock: 5 },
  { brand: "Tom Ford", fragrance: "Oud Wood", category: "Unisex", stock1oz: 15, stock2oz: 8, minStock: 3 },
  { brand: "Creed", fragrance: "Adventus", category: "Masculino", stock1oz: 12, stock2oz: 6, minStock: 3 },
  { brand: "Thierry Mugler", fragrance: "Angel", category: "Femenino", stock1oz: 36, stock2oz: 21, minStock: 5 },
  { brand: "Yves Saint Laurent", fragrance: "L'Homme", category: "Masculino", stock1oz: 31, stock2oz: 17, minStock: 5 },
]

const SAMPLE_CUSTOMERS = [
  {
    name: "María González",
    phone: "3001234567",
    email: "maria.gonzalez@email.com",
    address: "Calle 123 #45-67, Bogotá",
    totalOrders: 0,
    totalSpent: 0,
    isVip: false,
    notes: "Cliente frecuente, prefiere fragancias femeninas",
  },
  {
    name: "Carlos Rodríguez",
    phone: "3009876543",
    email: "carlos.rodriguez@email.com",
    address: "Carrera 78 #12-34, Medellín",
    totalOrders: 0,
    totalSpent: 0,
    isVip: false,
    notes: "Compra para regalo, le gustan las presentaciones elegantes",
  },
  {
    name: "Ana Martínez",
    phone: "3005555555",
    email: "ana.martinez@email.com",
    address: "Avenida 45 #67-89, Cali",
    totalOrders: 0,
    totalSpent: 0,
    isVip: true,
    notes: "Cliente VIP, compras mensuales, descuento especial",
  },
  {
    name: "Luis Hernández",
    phone: "3007777777",
    totalOrders: 0,
    totalSpent: 0,
    isVip: false,
    notes: "Prefiere fragancias masculinas clásicas",
  },
  {
    name: "Sofia Vargas",
    phone: "3008888888",
    email: "sofia.vargas@email.com",
    address: "Calle 90 #15-25, Barranquilla",
    totalOrders: 0,
    totalSpent: 0,
    isVip: false,
    notes: "Le gustan las fragancias dulces y frutales",
  },
]

export const seedDatabase = async () => {
  try {
    console.log("Iniciando población de base de datos...")

    // Check if products already exist
    const existingProducts = JSON.parse(localStorage.getItem("seeded_products") || "false")
    if (!existingProducts) {
      // Seed Products
      console.log("Agregando productos...")
      for (const product of SAMPLE_PRODUCTS) {
        await addDoc(collection(db, "products"), {
          ...product,
          price1oz: 15000,
          price2oz: 25000,
          isActive: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
      }
      localStorage.setItem("seeded_products", "true")
    }

    // Check if customers already exist
    const existingCustomers = JSON.parse(localStorage.getItem("seeded_customers") || "false")
    if (!existingCustomers) {
      // Seed Customers
      console.log("Agregando clientes...")
      for (const customer of SAMPLE_CUSTOMERS) {
        await addDoc(collection(db, "customers"), {
          ...customer,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
      }
      localStorage.setItem("seeded_customers", "true")
    }

    console.log("Base de datos poblada exitosamente!")
    return true
  } catch (error) {
    console.error("Error poblando la base de datos:", error)
    return false
  }
}
