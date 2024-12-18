import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'; // to create a card layout
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
  const [isSubmitting, setIsSubmitting] = useState(false); // tracks if the form is currently being submitted
  const [error, setError] = useState(''); // to show validation or server errors
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // array of objects that define the log form structure
  // set fields function lets the user update the entire log config at once
  const [fields, setFields] = useState([
    { name: 'name', enabled: true, required: true },
    { name: 'photo', enabled: false, required: false },
    { name: 'review', enabled: true, required: true },
    { name: 'note', enabled: false, required: false }
  ]);

  // update the log config details. 
  // takes in the index of the field the user is changing, and the property user is changing
  const handleFieldChange = (index, property) => {
    // use setFields function to update the state
    // map function creates a new array by looping through each field
    setFields(fields.map((field, i) => {
      if (i === index) {
        return { 
          ...field, // copy all existing properties of the field
          // get the property value and check which value we should be changing
          [property]: property === 'enabled' ? !field.enabled : !field.required 
        };
      }
      return field; // return other fields unchanged
    }));
  };

  // handle log creation form submission
  // use async because we need to wait for network requests to complete
  // e -- form submission event
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Log the request payload for debugging
    const requestPayload = {
      title,
      description,
      fields: fields.filter(field => field.enabled)
    };
    console.log('Sending request with payload:', requestPayload);

    try {
      // Use the environment variable to construct the full URL
      const apiUrl = `${process.env.REACT_APP_API_URL}/api/logs`;
      console.log('Making request to:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestPayload)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(e => ({ error: 'No error details available' }));
        console.error('Error response:', errorData);
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      console.log('Success response:', data);
      navigate(`/logs/${data.logId}`, { state: { qrCodeUrl: data.qrCodeUrl } });
    } catch (err) {
      console.error('Full error details:', err);
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