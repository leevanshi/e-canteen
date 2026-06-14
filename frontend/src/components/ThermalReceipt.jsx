import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Printer, Download, X, ChefHat } from "lucide-react";
import jsPDF from "jspdf";

const ThermalReceipt = ({ order, onClose, onPrint }) => {
  const receiptRef = useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);
    const printContent = receiptRef.current;
    const originalContents = document.body.innerHTML;

    if (printContent) {
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }

    setIsPrinting(false);
    if (onPrint) onPrint();
  };

  const handleDownloadPDF = () => {
    setIsDownloading(true);
    
    try {
      // Calculate dynamic height based on content
      const baseHeight = 40; // Base height in mm
      const itemRowHeight = 8; // Height per item in mm
      const itemsCount = order.items?.length || 0;
      const calculatedHeight = baseHeight + (itemsCount * itemRowHeight) + 30; // +30 for footer

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, calculatedHeight]
      });

      // Add receipt content
      const orderId = order.order_id || order.order_code || order._id;
      const orderDate = new Date(order.created_at || Date.now());
      const formattedDate = orderDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const formattedTime = orderDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      });

      let yPosition = 10;
      const pageWidth = 80;
      const centerX = pageWidth / 2;

      // Header
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("E-CANTEEN", centerX, yPosition, { align: "center" });
      yPosition += 5;
      
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text("NMIMS Campus", centerX, yPosition, { align: "center" });
      yPosition += 8;

      // Separator
      pdf.setLineWidth(0.2);
      pdf.line(5, yPosition, 75, yPosition);
      yPosition += 5;

      // Order Info
      pdf.setFontSize(8);
      pdf.setFont("courier", "normal");
      pdf.text(`Order ID : ${orderId}`, 5, yPosition);
      yPosition += 4;
      pdf.text(`Date     : ${formattedDate}`, 5, yPosition);
      yPosition += 4;
      pdf.text(`Time     : ${formattedTime}`, 5, yPosition);
      yPosition += 6;

      // Items Header
      pdf.setLineWidth(0.2);
      pdf.line(5, yPosition, 75, yPosition);
      yPosition += 4;
      pdf.setFont("courier", "bold");
      pdf.text("ITEMS", centerX, yPosition, { align: "center" });
      yPosition += 4;
      pdf.setLineWidth(0.2);
      pdf.line(5, yPosition, 75, yPosition);
      yPosition += 4;

      // Items
      pdf.setFont("courier", "normal");
      order.items?.forEach((item) => {
        const itemText = `${item.name} x${item.quantity}`;
        const priceText = `₹${(item.price * item.quantity).toFixed(0)}`;
        pdf.text(itemText, 5, yPosition);
        pdf.text(priceText, 75, yPosition, { align: "right" });
        yPosition += 4;
      });

      // Separator
      yPosition += 2;
      pdf.setLineWidth(0.2);
      pdf.line(5, yPosition, 75, yPosition);
      yPosition += 5;

      // Total
      pdf.setFont("courier", "bold");
      pdf.setFontSize(10);
      pdf.text(`TOTAL`, 5, yPosition);
      pdf.text(`₹${order.total_amount?.toFixed(0) || order.total?.toFixed(0)}`, 75, yPosition, { align: "right" });
      yPosition += 6;

      // Separator
      pdf.setLineWidth(0.2);
      pdf.line(5, yPosition, 75, yPosition);
      yPosition += 5;

      // Payment
      pdf.setFontSize(8);
      pdf.setFont("courier", "normal");
      pdf.text(`Payment : ${order.payment_method || "Cash"}`, 5, yPosition);
      yPosition += 8;

      // Footer
      pdf.setFontSize(8);
      pdf.text("Thank You", centerX, yPosition, { align: "center" });
      yPosition += 4;
      pdf.text("Visit Again", centerX, yPosition, { align: "center" });
      yPosition += 5;

      // Bottom separator
      pdf.setLineWidth(0.2);
      pdf.line(5, yPosition, 75, yPosition);

      pdf.save(`receipt-${orderId}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
    }

    setIsDownloading(false);
  };

  const handlePrintKitchenToken = () => {
    const orderId = order.order_id || order.order_code || order._id;
    const items = order.items?.map(item => `${item.name} x${item.quantity}`).join('\n') || '';
    
    const kitchenTokenContent = `
================================
TOKEN : ${orderId}
================================

${items}

================================
READY FOR PREPARATION
================================
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Kitchen Token - ${orderId}</title>
            <style>
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body {
                font-family: 'Courier New', monospace;
                font-size: 14px;
                font-weight: bold;
                max-width: 80mm;
                margin: 0;
                padding: 5mm;
                background: white;
              }
              .token {
                text-align: center;
                line-height: 1.5;
              }
              .token-id {
                font-size: 20px;
                font-weight: bold;
              }
              .items {
                font-size: 14px;
                margin: 10px 0;
                text-align: left;
              }
              .footer {
                font-size: 16px;
                font-weight: bold;
                margin-top: 15px;
              }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            <div class="token">
              <div class="token-id">TOKEN : ${orderId}</div>
              <div class="items">${items.replace(/\n/g, '<br>')}</div>
              <div class="footer">READY FOR PREPARATION</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  if (!order) return null;

  const orderDate = new Date(order.created_at || Date.now());
  const formattedDate = orderDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const formattedTime = orderDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Order Receipt</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        <div className="p-4 flex justify-center">
          {/* Thermal Receipt Preview - Exact 80mm width */}
          <div 
            ref={receiptRef}
            className="receipt bg-white p-2 border border-gray-300"
            style={{ 
              width: '80mm',
              fontFamily: "'Courier New', monospace",
              fontSize: '12px',
              lineHeight: '1.4'
            }}
          >
            {/* Header */}
            <div className="text-center mb-2">
              <div className="text-sm font-bold">E-CANTEEN</div>
              <div className="text-xs">NMIMS Campus</div>
            </div>

            <div className="border-t border-b border-dashed border-gray-400 py-2 mb-2">
              <div className="text-xs">Order ID : {order.order_id || order.order_code}</div>
              <div className="text-xs">Date     : {formattedDate}</div>
              <div className="text-xs">Time     : {formattedTime}</div>
            </div>

            {/* Items */}
            <div className="border-t border-b border-dashed border-gray-400 py-2 mb-2">
              <div className="text-xs font-bold text-center mb-2">ITEMS</div>
              {order.items?.map((item, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span>{item.name} x{item.quantity}</span>
                  <span>₹{(item.price * item.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t border-b border-gray-400 py-2 mb-2">
              <div className="flex justify-between font-bold text-sm">
                <span>TOTAL</span>
                <span>₹{order.total_amount?.toFixed(0) || order.total?.toFixed(0)}</span>
              </div>
            </div>

            {/* Payment */}
            <div className="text-xs mb-2">
              <div>Payment : {order.payment_method || "Cash"}</div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs">
              <div>Thank You</div>
              <div>Visit Again</div>
            </div>
          </div>
        </div>

        <div className="p-4 pt-0 flex flex-col gap-3">
          <Button
            onClick={handlePrint}
            disabled={isPrinting}
            className="w-full flex items-center justify-center gap-2"
          >
            <Printer size={18} />
            {isPrinting ? "Printing..." : "Print Receipt"}
          </Button>
          <Button
            onClick={handlePrintKitchenToken}
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            <ChefHat size={18} />
            Print Kitchen Token
          </Button>
          <Button
            onClick={handleDownloadPDF}
            variant="outline"
            disabled={isDownloading}
            className="w-full flex items-center justify-center gap-2"
          >
            <Download size={18} />
            {isDownloading ? "Downloading..." : "Download PDF"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ThermalReceipt;
