import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from '../components/ui/alert';

const CreateLog = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState([
    { name: 'name', enabled: true, required: true },
    { name: 'photo', enabled: false, required: false },
    { name: 'review', enabled: true, required: true },
    { name: 'note', enabled: false, required: false }
  ]);

  const handleFieldChange = (index, property) => {
    setFields(fields.map((field, i) => {
      if (i === index) {
        return { 
          ...field,
          [property]: property === 'enabled' ? !field.enabled : !field.required 
        };
      }
      return field;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validate form
    if (!title.trim()) {
      setError('Title is required');
      setIsSubmitting(false);
      return;
    }

    // Only include enabled fields
    const enabledFields = fields.filter(field => field.enabled);
    if (enabledFields.length === 0) {
      setError('At least one field must be enabled');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Assuming token is stored in localStorage
        },
        body: JSON.stringify({
          title,
          description,
          fields: enabledFields
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create log');
      }

      const data = await response.json();
      // Navigate to the log view page with the QR code
      navigate(`/logs/${data.logId}`, { state: { qrCodeUrl: data.qrCodeUrl } });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Log</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter log title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter log description"
                className="h-24"
              />
            </div>

            <div className="space-y-4">
              <Label>Form Fields</Label>
              {fields.map((field, index) => (
                <div key={field.name} className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${field.name}-enabled`}
                      checked={field.enabled}
                      onCheckedChange={() => handleFieldChange(index, 'enabled')}
                    />
                    <Label htmlFor={`${field.name}-enabled`}>
                      {field.name.charAt(0).toUpperCase() + field.name.slice(1)}
                    </Label>
                  </div>
                  
                  {field.enabled && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${field.name}-required`}
                        checked={field.required}
                        onCheckedChange={() => handleFieldChange(index, 'required')}
                      />
                      <Label htmlFor={`${field.name}-required`}>Required</Label>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Log'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateLog;