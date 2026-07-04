'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/hooks/use-theme';
import { getProducts, updateProductStatus, updateProductStock, createProduct } from '@/lib/productApi';
import { Package, Star, DollarSign, Calendar, Warehouse, Tag, Plus, X, Trash2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  grade?: string;
  weight?: string;
  price: number;
  originalPrice?: number; // Changed from original_price to originalPrice
  rating?: number;
  reviews?: number;
  image?: string;
  badge?: string;
  description?: string;
  features?: string[];
  stock: number;
  status: 'active' | 'inactive' | 'discontinued' | 'out_of_stock';
  sku?: string;
  created_at: string;
  updated_at: string;
}

export default function ProductsAdminPage() {
  const { dark: darkMode } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [updatingProduct, setUpdatingProduct] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [newProductAlert, setNewProductAlert] = useState<string | null>(null);
  const [stockUpdates, setStockUpdates] = useState<{[key: string]: number}>({});
  
  // Add product form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    grade: '',
    weight: '',
    price: '',
    original_price: '',
    image: '',
    badge: '',
    description: '',
    features: '',
    stock: '',
    sku: '',
    status: 'active'
  });

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Initial fetch
    fetchProducts();

    // Set up REAL-TIME polling (every 3 seconds for true real-time updates)
    const pollInterval = setInterval(() => {
      fetchProducts();
    }, 3000);

    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  const fetchProducts = async () => {
    try {
      // Use imported productApi
      const productsArray = await getProducts();
      
      console.log('Fetched products (real-time):', productsArray);
      console.log('Number of products:', productsArray?.length);
      
      setProducts(productsArray || []);
      setLastUpdate(new Date());
      setIsLive(true);
      setTimeout(() => setIsLive(false), 2000);
      setError('');
      
      // Only set loading on first fetch
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setError(error.message || 'Failed to load products. Please check your database configuration.');
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (productId: string, newStatus: string) => {
    try {
      setUpdatingProduct(productId);
      
      console.log('Updating product:', productId, 'to status:', newStatus);
      
      // Update using productApi
      await updateProductStatus(productId, newStatus);
      
      // Update local state
      setProducts(products.map(product => 
        product.id === productId 
          ? { ...product, status: newStatus as any }
          : product
      ));
      
      alert(`✅ Product status updated to: ${newStatus.replace('_', ' ')}`);
    } catch (error: any) {
      console.error('Error updating product status:', error);
      alert('❌ Failed to update status: ' + error.message);
    } finally {
      setUpdatingProduct(null);
    }
  };

  const handleStockUpdate = async (productId: string) => {
    const newStock = stockUpdates[productId];
    if (newStock === undefined || newStock < 0) return;

    try {
      setUpdatingProduct(productId);
      
      // Update using productApi
      await updateProductStock(productId, newStock);
      
      // Update local state
      setProducts(products.map(product => 
        product.id === productId 
          ? { ...product, stock: newStock }
          : product
      ));
      
      setStockUpdates(prev => {
        const newUpdates = { ...prev };
        delete newUpdates[productId];
        return newUpdates;
      });
      
      alert(`✅ Stock updated to: ${newStock} units`);
    } catch (error: any) {
      console.error('Error updating product stock:', error);
      alert('❌ Failed to update stock: ' + error.message);
    } finally {
      setUpdatingProduct(null);
    }
  };

  const handleAddProduct = async () => {
    try {
      setAddingProduct(true);
      
      // Validate required fields
      if (!newProduct.name.trim() || !newProduct.price) {
        alert('Name and price are required');
        return;
      }

      // Parse features
      let features: string[] = [];
      if (newProduct.features.trim()) {
        try {
          features = newProduct.features.split(',').map(f => f.trim()).filter(f => f.length > 0);
        } catch (e) {
          console.warn('Could not parse features, using as plain text');
        }
      }

      const productData = {
        name: newProduct.name.trim(),
        grade: newProduct.grade.trim() || null,
        weight: newProduct.weight.trim() || null,
        price: parseFloat(newProduct.price),
        originalPrice: newProduct.original_price ? parseFloat(newProduct.original_price) : null,
        image: newProduct.image.trim() || null,
        badge: newProduct.badge.trim() || null,
        description: newProduct.description.trim() || null,
        features: features.length > 0 ? features : null,
        stock: newProduct.stock ? parseInt(newProduct.stock) : 0,
        sku: newProduct.sku.trim() || null,
        status: newProduct.status
      };

      // Add using productApi
      await createProduct(productData);
      
      // Reset form
      setNewProduct({
        name: '',
        grade: '',
        weight: '',
        price: '',
        original_price: '',
        image: '',
        badge: '',
        description: '',
        features: '',
        stock: '',
        sku: '',
        status: 'active'
      });
      
      setShowAddForm(false);
      fetchProducts(); // Refresh the list
      alert('✅ Product added successfully!');
      
    } catch (error: any) {
      console.error('Error adding product:', error);
      alert('❌ Failed to add product: ' + error.message);
    } finally {
      setAddingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    // Confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${productName}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      setDeletingProduct(productId);
      
      // Delete using API
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete product');
      }
      
      // Remove from local state
      setProducts(products.filter(product => product.id !== productId));
      
      alert(`✅ Product "${productName}" deleted successfully!`);
    } catch (error: any) {
      console.error('Error deleting product:', error);
      alert('❌ Failed to delete product: ' + error.message);
    } finally {
      setDeletingProduct(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'discontinued': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'out_of_stock': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockColor = (stock: number) => {
    if (stock === 0) return 'text-red-600 dark:text-red-400';
    if (stock < 10) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const filteredProducts = filter === 'all' 
    ? products 
    : products.filter(product => product.status === filter);

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
            }`}>Loading Products...</h1>
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
            }`}>Error Loading Products</h1>
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
            <div className="flex gap-4">
              <Button 
                onClick={fetchProducts}
                className="bg-linear-to-r from-red-500 via-purple-600 to-amber-600 hover:from-red-600 hover:via-purple-700 hover:to-amber-700 text-white"
              >
                Try Again
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLoading(false)}
                className={darkMode ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600' : ''}
              >
                Continue Anyway
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
              }`}>Products Management</h1>
              <div className="flex items-center space-x-4 mb-2">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full animate-pulse ${isLive ? 'bg-green-500 shadow-lg shadow-green-500' : 'bg-orange-400 shadow-lg shadow-orange-400'}`}></div>
                <span className={`text-sm font-medium ${
                  isLive 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-orange-600 dark:text-orange-400'
                }`}>
                  {isLive ? '🔴 LIVE' : '⏱️ SYNCING'}
                </span>
              </div>
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Updated {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
              <p className={`text-lg ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Monitor and manage product inventory in real-time
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Add Product Button */}
              <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                <DialogTrigger asChild>
                  <Button className="bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${
                  darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                }`}>
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Product Name *</label>
                      <Input
                        placeholder="Enter product name"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Grade</label>
                      <Input
                        placeholder="e.g., Grade A+, Organic"
                        value={newProduct.grade}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, grade: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Weight</label>
                      <Input
                        placeholder="e.g., 1g, 250ml"
                        value={newProduct.weight}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, weight: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Price *</label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Original Price</label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={newProduct.original_price}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, original_price: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Stock</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, stock: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">SKU</label>
                      <Input
                        placeholder="e.g., SAF-001"
                        value={newProduct.sku}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Badge</label>
                      <Input
                        placeholder="e.g., Best Seller, New"
                        value={newProduct.badge}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, badge: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <Select value={newProduct.status} onValueChange={(value) => setNewProduct(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="discontinued">Discontinued</SelectItem>
                          <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Image URL</label>
                      <Input
                        placeholder="/image.jpg"
                        value={newProduct.image}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, image: e.target.value }))}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Features (comma-separated)</label>
                      <Input
                        placeholder="Premium Quality, Rich Aroma, 100% Pure"
                        value={newProduct.features}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, features: e.target.value }))}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <Textarea
                        placeholder="Product description..."
                        value={newProduct.description}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    
                    <div className="col-span-2 flex gap-2 pt-4">
                      <Button 
                        onClick={handleAddProduct}
                        disabled={addingProduct}
                        className="flex-1 bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      >
                        {addingProduct ? 'Adding...' : 'Add Product'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAddForm(false)}
                        disabled={addingProduct}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              {newProductAlert && (
                <div className="bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 animate-bounce">
                  <span className="text-green-700 dark:text-green-400 text-sm font-medium">
                    🎉 {newProductAlert}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {['all', 'active', 'inactive', 'discontinued', 'out_of_stock'].map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
              className={`capitalize ${
                filter === status 
                  ? 'bg-linear-to-r from-red-500 via-purple-600 to-amber-600 hover:from-red-600 hover:via-purple-700 hover:to-amber-700 text-white' 
                  : darkMode 
                    ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600' 
                    : 'bg-white text-gray-900'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
            </Button>
          ))}
        </div>

        {/* Products List */}
        <div className="space-y-4">
          {filteredProducts.length === 0 ? (
            <Card className={`${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
            }`}>
              <CardContent className="p-8 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className={`text-xl font-semibold mb-2 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  No Products Found
                </h3>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                  {filter === 'all' 
                    ? 'No products have been added yet.'
                    : `No products with status: ${filter.replace('_', ' ')}`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredProducts.map((product) => (
              <Card key={product.id} className={`${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
              }`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {product.image && (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <CardTitle className={`text-lg ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {product.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm">
                            <Tag className="w-4 h-4" />
                            <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                              {product.sku || 'No SKU'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            ₹{product.price}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-sm text-gray-400 line-through ml-1">
                              ₹{product.originalPrice}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Warehouse className="w-4 h-4" />
                          <span className={`font-medium ${getStockColor(product.stock)}`}>
                            {product.stock} units
                          </span>
                        </div>
                        
                        {product.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                              {product.rating} ({product.reviews} reviews)
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                            {new Date(product.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Badge className={getStatusColor(product.status)}>
                        {product.status ? product.status.replace('_', ' ') : 'unknown'}
                      </Badge>
                      {product.badge && (
                        <Badge variant="outline">{product.badge}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {product.description && (
                    <div className="mb-4">
                      <p className={`text-sm leading-relaxed ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {product.description}
                      </p>
                    </div>
                  )}
                  
                  {/* Stock Update */}
                  <div className="mb-4 flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Update stock"
                      value={stockUpdates[product.id] || ''}
                      onChange={(e) => setStockUpdates(prev => ({
                        ...prev,
                        [product.id]: parseInt(e.target.value) || 0
                      }))}
                      className="w-32"
                      min="0"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={updatingProduct === product.id || stockUpdates[product.id] === undefined}
                      onClick={() => handleStockUpdate(product.id)}
                      className={darkMode ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600' : ''}
                    >
                      Update Stock
                    </Button>
                  </div>
                  
                  {/* Status Actions */}
                  <div className="flex gap-2 flex-wrap mb-4">
                    {['active', 'inactive', 'discontinued', 'out_of_stock'].map((status) => (
                      product.status !== status && (
                        <Button
                          key={status}
                          variant="outline"
                          size="sm"
                          disabled={updatingProduct === product.id}
                          onClick={() => handleStatusUpdate(product.id, status)}
                          className={`capitalize text-xs ${
                            darkMode ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600' : ''
                          }`}
                        >
                          Mark as {status.replace('_', ' ')}
                        </Button>
                      )
                    ))}
                  </div>

                  {/* Delete Product */}
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deletingProduct === product.id}
                    onClick={() => handleDeleteProduct(product.id, product.name)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deletingProduct === product.id ? 'Deleting...' : 'Delete Product'}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          {['active', 'inactive', 'discontinued', 'out_of_stock'].map((status) => {
            const count = products.filter(p => p.status === status).length;
            const totalStock = products.filter(p => p.status === status).reduce((sum, p) => sum + p.stock, 0);
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
                  <div className={`text-sm capitalize mb-1 ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {status.replace('_', ' ')}
                  </div>
                  <div className={`text-xs ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {totalStock} total units
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