import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle, Clock, User, MessageSquare, ChevronRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const ViewLogs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchLogs = async (page) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/logs?page=${page}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }

      const data = await response.json();
      setLogs(data.logs || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(currentPage);
  }, [currentPage]);

  const handlePageChange = (value) => {
    setCurrentPage(parseInt(value));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleLogClick = (logId) => {
    navigate(`/logs/${logId}/reviews`);
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">Loading your logs...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your Logs</CardTitle>
            {pagination && (
              <p className="text-sm text-gray-500 mt-1">
                Showing {logs.length} of {pagination.total_records} logs
              </p>
            )}
          </div>
          <Button
            onClick={() => navigate('/create-log')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create New Log
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              You haven't created any logs yet. Click the button above to create your first log!
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {Array.isArray(logs) && logs.map((log) => (
                  <Card 
                    key={log.log_id} 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleLogClick(log.log_id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center">
                        <div className="space-y-2">
                          <h3 className="text-lg font-medium">{log.title}</h3>
                          {log.description && (
                            <p className="text-gray-600 text-sm line-clamp-2">
                              {log.description}
                            </p>
                          )}
                          <div className="flex space-x-6 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              Created {formatDate(log.created_at)}
                            </div>
                            <div className="flex items-center">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              {log.total_reviews || 0} Reviews
                            </div>
                            {log.last_review_at && (
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                Last review {formatDate(log.last_review_at)}
                              </div>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {pagination && pagination.total_pages > 1 && (
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  <Select value={currentPage.toString()} onValueChange={handlePageChange}>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Page..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: pagination.total_pages }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          Page {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(pagination.total_pages, prev + 1))}
                    disabled={currentPage === pagination.total_pages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewLogs;