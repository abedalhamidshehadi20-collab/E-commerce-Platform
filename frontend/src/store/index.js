import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./slices/authSlice";
import productsReducer from "./slices/productsSlice";
import cartReducer from "./slices/cartSlice";
import couponsReducer from "./slices/couponsSlice";
import ordersReducer from "./slices/ordersSlice";
import wishlistReducer from "./slices/wishlistSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    cart: cartReducer,
    coupons: couponsReducer,
    orders: ordersReducer,
    wishlist: wishlistReducer,
  },
});

export default store;
