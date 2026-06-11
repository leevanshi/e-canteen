import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Printer, Download, X } from "lucide-react";

const OrderReceipt = ({ order, onClose, onPrint }) => {
  const receiptRef = useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);

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
    const printContent = receiptRef.current;
    if (!printContent) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Order Receipt - ${order.order_id || order.order_code}</title>
            <style>
              body {
                font-family: 'Courier New', monospace;
                max-width: 280px;
                margin: 0 auto;
                padding: 20px;
                background: white;
              }
              .receipt {
                border: 1px dashed #000;
                padding: 20px;
              }
              .header {
                text-align: center;
                margin-bottom: 20px;
                border-bottom: 1px dashed #000;
                padding-bottom: 10px;
              }
              .header h1 {
                margin: 0;
                font-size: 18px;
              }
              .header p {
                margin: 5px 0;
                font-size: 12px;
              }
              .order-info {
                margin-bottom: 20px;
                font-size: 12px;
              }
              .order-info p {
                margin: 5px 0;
              }
              .items {
                margin-bottom: 20px;
                border-top: 1px dashed #000;
                border-bottom: 1px dashed #000;
                padding: 10px 0;
              }
              .item {
                display: flex;
                justify-content: space-between;
                margin: 5px 0;
                font-size: 12px;
              }
              .total {
                display: flex;
                justify-content: space-between;
                font-weight: bold;
                font-size: 14px;
                margin-top: 10px;
                border-top: 1px solid #000;
                padding-top: 10px;
              }
              .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 11px;
              }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
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

  const orderDate = new Date(order.created_at || order.timestamp || Date.now());
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
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Order Receipt</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        <div className="p-4">
          <div ref={receiptRef} className="receipt bg-white p-6 border border-gray-300 rounded">
            <div className="header text-center mb-4 border-b border-dashed border-gray-400 pb-4">
              <h1 className="text-xl font-bold mb-1">☕ E-CANTEEN</h1>
              <p className="text-sm text-gray-600">NMIMS Campus</p>
              <p className="text-xs text-gray-500">Walk-In Order</p>
            </div>

            <div className="order-info text-sm mb-4">
              <p><strong>Order ID:</strong> {order.order_id || order.order_code}</p>
              <p><strong>Date:</strong> {formattedDate}</p>
              <p><strong>Time:</strong> {formattedTime}</p>
              {order.admin_name && <p><strong>Processed By:</strong> {order.admin_name}</p>}
            </div>

            <div className="items border-t border-dashed border-gray-400 border-b py-3 mb-4">
              <p className="font-semibold mb-2 text-sm">Items:</p>
              {order.items?.map((item, index) => (
                <div key={index} className="item flex justify-between text-sm">
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="total flex justify-between font-bold text-base border-t border-gray-400 pt-3">
              <span>TOTAL</span>
              <span>₹{order.total_amount?.toFixed(2) || order.total?.toFixed(2)}</span>
            </div>

            {order.payment_method && (
              <div className="mt-3 text-sm">
                <p><strong>Payment:</strong> {order.payment_method}</p>
                {order.cash_received && (
                  <p><strong>Cash Received:</strong> ₹{order.cash_received.toFixed(2)}</p>
                )}
              </div>
            )}

            <div className="footer text-center mt-4 text-xs text-gray-500">
              <p>Thank you for your order!</p>
              <p>Visit us again</p>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Printer size={18} />
              {isPrinting ? "Printing..." : "Print"}
            </Button>
            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Download PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderReceipt;
