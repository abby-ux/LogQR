import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { AlertCircle, Loader2, ArrowLeft, ArrowRight, Send } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Checkbox } from '../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const ReviewForm = () => {
    const { logId } = useParams();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [logConfig, setLogConfig] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    
    // State for form data (same as before)
    const [formData, setFormData] = useState({
      name: '',
      photo: null,
      review: '',
      note: '',
      visitReasons: {
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
      },
      timeSpent: {
        value: '',
        unit: 'minutes'
      },
      topicsPondered: {
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
      },
      finalNotes: ''
    });
  
    useEffect(() => {
      const fetchLogConfig = async () => {
        try {
          const response = await fetch(`/api/logs/${logId}/config`);
          if (!response.ok) {
            throw new Error('Failed to fetch log configuration');
          }
          const data = await response.json();
          setLogConfig(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
  
      fetchLogConfig();
    }, [logId]);
  
    // Handler functions (same as before)
    const handleVisitReasonChange = (reason) => {
      setFormData(prev => ({
        ...prev,
        visitReasons: {
          ...prev.visitReasons,
          [reason]: !prev.visitReasons[reason]
        }
      }));
    };
  
    const handleTopicChange = (topic) => {
      setFormData(prev => ({
        ...prev,
        topicsPondered: {
          ...prev.topicsPondered,
          [topic]: !prev.topicsPondered[topic]
        }
      }));
    };
  
    const handleTimeChange = (field, value) => {
      setFormData(prev => ({
        ...prev,
        timeSpent: {
          ...prev.timeSpent,
          [field]: value
        }
      }));
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      setError('');
  
      try {
        const submitData = new FormData();
  
        if (formData.name) {
          submitData.append('name', formData.name);
        }
        
        Object.entries(formData.visitReasons)
          .filter(([_, checked]) => checked)
          .forEach(([reason]) => {
            submitData.append('visitReasons[]', reason);
          });
  
        submitData.append('timeSpent', JSON.stringify(formData.timeSpent));
  
        Object.entries(formData.topicsPondered)
          .filter(([_, checked]) => checked)
          .forEach(([topic]) => {
            submitData.append('topicsPondered[]', topic);
          });
  
        submitData.append('finalNotes', formData.finalNotes);
  
        const response = await fetch(`/api/logs/${logId}/reviews`, {
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
  
    // New navigation functions
    const nextStep = () => {
      if (currentStep < (logConfig?.fields?.length || 0) - 1) {
        setCurrentStep(current => current + 1);
      }
    };
  
    const prevStep = () => {
      if (currentStep > 0) {
        setCurrentStep(current => current - 1);
      }
    };
  
    // Render loading and success states
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
                  Thank you for your review! Your bathroom visit has been documented.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      );
    }
  
    // Render the current field based on step
    const renderField = (field) => {
      switch (field.name) {
        case 'visitReasons':
          return (
            <div className="space-y-4">
              <Label>Reason for visit (check all that apply)</Label>
              <div className="grid grid-cols-1 gap-4">
                {Object.entries({
                  usual: "The usual",
                  injury: "Minor injury",
                  pills: "Looking for pills",
                  teeth: "Checking my teeth",
                  bored: "Bored",
                  curious: "Curious",
                  phoneConvo: "Phone convo",
                  crying: "Crying in private",
                  break: "I just need a break",
                  mouthwash: "Hoping to find some mouthwash",
                  sick: "I might be getting sick",
                  tissue: "Need a tissue",
                  other: "Other"
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`reason-${key}`}
                      checked={formData.visitReasons[key]}
                      onCheckedChange={() => handleVisitReasonChange(key)}
                    />
                    <Label htmlFor={`reason-${key}`}>{label}</Label>
                  </div>
                ))}
              </div>
            </div>
          );
  
        case 'timeSpent':
          return (
            <div className="space-y-4">
              <Label>Time spent gazing in mirror</Label>
              <div className="flex space-x-4">
                <Input
                  type="number"
                  value={formData.timeSpent.value}
                  onChange={(e) => handleTimeChange('value', e.target.value)}
                  className="w-24"
                  min="0"
                />
                <Select
                  value={formData.timeSpent.unit}
                  onValueChange={(value) => handleTimeChange('unit', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seconds">Seconds</SelectItem>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
  
        case 'topicsPondered':
          return (
            <div className="space-y-4">
              <Label>Topics pondered during visit</Label>
              <div className="grid grid-cols-1 gap-4">
                {Object.entries({
                  past: "The past",
                  future: "The future",
                  morality: "Morality",
                  butts: "Butts",
                  love: "Love",
                  money: "Money",
                  politics: "Politics",
                  weekend: "Weekend plans",
                  work: "Work",
                  aliens: "Aliens",
                  garlicBread: "Cheesy garlic bread",
                  business: "Business at hand",
                  other: "Other"
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`topic-${key}`}
                      checked={formData.topicsPondered[key]}
                      onCheckedChange={() => handleTopicChange(key)}
                    />
                    <Label htmlFor={`topic-${key}`}>{label}</Label>
                  </div>
                ))}
              </div>
            </div>
          );
  
        case 'finalNotes':
          return (
            <div className="space-y-2">
              <Label htmlFor="finalNotes">Final notes before returning to civilization</Label>
              <Textarea
                id="finalNotes"
                value={formData.finalNotes}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  finalNotes: e.target.value
                }))}
                placeholder="Share your final thoughts..."
                className="h-32"
              />
            </div>
          );
  
        case 'name':
          return (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  name: e.target.value
                }))}
                placeholder="Enter your name"
              />
            </div>
          );
  
        case 'photo':
          return (
            <div className="space-y-2">
              <Label htmlFor="photo">Photo</Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  photo: e.target.files[0]
                }))}
              />
            </div>
          );
  
        case 'review':
          return (
            <div className="space-y-2">
              <Label htmlFor="review">Review</Label>
              <Textarea
                id="review"
                value={formData.review || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  review: e.target.value
                }))}
                placeholder="Enter your review"
                className="h-24"
              />
            </div>
          );
  
        default:
          return null;
      }
    };
  
    const currentField = logConfig?.fields?.[currentStep];
    const isLastStep = currentStep === (logConfig?.fields?.length || 0) - 1;
  
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>{logConfig?.title || 'Bathroom Visit Log'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
  
              {currentField && (
                <div className="space-y-6">
                  {renderField(currentField)}
                  
                  <div className="flex justify-between items-center pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      disabled={currentStep === 0}
                      className="w-24"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
  
                    {isLastStep ? (
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="w-24"
                      >
                        {submitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Submit
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={nextStep}
                        className="w-24"
                      >
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
  
                  <div className="flex justify-center gap-1 mt-4">
                    {logConfig.fields.map((_, index) => (
                      <div
                        key={index}
                        className={`h-2 w-2 rounded-full ${
                          index === currentStep ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    );
  };

export default ReviewForm;