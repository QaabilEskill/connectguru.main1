export const PSYCHOMETRIC_PRICE = 499;
export const PSYCHOMETRIC_ORIGINAL_PRICE = 999;
export const PSYCHOMETRIC_PRICE_IN_PAISE = PSYCHOMETRIC_PRICE * 100;
export const PSYCHOMETRIC_CURRENCY = 'INR';
export const PSYCHOMETRIC_FLOW_TYPE = 'psychometric';

export const formatRupees = (amount: number) => `₹${amount}`;
export const paiseToRupees = (amountInPaise: number) => amountInPaise / 100;