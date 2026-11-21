import { DEMO } from '../demo/mockApi.js';
import { DemoRazorpay } from '../demo/demoRazorpay.js';

let loading = null;

// Loads Razorpay's checkout.js only when someone actually pays.
export function loadRazorpay() {
  if (DEMO) return Promise.resolve(DemoRazorpay); // simulated window, no real payment
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(window.Razorpay);
      script.onerror = () => {
        loading = null;
        reject(new Error('Could not load the Razorpay payment window. Check your internet connection and try again.'));
      };
      document.body.appendChild(script);
    });
  }
  return loading;
}
