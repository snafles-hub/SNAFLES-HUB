import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Lock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { showPaymentFailed, isOffline } from '../../utils/notify';
import { paymentsAPI } from '../../services/api';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key_here');

const PaymentForm = ({ amount, onSuccess, onError, orderId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    if (!amount || amount <= 0) return;
    createPaymentIntent();
  }, [amount, orderId]);

  const createPaymentIntent = async () => {
    try {
      const data = await paymentsAPI.createPaymentIntent({
        amount,
        currency: 'inr',
        orderId,
      });
      if (!data?.clientSecret) {
        throw new Error('Missing client secret from payment intent');
      }
      setClientSecret(data.clientSecret);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      const message = error?.message || 'Failed to initialize payment';
      toast.error(message);
      onError && onError(error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      if (isOffline()) {
        toast.error('You are offline. Please reconnect and try again.')
        setLoading(false)
        return
      }
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (error) {
        showPaymentFailed(error.message);
        onError && onError(error);
      } else if (paymentIntent.status === 'succeeded') {
        toast.success('Payment successful!');
        onSuccess && onSuccess(paymentIntent);
      }
    } catch (error) {
      console.error('Payment error:', error);
      showPaymentFailed(error?.message || 'Payment failed. Please try again.');
      onError && onError(error);
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
          <div className="flex items-center text-sm text-gray-600">
            <Lock className="h-4 w-4 mr-1" />
            Secure Payment
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Information
            </label>
            <div className="border border-gray-300 rounded-lg p-3">
              <CardElement options={cardElementOptions} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cardholder Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="john@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Your payment is secure</p>
            <p>We use Stripe to process your payment securely. Your card details are never stored on our servers.</p>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {loading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing Payment...
          </div>
        ) : (
          <div className="flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Pay ₹{amount.toLocaleString()}
          </div>
        )}
      </button>
    </form>
  );
};

const StripePayment = ({ amount, onSuccess, onError, orderId }) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm 
        amount={amount} 
        onSuccess={onSuccess} 
        onError={onError} 
        orderId={orderId}
      />
    </Elements>
  );
};

export default StripePayment;
