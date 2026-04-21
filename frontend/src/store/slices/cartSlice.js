import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import cartApi from "../../api/cartApi";
import { getApiErrorMessage } from "../../api/apiClient";
import { logout } from "./authSlice";

const emptyCart = {
  id: null,
  items: [],
  total_items: 0,
  subtotal: "0.00",
  updated_at: null,
};

const initialState = {
  cart: emptyCart,
  loading: false,
  updating: false,
  error: "",
};

export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartApi.getCart();
      return response.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const addItemToCart = createAsyncThunk(
  "cart/addItemToCart",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await cartApi.addToCart(payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const updateCartItemQuantity = createAsyncThunk(
  "cart/updateCartItemQuantity",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await cartApi.updateCart(payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const removeCartItem = createAsyncThunk(
  "cart/removeCartItem",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await cartApi.removeFromCart(productId);
      return response.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    clearCartState(state) {
      state.cart = emptyCart;
      state.error = "";
      state.loading = false;
      state.updating = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unable to load cart.";
      })
      .addCase(addItemToCart.pending, (state) => {
        state.updating = true;
        state.error = "";
      })
      .addCase(addItemToCart.fulfilled, (state, action) => {
        state.updating = false;
        state.cart = action.payload;
      })
      .addCase(addItemToCart.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload || "Unable to add item to cart.";
      })
      .addCase(updateCartItemQuantity.pending, (state) => {
        state.updating = true;
      })
      .addCase(updateCartItemQuantity.fulfilled, (state, action) => {
        state.updating = false;
        state.cart = action.payload;
      })
      .addCase(updateCartItemQuantity.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload || "Unable to update cart item.";
      })
      .addCase(removeCartItem.pending, (state) => {
        state.updating = true;
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.updating = false;
        state.cart = action.payload;
      })
      .addCase(removeCartItem.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload || "Unable to remove cart item.";
      })
      .addCase(logout, () => initialState);
  },
});

export const { clearCartState } = cartSlice.actions;
export default cartSlice.reducer;
