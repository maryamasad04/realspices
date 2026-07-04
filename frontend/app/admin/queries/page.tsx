'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { getQuerySubmissions, updateQueryStatus } from '@/lib/queryApi';
import { Mail, Phone, Calendar, User, MessageSquare } from 'lucide-react';

interface Query {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved';
  created_at: string;
  updated_at: string;
}

export default function QueriesAdminPage() {
  const { dark: darkMode } = useTheme();
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [newContactAlert, setNewContactAlert] = useState<string | null>(null);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    fetchContacts();

    // Set up polling for contacts (every 30 seconds)
    const pollInterval = setInterval(() => {
      fetchContacts();
    }, 30000);

    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getQuerySubmissions();
      setQueries(response.data || []);
      setLastUpdate(new Date());
      setIsLive(true);
      setTimeout(() => setIsLive(false), 3000);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      setError(error.message || 'Failed to load queries. Please check your database configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (contactId: string, newStatus: string) => {
    try {
      setUpdatingStatus(contactId);
      await updateQueryStatus(contactId, newStatus);
      // Update the local state
      setQueries(queries.map(contact => 
        contact.id === contactId 
          ? { ...contact, status: newStatus as any, updated_at: new Date().toISOString() }
          : contact
      ));
    } catch (error) {
      console.error('Error updating contact status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredContacts = filter === 'all' 
    ? queries 
    : queries.filter(contact => contact.status === filter);

  if (loading) {
    return (
      <div className={`min-h-screen p-8 transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <h1 className={`text-3xl font-bold mb-8 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>Loading Contact Submissions...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen p-8 transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h1 className={`text-3xl font-bold mb-4 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>Error Loading Queries</h1>
            <div className={`p-6 rounded-lg mb-6 ${
              darkMode 
                ? 'bg-red-900/20 border border-red-800' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-center ${
                darkMode ? 'text-red-400' : 'text-red-700'
              }`}>
                {error}
              </p>
            </div>
            <div className="space-y-4">
              <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                Please ensure:
              </p>
              <ul className={`text-left max-w-md mx-auto space-y-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <li>• The contacts table exists in PostgreSQL</li>
                <li>• Row Level Security policies are configured correctly</li>
                <li>• Your authentication token is valid</li>
              </ul>
              <Button 
                onClick={fetchContacts}
                className="mt-4 bg-linear-to-r from-red-500 via-purple-600 to-amber-600 hover:from-red-600 hover:via-purple-700 hover:to-amber-700 text-white"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className={`text-3xl font-bold mb-2 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>Customer Queries</h1>
              <div className={`flex items-center space-x-2 mb-2 ${isLive ? 'animate-pulse' : ''}`}>
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {isLive ? 'Live Updates' : 'Last updated ' + lastUpdate.toLocaleTimeString()}
                </span>
              </div>
              <p className={`text-lg ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Manage and respond to customer queries
              </p>
            </div>
            
            {/* New Contact Alert */}
            {newContactAlert && (
              <div className="bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 animate-bounce">
                <span className="text-green-700 dark:text-green-400 text-sm font-medium">
                  🔔 {newContactAlert}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Status Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {['all', 'new', 'in_progress', 'resolved'].map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
              className={`capitalize ${
                filter === status 
                  ? 'bg-linear-to-r from-rose-700 via-yellow-600 to-amber-600 hover:from-rose-800 hover:via-yellow-700 hover:to-amber-700 text-white' 
                  : darkMode 
                    ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600' 
                    : 'bg-white text-gray-900'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
            </Button>
          ))}
        </div>

        {/* Contacts List */}
        <div className="space-y-4">
          {filteredContacts.length === 0 ? (
            <Card className={`${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
            }`}>
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className={`text-xl font-semibold mb-2 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  No Queries Found
                </h3>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                  {filter === 'all' 
                    ? 'No queries have been submitted yet.'
                    : `No queries with status: ${filter.replace('_', ' ')}`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredContacts.map((contact) => (
              <Card key={contact.id} className={`${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
              }`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className={`text-lg ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {contact.subject}
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <div className="flex items-center gap-1">
                          <User className={`w-4 h-4 ${darkMode ? 'text-white' : 'text-black'}`} />
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                            {contact.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className={`w-4 h-4 ${darkMode ? 'text-white' : 'text-black'}`} />
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                            {contact.email}
                          </span>
                        </div>
                        {contact.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className={`w-4 h-4 ${darkMode ? 'text-white' : 'text-black'}`} />
                            <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                              {contact.phone}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className={`w-4 h-4 ${darkMode ? 'text-white' : 'text-black'}`} />
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                            {new Date(contact.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(contact.status)}>
                        {contact.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h4 className={`font-medium mb-2 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>Message:</h4>
                    <p className={`leading-relaxed ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {contact.message}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    {['in_progress', 'resolved'].map((status) => (
                      contact.status !== status && (
                        <Button
                          key={status}
                          variant="outline"
                          size="sm"
                          disabled={updatingStatus === contact.id}
                          onClick={() => handleStatusUpdate(contact.id, status)}
                          className={`capitalize ${
                            darkMode ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600' : ''
                          }`}
                        >
                          Mark as {status.replace('_', ' ')}
                        </Button>
                      )
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {['new', 'in_progress', 'resolved'].map((status) => {
            const count = queries.filter(c => c.status === status).length;
            return (
              <Card key={status} className={`${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
              }`}>
                <CardContent className="p-4 text-center">
                  <div className={`text-2xl font-bold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {count}
                  </div>
                  <div className={`text-sm capitalize ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {status.replace('_', ' ')}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}