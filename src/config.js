// Fill these in after deploying backend/Code.gs as a Web App
export const API_URL = 'https://script.google.com/macros/s/AKfycbyb87P2Nu-Gy7rHSHMNAv0fcl5MWK7loyTVzey2dxfhX27_VsLoIKOggxoB7vy1bBy4/exec';
export const API_TOKEN = '8f74d84eee724355aff2a807ff23be22'; // must match TOKEN in Script Properties

export const HOSPITAL = {
  name: 'Lifeline Hospital',
  tagline: 'Hospital & Critical Care Unit',
  emergencyNumber: '+911234567890', // change to your real number
  ambulanceNumber: '102',
  razorpayKeyId: 'rzp_test_XXXXXXXXXXXX', // public key id only; secret stays in Apps Script
};

// Logo banner (2576 x 1298)
export const BANNER = require('../assets/banner.jpg');
export const BANNER_RATIO = 2576 / 1298;
