import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Award, Users, Truck, Shield, Clock } from 'lucide-react';

const About = () => {
  const colors = {
    bgPrimary: '#FAF7F2',
    primary: '#D4AF37',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    white: '#FFFFFF',
    border: '#E5E7EB'
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: colors.bgPrimary,
      padding: '40px 20px'
    },
    wrapper: {
      maxWidth: '1200px',
      margin: '0 auto'
    },
    header: {
      textAlign: 'center',
      marginBottom: '50px'
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: '15px'
    },
    subtitle: {
      fontSize: '1.1rem',
      color: colors.textSecondary,
      maxWidth: '600px',
      margin: '0 auto',
      lineHeight: '1.6'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '30px',
      marginBottom: '50px'
    },
    card: {
      background: colors.white,
      padding: '30px',
      borderRadius: '16px',
      border: `1px solid ${colors.border}`,
      textAlign: 'center'
    },
    icon: {
      width: '60px',
      height: '60px',
      background: `${colors.primary}15`,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 20px',
      color: colors.primary
    },
    cardTitle: {
      fontSize: '1.3rem',
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: '10px'
    },
    cardText: {
      color: colors.textSecondary,
      lineHeight: '1.6'
    },
    section: {
      background: colors.white,
      padding: '40px',
      borderRadius: '20px',
      border: `1px solid ${colors.border}`,
      marginBottom: '30px'
    },
    sectionTitle: {
      fontSize: '1.8rem',
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: '20px'
    },
    text: {
      color: colors.textSecondary,
      lineHeight: '1.8',
      marginBottom: '15px'
    }
  };

  const features = [
    { icon: Award, title: 'Quality Products', desc: '100% genuine products with warranty' },
    { icon: Users, title: 'Happy Customers', desc: '50,000+ satisfied customers across India' },
    { icon: Truck, title: 'Fast Delivery', desc: 'Free shipping on orders ₹5000+' },
    { icon: Shield, title: 'Secure Shopping', desc: '256-bit SSL encryption' },
    { icon: Clock, title: '24/7 Support', desc: 'Dedicated customer support' }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <h1 style={styles.title}>About OccaMart</h1>
          <p style={styles.subtitle}>
            Your premier destination for quality products and exceptional shopping experience
          </p>
        </div>

        <div style={styles.grid}>
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} style={styles.card}>
                <div style={styles.icon}>
                  <Icon size={28} />
                </div>
                <h3 style={styles.cardTitle}>{feature.title}</h3>
                <p style={styles.cardText}>{feature.desc}</p>
              </div>
            );
          })}
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Our Story</h2>
          <p style={styles.text}>
            Founded in 2024, OccaMart began with a simple mission: to provide quality products at affordable prices with exceptional customer service. What started as a small venture has grown into one of Bhubaneswar's most trusted online stores.
          </p>
          <p style={styles.text}>
            We believe in creating a seamless shopping experience for our customers, offering everything from electronics to fashion, home essentials to groceries. Our commitment to quality and customer satisfaction has earned us the trust of thousands of happy customers across Odisha.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Our Mission</h2>
          <p style={styles.text}>
            To make online shopping accessible, enjoyable, and trustworthy for everyone. We strive to bring the best products to your doorstep while supporting local businesses and communities in Odisha.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;