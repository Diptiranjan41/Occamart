import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Known categories (name must match the category saved on your products)
const KNOWN_CATEGORIES = [
  { name: 'Electronics', icon: '🔌' },
  { name: 'Fashion', icon: '👕' },
  { name: 'Home & Living', icon: '🏠' },
  { name: 'Beauty', icon: '💄' },
  { name: 'Sports', icon: '⚽' },
  { name: 'Books', icon: '📚' },
];

const normalize = (s) => String(s || '').trim().toLowerCase();

const Categories = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({}); // { 'electronics': 8, ... } (lowercase keys)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const toLowerKeys = (obj) => {
      const out = {};
      Object.entries(obj || {}).forEach(([k, v]) => {
        out[normalize(k)] = (out[normalize(k)] || 0) + Number(v || 0);
      });
      return out;
    };

    const loadCounts = async () => {
      try {
        // 1) Preferred: dedicated counts endpoint
        let result = null;
        try {
          const res = await axios.get(`${API_URL}/products/category-counts`);
          if (res.data?.success && res.data.data && Object.keys(res.data.data).length > 0) {
            result = toLowerKeys(res.data.data);
          }
        } catch (e) {
          // endpoint missing -> fall back below
        }

        // 2) Fallback: count from the products list
        if (!result) {
          const res = await axios.get(`${API_URL}/products`, { params: { limit: 1000 } });
          const data = res.data;
          const list = Array.isArray(data)
            ? data
            : Array.isArray(data.products)
            ? data.products
            : Array.isArray(data.data)
            ? data.data
            : [];
          result = {};
          list.forEach((p) => {
            const key = normalize(p.category);
            if (key) result[key] = (result[key] || 0) + 1;
          });
        }

        if (!cancelled) setCounts(result);
      } catch (err) {
        console.error('Error loading category counts:', err);
        if (!cancelled) setCounts({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCounts();
    return () => {
      cancelled = true;
    };
  }, []);

  // Known categories + any extra category that exists in the database
  const categories = useMemo(() => {
    const knownKeys = new Set(KNOWN_CATEGORIES.map((c) => normalize(c.name)));
    const extras = Object.keys(counts)
      .filter((k) => !knownKeys.has(k))
      .map((k) => ({
        name: k.replace(/\b\w/g, (ch) => ch.toUpperCase()),
        icon: '🏷️',
      }));

    return [...KNOWN_CATEGORIES, ...extras].map((c) => ({
      ...c,
      count: counts[normalize(c.name)] || 0,
    }));
  }, [counts]);

  const countLabel = (count) => {
    if (loading) return '...';
    if (count === 0) return 'No items yet';
    return `${count} ${count === 1 ? 'item' : 'items'}`;
  };

  // Opens the shop / product section filtered by this category
  const handleCategoryClick = (name) => {
    navigate(`/shop?category=${encodeURIComponent(name)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewAllClick = () => {
    navigate('/shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const styles = {
    section: { padding: '40px 0', background: '#FAF7F2' },
    container: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px' },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
      gap: '12px',
      flexWrap: 'wrap',
    },
    title: { fontSize: '2rem', fontWeight: '700', color: '#1F2937', margin: 0 },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '20px',
    },
    image: { fontSize: '3rem', marginBottom: '10px' },
    categoryName: { color: '#1F2937', fontWeight: '600', marginBottom: '5px' },
    itemCount: { color: '#4B5563', fontSize: '0.85rem' },
  };

  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Shop by Category</h2>
          <button type="button" className="cat-viewall" onClick={handleViewAllClick}>
            View All <ArrowRight size={16} />
          </button>
        </div>

        <div style={styles.grid}>
          {categories.map((category) => (
            <button
              type="button"
              key={category.name}
              className="cat-card"
              onClick={() => handleCategoryClick(category.name)}
              aria-label={`Shop ${category.name}`}
            >
              <div style={styles.image}>{category.icon}</div>
              <div style={styles.categoryName}>{category.name}</div>
              <div style={styles.itemCount}>{countLabel(category.count)}</div>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .cat-card {
          background: #F5F0E8;
          border-radius: 16px;
          padding: 20px;
          text-align: center;
          cursor: pointer;
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
          border: 1px solid #E0D9CD;
          font: inherit;
        }
        .cat-card:hover, .cat-card:focus-visible {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(212, 175, 55, 0.2);
          border-color: #D4AF37;
          outline: none;
        }
        .cat-viewall {
          color: #D4AF37;
          background: transparent;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font: inherit;
          font-weight: 500;
          transition: all 0.3s ease;
          padding: 8px 16px;
          border-radius: 8px;
          border: 2px solid #D4AF37;
        }
        .cat-viewall:hover, .cat-viewall:focus-visible {
          background: #D4AF37;
          color: #FFFFFF;
          outline: none;
        }
      `}</style>
    </section>
  );
};

export default Categories;
