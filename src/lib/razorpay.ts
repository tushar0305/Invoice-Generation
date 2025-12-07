import Razorpay from 'razorpay';

// Server-side SDK uses secret key
export const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

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
