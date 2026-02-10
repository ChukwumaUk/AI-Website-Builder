import PaystackSDK from '@paystack/paystack-sdk';

export const paystack = new PaystackSDK(
  process.env.PAYSTACK_SECRET_KEY!
);
