import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import wishlistApi from "../../api/wishlistApi";
import { getApiErrorMessage } from "../../api/apiClient";
import { logout } from "./authSlice";

const createEmptyWishlist = () => ({
  id: null,
  items: [],
  total_items: 0,
  created_at: null,
});

const createInitialState = () => ({
  wishlist: createEmptyWishlist(),
  loading: false,
  loaded: false,
  updating: false,
  clearing: false,
  error: "",
  message: "",
  pendingProductIds: {},
  optimisticState: {},
});

const initialState = createInitialState();

function clearPendingProduct(state, productId) {
  delete state.pendingProductIds[productId];
  delete state.optimisticState[productId];
}

function syncUpdatingState(state) {
  state.updating = state.clearing || Object.keys(state.pendingProductIds).length > 0;
}

export const fetchWishlist = createAsyncThunk(
  "wishlist/fetchWishlist",
  async (_, { rejectWithValue }) => {
    try {
      const response = await wishlistApi.getWishlist();
      return response.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const addProductToWishlist = createAsyncThunk(
  "wishlist/addProductToWishlist",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await wishlistApi.addToWishlist({ product_id: productId });
      return response.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const removeProductFromWishlist = createAsyncThunk(
  "wishlist/removeProductFromWishlist",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await wishlistApi.removeFromWishlist(productId);
      return response.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const clearWishlist = createAsyncThunk(
  "wishlist/clearWishlist",
  async (_, { rejectWithValue }) => {
    try {
      const response = await wishlistApi.clearWishlist();
      return response.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    clearWishlistState() {
      return createInitialState();
    },
    clearWishlistMessage(state) {
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.wishlist = action.payload;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.error = action.payload || "Unable to load wishlist.";
      })
      .addCase(addProductToWishlist.pending, (state, action) => {
        const productId = Number(action.meta.arg);
        state.error = "";
        state.message = "";
        state.pendingProductIds[productId] = true;
        // Keep the heart state and counter responsive while the request is in flight.
        state.optimisticState[productId] = true;
        syncUpdatingState(state);
      })
      .addCase(addProductToWishlist.fulfilled, (state, action) => {
        const productId = Number(action.meta.arg);
        clearPendingProduct(state, productId);
        state.loaded = true;
        state.wishlist = action.payload.wishlist;
        state.message = action.payload.message || "Product added to wishlist.";
        syncUpdatingState(state);
      })
      .addCase(addProductToWishlist.rejected, (state, action) => {
        const productId = Number(action.meta.arg);
        clearPendingProduct(state, productId);
        state.error = action.payload || "Unable to add product to wishlist.";
        syncUpdatingState(state);
      })
      .addCase(removeProductFromWishlist.pending, (state, action) => {
        const productId = Number(action.meta.arg);
        state.error = "";
        state.message = "";
        state.pendingProductIds[productId] = true;
        state.optimisticState[productId] = false;
        syncUpdatingState(state);
      })
      .addCase(removeProductFromWishlist.fulfilled, (state, action) => {
        const productId = Number(action.meta.arg);
        clearPendingProduct(state, productId);
        state.loaded = true;
        state.wishlist = action.payload.wishlist;
        state.message = action.payload.message || "Product removed from wishlist.";
        syncUpdatingState(state);
      })
      .addCase(removeProductFromWishlist.rejected, (state, action) => {
        const productId = Number(action.meta.arg);
        clearPendingProduct(state, productId);
        state.error = action.payload || "Unable to remove product from wishlist.";
        syncUpdatingState(state);
      })
      .addCase(clearWishlist.pending, (state) => {
        state.error = "";
        state.message = "";
        state.clearing = true;
        syncUpdatingState(state);
      })
      .addCase(clearWishlist.fulfilled, (state, action) => {
        state.clearing = false;
        state.loaded = true;
        state.wishlist = action.payload.wishlist;
        state.message = action.payload.message || "Wishlist cleared.";
        syncUpdatingState(state);
      })
      .addCase(clearWishlist.rejected, (state, action) => {
        state.clearing = false;
        state.error = action.payload || "Unable to clear wishlist.";
        syncUpdatingState(state);
      })
      .addCase(logout, () => createInitialState());
  },
});

export const { clearWishlistState, clearWishlistMessage } = wishlistSlice.actions;

export const selectIsProductInWishlist = (state, productId) => {
  const normalizedId = Number(productId);
  const { wishlist, optimisticState, clearing } = state.wishlist;

  if (clearing) {
    return false;
  }

  if (Object.prototype.hasOwnProperty.call(optimisticState, normalizedId)) {
    return optimisticState[normalizedId];
  }

  return wishlist.items.some((item) => item.product.id === normalizedId);
};

export const selectIsWishlistProductPending = (state, productId) =>
  Boolean(state.wishlist.pendingProductIds[Number(productId)]) || state.wishlist.clearing;

export const selectWishlistCount = (state) => {
  const { wishlist, optimisticState, clearing } = state.wishlist;

  if (clearing) {
    return 0;
  }

  const existingProductIds = new Set(wishlist.items.map((item) => item.product.id));
  let count = wishlist.items.length;

  Object.entries(optimisticState).forEach(([productId, nextValue]) => {
    const normalizedId = Number(productId);

    if (nextValue && !existingProductIds.has(normalizedId)) {
      count += 1;
    }

    if (!nextValue && existingProductIds.has(normalizedId)) {
      count -= 1;
    }
  });

  return Math.max(count, 0);
};

export const selectVisibleWishlistItems = (state) => {
  if (state.wishlist.clearing) {
    return [];
  }

  return state.wishlist.wishlist.items.filter(
    (item) => state.wishlist.optimisticState[item.product.id] !== false
  );
};

export default wishlistSlice.reducer;
