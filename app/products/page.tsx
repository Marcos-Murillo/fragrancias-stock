"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Navigation } from "@/components/navigation"
import { Header } from "@/components/header"
import { Search, Plus, Edit, Trash2, Package, Save, X } from "lucide-react"

interface Product {
  id: string
  brand: string
  fragrance: string
  category: "Masculino" | "Femenino" | "Unisex"
  stock1oz: number
  stock2oz: number
  price1oz: number
  price2oz: number
  minStock: number
  image?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const INITIAL_PRODUCTS = [
  { brand: "Paco Rabanne", fragrance: "1 million", category: "Masculino" },
  { brand: "Paco Rabanne", fragrance: "1 million Lucky", category: "Masculino" },
  { brand: "Carolina Herrera", fragrance: "212", category: "Unisex" },
  { brand: "Carolina Herrera", fragrance: "212 Sexy", category: "Femenino" },
  { brand: "Carolina Herrera", fragrance: "212 VIP", category: "Masculino" },
  { brand: "Carolina Herrera", fragrance: "Bad Boy", category: "Masculino" },
  { brand: "Versace", fragrance: "Eros", category: "Masculino" },
  { brand: "Versace", fragrance: "Dylan Blue", category: "Masculino" },
  { brand: "Hugo Boss", fragrance: "Boss", category: "Masculino" },
  { brand: "Dior", fragrance: "Fahrenheit", category: "Masculino" },
  { brand: "Chanel", fragrance: "Allure Sport", category: "Masculino" },
  { brand: "Tom Ford", fragrance: "Oud Wood", category: "Unisex" },
  { brand: "Creed", fragrance: "Adventus", category: "Masculino" },
  { brand: "Thierry Mugler", fragrance: "Angel", category: "Femenino" },
  { brand: "Yves Saint Laurent", fragrance: "L'Homme", category: "Masculino" },
  { brand: "Dolce & Gabbana", fragrance: "Light Blue", category: "Unisex" },
  { brand: "Giorgio Armani", fragrance: "Acqua di Gio", category: "Masculino" },
  { brand: "Jean Paul Gaultier", fragrance: "Le Male", category: "Masculino" },
  { brand: "Burberry", fragrance: "Brit", category: "Unisex" },
  { brand: "Calvin Klein", fragrance: "Eternity", category: "Unisex" },
]

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<"all" | "Masculino" | "Femenino" | "Unisex">("all")
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Form states
  const [formData, setFormData] = useState({
    brand: "",
    fragrance: "",
    category: "Masculino" as "Masculino" | "Femenino" | "Unisex",
    stock1oz: 20,
    stock2oz: 15,
    price1oz: 15000,
    price2oz: 25000,
    minStock: 5,
    image: "",
  })

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, categoryFilter])

  const loadProducts = () => {
    try {
      setIsLoading(true)
      const savedProducts = localStorage.getItem("products")

      if (savedProducts) {
        const parsedProducts = JSON.parse(savedProducts)
        setProducts(parsedProducts)
      } else {
        // Initialize with default products
        initializeProducts()
      }
    } catch (error) {
      console.error("Error loading products:", error)
      initializeProducts()
    } finally {
      setIsLoading(false)
    }
  }

  const initializeProducts = () => {
    const initialProducts: Product[] = INITIAL_PRODUCTS.map((product, index) => ({
      id: `prod_${Date.now()}_${index}`,
      ...product,
      category: product.category as "Masculino" | "Femenino" | "Unisex",
      stock1oz: 20,
      stock2oz: 15,
      price1oz: 15000,
      price2oz: 25000,
      minStock: 5,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))

    setProducts(initialProducts)
    localStorage.setItem("products", JSON.stringify(initialProducts))
  }

  const filterProducts = () => {
    let filtered = products.filter((p) => p.isActive)

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.fragrance.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((product) => product.category === categoryFilter)
    }

    setFilteredProducts(filtered)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string
        setFormData({ ...formData, image: imageUrl })
      }
      reader.readAsDataURL(file)
    }
  }

  const resetForm = () => {
    setFormData({
      brand: "",
      fragrance: "",
      category: "Masculino",
      stock1oz: 20,
      stock2oz: 15,
      price1oz: 15000,
      price2oz: 25000,
      minStock: 5,
      image: "",
    })
    setShowAddForm(false)
    setEditingProduct(null)
  }

  const saveProduct = () => {
    if (!formData.brand.trim() || !formData.fragrance.trim()) {
      alert("Por favor completa la marca y fragancia")
      return
    }

    const now = new Date().toISOString()
    let updatedProducts: Product[]

    if (editingProduct) {
      // Update existing product
      updatedProducts = products.map((product) =>
        product.id === editingProduct.id
          ? {
              ...product,
              ...formData,
              updatedAt: now,
            }
          : product,
      )
    } else {
      // Add new product
      const newProduct: Product = {
        id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...formData,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }
      updatedProducts = [...products, newProduct]
    }

    setProducts(updatedProducts)
    localStorage.setItem("products", JSON.stringify(updatedProducts))
    resetForm()
    alert(editingProduct ? "Producto actualizado exitosamente" : "Producto agregado exitosamente")
  }

  const editProduct = (product: Product) => {
    setFormData({
      brand: product.brand,
      fragrance: product.fragrance,
      category: product.category,
      stock1oz: product.stock1oz,
      stock2oz: product.stock2oz,
      price1oz: product.price1oz,
      price2oz: product.price2oz,
      minStock: product.minStock,
      image: product.image || "",
    })
    setEditingProduct(product)
    setShowAddForm(true)
  }

  const deleteProduct = (productId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      const updatedProducts = products.map((product) =>
        product.id === productId ? { ...product, isActive: false, updatedAt: new Date().toISOString() } : product,
      )
      setProducts(updatedProducts)
      localStorage.setItem("products", JSON.stringify(updatedProducts))
      alert("Producto eliminado exitosamente")
    }
  }

  const getStockStatus = (product: Product) => {
    const lowStock1oz = product.stock1oz <= product.minStock
    const lowStock2oz = product.stock2oz <= product.minStock
    const criticalStock1oz = product.stock1oz === 0
    const criticalStock2oz = product.stock2oz === 0

    if (criticalStock1oz || criticalStock2oz) {
      return { status: "critical", label: "Sin Stock", color: "bg-red-100 text-red-700" }
    }
    if (lowStock1oz || lowStock2oz) {
      return { status: "low", label: "Stock Bajo", color: "bg-orange-100 text-orange-700" }
    }
    return { status: "good", label: "Stock OK", color: "bg-green-100 text-green-700" }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 pt-16 flex items-center justify-center">
        <Header />
        <div className="text-center">
          <Package className="h-8 w-8 animate-pulse mx-auto mb-4 text-lime-600" />
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-16">
      <Header />
      <div className="bg-white px-6 pt-6 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-lime-400 rounded-full flex items-center justify-center">
              <Package className="h-6 w-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Gestión de Productos</h1>
              <p className="text-gray-500 text-sm">{products.filter((p) => p.isActive).length} productos activos</p>
            </div>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-lime-400 hover:bg-lime-500 text-black font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Producto
          </Button>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por marca o fragancia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={categoryFilter === "all" ? "default" : "outline"}
              onClick={() => setCategoryFilter("all")}
              className={categoryFilter === "all" ? "bg-lime-400 text-black hover:bg-lime-500" : ""}
            >
              Todos
            </Button>
            <Button
              variant={categoryFilter === "Masculino" ? "default" : "outline"}
              onClick={() => setCategoryFilter("Masculino")}
              className={categoryFilter === "Masculino" ? "bg-lime-400 text-black hover:bg-lime-500" : ""}
            >
              Masculino
            </Button>
            <Button
              variant={categoryFilter === "Femenino" ? "default" : "outline"}
              onClick={() => setCategoryFilter("Femenino")}
              className={categoryFilter === "Femenino" ? "bg-lime-400 text-black hover:bg-lime-500" : ""}
            >
              Femenino
            </Button>
            <Button
              variant={categoryFilter === "Unisex" ? "default" : "outline"}
              onClick={() => setCategoryFilter("Unisex")}
              className={categoryFilter === "Unisex" ? "bg-lime-400 text-black hover:bg-lime-500" : ""}
            >
              Unisex
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6">
        {/* Add/Edit Product Form */}
        {showAddForm && (
          <Card className="mb-6 bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{editingProduct ? "Editar Producto" : "Agregar Nuevo Producto"}</span>
                <Button variant="ghost" onClick={resetForm} className="p-2">
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand">Marca *</Label>
                  <Input
                    id="brand"
                    placeholder="Ej: Paco Rabanne"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="fragrance">Fragancia *</Label>
                  <Input
                    id="fragrance"
                    placeholder="Ej: 1 Million"
                    value={formData.fragrance}
                    onChange={(e) => setFormData({ ...formData, fragrance: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Categoría</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: "Masculino" | "Femenino" | "Unisex") =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Femenino">Femenino</SelectItem>
                      <SelectItem value="Unisex">Unisex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="price1oz">Precio 1oz (COP)</Label>
                  <Input
                    id="price1oz"
                    type="number"
                    value={formData.price1oz}
                    onChange={(e) => setFormData({ ...formData, price1oz: Number(e.target.value) })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="price2oz">Precio 2oz (COP)</Label>
                  <Input
                    id="price2oz"
                    type="number"
                    value={formData.price2oz}
                    onChange={(e) => setFormData({ ...formData, price2oz: Number(e.target.value) })}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="stock1oz">Stock 1oz</Label>
                  <Input
                    id="stock1oz"
                    type="number"
                    value={formData.stock1oz}
                    onChange={(e) => setFormData({ ...formData, stock1oz: Number(e.target.value) })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="stock2oz">Stock 2oz</Label>
                  <Input
                    id="stock2oz"
                    type="number"
                    value={formData.stock2oz}
                    onChange={(e) => setFormData({ ...formData, stock2oz: Number(e.target.value) })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="minStock">Stock Mínimo</Label>
                  <Input
                    id="minStock"
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="image">Imagen del Producto (Opcional)</Label>
                <div className="mt-2 space-y-3">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-lime-50 file:text-lime-700 hover:file:bg-lime-100"
                  />
                  {formData.image && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <img
                        src={formData.image || "/placeholder.svg"}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-lg border"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">Imagen cargada</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData({ ...formData, image: "" })}
                          className="text-red-600 hover:text-red-700 p-0 h-auto"
                        >
                          Eliminar imagen
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button onClick={saveProduct} className="flex-1 bg-lime-400 hover:bg-lime-500 text-black font-semibold">
                  <Save className="h-4 w-4 mr-2" />
                  {editingProduct ? "Actualizar Producto" : "Guardar Producto"}
                </Button>
                <Button variant="outline" onClick={resetForm} className="flex-1 bg-transparent">
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card className="bg-white border-gray-200">
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
              <p className="text-gray-500">
                {searchTerm || categoryFilter !== "all"
                  ? "Intenta cambiar los filtros de búsqueda"
                  : "Comienza agregando tu primer producto"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product)
              return (
                <Card key={product.id} className="bg-white border-gray-200 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-base font-semibold text-gray-900">{product.brand}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{product.fragrance}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                          <Badge className={`text-xs ${stockStatus.color}`}>{stockStatus.label}</Badge>
                        </div>
                      </div>
                      {product.image && (
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={`${product.brand} ${product.fragrance}`}
                          className="w-16 h-16 object-cover rounded-lg border ml-3"
                        />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Stock Info */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="p-2 bg-gray-50 rounded">
                          <p className="font-medium">1oz Stock</p>
                          <p
                            className={`${product.stock1oz <= product.minStock ? "text-red-600 font-semibold" : "text-gray-700"}`}
                          >
                            {product.stock1oz} unidades
                          </p>
                        </div>
                        <div className="p-2 bg-gray-50 rounded">
                          <p className="font-medium">2oz Stock</p>
                          <p
                            className={`${product.stock2oz <= product.minStock ? "text-red-600 font-semibold" : "text-gray-700"}`}
                          >
                            {product.stock2oz} unidades
                          </p>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">1oz</p>
                          <p className="font-semibold">${product.price1oz.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">2oz</p>
                          <p className="font-semibold">${product.price2oz.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => editProduct(product)} className="flex-1">
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteProduct(product.id)}
                          className="flex-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Navigation />
    </div>
  )
}
