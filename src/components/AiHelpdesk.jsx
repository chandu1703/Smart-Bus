import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Zap, Bot, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AiHelpdesk = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Welcome to SmartBus AI Helpdesk! 🚌 How can I assist your journey today?", sender: 'bot', time: new Date() }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const getAiResponse = (query) => {
        const q = query.toLowerCase();
        if (q.includes('track') || q.includes('where')) return "You can track your bus in real-time from the 'Ticket Status' page using your Booking ID! 📍";
        if (q.includes('book') || q.includes('ticket')) return "To book a ticket, simply enter your source and destination on the home page and select your preferred bus. 🎫";
        if (q.includes('cancel')) return "Cancellations can be done via the 'Ticket Status' page. Just enter your Booking ID and click 'Cancel Ticket'. ❌";
        if (q.includes('help') || q.includes('support')) return "I'm here to help! You can ask me about tracking, bookings, cancellations, or available routes.";
        if (q.includes('admin')) return "The Admin Dashboard is for fleet operators to monitor live movement and revenue. 📊";
        if (q.includes('hello') || q.includes('hi')) return "Hello! I'm the SmartBus AI. Ready to make your travel smarter? 😊";
        return "That's a great question! For specific route availability, please use our search engine on the home page. Is there anything else I can help with?";
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { id: Date.now(), text: input, sender: 'user', time: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Simulate AI "Thinking"
        setTimeout(() => {
            const botMsg = {
                id: Date.now() + 1,
                text: getAiResponse(userMsg.text),
                sender: 'bot',
                time: new Date()
            };
            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);
        }, 1500);
    };

    return (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999 }}>
            {/* Floating Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 32px rgba(216, 78, 85, 0.4)',
                    border: 'none',
                    cursor: 'pointer'
                }}
            >
                {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
                {!isOpen && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{ position: 'absolute', top: -5, right: -5, width: '20px', height: '20px', backgroundColor: 'var(--accent)', borderRadius: '50%', border: '3px solid white' }}
                    />
                )}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9, transformOrigin: 'bottom right' }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        style={{
                            position: 'absolute',
                            bottom: '80px',
                            right: '0',
                            width: '380px',
                            height: '550px',
                            backgroundColor: 'white',
                            borderRadius: '24px',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            border: '1px solid var(--border)'
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--secondary) 0%, #0F172A 100%)', color: 'white', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ position: 'relative' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Bot size={24} />
                                </div>
                                <div style={{ position: 'absolute', bottom: -2, right: -2, width: '12px', height: '12px', backgroundColor: '#10B981', borderRadius: '50%', border: '2px solid white' }}></div>
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>SmartBus AI</h4>
                                <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.7 }}>Powered by Next-Gen Intelligence</p>
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div
                            ref={scrollRef}
                            style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#F8FAFC' }}
                        >
                            {messages.map((msg) => (
                                <div key={msg.id} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                                    <div style={{
                                        maxWidth: '80%',
                                        padding: '0.875rem 1.25rem',
                                        borderRadius: msg.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                        backgroundColor: msg.sender === 'user' ? 'var(--primary)' : 'white',
                                        color: msg.sender === 'user' ? 'white' : 'var(--secondary)',
                                        boxShadow: msg.sender === 'user' ? '0 4px 12px rgba(216,78,85,0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
                                        fontSize: '0.95rem',
                                        lineHeight: 1.5
                                    }}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem' }}>
                                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} style={{ width: '8px', height: '8px', backgroundColor: '#CBD5E1', borderRadius: '50%' }} />
                                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} style={{ width: '8px', height: '8px', backgroundColor: '#CBD5E1', borderRadius: '50%' }} />
                                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} style={{ width: '8px', height: '8px', backgroundColor: '#CBD5E1', borderRadius: '50%' }} />
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <form onSubmit={handleSend} style={{ padding: '1.25rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem' }}>
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about your trip..."
                                style={{
                                    flex: 1,
                                    border: '1px solid var(--border)',
                                    borderRadius: '12px',
                                    padding: '0.75rem 1rem',
                                    outline: 'none',
                                    fontSize: '0.9rem'
                                }}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '12px',
                                    backgroundColor: 'var(--primary)',
                                    color: 'white',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    opacity: input.trim() ? 1 : 0.5
                                }}
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AiHelpdesk;
