import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Success() {
  const [status, setStatus] = useState('Loading...');
  const router = useRouter();

  useEffect(() => {
    const { session_id } = router.query;

    if (session_id) {
      // Handle Stripe success
      // You might want to verify the session with your backend
      setStatus('Payment successful!');
    } else {
      // Handle PayPal success
      // You might want to verify the payment with your backend
      setStatus('Payment successful!');
    }

    // Redirect to studio after a delay
    const timer = setTimeout(() => {
      router.push('/studio');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">{status}</h1>
        <p>Redirecting you back to the studio...</p>
      </div>
    </div>
  );
}