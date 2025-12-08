import Razorpay from 'razorpay';

// Server-side SDK uses secret key
// Create Razorpay instance only if credentials are available
const createRazorpayInstance = () => {
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!keyId || !keySecret) {
        console.warn('Razorpay credentials not configured');
        return null;
    }
    
    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
};

export const razorpay = createRazorpayInstance();

export const RAZORPAY_PLANS = {
    FREE: {
        id: 'free',
        name: 'Free Plan',
        price: 0,
        razorpayPlanId: '', // Free plans usually don't have a Razorpay ID
    },
    PRO_MONTHLY: {
        id: 'pro_monthly',
        name: 'Pro Plan (Monthly)',
        price: 499,
        razorpayPlanId: process.env.RAZORPAY_PLAN_ID_PRO_MONTHLY , // Replace with Env or Real ID
    },
    PRO_YEARLY: {
        id: 'pro_yearly',
        name: 'Pro Plan (Yearly)',
        price: 4999,
        razorpayPlanId: process.env.RAZORPAY_PLAN_ID_PRO_YEARLY || '',
    }
};
