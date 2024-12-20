import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle, ChevronDown, ChevronUp, Filter, Printer, Share2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const ViewLog = () => {
  const { logId } = useParams();
  const [log, setLog] = useState(null);
  const [reviews, setReviews] = useState([]);  // Initialize as empty array
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedReviews, setExpandedReviews] = useState(new Set());
  const [qrCodeUrl, setQrCodeUrl] = useState(null);

  const fetchReviews = async (page) => {
    try {
      setLoading(true);
      const reviewsResponse = await fetch(
        `http://localhost:5000/api/logs/${logId}/reviews?page=${page}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!reviewsResponse.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const reviewsData = await reviewsResponse.json();
      setReviews(reviewsData.reviews || []);
      setPagination(reviewsData.pagination || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogDetails = async () => {
    try {
      const logResponse = await fetch(
        `http://localhost:5000/api/logs/${logId}/config`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!logResponse.ok) {
        throw new Error('Failed to fetch log details');
      }

      const logData = await logResponse.json();
      setLog(logData);
      setQrCodeUrl(logData.qr_code_url);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const initializePage = async () => {
      setLoading(true);
      await Promise.all([
        fetchLogDetails(),
        fetchReviews(currentPage)
      ]);
      setLoading(false);
    };

    initializePage();
  }, [logId]);

  const handlePageChange = async (newPage) => {
    if (newPage === currentPage) return;
    
    setCurrentPage(newPage);
    fetchReviews(newPage);
    
    // Scroll to top of reviews section
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const toggleReviewExpansion = (reviewId) => {
    const newExpanded = new Set(expandedReviews);
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId);
    } else {
      newExpanded.add(reviewId);
    }
    setExpandedReviews(newExpanded);
  };

  const handleSortChange = (value) => {
    setSortOrder(value);
    const sortedReviews = [...reviews].sort((a, b) => {
      const dateA = new Date(a.submitted_at);
      const dateB = new Date(b.submitted_at);
      return value === 'newest' ? dateB - dateA : dateA - dateB;
    });
    setReviews(sortedReviews);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=600,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${log?.title || 'Log'}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              font-family: system-ui, -apple-system, sans-serif;
            }
            .container {
              text-align: center;
              padding: 20px;
            }
            .title {
              font-size: 24px;
              margin-bottom: 20px;
              color: #333;
            }
            .description {
              font-size: 16px;
              color: #666;
              margin-bottom: 30px;
            }
            img {
              max-width: 300px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              border-radius: 8px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2 class="title">${log?.title || 'QR Code'}</h2>
            ${log?.description ? `<p class="description">${log.description}</p>` : ''}
            <img src="${qrCodeUrl}" alt="QR Code"/>
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
  };

  const handleShare = async () => {
    // Construct the review URL
    const reviewUrl = `${window.location.origin}/review/${logId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: log?.title,
          text: log?.description,
          url: reviewUrl // Use review URL instead of current URL
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Failed to share log');
        }
      }
    } else {
      // Fallback to copying review URL to clipboard
      navigator.clipboard.writeText(reviewUrl)
        .then(() => alert('Link copied to clipboard!'))
        .catch(() => setError('Failed to copy link'));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
        {/* qr code */}
        <Card>
        <CardHeader>
          <CardTitle>QR Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
        </CardContent>
      </Card>

        {/* review */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{log?.title || 'Log Reviews'}</CardTitle>
            {pagination && (
              <p className="text-sm text-gray-500 mt-1">
                Showing {reviews.length} of {pagination.total_records} reviews
              </p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <Select value={sortOrder} onValueChange={handleSortChange}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No reviews yet
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.review_id} className="w-full">
                  <CardContent className="p-6">
                  <Link 
                    to={`/logs/${logId}/reviews/${review.review_id}`}
                    className="block hover:bg-gray-50"
                   >
                        <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <div className="font-medium">
                            {review.reviewer_name || 'Anonymous'}
                            </div>
                            <div className="text-sm text-gray-500">
                            {formatDate(review.submitted_at)}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleReviewExpansion(review.review_id)}
                        >
                            {expandedReviews.has(review.review_id) ? (
                            <ChevronUp className="h-4 w-4" />
                            ) : (
                            <ChevronDown className="h-4 w-4" />
                            )}
                        </Button>
                        </div>
                    </Link>

                    
                    {Array.isArray(review.field_values) && review.field_values.map((field) => (
                        <div
                            key={field.value_id}
                            className={`mt-4 ${
                            !expandedReviews.has(review.review_id) &&
                            field.field_name !== 'review'
                                ? 'hidden'
                                : ''
                            }`}
                        >
                            <div className="font-medium capitalize mb-2">
                            {field.field_name}:
                            </div>
                            {field.field_name === 'photo' && field.file_url ? (
                            <img
                                src={field.file_url}
                                alt="Review"
                                className="max-w-sm rounded-lg"
                            />
                            ) : (
                            <div className="text-gray-600">{field.field_value}</div>
                            )}
                        </div>
                    ))}
                    

{Array.from({ length: pagination.total_pages }, (_, i) => {
                const pageNumber = i + 1;
                // Show first page, last page, current page, and pages around current page
                if (
                  pageNumber === 1 ||
                  pageNumber === pagination.total_pages ||
                  (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                ) {
                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNumber)}
                      disabled={loading}
                      className="min-w-[40px]"
                    >
                      {pageNumber}
                    </Button>
                  );
                } else if (
                  pageNumber === currentPage - 2 ||
                  pageNumber === currentPage + 2
                ) {
                  return <span key={pageNumber} className="px-2">...</span>;
                }
                return null;
              })}

<Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.total_pages || loading}
              >
                Next
              </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {pagination && pagination.total_pages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: pagination.total_pages }, (_, i) => (
                <Button
                  key={i + 1}
                  variant={pagination.current_page === i + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    // Add pagination logic here
                  }}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewLog;