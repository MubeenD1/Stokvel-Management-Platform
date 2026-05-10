import { useState } from 'react';

export default function MakeContributionButton({ groupId, groupMemberId, role, user, amount }) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    // Basic validation to ensure we don't send null values
    if (!amount || !user.email) {
      console.error('Missing payment details:', { amount, email: user.email });
      alert('Missing payment details. Please check your profile.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/payfast/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name_first: user.firstName,
          name_last: user.lastName,
          email_address: user.email,
          amount,
          item_name: 'Stokvel Contribution',
          groupId,
          groupMemberId,
          role,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to initiate payment from server');
      }

      // We expect the backend to return { redirectUrl }
      const { redirectUrl } = await res.json();

      if (redirectUrl) {
        // Redirect the user to the PayFast secure payment page
        window.location.href = redirectUrl;
      } else {
        throw new Error('No redirect URL received from server');
      }

    } catch (err) {
      console.error('Payment error:', err);
      alert('There was an issue connecting to the payment gateway.');
    } finally {
      // In a redirect flow, we technically don't need to set loading to false 
      // because the page is navigating away, but it's good practice.
      setLoading(false);
    }
  };

  return (
    <button 
      className='pay-btn' 
      onClick={handlePay} 
      disabled={loading}
      style={{
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1
      }}
    >
      {loading ? 'Processing...' : 'Make Contribution'}
    </button>
  );
}
