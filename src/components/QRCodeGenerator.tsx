import React, { useState, useRef, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { FiDownload, FiCopy, FiPrinter, FiRefreshCw } from "react-icons/fi";
import { IconWrapper } from "../components/common/IconWrapper";
import { api } from "../services/api";

interface QRCodeGeneratorProps {
  hotelId?: string;
  hotelName?: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  hotelId,
  hotelName,
}) => {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [feedbackUrl, setFeedbackUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  // Fetch QR code from backend or generate locally if hotelId changes
  useEffect(() => {
    if (hotelId) {
      fetchQRCode(hotelId);
    } else {
      // Fallback to local generation if no hotelId
      const baseUrl = window.location.origin;
      setFeedbackUrl(`${baseUrl}/guest-feedback`);
      setQrCodeUrl(null);
    }
  }, [hotelId]);

  // Fetch QR code from backend
  const fetchQRCode = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.hotels.generateQRCode(id);

      if (response.success && response.data) {
        setQrCodeUrl(response.data.qrCodeUrl);
        setFeedbackUrl(response.data.feedbackUrl);
      } else {
        setError(response.error || "Failed to generate QR code");
        // Fallback to local URL
        const baseUrl = window.location.origin;
        setFeedbackUrl(`${baseUrl}/guest-feedback?hotelId=${id}`);
      }
    } catch (err) {
      setError("Error generating QR code");
      // Fallback to local URL
      const baseUrl = window.location.origin;
      setFeedbackUrl(`${baseUrl}/guest-feedback?hotelId=${id}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle copy URL to clipboard
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(feedbackUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Handle download QR code
  const handleDownload = () => {
    // If we have a backend-generated QR code URL, download directly
    if (qrCodeUrl) {
      const a = document.createElement("a");
      a.href = qrCodeUrl;
      a.download = `${hotelName || "Presken-Hotel"}-Feedback-QR.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // Fallback to local canvas download
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector("canvas");
    if (!canvas) return;

    const a = document.createElement("a");
    a.download = `${hotelName || "Presken-Hotel"}-Feedback-QR.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  // Handle regenerate QR code
  const handleRegenerate = () => {
    if (hotelId) {
      fetchQRCode(hotelId);
    }
  };

  // Handle print QR code
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const hotelTitle = hotelName ? hotelName : "Presken Hotel";

    // If we have a backend-generated QR code, use it in the print view
    const qrCodeHtml = qrCodeUrl
      ? `<img src="${qrCodeUrl}" alt="QR Code" style="max-width: 200px; max-height: 200px;" />`
      : qrRef.current?.innerHTML || "";

    printWindow.document.write(`
      <html>
        <head>
          <title>Feedback QR Code - ${hotelTitle}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
            }
            .qr-container {
              margin: 0 auto;
              max-width: 500px;
            }
            h1 {
              color: #333;
              margin-bottom: 10px;
            }
            p {
              color: #666;
              margin-bottom: 30px;
            }
            .qr-code {
              padding: 20px;
              background: white;
              border-radius: 10px;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
              display: inline-block;
            }
            .instructions {
              margin-top: 30px;
              text-align: left;
              font-size: 14px;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h1>Scan to Share Your Feedback</h1>
            <p>We value your opinion at ${hotelTitle}</p>
            <div class="qr-code">
              ${qrCodeHtml}
            </div>
            <div class="instructions">
              <p>1. Open your phone's camera app</p>
              <p>2. Point it at the QR code above</p>
              <p>3. Tap the notification that appears</p>
              <p>4. Share your feedback with us!</p>
            </div>
            <button class="no-print" style="margin-top: 30px; padding: 10px 20px;" onclick="window.print()">Print</button>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-medium mb-4">Guest Feedback QR Code</h3>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative">
          {loading ? (
            <div
              className="bg-white p-4 rounded-lg shadow-sm border flex items-center justify-center"
              style={{ width: "232px", height: "232px" }}
            >
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div
              className="bg-white p-4 rounded-lg shadow-sm border"
              style={{ width: "232px", height: "232px" }}
            >
              <div className="h-full flex flex-col items-center justify-center text-center">
                <p className="text-red-500 mb-2">Error loading QR code</p>
                <button
                  onClick={handleRegenerate}
                  className="btn btn-sm btn-outline"
                >
                  <IconWrapper icon={FiRefreshCw} className="mr-1" />
                  Retry
                </button>
              </div>
            </div>
          ) : qrCodeUrl ? (
            <div
              ref={qrRef}
              className="bg-white p-4 rounded-lg shadow-sm border"
              style={{ width: "232px", height: "232px" }}
            >
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="max-w-full max-h-full"
              />
            </div>
          ) : (
            <div
              ref={qrRef}
              className="bg-white p-4 rounded-lg shadow-sm border"
            >
              <QRCodeCanvas
                value={feedbackUrl}
                size={200}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"H"}
                includeMargin={true}
              />
            </div>
          )}
          {hotelId && !loading && !error && (
            <button
              onClick={handleRegenerate}
              className="absolute top-2 right-2 p-1 rounded-full bg-white shadow-sm hover:shadow-md"
              title="Regenerate QR Code"
            >
              <IconWrapper icon={FiRefreshCw} className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Feedback URL:</p>
            <div className="flex">
              <input
                type="text"
                value={feedbackUrl}
                readOnly
                className="input-field flex-1 text-sm"
              />
              <button
                onClick={handleCopyUrl}
                className="ml-2 btn btn-outline flex items-center"
                title="Copy URL"
              >
                <IconWrapper icon={FiCopy} className="mr-1" />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            Display this QR code in guest rooms, reception area, or include it
            in welcome materials. Guests can scan it to provide immediate
            feedback.
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDownload}
              className="btn btn-outline flex items-center"
              disabled={loading}
            >
              <IconWrapper icon={FiDownload} className="mr-1" />
              Download
            </button>
            <button
              onClick={handlePrint}
              className="btn btn-outline flex items-center"
              disabled={loading}
            >
              <IconWrapper icon={FiPrinter} className="mr-1" />
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
