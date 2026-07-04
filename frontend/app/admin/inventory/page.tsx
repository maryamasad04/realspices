"use client";

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
import { Package, Star, IndianRupee, Calendar, Warehouse, Tag, Plus, X, Trash2, Upload, Loader } from 'lucide-react';

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

export default function InventoryAdminPage() {
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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    grade: '',
    weight: '',
    price: '',
    originalPrice: '',
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

    fetchProducts();

    // Set up polling for product updates (every 30 seconds)
    const pollInterval = setInterval(() => {
      fetchProducts();
    }, 30000);

    return () => {
      clearInterval(pollInterval);
    };
  }, []);


  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch from API
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      console.log('API fetch - products:', data);
      console.log('Number of products:', data?.length);
      
      const productsArray = Array.isArray(data) ? data : [];
      setProducts(productsArray);
      setLastUpdate(new Date());
      setIsLive(true);
      setTimeout(() => setIsLive(false), 3000);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setError(error.message || 'Failed to load products. Please check your database configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (productId: string, newStatus: string) => {
    try {
      setUpdatingProduct(productId);
      
      console.log('Updating product:', productId, 'to status:', newStatus);
      
      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, status: newStatus })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }
      
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
      
      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, stock: newStock })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update stock');
      }
      
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.url) {
        setNewProduct(prev => ({ ...prev, image: data.url }));
        alert('✅ Image uploaded successfully!');
      } else {
        alert('❌ ' + (data.error || 'Failed to upload image'));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('❌ Image upload failed');
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (e.target) {
        e.target.value = '';
      }
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
        originalPrice: newProduct.originalPrice ? parseFloat(newProduct.originalPrice) : null,
        image: newProduct.image.trim() || null,
        badge: newProduct.badge.trim() || null,
        description: newProduct.description.trim() || null,
        features: features.length > 0 ? features : null,
        stock: newProduct.stock ? parseInt(newProduct.stock) : 0,
        sku: newProduct.sku.trim() || null,
        status: newProduct.status
      };

      // Add via API
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add product');
      }
      
      // Reset form
      setNewProduct({
        name: '',
        grade: '',
        weight: '',
        price: '',
        originalPrice: '',
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

  const handleEditProduct = async () => {
    try {
      setAddingProduct(true);
      
      if (!editingProduct) {
        alert('No product selected for editing');
        return;
      }

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
        id: editingProduct.id,
        name: newProduct.name.trim(),
        grade: newProduct.grade.trim() || null,
        weight: newProduct.weight.trim() || null,
        price: parseFloat(newProduct.price),
        originalPrice: newProduct.originalPrice ? parseFloat(newProduct.originalPrice) : null,
        image: newProduct.image.trim() || null,
        badge: newProduct.badge.trim() || null,
        description: newProduct.description.trim() || null,
        features: features.length > 0 ? features : null,
        stock: newProduct.stock ? parseInt(newProduct.stock) : 0,
        sku: newProduct.sku.trim() || null,
        status: newProduct.status
      };

      // Update via API
      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product');
      }
      
      // Reset form and state
      setNewProduct({
        name: '',
        grade: '',
        weight: '',
        price: '',
        originalPrice: '',
        image: '',
        badge: '',
        description: '',
        features: '',
        stock: '',
        sku: '',
        status: 'active'
      });
      
      setEditingProduct(null);
      setShowAddForm(false);
      fetchProducts(); // Refresh the list
      alert('✅ Product updated successfully!');
      
    } catch (error: any) {
      console.error('Error updating product:', error);
      alert('❌ Failed to update product: ' + error.message);
    } finally {
      setAddingProduct(false);
    }
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name || '',
      grade: product.grade || '',
      weight: product.weight || '',
      price: product.price?.toString() || '',
      originalPrice: product.originalPrice?.toString() || '',
      image: product.image || '',
      badge: product.badge || '',
      description: product.description || '',
      features: (product.features || []).join(', '),
      stock: product.stock?.toString() || '',
      sku: product.sku || '',
      status: product.status || 'active'
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setNewProduct({
      name: '',
      grade: '',
      weight: '',
      price: '',
      originalPrice: '',
      image: '',
      badge: '',
      description: '',
      features: '',
      stock: '',
      sku: '',
      status: 'active'
    });
    setEditingProduct(null);
    setShowAddForm(false);
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    // Confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${productName}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      setDeletingProduct(productId);
      
      // Delete via server API (handles cascade deletion of order items)
      const resp = await fetch('/api/admin/delete-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });

      const json = await resp.json();

      if (!resp.ok) {
        throw new Error(json.error || `Delete failed (status ${resp.status})`);
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
            <Button 
              onClick={fetchProducts}
              className="bg-linear-to-r from-red-500 via-purple-600 to-amber-600 hover:from-red-600 hover:via-purple-700 hover:to-amber-700 text-white"
            >
              Try Again
            </Button>
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
              }`}>Inventory Management</h1>
              <div className={`flex items-center space-x-2 mb-2 ${isLive ? 'animate-pulse' : ''}`}>
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {isLive ? 'Live Updates' : 'Last updated ' + lastUpdate.toLocaleTimeString()}
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
                    <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
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
                        value={newProduct.originalPrice}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, originalPrice: e.target.value }))}
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
                    
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-2">Product Image</label>
                      <div className="space-y-3">
                        {/* Image URL Input */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Or enter image URL:</label>
                          <Input
                            placeholder="/image.jpg"
                            value={newProduct.image}
                            onChange={(e) => setNewProduct(prev => ({ ...prev, image: e.target.value }))}
                          />
                        </div>

                        {/* File Upload */}
                        <div className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                          darkMode
                            ? 'border-gray-600 hover:border-blue-500 bg-gray-800/50 hover:bg-gray-800'
                            : 'border-gray-300 hover:border-blue-500 bg-gray-50 hover:bg-blue-50'
                        }`}>
                          <input
                            type="file"
                            id="image-upload"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                            className="hidden"
                          />
                          <label
                            htmlFor="image-upload"
                            className={`flex flex-col items-center justify-center gap-2 cursor-pointer ${
                              uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {uploadingImage ? (
                              <>
                                <Loader className="w-5 h-5 animate-spin text-blue-500" />
                                <span className="text-sm">Uploading...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-5 h-5 text-blue-500" />
                                <div className="text-sm font-medium">Click to upload or drag and drop</div>
                                <div className="text-xs text-gray-500">PNG, JPG, WebP, GIF (max 5MB)</div>
                              </>
                            )}
                          </label>
                        </div>

                        {/* Image Preview */}
                        {newProduct.image && (
                          <div className="relative w-full h-32 bg-gray-200 rounded-lg overflow-hidden">
                            <img
                              src={newProduct.image}
                              alt="Preview"
                              className="w-full h-full object-cover"
                              onError={() => {
                                console.error('Failed to load image preview');
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setNewProduct(prev => ({ ...prev, image: '' }))}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
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
                        onClick={editingProduct ? handleEditProduct : handleAddProduct}
                        disabled={addingProduct}
                        className="flex-1 bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      >
                        {addingProduct ? (editingProduct ? 'Updating...' : 'Adding...') : (editingProduct ? 'Update Product' : 'Add Product')}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={resetForm}
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
          {['all', 'active', 'discontinued', 'out_of_stock'].map((status) => (
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
                            <Tag className={`w-4 h-4 ${darkMode ? 'text-white' : 'text-black'}`} />
                            <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                              {product.sku || 'No SKU'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        <div className="flex items-center gap-1">
                          <IndianRupee className={`w-4 h-4 ${darkMode ? 'text-white' : 'text-black'}`} />
                          <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {product.price}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-sm text-gray-400 line-through ml-1">
                              ₹{product.originalPrice}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Warehouse className={`w-4 h-4 ${darkMode ? 'text-white' : 'text-black'}`} />
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
                          <Calendar className={`w-4 h-4 ${darkMode ? 'text-white' : 'text-black'}`} />
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                            {product.created_at && product.created_at !== '1970-01-01T00:00:00.000Z' 
                              ? new Date(product.created_at).toLocaleDateString()
                              : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Badge className={getStatusColor(product.status)}>
                        {product.status ? product.status.replace('_', ' ') : 'unknown'}
                      </Badge>
                      {product.badge && (
                        <Badge variant="outline" className={darkMode ? 'text-white border-white' : 'text-black border-black'}>{product.badge}</Badge>
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
                      className={`w-32 bg-transparent ${darkMode ? 'text-white border-white' : 'text-black border-black'}`}
                      min="0"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={updatingProduct === product.id || stockUpdates[product.id] === undefined}
                      onClick={() => handleStockUpdate(product.id)}
                      className={darkMode ? 'bg-gray-700 text-white border-white hover:bg-gray-600' : 'bg-white text-black border-black hover:bg-gray-100'}
                    >
                      Update Stock
                    </Button>
                  </div>
                  
                  {/* Status Actions */}
                  <div className="flex gap-2 flex-wrap mb-4">
                    {['active', 'discontinued', 'out_of_stock'].map((status) => (
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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditForm(product)}
                      className={`flex-1 ${
                        darkMode ? 'bg-blue-700/20 border-blue-600 text-blue-100 hover:bg-blue-700/30' : 'bg-blue-100 border-blue-200 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      disabled={deletingProduct === product.id}
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      className={`flex-1 ${darkMode ? 'bg-red-700/20 border-red-600 text-red-100 hover:bg-red-700/30' : 'bg-red-100 border-red-200 text-red-700 hover:bg-red-200'}`}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {deletingProduct === product.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {['active', 'discontinued', 'out_of_stock'].map((status) => {
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