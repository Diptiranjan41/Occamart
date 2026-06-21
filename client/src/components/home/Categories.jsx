import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Categories = () => {
  const navigate = useNavigate();

  const categories = [
    { name: 'Electronics', image: '🔌', items: '150+ items', route: '/category/electronics' },
    { name: 'Fashion', image: '👕', items: '300+ items', route: '/category/fashion' },
    { name: 'Home & Living', image: '🏠', items: '200+ items', route: '/category/home-living' },
    { name: 'Beauty', image: '💄', items: '120+ items', route: '/category/beauty' },
    { name: 'Sports', image: '⚽', items: '80+ items', route: '/category/sports' },
    { name: 'Books', image: '📚', items: '500+ items', route: '/category/books' },
  ];

  // Color scheme - keeping your exact structure but updating values
  const styles = {
    section: {
      padding: '40px 0',
      background: '#FAF7F2', // Beige background
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 20px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
    },
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      color: '#1F2937', // Dark gray text
    },
    viewAll: {
      color: '#D4AF37', // Gold color
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'all 0.3s ease',
      padding: '8px 16px',
      borderRadius: '8px',
      border: '2px solid #D4AF37', // Gold border
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '20px',
    },
    card: {
      background: '#F5F0E8', // Slightly darker beige
      borderRadius: '16px',
      padding: '20px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      border: '1px solid #E0D9CD', // Light beige border
    },
    image: {
      fontSize: '3rem',
      marginBottom: '10px',
    },
    categoryName: {
      color: '#1F2937', // Dark gray
      fontWeight: '600',
      marginBottom: '5px',
    },
    itemCount: {
      color: '#4B5563', // Medium gray
      fontSize: '0.85rem',
    },
  };

  const handleCategoryClick = (route) => {
    navigate(route);
  };

  const handleViewAllClick = () => {
    navigate('/categories');
  };

  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Shop by Category</h2>
          <div 
            style={styles.viewAll}
            onClick={handleViewAllClick}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#D4AF37'; // Gold background
              e.currentTarget.style.color = '#FFFFFF'; // White text
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#D4AF37'; // Back to gold
            }}
          >
            View All <ArrowRight size={16} />
          </div>
        </div>
        
        <div style={styles.grid}>
          {categories.map((category, index) => (
            <div 
              key={index} 
              style={styles.card}
              onClick={() => handleCategoryClick(category.route)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 20px rgba(212, 175, 55, 0.2)'; // Gold shadow
                e.currentTarget.style.borderColor = '#D4AF37'; // Gold border on hover
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#E0D9CD'; // Back to beige border
              }}
            >
              <div style={styles.image}>{category.image}</div>
              <div style={styles.categoryName}>{category.name}</div>
              <div style={styles.itemCount}>{category.items}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;