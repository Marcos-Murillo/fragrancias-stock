import type { Order, Customer } from "./firebase-service"

export interface ReceiptData {
  order: Order
  customer: Customer | null
  businessInfo: {
    name: string
    address: string
    phone: string
    email: string
  }
  receiptNumber: string
  printDate: Date
}

export const receiptService = {
  generateReceiptHTML(data: ReceiptData): string {
    const { order, customer, businessInfo, receiptNumber, printDate } = data

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Recibo #${receiptNumber}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            max-width: 300px;
            margin: 0 auto;
            padding: 10px;
            font-size: 12px;
            line-height: 1.4;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .business-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .business-info {
            font-size: 10px;
            margin-bottom: 2px;
          }
          .receipt-info {
            margin-bottom: 15px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
          }
          .customer-info {
            margin-bottom: 15px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
          }
          .items-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
            margin-bottom: 10px;
          }
          .item {
            margin-bottom: 8px;
            border-bottom: 1px dotted #ccc;
            padding-bottom: 5px;
          }
          .item-name {
            font-weight: bold;
            margin-bottom: 2px;
          }
          .item-details {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #666;
          }
          .item-price {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
          }
          .item-notes {
            font-style: italic;
            color: #666;
            font-size: 10px;
            margin-top: 2px;
          }
          .totals {
            border-top: 2px solid #000;
            padding-top: 10px;
            margin-top: 15px;
          }
          .total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          .final-total {
            font-weight: bold;
            font-size: 14px;
            border-top: 1px solid #000;
            padding-top: 5px;
            margin-top: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            border-top: 1px dashed #000;
            padding-top: 10px;
            font-size: 10px;
          }
          .order-notes {
            background: #f5f5f5;
            padding: 8px;
            margin: 10px 0;
            border-left: 3px solid #333;
            font-size: 10px;
          }
          @media print {
            body { margin: 0; padding: 5px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="business-name">${businessInfo.name}</div>
          <div class="business-info">${businessInfo.address}</div>
          <div class="business-info">Tel: ${businessInfo.phone}</div>
          <div class="business-info">${businessInfo.email}</div>
        </div>

        <div class="receipt-info">
          <div><strong>Recibo #:</strong> ${receiptNumber}</div>
          <div><strong>Fecha:</strong> ${printDate.toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}</div>
          <div><strong>Pedido #:</strong> ${order.id.slice(-8).toUpperCase()}</div>
          <div><strong>Estado:</strong> ${order.status === "completed" ? "Completado" : "Pendiente"}</div>
        </div>

        <div class="customer-info">
          <div><strong>Cliente:</strong> ${order.customerName}</div>
          ${order.customerPhone ? `<div><strong>Teléfono:</strong> ${order.customerPhone}</div>` : ""}
          ${customer?.address ? `<div><strong>Dirección:</strong> ${customer.address}</div>` : ""}
        </div>

        <div class="items-header">
          <span>Producto</span>
          <span>Total</span>
        </div>

        ${order.items
          .map(
            (item) => `
          <div class="item">
            <div class="item-name">${item.brand} - ${item.fragrance}</div>
            <div class="item-details">
              <span>Tamaño: ${item.size}</span>
              <span>Cant: ${item.quantity}</span>
              <span>$${item.unitPrice.toLocaleString()} c/u</span>
            </div>
            <div class="item-price">
              <span></span>
              <span>$${item.totalPrice.toLocaleString()} COP</span>
            </div>
            ${item.notes ? `<div class="item-notes">Nota: ${item.notes}</div>` : ""}
          </div>
        `,
          )
          .join("")}

        ${
          order.notes
            ? `
          <div class="order-notes">
            <strong>Instrucciones Especiales:</strong><br>
            ${order.notes}
          </div>
        `
            : ""
        }

        <div class="totals">
          <div class="total-line">
            <span>Subtotal:</span>
            <span>$${order.subtotal.toLocaleString()} COP</span>
          </div>
          <div class="total-line">
            <span>Total Productos:</span>
            <span>${order.itemCount} unidades</span>
          </div>
          <div class="total-line final-total">
            <span>TOTAL A PAGAR:</span>
            <span>$${order.total.toLocaleString()} COP</span>
          </div>
        </div>

        <div class="footer">
          <div>¡Gracias por su compra!</div>
          <div>Conserve este recibo</div>
          <div style="margin-top: 10px;">
            ${new Date().toLocaleDateString("es-CO")} - Sistema LotionPro
          </div>
        </div>

        <div class="no-print" style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Imprimir Recibo
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; font-size: 14px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
            Cerrar
          </button>
        </div>
      </body>
      </html>
    `
  },

  printReceipt(data: ReceiptData): void {
    const receiptHTML = this.generateReceiptHTML(data)
    const printWindow = window.open("", "_blank", "width=400,height=600")

    if (printWindow) {
      printWindow.document.write(receiptHTML)
      printWindow.document.close()

      // Auto print after content loads
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
        }, 250)
      }
    }
  },

  downloadReceiptPDF(data: ReceiptData): void {
    // For PDF generation, you would typically use a library like jsPDF
    // For now, we'll create a downloadable HTML file
    const receiptHTML = this.generateReceiptHTML(data)
    const blob = new Blob([receiptHTML], { type: "text/html" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `recibo-${data.receiptNumber}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },
}
