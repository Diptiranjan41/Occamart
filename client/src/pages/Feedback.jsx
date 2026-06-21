import React from 'react';
import FeedbackForm from '../components/FeedbackForm';

const Feedback = () => {
  const styles = {
    container: {
      minHeight: '100vh',
      background: '#FAF7F2',
      padding: '40px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  };

  return (
    <div style={styles.container}>
      <FeedbackForm />
    </div>
  );
};

// ✅ IMPORTANT: Add default export
export default Feedback;