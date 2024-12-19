import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle, ChevronDown, ChevronUp, Filter } from 'lucide-react';
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
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [expandedReviews, setExpandedReviews] = useState(new Set());

  useEffect(() => {
    const fetchLogAndReviews = async () => {
      try {
        // Fetch log details
        const logResponse = await fetch(`/api/logs/${logId}/config`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!logResponse.ok) {
          throw new Error('Failed to fetch log details');
        }

        const logData = await logResponse.ok();
        setLog(logData);

        // Fetch reviews
        const reviewsResponse = await fetch(`/api/logs/${logId}/reviews`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!reviewsResponse.ok) {
          throw new Error('Failed to fetch reviews');
        }

        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogAndReviews();
  }, [logId]);

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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{log?.title || 'Log Reviews'}</CardTitle>
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

                    {review.field_values.map((field) => (
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewLog;