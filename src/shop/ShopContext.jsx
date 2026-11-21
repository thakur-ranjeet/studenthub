import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { shopApi } from '../api/index.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../components/Toast.jsx';

const ShopContext = createContext(null);
const EMPTY = { wishlist: [], cart: [], enrolled: [] };

// Holds which courses the signed-in user has wishlisted / put in the cart, so every page can show the right buttons.
export function ShopProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const [state, setState] = useState(EMPTY);
  const username = user?.username;

  useEffect(() => {
    let alive = true;
    if (!username) {
      setState(EMPTY);
      return undefined;
    }
    shopApi.state().then(
      (s) => alive && setState(s),
      () => { /* the shop service may be down: keep the buttons working but empty */ },
    );
    return () => { alive = false; };
  }, [username]);

  // every mutation returns the new { wishlist, cart }
  const run = useCallback(async (call, okMessage) => {
    try {
      setState(await call());
      if (okMessage) toast.success(okMessage);
    } catch (e) {
      toast.error(e.message);
    }
  }, [toast]);

  const value = useMemo(() => {
    const wishlist = new Set(state.wishlist);
    const cart = new Set(state.cart);
    const enrolled = new Set(state.enrolled || []);
    return {
      wishlist,
      cart,
      enrolled,
      refresh: () => shopApi.state().then(setState, () => {}),
      wishlistKey: state.wishlist.join(','),
      cartKey: state.cart.join(','),
      enrolledKey: (state.enrolled || []).join(','),
      toggleWishlist: (cid) => (wishlist.has(cid)
        ? run(() => shopApi.removeWishlist(cid), 'Removed from wishlist')
        : run(() => shopApi.addWishlist(cid), 'Added to wishlist')),
      removeFromWishlist: (cid) => run(() => shopApi.removeWishlist(cid), 'Removed from wishlist'),
      addToCart: (cid) => run(() => shopApi.addCart(cid), 'Added to cart'),
      removeFromCart: (cid) => run(() => shopApi.removeCart(cid), 'Removed from cart'),
      moveToCart: (cid) => run(() => shopApi.moveToCart(cid), 'Moved to cart'),
      clearCart: () => run(() => shopApi.clearCart(), 'Cart cleared'),
    };
  }, [state, run]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export const useShop = () => useContext(ShopContext);
