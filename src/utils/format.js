const whole = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const withPaise = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ₹4,999 for whole rupees, ₹7,999.50 when there are paise
export const inr = (amount) => {
  const n = Number(amount) || 0;
  return Number.isInteger(n) ? whole.format(n) : withPaise.format(n);
};

// A course can be bought only when the admin has set a price above zero.
export const isForSale = (course) => course?.price != null && Number(course.price) > 0;
