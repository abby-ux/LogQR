import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle, ChevronLeft, Calendar, User } from 'lucide-react';


const ViewReview = () => {
  const { logId, reviewId } = useParams();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/logs/${logId}/reviews/${reviewId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch review details');
        }

        const data = await response.json();
        setReview(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [logId, reviewId]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl py-8">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">Loading review details...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-3xl py-8">
        <Card>
          <CardContent className="p-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Link to={`/logs/${logId}/reviews`}>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <ChevronLeft className="h-4 w-4" />
                Back to Log
              </Button>
            </Link>
          </div>
          <CardTitle>Review Details</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Review Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(review.submitted_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{review.reviewer_name}</span>
            </div>
          </div>

          {/* Review Field Values */}
          <div className="space-y-4">
  {review.field_values.map((field, index) => {
    const cleanFieldValue = () => {
      if (field.field_name === 'timeSpent') {
        try {
          const timeObj = JSON.parse(field.field_value);
          return `${timeObj.value} ${timeObj.unit}`;
        } catch {
          return field.field_value;
        }
      }

      // For visitReasons and topicsPondered, remove brackets and quotes
      if (field.field_name === 'visitReasons' || field.field_name === 'topicsPondered') {
        return field.field_value
          .replace(/[{}]/g, '') // Remove curly braces
          .split(',') // Split into array
          .map(item => item.trim().replace(/"/g, '')); // Remove quotes and trim whitespace
      }

      return field.field_value;
    };

    const renderFieldValue = () => {
      if (field.field_name === 'photo') {
        return field.file_url ? (
          <div className="rounded-lg overflow-hidden border">
            <img
              src={field.file_url}
              alt="Review"
              className="max-w-full h-auto"
            />
          </div>
        ) : (
          <p className="text-gray-500 italic">No photo provided</p>
        );
      }

      const value = cleanFieldValue();

      if (Array.isArray(value)) {
        return (
          <ul className="list-disc pl-5 space-y-1">
            {value.map((item, idx) => (
              <li key={idx} className="text-gray-700 capitalize">{item}</li>
            ))}
          </ul>
        );
      }

      return <p className="text-gray-700">{value}</p>;
    };

    return (
      <div key={index} className="space-y-2">
        <h3 className="font-medium capitalize">
          {field.field_name.replace(/([A-Z])/g, ' $1').toLowerCase()}
        </h3>
        {renderFieldValue()}
      </div>
    );
  })}
</div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ViewReview;