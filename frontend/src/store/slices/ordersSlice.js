import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import ordersApi from "../../api/ordersApi";
import { getApiErrorMessage } from "../../api/apiClient";
import { logout } from "./authSlice";

const initialState = {
  list: [],
  selectedOrder: null,
  paymentSession: null,
  loading: false,
  detailLoading: false,
  checkoutLoading: false,
  paymentSessionLoading: false,
  paymentConfirmLoading: false,
  error: "",
  paymentError: "",
};

function upsertOrder(list, order) {
  if (!order) {
    return list;
  }

  const existingIndex = list.findIndex((entry) => entry.id === order.id);
  if (existingIndex === -1) {
    return [order, ...list];
  }

  const next = [...list];
  next[existingIndex] = { ...next[existingIndex], ...order };
  return next;
}

export const fetchOrders = createAsyncThunk(
  "orders/fetchOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await ordersApi.getOrders();
      return response.data.results || [];
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  "orders/fetchOrderById",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await ordersApi.getOrderById(orderId);
      return response.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const checkoutOrder = createAsyncThunk(
  "orders/checkoutOrder",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await ordersApi.checkout(payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const createPaymentSession = createAsyncThunk(
  "orders/createPaymentSession",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await ordersApi.createPaymentSession(payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const confirmPaymentSession = createAsyncThunk(
  "orders/confirmPaymentSession",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await ordersApi.confirmPaymentSession(payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    clearPaymentSession(state) {
      state.paymentSession = null;
      state.paymentError = "";
      state.paymentSessionLoading = false;
      state.paymentConfirmLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unable to load orders.";
      })
      .addCase(fetchOrderById.pending, (state) => {
        state.detailLoading = true;
        state.error = "";
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedOrder = action.payload;
        state.list = upsertOrder(state.list, action.payload);
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload || "Unable to load order details.";
      })
      .addCase(checkoutOrder.pending, (state) => {
        state.checkoutLoading = true;
        state.error = "";
      })
      .addCase(checkoutOrder.fulfilled, (state, action) => {
        state.checkoutLoading = false;
        state.paymentSession = null;
        state.selectedOrder = action.payload;
        state.list = upsertOrder(state.list, action.payload);
      })
      .addCase(checkoutOrder.rejected, (state, action) => {
        state.checkoutLoading = false;
        state.error = action.payload || "Unable to place order.";
      })
      .addCase(createPaymentSession.pending, (state) => {
        state.paymentSessionLoading = true;
        state.paymentError = "";
      })
      .addCase(createPaymentSession.fulfilled, (state, action) => {
        state.paymentSessionLoading = false;
        state.paymentSession = action.payload;
      })
      .addCase(createPaymentSession.rejected, (state, action) => {
        state.paymentSessionLoading = false;
        state.paymentError = action.payload || "Unable to start payment.";
      })
      .addCase(confirmPaymentSession.pending, (state) => {
        state.paymentConfirmLoading = true;
        state.paymentError = "";
      })
      .addCase(confirmPaymentSession.fulfilled, (state, action) => {
        state.paymentConfirmLoading = false;
        state.paymentSession = { ...(state.paymentSession || {}), ...action.payload };
        if (action.payload.order) {
          state.selectedOrder = action.payload.order;
          state.list = upsertOrder(state.list, action.payload.order);
        }
      })
      .addCase(confirmPaymentSession.rejected, (state, action) => {
        state.paymentConfirmLoading = false;
        state.paymentError = action.payload || "Unable to confirm payment.";
      })
      .addCase(logout, () => initialState);
  },
});

export const { clearPaymentSession } = ordersSlice.actions;
export default ordersSlice.reducer;
