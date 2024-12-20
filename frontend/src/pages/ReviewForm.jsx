import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';

const ReviewForm = () => {
  const { logId } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [logConfig, setLogConfig] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const fetchLogConfig = async () => {
      try {
        const response = await fetch(`/api/logs/${logId}/config`);
        if (!response.ok) {
          throw new Error('Failed to fetch log configuration');
        }
        const data = await response.json();
        setLogConfig(data);
        
        // Initialize form data based on fields
        const initialData = {};
        data.fields.forEach(field => {
          initialData[field.name] = '';
        });
        setFormData(initialData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogConfig();
  }, [logId]);

  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        photo: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Validate required fields
      const missingFields = logConfig.fields
        .filter(field => field.required && !formData[field.name])
        .map(field => field.name);

      if (missingFields.length > 0) {
        throw new Error(`Please fill out the following required fields: ${missingFields.join(', ')}`);
      }

      // Create FormData for multipart/form-data (needed for file upload)
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value);
      });

      const response = await fetch(`http://localhost:5000/api/logs/${logId}/reviews`, {
        method: 'POST',
        body: submitData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            <p className="mt-2">Loading form...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <Card>
          <CardContent className="p-8">
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                Thank you for your review! It has been submitted successfully.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>{logConfig?.title || 'Submit Review'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {logConfig?.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name} className="capitalize">
                  {field.name} {field.required && <span className="text-red-500">*</span>}
                </Label>
                
                {field.name === 'photo' ? (
                  <Input
                    id={field.name}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                    required={field.required}
                  />
                ) : field.name === 'review' ? (
                  <Textarea
                    id={field.name}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder={`Enter your ${field.name}`}
                    className="h-32"
                    required={field.required}
                  />
                ) : (
                  <Input
                    id={field.name}
                    type="text"
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder={`Enter your ${field.name}`}
                    required={field.required}
                  />
                )}
              </div>
            ))}

            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewForm;