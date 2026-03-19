// src/components/home/HeroBanner.jsx
import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowRight, ChevronLeft, ChevronRight, Star, Truck, Shield, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const HeroBanner = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoPlay, setAutoPlay] = useState(true);
  const [themeColor, setThemeColor] = useState('#D4AF37');
  const [imageErrors, setImageErrors] = useState({});

  // API URL
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const BASE_URL = 'http://localhost:5000'; // Base URL for images

  // Function to get full image URL
  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return '';
    
    // If it's already a full URL with localhost, return as is
    if (imagePath.includes('localhost') || imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // If it starts with /uploads
    if (imagePath.startsWith('/uploads')) {
      return `${BASE_URL}${imagePath}`;
    }
    
    // If it's just the filename
    if (imagePath.startsWith('banner-')) {
      return `${BASE_URL}/uploads/${imagePath}`;
    }
    
    // For Unsplash URLs or other external images
    if (imagePath.includes('unsplash.com') || imagePath.includes('images.unsplash.com')) {
      return imagePath;
    }
    
    // Default: assume it's a filename in uploads
    return `${BASE_URL}/uploads/${imagePath}`;
  };

  // Color scheme based on theme color from admin panel
  const colors = {
    primary: themeColor,
    primaryDark: adjustColor(themeColor, -20),
    bgPrimary: '#FAF7F2',
    bgSecondary: '#F5F0E8',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    border: '#E5E7EB',
    white: '#FFFFFF',
  };

  // Helper function to adjust color brightness
  function adjustColor(hex, percent) {
    if (!hex) return '#B8962E';
    
    // Convert hex to RGB
    let R = parseInt(hex.substring(1,3), 16);
    let G = parseInt(hex.substring(3,5), 16);
    let B = parseInt(hex.substring(5,7), 16);

    // Adjust brightness
    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    // Ensure values are within range
    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    // Convert back to hex
    const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

    return "#" + RR + GG + BB;
  }

  // Fetch slides from backend
  useEffect(() => {
    fetchHeroBannerData();
  }, []);

  const fetchHeroBannerData = async () => {
    try {
      setLoading(true);
      console.log('📦 Fetching hero banner from:', `${API_URL}/hero-banner`);
      
      // Try to fetch from backend
      try {
        const response = await axios.get(`${API_URL}/hero-banner`);
        console.log('📥 Hero banner response:', response.data);
        
        if (response.data && response.data.success) {
          // Filter only active slides and process image URLs
          const activeSlides = response.data.data
            .filter(slide => slide.active !== false)
            .map(slide => {
              const fullImageUrl = getFullImageUrl(slide.image);
              console.log(`Slide ${slide.title} image URL:`, fullImageUrl);
              return {
                ...slide,
                fullImageUrl: fullImageUrl
              };
            });
          
          console.log('✅ Processed slides:', activeSlides);
          setSlides(activeSlides);
          setThemeColor(response.data.themeColor || '#D4AF37');
          setError(null);
        } else {
          // If response format is different, use default slides
          console.log('Using default slides - no data from backend');
          setSlides(getDefaultSlides());
        }
      } catch (err) {
        console.log('Backend not available, using default slides');
        setSlides(getDefaultSlides());
        setError(null); // Don't show error to user
      }
    } catch (err) {
      console.error('Error in hero banner:', err);
      setSlides(getDefaultSlides());
    } finally {
      setLoading(false);
    }
  };

  // Default slides as fallback
  const getDefaultSlides = () => [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      title: 'Summer Collection 2024',
      subtitle: 'Discover Your Perfect Style',
      badge: '🔥 HOT DEALS',
      highlight: 'Up to 50% Off',
      category: 'fashion',
      active: true,
      fullImageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      title: 'Premium Electronics',
      subtitle: 'Latest Tech Arrivals',
      badge: '⚡ FLASH SALE',
      highlight: 'Save ₹5000+',
      category: 'electronics',
      active: true,
      fullImageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    }
  ];

  // Auto-slide functionality
  useEffect(() => {
    let timer;
    if (autoPlay && slides.length > 0) {
      timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [slides.length, autoPlay]);

  // Pause auto-play on hover
  const handleMouseEnter = () => setAutoPlay(false);
  const handleMouseLeave = () => setAutoPlay(true);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const nextSlide = () => {
    if (slides.length > 0) {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }
  };

  const prevSlide = () => {
    if (slides.length > 0) {
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }
  };

  const handleShopNow = () => {
    if (slides.length > 0 && slides[currentSlide]?.category) {
      navigate(`/shop?category=${slides[currentSlide].category}`);
    } else {
      navigate('/shop');
    }
  };

  const handleLearnMore = () => {
    if (slides.length > 0 && slides[currentSlide]?.link) {
      navigate(slides[currentSlide].link);
    } else {
      navigate('/about');
    }
  };

  const handleImageError = (slide, imageUrl) => {
    console.error(`❌ Image failed to load for slide:`, slide.title);
    console.error('Failed URL:', imageUrl);
    setImageErrors(prev => ({ ...prev, [slide._id || slide.id]: true }));
  };

  const handleImageLoad = (slide) => {
    console.log(`✅ Image loaded successfully for slide:`, slide.title);
  };

  // Responsive breakpoints
  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth > 768 && windowWidth <= 1024;
  const isDesktop = windowWidth > 1024 && windowWidth <= 1400;
  const isLargeScreen = windowWidth > 1400;

  const styles = {
    hero: {
      background: colors.bgPrimary,
      padding: isMobile ? '20px 15px' : isTablet ? '30px 20px' : '40px 20px',
      borderRadius: isMobile ? '16px' : '24px',
      margin: isMobile ? '10px 0' : '20px 0',
      position: 'relative',
      overflow: 'hidden',
    },
    sliderContainer: {
      position: 'relative',
      maxWidth: isLargeScreen ? '1400px' : '1200px',
      margin: '0 auto',
      borderRadius: isMobile ? '16px' : '24px',
      overflow: 'hidden',
      boxShadow: `0 20px 40px rgba(0,0,0,0.1)`,
    },
    slide: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap: isMobile ? '20px' : isTablet ? '30px' : '40px',
      alignItems: 'center',
      background: colors.bgSecondary,
      minHeight: isMobile ? '400px' : isTablet ? '450px' : '500px',
      transition: 'all 0.5s ease',
    },
    content: {
      padding: isMobile ? '20px' : isTablet ? '30px' : '40px',
      order: isMobile ? 1 : 0,
    },
    badge: {
      background: colors.primary,
      color: colors.white,
      padding: isMobile ? '4px 10px' : '6px 14px',
      borderRadius: '30px',
      fontSize: isMobile ? '0.75rem' : isTablet ? '0.8rem' : '0.9rem',
      fontWeight: '600',
      display: 'inline-block',
      marginBottom: isMobile ? '12px' : '20px',
      letterSpacing: '1px',
      boxShadow: `0 4px 10px ${colors.primary}40`,
    },
    title: {
      fontSize: isMobile ? '1.8rem' : isTablet ? '2.2rem' : isDesktop ? '2.8rem' : '3.2rem',
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: isMobile ? '12px' : '20px',
      lineHeight: '1.2',
    },
    subtitle: {
      fontSize: isMobile ? '1rem' : isTablet ? '1.1rem' : '1.2rem',
      color: colors.textSecondary,
      marginBottom: isMobile ? '15px' : '20px',
      lineHeight: '1.6',
    },
    highlight: {
      color: colors.primary,
      fontSize: isMobile ? '1.2rem' : '1.4rem',
      fontWeight: '700',
      marginBottom: isMobile ? '15px' : '20px',
    },
    buttonGroup: {
      display: 'flex',
      gap: isMobile ? '10px' : '15px',
      flexDirection: isMobile ? 'column' : 'row',
    },
    primaryButton: {
      background: colors.primary,
      color: colors.white,
      border: 'none',
      padding: isMobile ? '12px 20px' : '14px 32px',
      borderRadius: '12px',
      fontSize: isMobile ? '0.9rem' : '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.3s ease',
      boxShadow: `0 8px 20px ${colors.primary}80`,
      width: isMobile ? '100%' : 'auto',
    },
    secondaryButton: {
      background: 'transparent',
      color: colors.textPrimary,
      border: `2px solid ${colors.border}`,
      padding: isMobile ? '12px 20px' : '14px 32px',
      borderRadius: '12px',
      fontSize: isMobile ? '0.9rem' : '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.3s ease',
      width: isMobile ? '100%' : 'auto',
    },
    imageContainer: {
      position: 'relative',
      height: '100%',
      minHeight: isMobile ? '250px' : '400px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      order: isMobile ? 0 : 1,
      backgroundColor: colors.bgSecondary,
    },
    image: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius: isMobile ? '16px' : '24px',
      boxShadow: `0 20px 40px rgba(0,0,0,0.15)`,
    },
    floatingCard: {
      position: 'absolute',
      bottom: isMobile ? '10px' : '20px',
      left: isMobile ? '10px' : '20px',
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(10px)',
      padding: isMobile ? '12px 15px' : '15px 20px',
      borderRadius: '12px',
      boxShadow: `0 10px 30px rgba(0,0,0,0.15)`,
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '10px' : '12px',
      border: `1px solid ${colors.border}`,
    },
    floatingIcon: {
      width: isMobile ? '35px' : '40px',
      height: isMobile ? '35px' : '40px',
      background: colors.primary,
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: colors.white,
    },
    navButton: {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      width: isMobile ? '35px' : '45px',
      height: isMobile ? '35px' : '45px',
      background: colors.white,
      border: `1px solid ${colors.border}`,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      zIndex: 10,
      boxShadow: `0 4px 12px rgba(0,0,0,0.1)`,
      transition: 'all 0.3s ease',
    },
    prevButton: {
      left: isMobile ? '10px' : '20px',
    },
    nextButton: {
      right: isMobile ? '10px' : '20px',
    },
    dots: {
      position: 'absolute',
      bottom: isMobile ? '10px' : '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: isMobile ? '6px' : '8px',
      zIndex: 10,
    },
    dot: {
      width: isMobile ? '8px' : '10px',
      height: isMobile ? '8px' : '10px',
      borderRadius: '50%',
      background: colors.border,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      border: `1px solid ${colors.white}`,
    },
    activeDot: {
      background: colors.primary,
      width: isMobile ? '20px' : '25px',
      borderRadius: '12px',
    },
    features: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
      gap: isMobile ? '10px' : '20px',
      marginTop: isMobile ? '20px' : '30px',
      padding: isMobile ? '15px' : '20px',
      background: colors.white,
      borderRadius: '16px',
      border: `1px solid ${colors.border}`,
    },
    feature: {
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '10px' : '12px',
      padding: isMobile ? '10px' : '0',
      justifyContent: isMobile ? 'flex-start' : 'center',
    },
    featureIcon: {
      width: isMobile ? '35px' : '40px',
      height: isMobile ? '35px' : '40px',
      background: colors.bgSecondary,
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: colors.primary,
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '400px',
      background: colors.bgSecondary,
      borderRadius: '24px',
    },
    errorContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '400px',
      background: colors.bgSecondary,
      borderRadius: '24px',
      color: colors.textSecondary,
      flexDirection: 'column',
      gap: '20px',
    },
    retryButton: {
      background: colors.primary,
      color: colors.white,
      border: 'none',
      padding: '10px 20px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '1rem',
    }
  };

  if (loading) {
    return (
      <section style={styles.hero}>
        <div style={styles.loadingContainer}>
          <div>Loading banner...</div>
        </div>
      </section>
    );
  }

  if (error || slides.length === 0) {
    return (
      <section style={styles.hero}>
        <div style={styles.errorContainer}>
          <div>Unable to load banner</div>
          <button 
            style={styles.retryButton}
            onClick={fetchHeroBannerData}
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  const currentSlideData = slides[currentSlide];

  return (
    <section style={styles.hero}>
      <div 
        style={styles.sliderContainer}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Navigation Buttons */}
        <button 
          style={{...styles.navButton, ...styles.prevButton}}
          onClick={prevSlide}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.primary;
            e.currentTarget.style.color = colors.white;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colors.white;
            e.currentTarget.style.color = colors.textPrimary;
          }}
        >
          <ChevronLeft size={isMobile ? 18 : 22} />
        </button>
        
        <button 
          style={{...styles.navButton, ...styles.nextButton}}
          onClick={nextSlide}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.primary;
            e.currentTarget.style.color = colors.white;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colors.white;
            e.currentTarget.style.color = colors.textPrimary;
          }}
        >
          <ChevronRight size={isMobile ? 18 : 22} />
        </button>

        {/* Slide Content */}
        <div style={styles.slide}>
          <div style={styles.content}>
            <span style={styles.badge}>{currentSlideData.badge}</span>
            <h1 style={styles.title}>
              {currentSlideData.title}
            </h1>
            <p style={styles.subtitle}>{currentSlideData.subtitle}</p>
            <div style={styles.highlight}>{currentSlideData.highlight}</div>
            
            <div style={styles.buttonGroup}>
              <button 
                style={styles.primaryButton}
                onClick={handleShopNow}
                onMouseEnter={(e) => e.target.style.background = adjustColor(colors.primary, -10)}
                onMouseLeave={(e) => e.target.style.background = colors.primary}
              >
                Shop Now <ShoppingBag size={isMobile ? 16 : 18} />
              </button>
              
              <button 
                style={styles.secondaryButton}
                onClick={handleLearnMore}
                onMouseEnter={(e) => {
                  e.target.style.background = colors.primary;
                  e.target.style.color = colors.white;
                  e.target.style.borderColor = colors.primary;
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = colors.textPrimary;
                  e.target.style.borderColor = colors.border;
                }}
              >
                Learn More <ArrowRight size={isMobile ? 16 : 18} />
              </button>
            </div>
          </div>

          <div style={styles.imageContainer}>
            <img 
              src={currentSlideData.fullImageUrl || currentSlideData.image}
              alt={currentSlideData.title}
              style={styles.image}
              loading="lazy"
              onError={(e) => {
                console.error('Image failed to load:', e.target.src);
                handleImageError(currentSlideData, e.target.src);
                // Try fallback to Unsplash if local image fails
                if (!currentSlideData.image.includes('unsplash.com')) {
                  e.target.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';
                }
              }}
              onLoad={() => handleImageLoad(currentSlideData)}
            />

            <div style={styles.floatingCard}>
              <div style={styles.floatingIcon}>
                <Star size={isMobile ? 18 : 20} />
              </div>
              <div>
                <div style={{ fontWeight: '600', color: colors.textPrimary }}>4.8 ★ Rating</div>
                <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', color: colors.textSecondary }}>
                  50k+ Happy Customers
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dots Navigation */}
        <div style={styles.dots}>
          {slides.map((_, index) => (
            <button
              key={index}
              style={{
                ...styles.dot,
                ...(currentSlide === index ? styles.activeDot : {})
              }}
              onClick={() => setCurrentSlide(index)}
              onMouseEnter={(e) => {
                if (currentSlide !== index) {
                  e.target.style.background = colors.primary;
                }
              }}
              onMouseLeave={(e) => {
                if (currentSlide !== index) {
                  e.target.style.background = colors.border;
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div style={styles.features}>
        <div style={styles.feature}>
          <div style={styles.featureIcon}>
            <Truck size={isMobile ? 18 : 20} />
          </div>
          <div>
            <div style={{ fontWeight: '600', color: colors.textPrimary }}>Free Shipping</div>
            <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', color: colors.textSecondary }}>
              On orders ₹5000+
            </div>
          </div>
        </div>

        <div style={styles.feature}>
          <div style={styles.featureIcon}>
            <Shield size={isMobile ? 18 : 20} />
          </div>
          <div>
            <div style={{ fontWeight: '600', color: colors.textPrimary }}>Secure Payment</div>
            <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', color: colors.textSecondary }}>
              100% Protected
            </div>
          </div>
        </div>

        <div style={styles.feature}>
          <div style={styles.featureIcon}>
            <Clock size={isMobile ? 18 : 20} />
          </div>
          <div>
            <div style={{ fontWeight: '600', color: colors.textPrimary }}>24/7 Support</div>
            <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', color: colors.textSecondary }}>
              Dedicated Help
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;