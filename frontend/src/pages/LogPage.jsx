import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle, Printer, Share2 } from 'lucide-react';

const LogPage = () => {
  // get the logId from /logs/:logId
  const { logId } = useParams();
  const location = useLocation();
  const [log, setLog] = useState(null); // fetch the log from the server
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true); // we are initially loading data
  
  // If we have a QR code URL from navigation state, use it
  const initialQrCode = location.state?.qrCodeUrl;
  // might have to qrcode value, might not
  const [qrCodeUrl, setQrCodeUrl] = useState(initialQrCode);

  useEffect(() => {
    const fetchLogDetails = async () => {
      try {
        const response = await fetch(`/api/logs/${logId}/config`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch log details');
        }

        const data = await response.json();
        setLog(data);
        // If we didn't get QR code from navigation, use the one from the API
        if (!qrCodeUrl) {
          setQrCodeUrl(data.qr_code_url);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogDetails();
  }, [logId, qrCodeUrl]);

  const handlePrint = () => {
    // Open a new window with just the QR code for printing
    const printWindow = window.open('', '', 'width=600,height=600');
    printWindow.document.write(`
      <html>
        <head><title>Print QR Code</title></head>
        <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
          <div style="text-align: center;">
            <h2 style="margin-bottom: 20px;">${log?.title || 'QR Code'}</h2>
            <img src="${qrCodeUrl}" style="max-width: 300px;" />
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: log?.title,
          text: log?.description,
          url: window.location.href
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Failed to share log');
        }
      }
    } else {
      // Fallback to copying URL to clipboard
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Link copied to clipboard!'))
        .catch(() => setError('Failed to copy link'));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>{log?.title || 'Log Details'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {log?.description && (
            <div className="text-gray-600">
              {log.description}
            </div>
          )}

          {qrCodeUrl && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code"
                  className="max-w-[300px] border rounded-lg shadow-sm" 
                />
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button 
                  variant="outline" 
                  onClick={handlePrint}
                  className="flex items-center space-x-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print QR Code</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="flex items-center space-x-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Log</span>
                </Button>
              </div>
            </div>
          )}

          {log?.fields && (
            <div className="space-y-2">
              <h3 className="font-medium">Enabled Fields:</h3>
              <div className="space-y-1">
                {log.fields.map((field, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="capitalize">{field.name}</span>
                    {field.required && (
                      <span className="text-sm text-gray-500">(Required)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LogPage;