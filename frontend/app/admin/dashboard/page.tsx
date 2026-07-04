'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { 
  Users, 
  Package, 
  MessageSquare, 
  TrendingUp, 
  ShoppingCart,
  BarChart3,
  Activity,
  DollarSign,
  Settings,
  LogOut,
  Home,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalContacts: number;
  newContacts: number;
  totalProducts: number;
  totalOrders: number;
  revenue: string;
}

export default function AdminDashboard() {
  const { dark: darkMode } = useTheme();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalContacts: 0,
    newContacts: 0,
    totalProducts: 0,
    totalOrders: 0,
    revenue: '$0'
  });
  const [loading, setLoading] = useState(true);
  const [recentQueries, setRecentQueries] = useState<any[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [formattedLastUpdate, setFormattedLastUpdate] = useState<string>('');

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Check if user is admin
    if (typeof window !== 'undefined') {
      const isAdmin = localStorage.getItem('isAdmin');
      if (!isAdmin) {
        router.push('/login');
        return;
      }
    }
    
    fetchDashboardData();

    // Set up polling (every 30 seconds)
    const pollInterval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  // Format lastUpdate on the client to avoid server/client markup mismatch
  useEffect(() => {
    try {
      const fmt = lastUpdate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
      setFormattedLastUpdate(fmt);
    } catch (e) {
      setFormattedLastUpdate(lastUpdate.toString());
    }
  }, [lastUpdate]);

  // Helper for handling new order payloads (notifications, sounds, refresh)
  const handleNewOrderPayload = (payload: any) => {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Order Placed!', {
          body: `Order #${payload.new?.order_id || ''} for ${payload.new?.total_amount || ''}`,
          icon: '/favicon.ico'
        });
      }
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          title: 'New Order Placed!',
          message: `Order #${payload.new?.order_id || ''} for ${payload.new?.total_amount || ''}`,
          type: 'success'
        }
      }));
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj');
      audio.play().catch(() => {});
      fetchDashboardData();
    } catch (e) {
      console.error('Error handling new order payload:', e);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats from API
      const response = await fetch('/api/admin/dashboard-stats');
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard stats: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
        setRecentQueries(data.recentQueries || []);
        setLastUpdate(new Date());
        setIsLive(true);

        // Reset live indicator after 3 seconds
        setTimeout(() => setIsLive(false), 3000);
      } else {
        console.error('API error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isAdmin');
      router.push('/');
    }
  };

  const dashboardCards = [
    {
      title: 'Total Queries',
      value: stats.totalContacts,
      icon: <MessageSquare className="w-6 h-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      trend: '+12%',
      link: '/admin/queries'
    },
    {
      title: 'New Inquiries',
      value: stats.newContacts,
      icon: <Users className="w-6 h-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      trend: '+5%',
      link: '/admin/queries'
    },
    {
      title: 'Inventory Items',
      value: stats.totalProducts,
      icon: <Package className="w-6 h-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      trend: '+2%',
      link: '/admin/inventory'
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: <ShoppingCart className="w-6 h-6" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      trend: '+18%',
      link: '/orders'
    }
  ];

  const quickActions = [
    {
      title: 'View Queries',
      description: 'Manage customer inquiries',
      icon: <MessageSquare className="w-8 h-8" />,
      link: '/admin/queries',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      title: 'Inventory',
      description: 'Manage product inventory',
      icon: <Package className="w-8 h-8" />,
      link: '/admin/inventory',
      color: 'from-purple-500 to-pink-600'
    },
    {
      title: 'Orders',
      description: 'View and process orders',
      icon: <ShoppingCart className="w-8 h-8" />,
      link: '/admin/orders',
      color: 'from-green-500 to-emerald-600'
    },
    {
      title: 'Analytics',
      description: 'View performance metrics',
      icon: <BarChart3 className="w-8 h-8" />,
      link: '/admin/analytics',
      color: 'from-orange-500 to-red-600'
    },
    {
      title: 'About Us',
      description: 'Manage journey timeline & team',
      icon: <Info className="w-8 h-8" />,
      link: '/admin/about',
      color: 'from-amber-500 to-yellow-600'
    }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gray-900' 
        : 'bg-gray-50'
    }`}>
      {/* Header */}
      <div className={`border-b ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-red-600 hover:text-red-700">
                <Home className="w-5 h-5" />
                <span>Back to Site</span>
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <h1 className={`text-2xl font-bold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Admin Dashboard
              </h1>
              <div className={`flex items-center space-x-2 ${isLive ? 'animate-pulse' : ''}`}>
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {isLive ? 'Live' : (formattedLastUpdate ? 'Updated ' + formattedLastUpdate : 'Updated')}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Admin
              </Badge>
              <Button 
                onClick={handleLogout}
                variant="outline" 
                size="sm"
                className={`flex items-center space-x-2 ${
                  darkMode ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600' : ''
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardCards.map((card, index) => (
            <Link key={index} href={card.link}>
              <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {card.title}
                      </p>
                      <p className={`text-3xl font-bold ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {card.value}
                      </p>
                      <p className="text-xs text-green-600 font-medium mt-1">
                        {card.trend} from last month
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${card.bgColor}`}>
                      <div className={card.color}>
                        {card.icon}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card className={`border-0 shadow-lg ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <CardHeader>
                <CardTitle className={`flex items-center space-x-2 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  <Activity className="w-5 h-5" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => (
                    <Link key={index} href={action.link}>
                      <Card className={`border cursor-pointer hover:shadow-lg transition-all duration-300 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg bg-linear-to-r ${action.color}`}>
                              <div className="text-white">
                                {action.icon}
                              </div>
                            </div>
                            <div>
                              <h3 className={`font-semibold ${
                                darkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {action.title}
                              </h3>
                              <p className={`text-sm ${
                                darkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                {action.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Contacts */}
          <div>
            <Card className={`border-0 shadow-lg ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <CardHeader>
                <CardTitle className={`flex items-center space-x-2 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  <MessageSquare className="w-5 h-5" />
                  <span>Recent Queries</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-1"></div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentQueries.length > 0 ? (
                  <div className="space-y-4">
                    {recentQueries.map((contact, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-linear-to-r from-red-500 to-purple-600 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {contact.name}
                          </p>
                          <p className={`text-sm truncate ${
                            darkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            {contact.subject}
                          </p>
                        </div>
                        <Badge 
                          variant={contact.status === 'new' ? 'destructive' : 'outline'}
                          className={`text-xs ${
                            darkMode 
                              ? 'bg-gray-700 text-white border-gray-600' 
                              : ''
                          }`}
                        >
                          {contact.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-center py-4 ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    No recent contacts
                  </p>
                )}
                <div className="mt-4">
                  <Link href="/admin/queries">
                    <Button variant="outline" className={`w-full ${
                      darkMode ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600' : ''
                    }`}>
                      View All Queries
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}