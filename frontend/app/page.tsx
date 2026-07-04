'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Star, ChevronRight, Play, CheckCircle, Award, Shield, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import SiteFooter from '@/components/site-footer';
import SectionHeader from '@/components/site/section-header';
import {
  siteContainer,
  siteSection,
  siteCard,
  siteBtnPrimary,
  siteBtnSecondary,
  siteSubtext,
  siteHeading,
  siteBadge,
} from '@/lib/siteStyles';
import { useTheme } from '@/hooks/use-theme';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  image: string;
  weight?: string;
  description?: string;
  grade?: string;
  originalPrice?: number;
}

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { dark: darkMode } = useTheme();
  const { toast } = useToast();
  const { addToCart: addToCartContext } = useCart();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationProduct, setNotificationProduct] = useState<string>('');
  
  const heroSlides = [
    {
      title: "Premium Kashmiri Saffron",
      subtitle: "Experience the world's finest saffron",
      description: "Hand-picked from the pristine valleys of Kashmir, our saffron delivers unmatched quality and flavor.",
      image: "/h-1.jpg"
    },
    {
      title: "Authentic & Pure",
      subtitle: "100% Natural Saffron",
      description: "No artificial colors or additives. Just pure, authentic saffron threads from certified farms.",
      image: "/saffron flower.jpg"
    },
    {
      title: "Culinary Excellence",
      subtitle: "Elevate your cooking",
      description: "Transform your dishes with the golden touch of premium saffron. Perfect for biryanis, desserts, and more.",
      image: "/saffron-tea-golden.jpg"
    }
  ];

  const products = [
    {
      id: 1,
      name: "Premium Kashmiri Saffron",
      grade: "Grade A+",
      weight: "1g",
      price: 299,
      originalPrice: 399,
      rating: 4.9,
      reviews: 156,
      image: "/saffron-wooden-bowl.jpg",
      badge: "Best Seller"
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
      image: "/saffron-threads-purple-flowers.jpg",
      badge: "Premium"
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
      badge: "Limited Edition"
    }
  ];

  const features = [
    {
      icon: <Award className="w-8 h-8 text-rose-700" />,
      title: "Premium Quality",
      description: "Grade A+ saffron with highest crocin content"
    },
    {
      icon: <Shield className="w-8 h-8 text-rose-700" />,
      title: "100% Authentic",
      description: "Certified pure saffron with lab test reports"
    },
    {
      icon: <Truck className="w-8 h-8 text-rose-700" />,
      title: "Fast Delivery",
      description: "Free shipping on orders above ₹500"
    }
  ];

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [isPaused, heroSlides.length]);

  // Add to cart handler
  function addToCart(product: typeof products[0], qty = 1) {
    console.log('Adding to cart:', product.name);
    
    // Use cart context to add item
    addToCartContext({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      weight: product.weight,
      grade: product.grade,
      originalPrice: product.originalPrice
    }, qty);
    
    // Show custom notification
    setNotificationProduct(product.name);
    setShowNotification(true);
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 4000);
    
    console.log('Product added to cart successfully:', product.name);
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-gray-950 text-white' : 'bg-stone-50 text-gray-900'}`}>
      {/* Hero Carousel */}
      <section
        className="relative h-[92vh] min-h-[620px] overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Background slides */}
        {heroSlides.map((slide, index) => (
          <div
            key={slide.image}
            className={`absolute inset-0 transition-opacity duration-[1400ms] ease-in-out ${
              index === currentSlide ? 'opacity-100 z-0' : 'opacity-0 z-0'
            }`}
            aria-hidden={index !== currentSlide}
          >
            <Image
              src={slide.image}
              alt=""
              fill
              priority={index === 0}
              quality={90}
              className={`object-cover transition-transform duration-[8000ms] ease-out ${
                index === currentSlide ? 'scale-105' : 'scale-100'
              }`}
            />
            <div className="absolute inset-0 bg-linear-to-r from-black/85 via-black/55 to-black/25" />
            <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-black/20" />
          </div>
        ))}

        {/* Content */}
        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
          <div key={currentSlide} className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <p className="text-xs sm:text-sm font-medium tracking-[0.2em] uppercase text-rose-300/90 mb-4">
              {heroSlides[currentSlide].subtitle}
            </p>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white mb-6 leading-[1.08] tracking-tight">
              {heroSlides[currentSlide].title}
            </h1>

            <p className="text-base sm:text-lg text-white/70 mb-10 leading-relaxed max-w-xl font-light">
              {heroSlides[currentSlide].description}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link href="/products">
                <Button
                  size="lg"
                  className="bg-white/95 text-rose-800 hover:bg-white border-0 px-8 h-12 text-sm font-medium tracking-wide"
                >
                  Shop Premium Saffron
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/about#our-journey">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm px-8 h-12 text-sm font-medium tracking-wide"
                >
                  <Play className="w-4 h-4 mr-2 fill-white/80" />
                  Watch Our Story
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section className={siteSection(darkMode, 'alt')}>
        <div className={siteContainer()}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center md:text-left group">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-5 transition-colors ${
                  darkMode ? 'bg-white/5 border border-white/10' : 'bg-rose-50 border border-rose-100'
                }`}>
                  {feature.icon}
                </div>
                <h3 className={`text-sm font-medium tracking-wide uppercase mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {feature.title}
                </h3>
                <p className={`text-sm font-light leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className={siteSection(darkMode)}>
        <div className={siteContainer()}>
          <SectionHeader
            eyebrow="Collection"
            title="Featured Products"
            description="Authentic Kashmiri saffron, carefully selected for exceptional quality and flavor."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-stretch">
            {products.map((product) => (
              <div key={product.id} className={`group overflow-hidden flex flex-col h-full ${siteCard(darkMode, true)}`}>
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <span className={`absolute top-4 left-4 ${siteBadge(darkMode)}`}>{product.badge}</span>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <span className={siteBadge(darkMode)}>{product.grade}</span>
                    <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{product.weight}</span>
                  </div>

                  <h3 className={`text-lg font-medium mb-3 group-hover:text-rose-700 transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {product.name}
                  </h3>

                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'text-amber-500 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                    <span className={`text-xs ml-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {product.rating} ({product.reviews})
                    </span>
                  </div>

                  <div className={`mt-auto pt-4 space-y-3 ${darkMode ? 'border-t border-white/10' : 'border-t border-gray-200/80'}`}>
                    <div className="flex items-baseline flex-wrap gap-2">
                      <span className={`text-xl font-light ${darkMode ? 'text-white' : 'text-gray-900'}`}>₹{product.price}</span>
                      <span className={`text-sm line-through ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>₹{product.originalPrice}</span>
                    </div>
                    <Button
                      onClick={() => addToCart(product)}
                      className={siteBtnPrimary('w-full h-10 px-4 text-[11px]')}
                    >
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-14">
            <Link href="/products">
              <Button className={siteBtnSecondary(darkMode)}>
                View All Products
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className={siteSection(darkMode, 'alt')}>
        <div className={siteContainer()}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <SectionHeader
                align="left"
                eyebrow="Heritage"
                title="The Golden Heritage of Kashmir"
                description="For generations, the valleys of Kashmir have been home to the world's most precious spice. At Real Spices, we continue this legacy with saffron hand-picked at dawn when the flowers are at their most potent."
              />
              <p className={`${siteSubtext(darkMode)} mb-8 -mt-6`}>
                Every thread is processed using traditional methods and tested for purity, aroma, and vibrant color.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className={`text-3xl font-light text-rose-700 mb-1`}>25+</div>
                  <div className={`text-xs tracking-wide uppercase ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Years of Excellence</div>
                </div>
                <div>
                  <div className={`text-3xl font-light text-rose-700 mb-1`}>10,000+</div>
                  <div className={`text-xs tracking-wide uppercase ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Happy Customers</div>
                </div>
              </div>
            </div>

            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                src="/saffron-bowl-flower.jpg"
                alt="Saffron farming in Kashmir"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={siteSection(darkMode)}>
        <div className={siteContainer()}>
          <SectionHeader
            eyebrow="Testimonials"
            title="What Our Customers Say"
            description="Trusted by chefs and home cooks worldwide"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Chef Rajesh Kumar', role: 'Executive Chef', content: 'The quality of Real Spices saffron is exceptional. It transforms every dish with its rich aroma and vibrant color.', rating: 5 },
              { name: 'Priya Sharma', role: 'Home Cook', content: "I've been using Real Spices saffron for my family recipes. The authenticity and purity are unmatched.", rating: 5 },
              { name: 'Mohammed Ali', role: 'Restaurant Owner', content: 'Our customers always compliment the flavor of our biryanis. Real Spices saffron makes all the difference.', rating: 5 },
            ].map((testimonial, index) => (
              <div key={index} className={`p-6 ${siteCard(darkMode)}`}>
                <div className="flex items-center gap-0.5 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-amber-500 fill-current" />
                  ))}
                </div>
                <p className={`text-sm font-light leading-relaxed mb-6 italic ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  &ldquo;{testimonial.content}&rdquo;
                </p>
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{testimonial.name}</p>
                  <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className={`relative overflow-hidden border-t transition-colors duration-500 ${
          darkMode
            ? 'bg-gray-950 border-white/10'
            : 'bg-linear-to-br from-rose-100 via-stone-200 to-amber-100 border-rose-200/60'
        }`}
      >
        {darkMode && (
          <div className="absolute inset-0 bg-linear-to-br from-rose-950/50 via-gray-950 to-amber-950/30" />
        )}
        {!darkMode && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.1),transparent_70%)]" />
        )}
        <div className={`${siteContainer()} relative z-10 py-20 md:py-24 text-center`}>
          <span
            className={`text-[11px] font-medium tracking-[0.28em] uppercase mb-4 block ${
              darkMode ? 'text-amber-300/80' : 'text-rose-700'
            }`}
          >
            Experience the Difference
          </span>
          <h2 className={`${siteHeading(darkMode, 'md')} mb-6 max-w-2xl mx-auto`}>
            Taste the authentic flavor of Kashmir
          </h2>
          <p className={`${siteSubtext(darkMode)} mb-10 max-w-xl mx-auto`}>
            Join thousands of satisfied customers who trust Real Spices for premium saffron.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/products">
              <Button className={siteBtnPrimary()}>Shop Now</Button>
            </Link>
            <Link href="/contact">
              <Button className={siteBtnSecondary(darkMode)}>Contact Us</Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />

      {/* Custom Notification Popup */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-down">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium">Product has been added to cart</p>
                  <p className="text-gray-600 text-sm">{notificationProduct}</p>
                </div>
              </div>
              <Link href="/cart">
                <Button 
                  size="sm" 
                  className="bg-rose-700 hover:bg-rose-800 text-white border-0 px-4 ml-4"
                  onClick={() => setShowNotification(false)}
                >
                  View Bag &gt;
                </Button>
              </Link>
            </div>
            <button 
              onClick={() => setShowNotification(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}