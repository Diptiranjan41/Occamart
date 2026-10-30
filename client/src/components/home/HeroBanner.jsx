// src/components/home/HeroBanner.jsx
import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowRight, ChevronLeft, ChevronRight, Star, Truck, Shield, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Items shown in the moving news-style ticker
const TICKER_ITEMS = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders ₹5000+' },
  { icon: Shield, title: 'Secure Payment', desc: '100% Protected' },
  { icon: Clock, title: '24/7 Support', desc: 'Dedicated Help' },
];

// Repeat the items so one group is always wider than the screen (seamless loop)
const TICKER_GROUP = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];

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

    if (imagePath.includes('localhost') || imagePath.startsWith('http')) {
      return imagePath;
    }
    if (imagePath.startsWith('/uploads')) {
      return `${BASE_URL}${imagePath}`;
    }
    if (imagePath.startsWith('banner-')) {
      return `${BASE_URL}/uploads/${imagePath}`;
    }
    if (imagePath.includes('unsplash.com') || imagePath.includes('images.unsplash.com')) {
      return imagePath;
    }
    return `${BASE_URL}/uploads/${imagePath}`;
  };

  // Helper function to adjust color brightness
  function adjustColor(hex, percent) {
    if (!hex) return '#B8962E';

    let R = parseInt(hex.substring(1, 3), 16);
    let G = parseInt(hex.substring(3, 5), 16);
    let B = parseInt(hex.substring(5, 7), 16);

    R = parseInt((R * (100 + percent)) / 100);
    G = parseInt((G * (100 + percent)) / 100);
    B = parseInt((B * (100 + percent)) / 100);

    R = R < 255 ? R : 255;
    G = G < 255 ? G : 255;
    B = B < 255 ? B : 255;

    const RR = R.toString(16).length === 1 ? '0' + R.toString(16) : R.toString(16);
    const GG = G.toString(16).length === 1 ? '0' + G.toString(16) : G.toString(16);
    const BB = B.toString(16).length === 1 ? '0' + B.toString(16) : B.toString(16);

    return '#' + RR + GG + BB;
  }

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

  // Fetch slides from backend
  useEffect(() => {
    fetchHeroBannerData();
  }, []);

  const fetchHeroBannerData = async () => {
    try {
      setLoading(true);

      try {
        const response = await axios.get(`${API_URL}/hero-banner`);

        if (response.data && response.data.success) {
          const activeSlides = response.data.data
            .filter((slide) => slide.active !== false)
            .map((slide) => ({
              ...slide,
              fullImageUrl: getFullImageUrl(slide.image),
            }));

          setSlides(activeSlides);
          setThemeColor(response.data.themeColor || '#D4AF37');
          setError(null);
        } else {
          setSlides(getDefaultSlides());
        }
      } catch (err) {
        console.log('Backend not available, using default slides');
        setSlides(getDefaultSlides());
        setError(null);
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
      fullImageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
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
      fullImageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    },
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

  const handleMouseEnter = () => setAutoPlay(false);
  const handleMouseLeave = () => setAutoPlay(true);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const nextSlide = () => {
    if (slides.length > 0) setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    if (slides.length > 0) setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
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
    console.error('Image failed to load for slide:', slide.title, imageUrl);
    setImageErrors((prev) => ({ ...prev, [slide._id || slide.id]: true }));
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
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
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
      // extra left padding so the prev arrow never covers the text
      padding: isMobile ? '20px' : isTablet ? '30px 30px 30px 70px' : '40px 40px 40px 80px',
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
      boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
    },
    floatingCard: {
      position: 'absolute',
      bottom: isMobile ? '10px' : '20px',
      left: isMobile ? '10px' : '20px',
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(10px)',
      padding: isMobile ? '12px 15px' : '15px 20px',
      borderRadius: '12px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
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
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease',
    },
    prevButton: { left: isMobile ? '10px' : '20px' },
    nextButton: { right: isMobile ? '10px' : '20px' },
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

    /* ---------- NEWS-STYLE MOVING TICKER ---------- */
    ticker: {
      marginTop: isMobile ? '20px' : '30px',
      padding: isMobile ? '12px 0' : '16px 0',
      background: colors.white,
      borderRadius: '16px',
      border: `1px solid ${colors.border}`,
      overflow: 'hidden',
      position: 'relative',
      // soft fade on left & right edges
      WebkitMaskImage: 'linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)',
      maskImage: 'linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)',
    },
    tickerTrack: {
      display: 'flex',
      width: 'max-content',
    },
    tickerGroup: {
      display: 'flex',
      flexShrink: 0,
      alignItems: 'center',
    },
    tickerItem: {
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '10px' : '12px',
      padding: isMobile ? '0 24px' : '0 48px',
      whiteSpace: 'nowrap',
    },
    tickerSeparator: {
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      background: colors.primary,
      flexShrink: 0,
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
      flexShrink: 0,
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
    },
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
          <button style={styles.retryButton} onClick={fetchHeroBannerData}>
            Retry
          </button>
        </div>
      </section>
    );
  }

  const currentSlideData = slides[currentSlide];

  // One group of ticker items (rendered twice for a seamless loop)
  const renderTickerGroup = (groupKey, hidden = false) => (
    <div style={styles.tickerGroup} aria-hidden={hidden}>
      {TICKER_GROUP.map((item, i) => (
        <React.Fragment key={`${groupKey}-${i}`}>
          <div style={styles.tickerItem}>
            <div style={styles.featureIcon}>
              <item.icon size={isMobile ? 18 : 20} />
            </div>
            <div>
              <div style={{ fontWeight: '600', color: colors.textPrimary }}>{item.title}</div>
              <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', color: colors.textSecondary }}>
                {item.desc}
              </div>
            </div>
          </div>
          <span style={styles.tickerSeparator} />
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <section style={styles.hero}>
      <div style={styles.sliderContainer} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {/* Navigation Buttons */}
        <button
          style={{ ...styles.navButton, ...styles.prevButton }}
          onClick={prevSlide}
          aria-label="Previous slide"
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
          style={{ ...styles.navButton, ...styles.nextButton }}
          onClick={nextSlide}
          aria-label="Next slide"
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
            <h1 style={styles.title}>{currentSlideData.title}</h1>
            <p style={styles.subtitle}>{currentSlideData.subtitle}</p>
            <div style={styles.highlight}>{currentSlideData.highlight}</div>

            <div style={styles.buttonGroup}>
              <button
                style={styles.primaryButton}
                onClick={handleShopNow}
                onMouseEnter={(e) => (e.currentTarget.style.background = adjustColor(colors.primary, -10))}
                onMouseLeave={(e) => (e.currentTarget.style.background = colors.primary)}
              >
                Shop Now <ShoppingBag size={isMobile ? 16 : 18} />
              </button>

              <button
                style={styles.secondaryButton}
                onClick={handleLearnMore}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.primary;
                  e.currentTarget.style.color = colors.white;
                  e.currentTarget.style.borderColor = colors.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = colors.textPrimary;
                  e.currentTarget.style.borderColor = colors.border;
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
                handleImageError(currentSlideData, e.target.src);
                if (!currentSlideData.image?.includes('unsplash.com')) {
                  e.target.src =
                    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';
                }
              }}
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
              aria-label={`Go to slide ${index + 1}`}
              style={{
                ...styles.dot,
                ...(currentSlide === index ? styles.activeDot : {}),
              }}
              onClick={() => setCurrentSlide(index)}
              onMouseEnter={(e) => {
                if (currentSlide !== index) e.currentTarget.style.background = colors.primary;
              }}
              onMouseLeave={(e) => {
                if (currentSlide !== index) e.currentTarget.style.background = colors.border;
              }}
            />
          ))}
        </div>
      </div>

      {/* Moving news-style ticker (pauses on hover) */}
      <div className="hb-ticker" style={styles.ticker} role="marquee" aria-label="Store benefits">
        <div className="hb-ticker-track" style={styles.tickerTrack}>
          {renderTickerGroup('a')}
          {renderTickerGroup('b', true)}
        </div>
      </div>

      <style>{`
        @keyframes hb-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .hb-ticker-track {
          animation: hb-marquee ${isMobile ? 25 : 35}s linear infinite;
          will-change: transform;
        }
        .hb-ticker:hover .hb-ticker-track {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .hb-ticker-track { animation: none; }
          .hb-ticker { overflow-x: auto; }
        }
      `}</style>
    </section>
  );
};

export default HeroBanner;
