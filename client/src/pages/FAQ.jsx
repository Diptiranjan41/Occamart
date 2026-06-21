import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

const FAQ = () => {
  const [openItems, setOpenItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const colors = {
    bgPrimary: '#FAF7F2',
    primary: '#D4AF37',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    white: '#FFFFFF',
    border: '#E5E7EB'
  };

  const faqs = [
    {
      category: 'Orders & Shipping',
      items: [
        {
          question: 'How long does delivery take?',
          answer: 'Delivery usually takes 3-5 business days within Odisha, and 5-7 business days for other states. Same-day delivery is available in Bhubaneswar for orders placed before 2 PM.'
        },
        {
          question: 'Do you ship internationally?',
          answer: 'Currently, we only ship within India. We plan to start international shipping soon.'
        },
        {
          question: 'How can I track my order?',
          answer: 'Once your order is shipped, you will receive a tracking number via email and SMS. You can also track your order from your account dashboard.'
        },
        {
          question: 'What are the shipping charges?',
          answer: 'Shipping is free on orders above ₹5000. For orders below ₹5000, a flat rate of ₹99 is applicable.'
        }
      ]
    },
    {
      category: 'Returns & Refunds',
      items: [
        {
          question: 'What is your return policy?',
          answer: 'We offer 30-day easy returns on most products. Items must be unused and in original packaging.'
        },
        {
          question: 'How do I initiate a return?',
          answer: 'You can initiate a return from your order history page. Select the items you want to return and follow the instructions.'
        },
        {
          question: 'How long do refunds take?',
          answer: 'Refunds are processed within 5-7 business days after we receive the returned item. The amount will be credited to your original payment method.'
        }
      ]
    },
    {
      category: 'Products & Pricing',
      items: [
        {
          question: 'Are your products genuine?',
          answer: 'Yes, all our products are 100% genuine and come with manufacturer warranty where applicable.'
        },
        {
          question: 'Do you offer student discounts?',
          answer: 'Yes, we offer 15% extra discount for students from GITA, KIIT, SOA, BJB, and all other colleges. Send your college ID to support@occamart.com for verification.'
        },
        {
          question: 'Can I change or cancel my order?',
          answer: 'Orders can be modified or cancelled within 2 hours of placing them. After that, the order enters processing and cannot be changed.'
        }
      ]
    },
    {
      category: 'Payment',
      items: [
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit/debit cards, UPI (Google Pay, PhonePe, Paytm), net banking, and COD (Cash on Delivery).'
        },
        {
          question: 'Is COD available?',
          answer: 'Yes, Cash on Delivery is available for orders up to ₹10,000.'
        },
        {
          question: 'Is my payment information secure?',
          answer: 'Absolutely! We use 256-bit SSL encryption to ensure your payment information is completely secure.'
        }
      ]
    }
  ];

  const styles = {
    container: {
      minHeight: '100vh',
      background: colors.bgPrimary,
      padding: '40px 20px'
    },
    wrapper: {
      maxWidth: '900px',
      margin: '0 auto'
    },
    header: {
      textAlign: 'center',
      marginBottom: '40px'
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
      margin: '0 auto 30px'
    },
    searchBox: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '12px 20px',
      background: colors.white,
      borderRadius: '50px',
      border: `1px solid ${colors.border}`,
      maxWidth: '500px',
      margin: '0 auto'
    },
    searchInput: {
      border: 'none',
      background: 'transparent',
      outline: 'none',
      width: '100%',
      fontSize: '1rem'
    },
    category: {
      marginBottom: '30px',
      background: colors.white,
      borderRadius: '16px',
      border: `1px solid ${colors.border}`,
      overflow: 'hidden'
    },
    categoryTitle: {
      padding: '20px',
      background: colors.bgPrimary,
      borderBottom: `1px solid ${colors.border}`,
      fontSize: '1.3rem',
      fontWeight: '600',
      color: colors.primary
    },
    faqItem: {
      borderBottom: `1px solid ${colors.border}`,
      cursor: 'pointer'
    },
    question: {
      padding: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontWeight: '500',
      color: colors.textPrimary
    },
    answer: {
      padding: '0 20px 20px',
      color: colors.textSecondary,
      lineHeight: '1.6'
    }
  };

  const toggleItem = (categoryIndex, itemIndex) => {
    const key = `${categoryIndex}-${itemIndex}`;
    setOpenItems(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const filteredFaqs = faqs.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <h1 style={styles.title}>Frequently Asked Questions</h1>
          <p style={styles.subtitle}>
            Find answers to common questions about ordering, shipping, returns, and more.
          </p>
          
          <div style={styles.searchBox}>
            <Search size={20} color={colors.textSecondary} />
            <input
              type="text"
              placeholder="Search FAQs..."
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredFaqs.map((category, categoryIndex) => (
          <div key={categoryIndex} style={styles.category}>
            <h2 style={styles.categoryTitle}>{category.category}</h2>
            {category.items.map((item, itemIndex) => {
              const isOpen = openItems.includes(`${categoryIndex}-${itemIndex}`);
              return (
                <div
                  key={itemIndex}
                  style={styles.faqItem}
                  onClick={() => toggleItem(categoryIndex, itemIndex)}
                >
                  <div style={styles.question}>
                    <span>{item.question}</span>
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                  {isOpen && (
                    <div style={styles.answer}>
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;