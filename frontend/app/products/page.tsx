'use client';

import { useEffect, useState } from 'react';
// Server API will be used to fetch products (local Postgres)
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import PageShell from '@/components/site/page-shell';
import PageHero from '@/components/site/page-hero';
import SectionHeader from '@/components/site/section-header';
import {
  siteContainer,
  siteSection,
  siteCard,
  siteBtnPrimary,
  siteBtnSecondary,
  siteInput,
  siteBadge,
  siteDivider,
  siteSubtext,
  siteHeading,
} from '@/lib/siteStyles';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, ShoppingCart, Filter, Search, Grid, List, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import SiteFooter from '@/components/site-footer';
import { useTheme } from '@/hooks/use-theme';
import { useCart } from '@/context/CartContext';
// import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';

// --- Types ---
interface Product {
  id: number | string;
  name?: string;
  grade?: string;
  weight?: string;
  price?: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  image?: string;
  badge?: string;
  description?: string;
  features?: string[];
  stock?: number;
  created_at?: string | null;
  [key: string]: any;
}

interface CartItem {
  id: number | string;
  name?: string;
  price?: number;
  qty: number;
  image?: string;
}

// We fetch products from the server API at `/api/products` which reads from local PostgreSQL

/** Fallback products (used only if API fetch fails) */
const fallbackProducts: Product[] = [
  {
    id: 1,
    name: "Premium Kashmiri Saffron",
    grade: "Grade A+",
    weight: "1g",
    price: 299,
    originalPrice: 399,
    rating: 4.9,
    reviews: 156,
    image: "/p-1.jpg",
    badge: "Best Seller",
    description: "Hand-picked premium saffron threads with highest crocin content. Perfect for biryanis and desserts.",
    features: ["Lab Tested", "ISO Certified", "Premium Grade"],
    stock: 50
  },
  {
    id: 2,
    name: "Royal Saffron Collection",
    grade: "Premium",
    weight: "2g",
    price: 549,
    originalPrice: 699,
    rating: 4.8,
    reviews: 89,
    image: "/p-2.jpg",
    badge: "Premium",
    description: "Luxury saffron collection in elegant packaging. Ideal for gifting and special occasions.",
    features: ["Gift Packaging", "Certificate of Authenticity", "Premium Quality"],
    stock: 30
  },
  {
    id: 3,
    name: "Saffron Gift Set",
    grade: "Luxury",
    weight: "5g",
    price: 1299,
    originalPrice: 1599,
    rating: 5.0,
    reviews: 45,
    image: "/saffron-gift-set.jpg",
    badge: "Limited Edition",
    description: "Exclusive gift set with premium saffron, recipe book, and elegant wooden box.",
    features: ["Wooden Gift Box", "Recipe Book", "Limited Edition"],
    stock: 8
  },
  {
    id: 4,
    name: "Organic Saffron Threads",
    grade: "Organic",
    weight: "1g",
    price: 349,
    originalPrice: 449,
    rating: 4.7,
    reviews: 78,
    image: "/organic-saffron-threads.jpg",
    badge: "Organic",
    description: "Certified organic saffron grown without pesticides or chemicals. Pure and natural.",
    features: ["Organic Certified", "Chemical Free", "Natural Processing"],
    stock: 80
  },
  {
    id: 5,
    name: "Saffron Powder",
    grade: "Grade A",
    weight: "2g",
    price: 199,
    originalPrice: 249,
    rating: 4.6,
    reviews: 123,
    image: "/saffron-powder.jpg",
    badge: "Value Pack",
    description: "Finely ground saffron powder for easy mixing in milk, desserts, and beverages.",
    features: ["Easy to Use", "Quick Dissolving", "Value for Money"],
    stock: 40
  },
  {
    id: 6,
    name: "Bulk Saffron Pack",
    grade: "Commercial",
    weight: "10g",
    price: 2499,
    originalPrice: 2999,
    rating: 4.8,
    reviews: 34,
    image: "/p-6.jpg",
    badge: "Wholesale",
    description: "Bulk pack for restaurants and commercial use. Best value for professional kitchens.",
    features: ["Bulk Quantity", "Commercial Grade", "Best Value"],
    stock: 15
  }
];

export default function ProductsPage() {
  // router navigation removed so Add button doesn't navigate
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { toast } = useToast();
  const { addToCart: addToCartContext } = useCart();
  const [sortBy, setSortBy] = useState('featured');
  const [filterBy, setFilterBy] = useState('all');
  const { dark: darkMode } = useTheme();

  // Products state (fetched from local PostgreSQL API)
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // UI state for cart messages and product details
  const [cartMessage, setCartMessage] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Add to cart handler (checks stock)
  function addToCart(product: Product, qty = 1) {
    const stock = Number(product.stock ?? 0);
    if (stock <= 0) {
      setCartMessage('Item is out of stock');
      setTimeout(() => setCartMessage(''), 2000);
      return;
    }

    // Use cart context to add item
    addToCartContext({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      weight: product.weight,
      description: product.description
    }, qty);

    // Show toast notification
    try {
      toast({
        title: ( (
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-green-50">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <span>Product has been added to cart</span>
          </div>
        ) as any),
        description: `${product.name}${product.weight ? ' • ' + product.weight : ''}`,
        action: ( (
          <ToastAction asChild altText="Go to shopping cart">
            <Link href="/cart" className="text-rose-700 font-medium">View Bag &gt;</Link>
          </ToastAction>
        ) as any),
      } as any);
    } catch (e) { /* ignore */ }
    
    setCartMessage('Added to cart');
    setTimeout(() => setCartMessage(''), 1500);
  }

  // Normalize product features and stock
  const normalizeProduct = (p: any): Product => {
    let features: string[] = [];
    try {
      if (Array.isArray(p.features)) features = p.features;
      else if (p.features) features = JSON.parse(p.features);
    } catch (e) {
      features = [];
    }

    const stockFields = ['stock', 'qty', 'quantity', 'inventory', 'count'];
    let stockVal = 0;
    for (const key of stockFields) {
      const v = p[key];
      if (v !== undefined && v !== null) {
        const n = Number(v);
        if (!Number.isNaN(n)) { stockVal = n; break; }
      }
    }

    return {
      ...p,
      features,
      stock: stockVal
    } as Product;
  };

  // Fetch products from local PostgreSQL API on mount
  useEffect(() => {
    let mounted = true;

    async function fetchProducts() {
      try {
        setLoading(true);

        const resp = await fetch('/api/products', { cache: 'no-store' });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          console.error('API error fetching products:', err);
          if (mounted) setProducts(fallbackProducts);
          return;
        }

        const data = await resp.json();
        const normalized = (data || []).map(normalizeProduct);
        if (mounted) setProducts(normalized.length ? normalized : fallbackProducts);
      } catch (err) {
        console.error('Fetch products failed:', err);
        if (mounted) setProducts(fallbackProducts);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchProducts();

    // Poll for changes every 20 seconds to pick up new products added via admin
    const interval = setInterval(() => {
      if (mounted) fetchProducts();
    }, 20000);

    return () => { 
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Filters & sorting (works with fetched products)
  const filteredProducts = products.filter(product => {
    if (filterBy === 'all') return true;
    if (filterBy === 'premium') return String(product.grade || '').includes('Premium') || String(product.grade || '').includes('A+');
    if (filterBy === 'organic') return String(product.grade || '').includes('Organic');
    if (filterBy === 'gift') return String(product.name || '').includes('Gift') || String(product.badge || '').includes('Limited');
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') return (a.price || 0) - (b.price || 0);
    if (sortBy === 'price-high') return (b.price || 0) - (a.price || 0);
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    return 0; // featured (default order)
  });

  return (
    <PageShell>

      <PageHero
        eyebrow="Our Collection"
        title="Premium Saffron Collection"
        description="Discover our complete range of authentic Kashmiri saffron products, each carefully selected for exceptional quality and purity."
      />

      {/* Filters and Search */}
      <section className={cn(siteSection(darkMode, 'muted'), 'py-8 md:py-10')}>
        <div className={siteContainer()}>
          <div className={cn(siteCard(darkMode), 'p-4 md:p-5 backdrop-blur-md')}>
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 items-center w-full lg:w-auto">
                <div className="relative w-full sm:w-auto">
                  <Search className={cn(
                    'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  )} />
                  <Input
                    placeholder="Search products..."
                    className={siteInput(darkMode, 'pl-10 w-full sm:w-64 h-10')}
                  />
                </div>

                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className={siteInput(darkMode, 'w-full sm:w-48 h-10')}>
                    <Filter className="w-4 h-4 mr-2 shrink-0" />
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent className={darkMode ? 'bg-gray-900 border-white/10' : 'bg-white'}>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="premium">Premium Grade</SelectItem>
                    <SelectItem value="organic">Organic</SelectItem>
                    <SelectItem value="gift">Gift Sets</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className={siteInput(darkMode, 'w-full sm:w-48 h-10')}>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className={darkMode ? 'bg-gray-900 border-white/10' : 'bg-white'}>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                  </SelectContent>
                </Select>

                <div className={cn(
                  'flex rounded-full p-1 shrink-0',
                  darkMode ? 'bg-white/5 border border-white/10' : 'bg-stone-100/80 border border-gray-200/80'
                )}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'rounded-full h-8 w-8 p-0',
                      viewMode === 'grid'
                        ? siteBtnPrimary('h-8 w-8 p-0')
                        : darkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                    )}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'rounded-full h-8 w-8 p-0',
                      viewMode === 'list'
                        ? siteBtnPrimary('h-8 w-8 p-0')
                        : darkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                    )}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className={siteSection(darkMode)}>
        <div className={siteContainer()}>
          {loading ? (
            <div className={cn('text-center py-24', siteSubtext(darkMode))}>Loading products…</div>
          ) : (
            <div className={cn(
              'grid gap-6 md:gap-8 items-stretch',
              viewMode === 'grid'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1'
            )}>
              {sortedProducts.map((product) => (
                <div
                  key={product.id}
                  className={cn(
                    siteCard(darkMode, true),
                    'group overflow-hidden flex flex-col',
                    (product.stock === 0 || product.status === 'discontinued' || product.status === 'inactive') && 'opacity-60',
                    viewMode === 'list' && 'flex-row'
                  )}
                >
                  <div className={cn(
                    'relative overflow-hidden',
                    viewMode === 'list' ? 'w-64 shrink-0' : ''
                  )}>
                    <Image
                      src={product.image || '/placeholder.jpg'}
                      alt={product.name || ''}
                      width={400}
                      height={300}
                      className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
                        viewMode === 'list' ? 'w-full h-full' : 'w-full h-64'
                      }`}
                    />
                    {product.badge && (
                      <span className={cn(siteBadge(darkMode), 'absolute top-4 left-4')}>
                        {product.badge}
                      </span>
                    )}
                    {/* Status Badge */}
                    {product.status && (
                      <Badge className={`absolute top-4 right-4 text-white ${
                        product.status === 'active' ? 'bg-green-600' :
                        product.status === 'inactive' ? 'bg-gray-600' :
                        product.status === 'discontinued' ? 'bg-rose-700' :
                        product.status === 'out_of_stock' ? 'bg-yellow-600' :
                        'bg-gray-600'
                      }`}>
                        {product.status === 'out_of_stock' ? 'Out of Stock' : product.status.replace('_', ' ')}
                      </Badge>
                    )}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ShoppingCart className="w-5 h-5 text-rose-700" />
                    </div>
                  </div>

                  <div className={cn('p-6 flex flex-col flex-1 min-w-0', viewMode === 'list' && 'flex-1')}>
                    <div className="flex items-center justify-between mb-2">
                      {product.grade && (
                        <span className={siteBadge(darkMode)}>{product.grade}</span>
                      )}
                      <span className={cn('text-sm', darkMode ? 'text-gray-400' : 'text-gray-500')}>{product.weight}</span>
                    </div>

                    <h3 className={cn(
                      siteHeading(darkMode, 'sm'),
                      'mb-2 group-hover:text-rose-700 transition-colors'
                    )}>
                      {product.name}
                    </h3>

                    <p className={cn(siteSubtext(darkMode), 'mb-4 text-sm md:text-base')}>
                      {product.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {(product.features || []).map((feature, index) => (
                        <span key={index} className={cn(siteBadge(darkMode), 'normal-case tracking-normal text-[11px]')}>
                          {feature}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center mb-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(product.rating || 0) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <span className={`text-sm ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {product.rating || 0} ({product.reviews || 0} reviews)
                      </span>
                    </div>
                    
                    <div
                      className={cn(
                        'mt-auto pt-4 space-y-3',
                        darkMode ? 'border-t border-white/10' : 'border-t border-gray-200/80'
                      )}
                    >
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          ₹{product.price}
                        </span>
                        {product.originalPrice != null && (
                          <span className={`text-sm line-through ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            ₹{product.originalPrice}
                          </span>
                        )}
                        {product.originalPrice != null && (
                          <Badge className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5">
                            {Math.round(((product.originalPrice - (product.price ?? 0)) / product.originalPrice) * 100)}% OFF
                          </Badge>
                        )}
                      </div>

                      <div
                        className={cn(
                          'grid gap-2 w-full',
                          viewMode === 'list' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
                        )}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSelectedProduct(product); setDetailsOpen(true); }}
                          className={siteBtnSecondary(darkMode, 'w-full h-10 px-3 text-[10px] sm:text-[11px]')}
                        >
                          View Details
                        </Button>
                        <Button
                          disabled={product.stock === 0 || product.status === 'discontinued' || product.status === 'inactive'}
                          onClick={() => { addToCart(product, 1); }}
                          className={cn(
                            'w-full h-10 px-3 text-[10px] sm:text-[11px]',
                            product.stock === 0 || product.status === 'discontinued' || product.status === 'inactive'
                              ? 'bg-gray-400 cursor-not-allowed text-white rounded-full'
                              : siteBtnPrimary('h-10 px-3 text-[10px] sm:text-[11px]')
                          )}
                        >
                          {product.stock === 0
                            ? 'Out of Stock'
                            : product.status === 'discontinued'
                              ? 'Discontinued'
                              : product.status === 'inactive'
                                ? 'Unavailable'
                                : 'Add to Cart'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      {/* Product Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={(open) => { if (!open) setSelectedProduct(null); setDetailsOpen(open); }}>
        <DialogContent className="bg-white text-gray-900 w-[95vw] max-w-[95vw] sm:w-[75vw] sm:max-w-[75vw] rounded-lg">
          {selectedProduct ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative w-full h-80 md:h-[420px] rounded-md overflow-hidden">
                <Image
                  src={selectedProduct.image || '/placeholder.jpg'}
                  alt={selectedProduct.name || ''}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <DialogTitle className="text-gray-900">{selectedProduct.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-2 mb-3">
                  {selectedProduct.badge && <Badge className="bg-rose-100 text-rose-700 text-xs">{selectedProduct.badge}</Badge>}
                  {selectedProduct.grade && <Badge variant="outline" className="text-sm">{selectedProduct.grade}</Badge>}
                  <span className="text-sm text-gray-600">{selectedProduct.weight}</span>
                </div>

                <div className="mb-3 text-sm text-gray-700">{selectedProduct.description}</div>

                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl font-semibold">₹{selectedProduct.price}</span>
                  {selectedProduct.originalPrice && (
                    <span className="text-lg line-through text-gray-500">₹{selectedProduct.originalPrice}</span>
                  )}
                  {selectedProduct.originalPrice && (
                    <Badge className="bg-green-100 text-green-800 text-xs">{Math.round(((selectedProduct.originalPrice - (selectedProduct.price ?? 0)) / selectedProduct.originalPrice) * 100)}% OFF</Badge>
                  )}
                </div>

                <div className="mb-3">
                  <h4 className="text-sm font-medium mb-2">Details</h4>
                  <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
                    <li>Rating: {selectedProduct.rating ?? 0} ({selectedProduct.reviews ?? 0} reviews)</li>
                    <li>Stock: {selectedProduct.stock != null ? selectedProduct.stock : 'N/A'}</li>
                  </ul>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedProduct.features || []).map((f, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{f}</Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <Button onClick={() => { addToCart(selectedProduct, 1); setDetailsOpen(false); }} className={siteBtnPrimary()}>Add to Cart</Button>
                  <Button variant="ghost" onClick={() => setDetailsOpen(false)} className={siteBtnSecondary(false, 'h-11')}>Close</Button>
                </div>
              </div>
            </div>
          ) : null}
          <DialogClose />
        </DialogContent>
      </Dialog>
      <section className={siteSection(darkMode, 'alt')}>
        <div className={siteContainer()}>
          <SectionHeader
            eyebrow="Why Us"
            title="Why Choose Real Spices Saffron?"
            description="We're committed to bringing you the finest saffron with complete transparency and quality assurance."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Direct from Farms",
                description: "Sourced directly from Kashmir valley farmers",
                icon: "🌾"
              },
              {
                title: "Lab Tested",
                description: "Every batch tested for purity and quality",
                icon: "🔬"
              },
              {
                title: "Secure Packaging",
                description: "Airtight containers to preserve freshness",
                icon: "📦"
              },
              {
                title: "Money Back Guarantee",
                description: "100% satisfaction or full refund",
                icon: "💯"
              }
            ].map((item, index) => (
              <div key={index} className={cn(siteCard(darkMode, true), 'p-6 text-center')}>
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className={cn(siteHeading(darkMode, 'sm'), 'mb-2 text-xl')}>{item.title}</h3>
                <p className={siteSubtext(darkMode)}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </PageShell>
  );
}
