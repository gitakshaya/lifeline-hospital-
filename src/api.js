import { API_URL, API_TOKEN } from './config';

// Apps Script web apps accept simple POSTs; text/plain avoids CORS preflight issues.
async function call(action, payload = {}) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, token: API_TOKEN, ...payload }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Request failed');
  return json.data;
}

export const getFacilities = () => call('getFacilities');
export const getPlans = () => call('getPlans');
export const getGallery = () => call('getGallery');
export const getReviews = () => call('getReviews');
export const validateDiscount = (code, amount) => call('validateDiscount', { code, amount });
export const createOrder = (planId, code, customerId) =>
  call('createOrder', { planId, code, customerId });
export const confirmPayment = (data) => call('confirmPayment', data);
export const registerCustomer = (customer) => call('registerCustomer', { customer });
export const getIdCard = (idNumber) => call('getIdCard', { idNumber });
