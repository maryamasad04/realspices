'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';
import { BarChart3, Package, MessageSquare, TrendingUp, Calendar, AlertCircle, CheckCircle2, Clock, XCircle, ArrowUpRight, ArrowDownRight, PieChart as PieChartIcon, LineChart as LineChartIcon, BarChart2 } from 'lucide-react';
import { BarChart, Bar, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsData {
  inventoryStats: {
    active: number;
    discontinued: number;
    out_of_stock: number;
  };
  queryStats: {
    new: number;
    in_progress: number;
    resolved: number;
  };
  totalProducts: number;
  totalQueries: number;
  orderStats?: {
    pending: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  totalOrders?: number;
  usersData?: any[];
  productsData?: any[];
  ordersData?: any[];
  orderItemsData?: any[];
  queriesData?: any[];
}

export default function AnalyticsPage() {
  const { dark: darkMode } = useTheme();
  const [data, setData] = useState<AnalyticsData>({
    inventoryStats: { active: 0, discontinued: 0, out_of_stock: 0 },
    queryStats: { new: 0, in_progress: 0, resolved: 0 },
    totalProducts: 0,
    totalQueries: 0,
    orderStats: { pending: 0, shipped: 0, delivered: 0, cancelled: 0 },
    totalOrders: 0,
    usersData: [],
    productsData: [],
    ordersData: [],
    orderItemsData: [],
    queriesData: []
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [inventoryChartType, setInventoryChartType] = useState<'pie' | 'bar' | 'line'>('pie');
  const [queryChartType, setQueryChartType] = useState<'pie' | 'bar' | 'line'>('bar');
  const [ordersChartType, setOrdersChartType] = useState<'pie' | 'bar' | 'line'>('bar');
  // keys to force pie remount/animation on full page reload
  const [pieKey] = useState(() => Date.now());

  useEffect(() => {
    fetchAnalyticsData();

    // Set up polling for analytics (every 30 seconds)
    const interval = setInterval(fetchAnalyticsData, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch data from dashboard API
      const response = await fetch('/api/admin/dashboard');
      const dashboardData = await response.json();
      
      const products = dashboardData.data?.products || [];
      const queries = dashboardData.data?.queries || [];
      const orders = dashboardData.data?.orders || [];

      // Fetch additional table data for charts
      let usersData: any[] = [];
      let ordersTableData: any[] = [];
      let productsTableData: any[] = [];
      let orderItemsTableData: any[] = [];
      let queriesTableData: any[] = [];

      try {
        // Fetch users, orders, and products data directly
        const [usersResp, ordersResp, productsResp, orderItemsResp, queriesResp] = await Promise.all([
          fetch('/api/admin/analytics/users'),
          fetch('/api/admin/analytics/orders'),
          fetch('/api/admin/analytics/products'),
          fetch('/api/admin/analytics/orderitems'),
          fetch('/api/admin/analytics/queries')
        ]);

        if (usersResp.ok) {
          const usersResult = await usersResp.json();
          usersData = usersResult.data || [];
        }
        if (ordersResp.ok) {
          const ordersResult = await ordersResp.json();
          ordersTableData = ordersResult.data || [];
        }
        if (productsResp.ok) {
          const productsResult = await productsResp.json();
          productsTableData = productsResult.data || [];
        }
        if (orderItemsResp.ok) {
          const orderItemsResult = await orderItemsResp.json();
          orderItemsTableData = orderItemsResult.data || [];
        }
        if (queriesResp.ok) {
          const queriesResult = await queriesResp.json();
          queriesTableData = queriesResult.data || [];
        }
      } catch (tableError) {
        console.warn('Error fetching table data:', tableError);
      }

      // Use direct table data fetched above for accurate counts
      const inventoryStats = {
        active: productsTableData.filter((p: any) => (p.stock || 0) > 0 && (p.status === 'active' || p.status === null || !p.status)).length || 0,
        discontinued: productsTableData.filter((p: any) => p.status === 'discontinued').length || 0,
        out_of_stock: productsTableData.filter((p: any) => (p.stock || 0) === 0).length || 0
      };

      const queryStats = {
        new: queriesTableData.filter((c: any) => c.status === 'new').length || 0,
        in_progress: queriesTableData.filter((c: any) => c.status === 'in_progress').length || 0,
        resolved: queriesTableData.filter((c: any) => c.status === 'resolved').length || 0
      };

      const orderStats = {
        pending: ordersTableData.filter((o: any) => o.status === 'pending').length || 0,
        shipped: ordersTableData.filter((o: any) => o.status === 'shipped').length || 0,
        delivered: ordersTableData.filter((o: any) => o.status === 'delivered').length || 0,
        cancelled: ordersTableData.filter((o: any) => o.status === 'cancelled').length || 0
      };

      setData({
        inventoryStats,
        queryStats,
        // Totals derived from the direct table queries
        totalProducts: productsTableData.length || 0,
        totalQueries: queriesTableData.length || 0,
        orderStats,
        totalOrders: ordersTableData.length || 0,
        usersData,
        productsData: productsTableData,
        ordersData: ordersTableData,
        orderItemsData: orderItemsTableData,
        queriesData: queriesTableData
      });

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBarHeight = (value: number, max: number) => {
    return max > 0 ? `${(value / max) * 100}%` : '0%';
  };

  const maxInventory = Math.max(...Object.values(data.inventoryStats));
  const maxQuery = Math.max(...Object.values(data.queryStats));
  const maxOrder = Math.max(...Object.values(data.orderStats || { pending: 0, shipped: 0, delivered: 0, cancelled: 0 }));

  // Prepare data for charts
  // Users data for Pie Chart
  const usersChartData = [
    { name: 'Total Users', value: data.usersData?.length || 0, fill: '#22c55e' },
    { name: 'Active Users', value: data.usersData?.filter((u: any) => !u.deleted_at)?.length || 0, fill: '#3b82f6' },
    { name: 'Registered Users', value: data.usersData?.length || 0, fill: '#f59e0b' }
  ];

  // Products status breakdown for Bar Chart
  const productsStatusChartData = [
    { name: 'Active', value: data.productsData?.filter((p: any) => (p.stock || 0) > 0 && (p.status === 'active' || p.status === null || !p.status))?.length || 0, fill: '#22c55e' },
    { name: 'Out of Stock', value: data.productsData?.filter((p: any) => (p.stock || 0) === 0)?.length || 0, fill: '#eab308' },
    { name: 'Discontinued', value: data.productsData?.filter((p: any) => p.status === 'discontinued')?.length || 0, fill: '#ef4444' }
  ];

  // Products data for Line Chart
  const productsChartData = data.productsData?.slice(0, 5)?.map((p: any) => ({
    name: p.name?.substring(0, 10) || 'Product',
    value: p.stock || 0,
    fill: '#a855f7'
  })) || [{ name: 'No Products', value: 0, fill: '#a855f7' }];

  // Orders data for Bar Chart
  const ordersChartData = [
    { name: 'Pending', value: data.ordersData?.filter((o: any) => o.status === 'pending')?.length || 0, fill: '#f59e0b' },
    { name: 'Shipped', value: data.ordersData?.filter((o: any) => o.status === 'shipped')?.length || 0, fill: '#10b981' },
    { name: 'Delivered', value: data.ordersData?.filter((o: any) => o.status === 'delivered')?.length || 0, fill: '#06b6d4' },
    { name: 'Cancelled', value: data.ordersData?.filter((o: any) => o.status === 'cancelled')?.length || 0, fill: '#ef4444' }
  ];

  // Queries status breakdown for Bar Chart
  const queriesStatusChartData = [
    { name: 'New', value: data.queriesData?.filter((q: any) => q.status === 'new')?.length || 0, fill: '#3b82f6' },
    { name: 'In Progress', value: data.queriesData?.filter((q: any) => q.status === 'in_progress')?.length || 0, fill: '#eab308' },
    { name: 'Resolved', value: data.queriesData?.filter((q: any) => q.status === 'resolved')?.length || 0, fill: '#22c55e' }
  ];

  const inventoryChartData = [
    { name: 'Active', value: data.inventoryStats.active, fill: '#22c55e' },
    { name: 'Discontinued', value: data.inventoryStats.discontinued, fill: '#ef4444' },
    { name: 'Out of Stock', value: data.inventoryStats.out_of_stock, fill: '#eab308' }
  ];

  const queryChartData = [
    { name: 'New', value: data.queryStats.new, fill: '#3b82f6' },
    { name: 'In Progress', value: data.queryStats.in_progress, fill: '#eab308' },
    { name: 'Resolved', value: data.queryStats.resolved, fill: '#22c55e' }
  ];

  // Orders status breakdown for Chart
  const ordersStatusChartData = [
    { name: 'Pending', value: data.ordersData?.filter((o: any) => o.status === 'pending')?.length || 0, fill: '#f59e0b' },
    { name: 'Shipped', value: data.ordersData?.filter((o: any) => o.status === 'shipped')?.length || 0, fill: '#10b981' },
    { name: 'Delivered', value: data.ordersData?.filter((o: any) => o.status === 'delivered')?.length || 0, fill: '#06b6d4' },
    { name: 'Cancelled', value: data.ordersData?.filter((o: any) => o.status === 'cancelled')?.length || 0, fill: '#ef4444' }
  ];

  const orderChartData = [
    { name: 'Pending', value: data.orderStats?.pending || 0, fill: '#f59e0b' },
    { name: 'Shipped', value: data.orderStats?.shipped || 0, fill: '#10b981' },
    { name: 'Delivered', value: data.orderStats?.delivered || 0, fill: '#06b6d4' },
    { name: 'Cancelled', value: data.orderStats?.cancelled || 0, fill: '#ef4444' }
  ];

  const inventoryTotal = inventoryChartData.reduce((s, e) => s + (e.value || 0), 0);
  const queryTotal = queryChartData.reduce((s, e) => s + (e.value || 0), 0);
  const orderTotal = orderChartData.reduce((s, e) => s + (e.value || 0), 0);

  

  // Generate weekly trend data - Real time-based logic
  const generateWeeklyTrendData = async () => {
    try {
      // Generate simple trend data based on current analytics data
      // In a production app, you'd fetch this from a dedicated API endpoint
      const trendDataPoints = [];
      
      // Get last 7 days starting from today going backwards
      const today = new Date();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      // Build array of last 7 days in chronological order
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      
      for (let i = 0; i < 7; i++) {
        const currentDay = new Date(sevenDaysAgo);
        currentDay.setDate(currentDay.getDate() + i);
        
        // Format date for comparison (YYYY-MM-DD)
        const dateStr = currentDay.toISOString().split('T')[0];
        const dayLabel = dayLabels[currentDay.getDay()];

        // Helper to extract a date string (YYYY-MM-DD) from various possible timestamp fields
        const extractDate = (item: any) => {
          if (!item) return null;
          const candidates = ['created_at', 'createdAt', 'created', 'date', 'order_date', 'timestamp', 'created_on'];
          for (const key of candidates) {
            if (item[key]) {
              try {
                const d = new Date(item[key]);
                if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
              } catch (e) {
                continue;
              }
            }
          }
          return null;
        };

        // Count orders, queries, and active products that match the date from their respective tables
        const ordersCount = (data.ordersData || []).filter((o: any) => extractDate(o) === dateStr).length;
        const queriesCount = (data.queriesData || []).filter((q: any) => extractDate(q) === dateStr).length;
        
        // Active products: count all products with stock > 0 that were created on or before this date
        const activeProductsCount = (data.productsData || []).filter((p: any) => {
          const productDate = extractDate(p);
          const hasStock = (p.stock || 0) > 0;
          const isActive = p.status === 'active' || p.status === null || !p.status;
          const wasCreatedByThisDate = !productDate || productDate <= dateStr;
          return hasStock && isActive && wasCreatedByThisDate;
        }).length;

        const dayData = {
          day: dayLabel,
          fullDay: dayNames[currentDay.getDay()],
          date: dateStr,
          orders: ordersCount,
          queries: queriesCount,
          activeProducts: activeProductsCount
        };
        
        trendDataPoints.push(dayData);
      }
      
      return trendDataPoints;
    } catch (error) {
      console.error('Error generating weekly trend data:', error);
      return [];
    }
  };

  // State for trend data
  const [trendData, setTrendData] = useState<any[]>([]);

  // Fetch trend data on component mount
  useEffect(() => {
    const loadTrendData = async () => {
      const trends = await generateWeeklyTrendData();
      setTrendData(trends);
    };
    loadTrendData();
  }, [data]); // Re-fetch when main analytics data changes

  // Calculate percentages and trends
  const activePercentage = data.totalProducts > 0 
    ? ((data.inventoryStats.active / data.totalProducts) * 100).toFixed(1) 
    : '0';
  const resolvedPercentage = data.totalQueries > 0 
    ? ((data.queryStats.resolved / data.totalQueries) * 100).toFixed(1) 
    : '0';

  // Order rate (percentage of completed orders: shipped + delivered)
  const totalOrdersCount = data.totalOrders || 0;
  const orderRatePct = totalOrdersCount > 0
    ? ((((data.orderStats?.shipped || 0) + (data.orderStats?.delivered || 0)) / totalOrdersCount) * 100).toFixed(1)
    : '0';

  // Individual order status percentages removed — only Order Rate remains

  const inventoryColors = {
    active: 'bg-green-500',
    discontinued: 'bg-red-500',
    out_of_stock: 'bg-yellow-500'
  };

  const queryColors = {
    new: 'bg-blue-500',
    in_progress: 'bg-yellow-500',
    resolved: 'bg-green-500'
  };

  if (loading && data.totalProducts === 0) {
    return (
      <div className={`min-h-screen p-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Loading Analytics...
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 sm:p-6 lg:p-8 ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Analytics Dashboard
              </h1>
              <p className={`text-sm sm:text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Real-time performance metrics and insights
              </p>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className={`text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-white'}`}>
                Updated {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
          <Card className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white'} shadow-lg hover:shadow-xl transition-shadow`}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                    Total Inventory
                  </p>
                  <p className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                    {data.totalProducts}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-500 font-medium">{activePercentage}% Active</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <Package className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white'} shadow-lg hover:shadow-xl transition-shadow`}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                    Total Queries
                  </p>
                  <p className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                    {data.totalQueries}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-500 font-medium">{resolvedPercentage}% Resolved</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <MessageSquare className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white'} shadow-lg hover:shadow-xl transition-shadow`}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                    Active Products
                  </p>
                  <p className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                    {data.inventoryStats.active}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-500 font-medium">Operational</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-green-500/10">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white'} shadow-lg hover:shadow-xl transition-shadow`}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                    Total Orders
                  </p>
                  <p className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                    {data.totalOrders}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Live</span>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>• {lastUpdate.toLocaleTimeString()}</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <BarChart3 className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Inventory Chart */}
          <Card className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white'} shadow-lg`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className={`flex items-center gap-2 text-base sm:text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Package className="w-5 h-5" />
                    Inventory Distribution
                  </CardTitle>
                  <CardDescription className={`mt-1 text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Product status breakdown
                  </CardDescription>
                </div>
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  <button
                    onClick={() => setInventoryChartType('pie')}
                    className={`p-2 rounded transition-all ${
                      inventoryChartType === 'pie'
                        ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title="Pie Chart"
                  >
                    <PieChartIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setInventoryChartType('bar')}
                    className={`p-2 rounded transition-all ${
                      inventoryChartType === 'bar'
                        ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title="Bar Chart"
                  >
                    <BarChart2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setInventoryChartType('line')}
                    className={`p-2 rounded transition-all ${
                      inventoryChartType === 'line'
                        ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title="Line Chart"
                  >
                    <LineChartIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`flex items-start gap-6 ${darkMode ? 'group' : ''}`}>
                <div className="flex-1">
                  {inventoryChartType === 'pie' ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart key={`inventory-pie-${pieKey}`}>
                        <Pie
                          data={productsStatusChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          innerRadius={0}
                          outerRadius={90}
                          dataKey="value"
                          isAnimationActive={true}
                          animationBegin={80}
                          animationDuration={900}
                          stroke="#000000"
                          strokeWidth={1}
                          startAngle={90}
                          endAngle={450}
                        >
                          {productsStatusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                            border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                          labelStyle={{ color: darkMode ? '#f9fafb' : '#111827' }}
                          itemStyle={{ color: darkMode ? '#ffffff' : '#111827' }}
                          wrapperStyle={{ color: darkMode ? '#ffffff' : undefined }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (<></>)}
                </div>
                  {inventoryChartType === 'bar' && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={productsStatusChartData} margin={{ top: 20, right: 10, left: -40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: darkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: darkMode ? '#374151' : '#e5e7eb' }}
                    />
                    <YAxis
                      tick={{ fill: darkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: darkMode ? '#374151' : '#e5e7eb' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                        border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      labelStyle={{ color: darkMode ? '#f9fafb' : '#111827' }}
                      itemStyle={{ color: '#a855f7' }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {productsStatusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  )}
                  {inventoryChartType === 'line' && (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={productsStatusChartData} margin={{ top: 20, right: 30, left: -40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: darkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: darkMode ? '#374151' : '#e5e7eb' }}
                    />
                    <YAxis
                      tick={{ fill: darkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: darkMode ? '#374151' : '#e5e7eb' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                        border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      labelStyle={{ color: darkMode ? '#f9fafb' : '#111827' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#a855f7"
                      strokeWidth={3}
                      dot={{ fill: '#a855f7', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    </LineChart>
                  </ResponsiveContainer>
                  )}

                {/* Simple legend shown beside pie */}
                {inventoryChartType === 'pie' && (
                  <div className="flex flex-col gap-3 w-1/4">
                    {productsStatusChartData.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-4 h-4 rounded-full shrink-0 border ${darkMode ? 'border-white/5' : 'border-black/5'}`}
                          style={{ backgroundColor: d.fill }}
                        />
                        <span className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'} ${darkMode ? 'group-hover:text-white' : ''}`}>{d.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active</span>
                  </div>
                  <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {data.productsData?.filter((p: any) => (p.stock || 0) > 0 && (p.status === 'active' || p.status === null || !p.status))?.length || 0}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Out of Stock</span>
                  </div>
                  <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {data.productsData?.filter((p: any) => (p.stock || 0) === 0)?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Queries Chart */}
          <Card className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white'} shadow-lg`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className={`flex items-center gap-2 text-base sm:text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <MessageSquare className="w-5 h-5" />
                    Customer Queries
                  </CardTitle>
                  <CardDescription className={`mt-1 text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Status breakdown
                  </CardDescription>
                </div>
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  <button
                    onClick={() => setQueryChartType('pie')}
                    className={`p-2 rounded transition-all ${
                      queryChartType === 'pie'
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title="Pie Chart"
                  >
                    <PieChartIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setQueryChartType('bar')}
                    className={`p-2 rounded transition-all ${
                      queryChartType === 'bar'
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title="Bar Chart"
                  >
                    <BarChart2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setQueryChartType('line')}
                    className={`p-2 rounded transition-all ${
                      queryChartType === 'line'
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title="Line Chart"
                  >
                    <LineChartIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`flex items-start gap-6 ${darkMode ? 'group' : ''}`}>
                <div className="flex-1">
                  {queryChartType === 'pie' ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart key={`query-pie-${pieKey}`}>
                        <Pie
                          data={queriesStatusChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          innerRadius={0}
                          outerRadius={90}
                          dataKey="value"
                          isAnimationActive={true}
                          animationBegin={80}
                          animationDuration={900}
                          stroke="#000000"
                          strokeWidth={1}
                          startAngle={90}
                          endAngle={450}
                        >
                          {queriesStatusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                            border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                          labelStyle={{ color: darkMode ? '#f9fafb' : '#111827' }}
                          itemStyle={{ color: darkMode ? '#ffffff' : '#111827' }}
                          wrapperStyle={{ color: darkMode ? '#ffffff' : undefined }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <></>
                  )}
                </div>
                  {queryChartType === 'bar' && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={queriesStatusChartData} margin={{ top: 20, right: 10, left: -40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: darkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: darkMode ? '#374151' : '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fill: darkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: darkMode ? '#374151' : '#e5e7eb' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                        border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      labelStyle={{ color: darkMode ? '#f9fafb' : '#111827' }}
                      itemStyle={{ color: '#3b82f6' }}
                    />
                    <Bar dataKey="value" fill="#8884d8" radius={[8, 8, 0, 0]}>
                      {queriesStatusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {queryChartType === 'line' && (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={queriesStatusChartData} margin={{ top: 20, right: 30, left: -40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: darkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: darkMode ? '#374151' : '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fill: darkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: darkMode ? '#374151' : '#e5e7eb' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                        border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      labelStyle={{ color: darkMode ? '#f9fafb' : '#111827' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {queryChartType === 'pie' && (
                  <div className="flex flex-col gap-3 w-1/4">
                    {queriesStatusChartData.map((d, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full shrink-0 border ${darkMode ? 'border-white/5' : 'border-black/5'}`}
                          style={{ backgroundColor: d.fill }}
                        />
                        <span className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'} ${darkMode ? 'group-hover:text-white' : ''}`}>{d.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>New</span>
                  </div>
                  <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {queriesStatusChartData[0]?.value || 0}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className={`text-xs ${darkMode ? 'text-white' : 'text-gray-600'}`}>Resolved</span>
                  </div>
                  <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {queriesStatusChartData[2]?.value || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders Chart */}
          <Card className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white'} shadow-lg`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className={`flex items-center gap-2 text-base sm:text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <BarChart3 className="w-5 h-5" />
                    Orders
                  </CardTitle>
                  <CardDescription className={`mt-1 text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Live order status breakdown
                  </CardDescription>
                </div>
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  <button
                    onClick={() => setOrdersChartType('pie')}
                    className={`p-2 rounded transition-all ${
                      ordersChartType === 'pie'
                        ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title="Pie Chart"
                  >
                    <PieChartIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setOrdersChartType('bar')}
                    className={`p-2 rounded transition-all ${
                      ordersChartType === 'bar'
                        ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title="Bar Chart"
                  >
                    <BarChart2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setOrdersChartType('line')}
                    className={`p-2 rounded transition-all ${
                      ordersChartType === 'line'
                        ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title="Line Chart"
                  >
                    <LineChartIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`flex items-start gap-6 ${darkMode ? 'group' : ''}`}>
                <div className="flex-1">
                  {ordersChartType === 'pie' ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart key={`orders-pie-${pieKey}`}>
                        <Pie
                          data={ordersStatusChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          innerRadius={0}
                          outerRadius={90}
                          dataKey="value"
                          isAnimationActive={true}
                          animationBegin={80}
                          animationDuration={900}
                          stroke="#000000"
                          strokeWidth={1}
                          startAngle={90}
                          endAngle={450}
                        >
                          {ordersStatusChartData.map((entry, index) => (
                            <Cell key={`cell-order-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                            border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                          labelStyle={{ color: darkMode ? '#f9fafb' : '#111827' }}
                          itemStyle={{ color: darkMode ? '#ffffff' : '#111827' }}
                          wrapperStyle={{ color: darkMode ? '#ffffff' : undefined }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <></>
                  )}
                </div>
                  {ordersChartType === 'bar' && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ordersStatusChartData} margin={{ top: 20, right: 10, left: -40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: darkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: darkMode ? '#374151' : '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fill: darkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: darkMode ? '#374151' : '#e5e7eb' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                        border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      labelStyle={{ color: darkMode ? '#f9fafb' : '#111827' }}
                      itemStyle={{ color: darkMode ? '#6366F1' : '#818CF8' }}
                    />
                    <Bar dataKey="value" fill="#8884d8" radius={[8, 8, 0, 0]}>
                      {ordersStatusChartData.map((entry, index) => (
                        <Cell key={`cell-order-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {ordersChartType === 'line' && (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={ordersStatusChartData} margin={{ top: 20, right: 30, left: -40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: darkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: darkMode ? '#374151' : '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fill: darkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                      axisLine={{ stroke: darkMode ? '#374151' : '#e5e7eb' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                        border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      labelStyle={{ color: darkMode ? '#f9fafb' : '#111827' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={darkMode ? '#6366F1' : '#818CF8'} 
                      strokeWidth={3}
                      dot={{ fill: darkMode ? '#6366F1' : '#818CF8', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {ordersChartType === 'pie' && (
                  <div className="flex flex-col gap-3 w-1/4">
                    {ordersStatusChartData.map((d, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full shrink-0 border ${darkMode ? 'border-white/5' : 'border-black/5'}`}
                          style={{ backgroundColor: d.fill }}
                        />
                        <span className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'} ${darkMode ? 'group-hover:text-white' : ''}`}>{d.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pending</span>
                  </div>
                  <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {ordersStatusChartData[0]?.value || 0}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Shipped</span>
                  </div>
                  <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {ordersStatusChartData[1]?.value || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trend Line Chart - Full Width */}
        <Card className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white'} shadow-lg mb-6 sm:mb-8`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className={`flex items-center gap-2 text-base sm:text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <TrendingUp className="w-5 h-5" />
                  Weekly Trends
                </CardTitle>
                <CardDescription className={`mt-1 text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Inventory and query trends over the last 7 days
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis 
                  dataKey="day" 
                  tick={{ fill: darkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: darkMode ? '#374151' : '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fill: darkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: darkMode ? '#374151' : '#e5e7eb' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                    border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  labelStyle={{ color: darkMode ? '#f9fafb' : '#111827' }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                  iconType="line"
                />
                <Line 
                  type="monotone" 
                  dataKey="activeProducts" 
                  stroke="#a855f7" 
                  strokeWidth={3}
                  dot={{ fill: '#a855f7', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Active Products"
                />
                <Line 
                  type="monotone" 
                  dataKey="queries" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Queries"
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke={darkMode ? '#6366F1' : '#818CF8'}
                  strokeWidth={3}
                  dot={{ fill: darkMode ? '#6366F1' : '#818CF8', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Orders"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Additional Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white'} shadow-lg`}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Product Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Active</span>
                </div>
                <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {data.inventoryStats.active}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  </div>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Out of Stock</span>
                </div>
                <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {data.inventoryStats.out_of_stock}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  </div>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Discontinued</span>
                </div>
                <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {data.inventoryStats.discontinued}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white'} shadow-lg`}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Query Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Clock className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>New</span>
                </div>
                <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {data.queryStats.new}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  </div>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>In Progress</span>
                </div>
                <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {data.queryStats.in_progress}
                </span>
              </div>
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                  <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-700'}`}>Resolved</span>
                </div>
                <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {data.queryStats.resolved}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white'} shadow-lg`}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-3">

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <Clock className="w-4 h-4 text-yellow-500" />
                  </div>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Pending</span>
                </div>
                <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {data.orderStats?.pending}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Shipped</span>
                </div>
                <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {data.orderStats?.shipped}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  </div>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Cancelled</span>
                </div>
                <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {data.orderStats?.cancelled}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white'} shadow-lg`}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Rate</span>
                  <span className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{activePercentage}%</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${activePercentage}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Resolution Rate</span>
                  <span className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{resolvedPercentage}%</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${resolvedPercentage}%` }}
                  ></div>
                </div>
              </div>
            
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Order Rate</span>
                  <span className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{orderRatePct}%</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${orderRatePct}%` }}
                  />
                </div>
              </div>

              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} mt-4`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>System Health</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-medium text-green-500">Operational</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
