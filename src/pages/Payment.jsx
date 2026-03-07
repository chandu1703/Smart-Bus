import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard, ShieldCheck, Lock, Smartphone,
    CheckCircle2, Loader2, Building, ChevronRight
} from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    CardElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';

// Replace with your Stripe public key
const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

const CheckoutForm = ({ amount, bookingId, onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!stripe || !elements) return;

        setProcessing(true);

        try {
            // Create PaymentIntent on the server
            const { data: { clientSecret } } = await axios.post(`${API_BASE_URL}/api/payment/create-intent`, {
                amount: amount * 100, // Stripe expects amount in paise/cents
                bookingId
            });

            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                },
            });

            if (result.error) {
                setError(result.error.message);
                setProcessing(false);
            } else {
                if (result.paymentIntent.status === 'succeeded') {
                    // Update booking status in MySQL
                    await axios.post(`${API_BASE_URL}/api/bookings/pay`, {
                        bookingId,
                        paymentIntentId: result.paymentIntent.id,
                        paymentStatus: 'Paid',
                        paymentMethod: 'Credit Card'
                    });
                    onSuccess();
                }
            }
        } catch (err) {
            setError('Payment failed. Please try again.');
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="card" style={{ marginTop: '2rem', padding: '2rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '1rem' }}>CARD DETAILS</label>
                <div style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'white'
                }}>
                    <CardElement options={{
                        style: {
                            base: {
                                fontSize: '16px',
                                color: '#424770',
                                '::placeholder': { color: '#aab7c4' },
                            },
                        },
                    }} />
                </div>
            </div>
            {error && <div style={{ color: '#DC2626', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>}
            <button
                type="submit"
                disabled={!stripe || processing}
                className="btn-primary"
                style={{ width: '100%', padding: '1rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
            >
                {processing ? <Loader2 className="animate-spin" /> : <>PAY ₹{amount.toLocaleString()} <ChevronRight size={18} /></>}
            </button>
        </form>
    );
};

const Payment = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const { bookingResult, selectedBus, selectedSeats } = useBooking();
    const [method, setMethod] = useState('card');
    const [status, setStatus] = useState('ideal'); // ideal, processing, success

    if (!bookingResult) {
        return <div style={{ padding: '5rem', textAlign: 'center' }}><h2>Session Expired</h2><button onClick={() => navigate('/')} className="btn-primary">Go Home</button></div>;
    }

    const totalAmount = bookingResult.totalAmount || 0;

    return (
        <div style={{ padding: '4rem 0', backgroundColor: '#F8FAFC', minHeight: '90vh' }}>
            <div className="container" style={{ maxWidth: '900px', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                <div>
                    <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Lock size={24} color="var(--primary)" /> Secure Payment
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <PaymentOption
                            active={method === 'card'}
                            onClick={() => setMethod('card')}
                            icon={<CreditCard size={20} />}
                            title="Credit / Debit Card"
                            subtitle="Powered by Stripe"
                        />
                        <PaymentOption
                            active={method === 'upi'}
                            onClick={() => setMethod('upi')}
                            icon={<Smartphone size={20} />}
                            title="UPI / Google Pay"
                            subtitle="Pay via any UPI app"
                        />
                    </div>

                    <AnimatePresence mode='wait'>
                        {method === 'card' && (
                            <Elements stripe={stripePromise}>
                                <CheckoutForm
                                    amount={totalAmount}
                                    bookingId={bookingId}
                                    onSuccess={() => {
                                        setStatus('success');
                                        setTimeout(() => navigate(`/ticket/${bookingId}`), 3000);
                                    }}
                                />
                            </Elements>
                        )}

                        {method === 'upi' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="card"
                                style={{ marginTop: '2rem', textAlign: 'center', padding: '3rem' }}
                            >
                                <h4 style={{ marginBottom: '1rem' }}>Scan QR Code</h4>
                                <div style={{ width: '200px', height: '200px', margin: '0 auto 1.5rem', backgroundColor: '#F1F5F9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)' }}>
                                    <Smartphone size={100} color="#CBD5E1" />
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Open any UPI app to scan and pay</p>
                                <button onClick={() => {
                                    setStatus('success');
                                    setTimeout(() => navigate(`/ticket/${bookingId}`), 3000);
                                }} className="btn-primary" style={{ width: '100%' }}>I HAVE PAID ₹{totalAmount.toLocaleString()}</button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <aside>
                    <div className="card" style={{ padding: '2rem', border: '1px solid var(--primary)', position: 'sticky', top: '100px' }}>
                        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>Order Summary</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Bus Operator</span>
                            <span style={{ fontWeight: '600' }}>{selectedBus?.name || 'SmartBus Express'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Seats ({selectedSeats.length})</span>
                            <span style={{ fontWeight: '600' }}>{selectedSeats.join(', ')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '2px solid var(--border)' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: '800' }}>Total Amount</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary)' }}>₹{totalAmount.toLocaleString()}</span>
                        </div>
                        <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            <ShieldCheck size={16} /> 100% SECURE TRANSACTIONS
                        </div>
                    </div>
                </aside>
            </div>

            <AnimatePresence>
                {status === 'success' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(255,255,255,0.95)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', damping: 10 }}
                        >
                            <CheckCircle2 size={100} color="var(--accent)" />
                        </motion.div>
                        <h1 style={{ marginTop: '2rem', color: 'var(--secondary)' }}>Successfully Paid!</h1>
                        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Your ticket is being generated...</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const PaymentOption = ({ active, onClick, icon, title, subtitle }) => (
    <div
        onClick={onClick}
        style={{
            padding: '1.25rem',
            borderRadius: '12px',
            border: active ? '2px solid var(--primary)' : '1px solid var(--border)',
            backgroundColor: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: active ? '0 10px 15px -3px rgba(216, 78, 85, 0.1)' : 'none'
        }}
    >
        <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            backgroundColor: active ? 'rgba(216, 78, 85, 0.1)' : '#F1F5F9',
            color: active ? 'var(--primary)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {icon}
        </div>
        <div style={{ flex: 1 }}>
            <h4 style={{ fontWeight: '700', color: active ? 'var(--secondary)' : 'inherit' }}>{title}</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{subtitle}</p>
        </div>
        <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: active ? '6px solid var(--primary)' : '2px solid var(--border)', transition: 'all 0.2s' }}></div>
    </div>
);

export default Payment;
