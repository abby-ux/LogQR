import React, { useState, useEffect } from 'react';
import { Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'; // to create a card layout
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ListOrderedIcon } from "lucide-react"
import { Alert, AlertDescription } from '../components/ui/alert';

const CreateLog = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false); // tracks if the form is currently being submitted
  const [error, setError] = useState(''); // to show validation or server errors
  const { logId } = useParams();
  const isEditing = !!logId;
  const [isLoading, setIsLoading] = useState(isEditing); // we need to load the prior form data if just editing
  
  // Form state for the form field options
  // the form structure is defined with a complex object/array
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [visitReasons, setVisitReasons] = useState({
    usual: false,
    injury: false,
    pills: false,
    teeth: false,
    bored: false,
    curious: false,
    phoneConvo: false,
    crying: false,
    break: false,
    mouthwash: false,
    sick: false,
    tissue: false,
    other: false
  });

  // Mirror gazing time state
  const [timeValue, setTimeValue] = useState('');
  const [timeUnit, setTimeUnit] = useState('minutes');

  // Topics pondered state
  const [topics, setTopics] = useState({
    past: false,
    future: false,
    morality: false,
    butts: false,
    love: false,
    money: false,
    politics: false,
    weekend: false,
    work: false,
    aliens: false,
    garlicBread: false,
    business: false,
    other: false
  });

  // Final notes state
  const [finalNotes, setFinalNotes] = useState('');

  // array of objects that define the log form structure
  // set fields function lets the user update the entire log config at once
  const [fields, setFields] = useState([
    { name: 'name', enabled: true, required: true },
    { name: 'photo', enabled: true, required: false },
    { name: 'review', enabled: false, required: false },
    { name: 'note', enabled: false, required: false },
    {
      name: 'visitReasons',
      enabled: true,
      required: false,
      type: 'checkbox',
      options: visitReasons
    },
    {
      name: 'timeSpent',
      enabled: true,
      required: false,
      type: 'duration',
      value: { value: timeValue, unit: timeUnit }
    },
    {
      name: 'topicsPondered',
      enabled: true,
      required: false,
      type: 'checkbox',
      options: topics
    },
    {
      name: 'finalNotes',
      enabled: true,
      required: false,
      type: 'textarea',
      value: finalNotes
    }
  ]);

  // Fetch existing log data if editing
  useEffect(() => {
    const fetchLogData = async () => {
      if (!isEditing) return;

      try {
        const response = await fetch(`/api/logs/${logId}/config`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch log details');
        }

        // store form config data for repsonse in a json object
        const data = await response.json();
        
        // Populate form with existing data
        setTitle(data.title);
        setDescription(data.description);
        
        // Map existing fields to form state
        const existingFields = fields.map(field => {
          const existingField = data.fields.find(f => f.name === field.name);
          return existingField ? {
            name: field.name,
            enabled: true,
            required: existingField.required
          } : field;
        });
        
        setFields(existingFields);
      } catch (err) {
        setError('Failed to load log data: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogData();
  }, [logId, isEditing]);

  // update the log config details. - actually doesnt update the array, but creates a new one
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
      const endpoint = isEditing ? `http://localhost:5000/api/logs/${logId}` : 'http://localhost:5000/api/logs';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title,
          description,
          fields: enabledFields
        })
      });

      if (!response.ok) {
        throw new Error(isEditing ? 'Failed to update log' : 'Failed to create log');
      }

      const data = await response.json();
      // Navigate to the log view page
      navigate(`/logs/${isEditing ? logId : data.logId}`, { 
        state: { qrCodeUrl: data.qrCodeUrl }
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
};

if (isLoading) {
  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardContent className="p-8 flex justify-center items-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    </div>
  );
}

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Log' : 'Create New Log'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error === 'Invalid token' 
                  ? 'Session expired. Please sign in first.'
                  :  error}
              </AlertDescription>
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
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isEditing ? 'Updating...' : 'Creating...'}</span>
                </div>
              ) : (
                isEditing ? 'Update Log' : 'Create Log'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateLog;