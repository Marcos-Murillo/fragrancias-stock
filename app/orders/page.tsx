"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Navigation } from "@/components/navigation"
import { Header } from "@/components/header"
import { ArrowLeft, Search, ShoppingCart, Plus, Minus, User, MessageSquare, Trash2, Package, Phone } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  productService,
  customerService,
  orderService,
  type Product,
  type Customer,
  type OrderItem as FirebaseOrderItem,
} from "@/lib/firebase-service"
import { receiptService } from "@/lib/receipt-service"

interface OrderItem {
  id: string
  product: Product
  size: "1oz" | "2oz"
  quantity: number
  unitPrice: number
  price: number
  notes?: string
}

interface OrderSummary {
  items: OrderItem[]
  subtotal: number
  itemCount: number
}

export default function OrdersPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [customerSearchTerm, setCustomerSearchTerm] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedSize, setSelectedSize] = useState<"1oz" | "2oz">("1oz")
  const [quantity, setQuantity] = useState(1)
  const [itemNotes, setItemNotes] = useState("")
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [orderNotes, setOrderNotes] = useState("")
  const [showInvoice, setShowInvoice] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      const [productsData, customersData] = await Promise.all([productService.getAll(), customerService.getAll()])

      if (productsData.length === 0) {
        // If no products, show a helpful message
        alert("No hay productos en la base de datos. Ve al Panel de Administración para poblar la base de datos.")
        router.push("/admin")
        return
      }

      setProducts(productsData)
      setCustomers(customersData)
    } catch (error) {
      console.error("Error loading data:", error)
      alert("Error al cargar los datos. Verifica tu conexión a Firebase.")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProducts = products.filter(
    (product) =>
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.fragrance.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(customerSearchTerm)),
  )

  const generateItemId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }

  const findOrCreateCustomer = async (): Promise<Customer> => {
    if (selectedCustomer) {
      return selectedCustomer
    }

    // Try to find existing customer by phone
    if (customerPhone.trim()) {
      const existingCustomer = await customerService.findByPhone(customerPhone.trim())
      if (existingCustomer) {
        return existingCustomer
      }
    }

    // Create new customer
    const customerId = await customerService.create({
      name: customerName.trim(),
      phone: customerPhone.trim() || undefined,
      totalOrders: 0,
      totalSpent: 0,
      isVip: false,
    })

    return {
      id: customerId,
      name: customerName.trim(),
      phone: customerPhone.trim() || undefined,
      totalOrders: 0,
      totalSpent: 0,
      isVip: false,
      createdAt: new Date() as any,
      updatedAt: new Date() as any,
    }
  }

  const addToOrder = () => {
    if (!selectedProduct) return

    // Check stock availability
    const availableStock = selectedSize === "1oz" ? selectedProduct.stock1oz : selectedProduct.stock2oz
    if (availableStock < quantity) {
      alert(`Stock insuficiente. Solo hay ${availableStock} unidades disponibles de ${selectedSize}`)
      return
    }

    const unitPrice = selectedSize === "1oz" ? selectedProduct.price1oz : selectedProduct.price2oz
    const newItem: OrderItem = {
      id: generateItemId(),
      product: selectedProduct,
      size: selectedSize,
      quantity,
      unitPrice,
      price: unitPrice * quantity,
      notes: itemNotes.trim() || undefined,
    }

    setOrderItems([...orderItems, newItem])
    setSelectedProduct(null)
    setQuantity(1)
    setItemNotes("")
  }

  const removeFromOrder = (itemId: string) => {
    setOrderItems(orderItems.filter((item) => item.id !== itemId))
  }

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromOrder(itemId)
      return
    }

    setOrderItems(
      orderItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: newQuantity,
              price: item.unitPrice * newQuantity,
            }
          : item,
      ),
    )
  }

  const getOrderSummary = (): OrderSummary => {
    const subtotal = orderItems.reduce((total, item) => total + item.price, 0)
    const itemCount = orderItems.reduce((total, item) => total + item.quantity, 0)

    return {
      items: orderItems,
      subtotal,
      itemCount,
    }
  }

  const saveOrder = async () => {
    if (!customerName.trim()) {
      alert("Por favor ingresa el nombre del cliente")
      return
    }

    if (orderItems.length === 0) {
      alert("Por favor agrega al menos un producto al pedido")
      return
    }

    setIsSaving(true)
    try {
      const customer = await findOrCreateCustomer()
      const orderSummary = getOrderSummary()

      // Convert OrderItem to FirebaseOrderItem
      const firebaseItems: FirebaseOrderItem[] = orderItems.map((item) => ({
        productId: item.product.id,
        productName: `${item.product.brand} - ${item.product.fragrance}`,
        brand: item.product.brand,
        fragrance: item.product.fragrance,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.price,
        notes: item.notes,
      }))

      const orderId = await orderService.create({
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        items: firebaseItems,
        subtotal: orderSummary.subtotal,
        total: orderSummary.subtotal,
        itemCount: orderSummary.itemCount,
        notes: orderNotes.trim() || undefined,
        status: "pending",
      })

      // Save customer data to localStorage for quick access
      const savedCustomers = JSON.parse(localStorage.getItem("recent_customers") || "[]")
      const customerData = {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        lastUsed: new Date().toISOString(),
      }

      // Remove if exists and add to beginning
      const filteredCustomers = savedCustomers.filter((c: any) => c.id !== customer.id)
      const updatedCustomers = [customerData, ...filteredCustomers].slice(0, 10) // Keep only last 10
      localStorage.setItem("recent_customers", JSON.stringify(updatedCustomers))

      // Print receipt if requested
      const savedOrder = await orderService.getById(orderId)
      if (!savedOrder) {
        throw new Error("Error al recuperar el pedido guardado")
      }

      const receiptData = {
        order: savedOrder,
        customer,
        businessInfo: {
          name: "LotionPro",
          address: "Calle Principal #123, Ciudad",
          phone: "300-123-4567",
          email: "info@lotionpro.com",
        },
        receiptNumber: `R-${orderId.slice(-8).toUpperCase()}`,
        printDate: new Date(),
      }

      const shouldPrint = confirm("¿Deseas imprimir el recibo del pedido?")
      if (shouldPrint) {
        receiptService.printReceipt(receiptData)
      }

      // Reset form
      setOrderItems([])
      setCustomerName("")
      setCustomerPhone("")
      setSelectedCustomer(null)
      setOrderNotes("")
      setShowInvoice(false)

      alert("Pedido guardado exitosamente!")
      router.push("/")
    } catch (error) {
      console.error("Error saving order:", error)
      alert("Error al guardar el pedido")
    } finally {
      setIsSaving(false)
    }
  }

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setCustomerName(customer.name)
    setCustomerPhone(customer.phone || "")
    setCustomerSearchTerm("")
  }

  const orderSummary = getOrderSummary()

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

  if (showInvoice) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 pt-16">
        <Header />
        <div className="bg-white px-6 pt-6 pb-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => setShowInvoice(false)} className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-900">Resumen del Pedido</h1>
          </div>
        </div>

        <div className="px-6">
          <Card className="bg-white border-gray-200">
            <CardHeader className="bg-lime-400 text-black">
              <CardTitle className="text-xl">Factura de Pedido #{Date.now().toString().slice(-6)}</CardTitle>
              <CardDescription className="text-black/70">
                {new Date().toLocaleDateString("es-CO", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {/* Customer Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Información del Cliente</h3>
                <p className="text-gray-700">
                  <strong>Nombre:</strong> {customerName}
                </p>
                {customerPhone && (
                  <p className="text-gray-700">
                    <strong>Teléfono:</strong> {customerPhone}
                  </p>
                )}
                {selectedCustomer?.isVip && <Badge className="mt-2 bg-purple-100 text-purple-700">Cliente VIP</Badge>}
              </div>

              {/* Order Items */}
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-gray-800">Productos Solicitados</h3>
                {orderItems.map((item, index) => (
                  <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">
                          {item.product.brand} - {item.product.fragrance}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span>Tamaño: {item.size}</span>
                          <span>Cantidad: {item.quantity}</span>
                          <span>Precio unitario: ${item.unitPrice.toLocaleString()} COP</span>
                        </div>
                        {item.notes && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                            <strong className="text-blue-700">Nota:</strong> {item.notes}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-800">${item.price.toLocaleString()} COP</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Notes */}
              {orderNotes && (
                <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">Instrucciones Especiales</h3>
                  <p className="text-yellow-700">{orderNotes}</p>
                </div>
              )}

              {/* Order Summary */}
              <div className="border-t pt-4">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Total de productos:</span>
                    <span>{orderSummary.itemCount} unidades</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>${orderSummary.subtotal.toLocaleString()} COP</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xl font-bold border-t pt-4">
                  <span>Total a Pagar:</span>
                  <span className="text-lime-600">${orderSummary.subtotal.toLocaleString()} COP</span>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <Button
                  onClick={saveOrder}
                  disabled={isSaving}
                  className="flex-1 bg-lime-400 hover:bg-lime-500 text-black font-semibold py-3"
                >
                  {isSaving ? "Guardando..." : "Confirmar Pedido"}
                </Button>
                <Button variant="outline" onClick={() => setShowInvoice(false)} className="flex-1 py-3">
                  Continuar Editando
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Navigation />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-16">
      <Header />
      <div className="bg-white px-6 pt-6 pb-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.push("/")} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Nuevo Pedido</h1>
        </div>

        {/* Customer Information */}
        <Card className="bg-white border-gray-200 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-5 w-5" />
              Información del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer Search */}
            <div>
              <Label>Buscar Cliente Existente</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre o teléfono..."
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {customerSearchTerm && (
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {filteredCustomers.slice(0, 5).map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => selectCustomer(customer)}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          {customer.phone && (
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {customer.isVip && <Badge className="bg-purple-100 text-purple-700 mb-1">VIP</Badge>}
                          <p className="text-xs text-gray-500">
                            {customer.totalOrders} pedidos • ${customer.totalSpent.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Nombre del Cliente *</Label>
                  <Input
                    id="customerName"
                    placeholder="Ingresa el nombre completo"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Teléfono (Opcional)</Label>
                  <Input
                    id="customerPhone"
                    placeholder="Número de contacto"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Selection */}
          <div className="lg:col-span-2">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShoppingCart className="h-5 w-5" />
                  Catálogo de Productos
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar marca o fragancia..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedProduct?.id === product.id ? "bg-lime-400 text-black" : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h3 className="font-semibold">{product.brand}</h3>
                          <p
                            className={`text-sm ${
                              selectedProduct?.id === product.id ? "text-black/70" : "text-gray-600"
                            }`}
                          >
                            {product.fragrance}
                          </p>
                          <div className="flex gap-4 mt-1 text-xs">
                            <span
                              className={`${
                                product.stock1oz <= product.minStock
                                  ? "text-red-600 font-semibold"
                                  : selectedProduct?.id === product.id
                                    ? "text-black/70"
                                    : "text-gray-500"
                              }`}
                            >
                              1oz: {product.stock1oz} disponibles
                            </span>
                            <span
                              className={`${
                                product.stock2oz <= product.minStock
                                  ? "text-red-600 font-semibold"
                                  : selectedProduct?.id === product.id
                                    ? "text-black/70"
                                    : "text-gray-500"
                              }`}
                            >
                              2oz: {product.stock2oz} disponibles
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          {selectedProduct?.id === product.id && (
                            <Badge className="bg-black/20 text-black mb-2">Seleccionado</Badge>
                          )}
                          {(product.stock1oz <= product.minStock || product.stock2oz <= product.minStock) && (
                            <Badge variant="destructive" className="text-xs">
                              Stock Bajo
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Configuration */}
          <div className="space-y-6">
            {selectedProduct && (
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-base">Configurar Producto</CardTitle>
                  <CardDescription>
                    {selectedProduct.brand} - {selectedProduct.fragrance}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Tamaño y Precio</Label>
                    <Select value={selectedSize} onValueChange={(value: "1oz" | "2oz") => setSelectedSize(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1oz" disabled={selectedProduct.stock1oz === 0}>
                          1 onza - ${selectedProduct.price1oz.toLocaleString()} COP ({selectedProduct.stock1oz}{" "}
                          disponibles)
                        </SelectItem>
                        <SelectItem value="2oz" disabled={selectedProduct.stock2oz === 0}>
                          2 onzas - ${selectedProduct.price2oz.toLocaleString()} COP ({selectedProduct.stock2oz}{" "}
                          disponibles)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Cantidad</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Button variant="outline" size="sm" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => {
                          const maxStock = selectedSize === "1oz" ? selectedProduct.stock1oz : selectedProduct.stock2oz
                          const newQuantity = Math.min(maxStock, Math.max(1, Number.parseInt(e.target.value) || 1))
                          setQuantity(newQuantity)
                        }}
                        className="text-center"
                        min="1"
                        max={selectedSize === "1oz" ? selectedProduct.stock1oz : selectedProduct.stock2oz}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const maxStock = selectedSize === "1oz" ? selectedProduct.stock1oz : selectedProduct.stock2oz
                          setQuantity(Math.min(maxStock, quantity + 1))
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Máximo: {selectedSize === "1oz" ? selectedProduct.stock1oz : selectedProduct.stock2oz} unidades
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="itemNotes">Notas del Producto (Opcional)</Label>
                    <Textarea
                      id="itemNotes"
                      placeholder="Ej: Empaque de regalo, entrega urgente, etc."
                      value={itemNotes}
                      onChange={(e) => setItemNotes(e.target.value)}
                      className="mt-2 h-20"
                    />
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span>Subtotal:</span>
                      <span className="font-semibold">
                        $
                        {(
                          (selectedSize === "1oz" ? selectedProduct.price1oz : selectedProduct.price2oz) * quantity
                        ).toLocaleString()}{" "}
                        COP
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={addToOrder}
                    disabled={(selectedSize === "1oz" ? selectedProduct.stock1oz : selectedProduct.stock2oz) < quantity}
                    className="w-full bg-lime-400 hover:bg-lime-500 text-black font-semibold py-3 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar al Pedido
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Shopping Cart */}
            {orderItems.length > 0 && (
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="h-5 w-5" />
                    Carrito de Compras
                  </CardTitle>
                  <CardDescription>
                    {orderSummary.itemCount} producto(s) • {orderItems.length} línea(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {orderItems.map((item) => (
                      <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">
                              {item.product.brand} - {item.product.fragrance}
                            </h4>
                            <p className="text-xs text-gray-600">
                              {item.size} • ${item.unitPrice.toLocaleString()} c/u
                            </p>
                            {item.notes && <p className="text-xs text-blue-600 mt-1 italic">"{item.notes}"</p>}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromOrder(item.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="text-sm font-semibold">${item.price.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Notes */}
                  <div className="mt-4 pt-4 border-t">
                    <Label htmlFor="orderNotes">Instrucciones Especiales del Pedido</Label>
                    <Textarea
                      id="orderNotes"
                      placeholder="Ej: Entrega a domicilio, horario preferido, empaque especial..."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="mt-2 h-16"
                    />
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-lime-600">${orderSummary.subtotal.toLocaleString()} COP</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{orderSummary.itemCount} productos en total</p>
                  </div>

                  <Button
                    onClick={() => setShowInvoice(true)}
                    disabled={!customerName.trim() || orderItems.length === 0}
                    className="w-full mt-4 bg-lime-400 hover:bg-lime-500 text-black font-semibold py-3 disabled:opacity-50"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Revisar Pedido
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Navigation />
    </div>
  )
}
