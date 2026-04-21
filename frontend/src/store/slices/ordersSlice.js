import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import ordersApi from "../../api/ordersApi";
import { getApiErrorMessage } from "../../api/apiClient";
import { logout } from "./authSlice";

const initialState = {
  list: [],
  selectedOrder: null,
  loading: false,
  detailLoading: false,
  checkoutLoading: false,
  error: "",
};

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

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {},
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
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedOrder = action.payload;
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
        state.selectedOrder = action.payload;
        state.list = [action.payload, ...state.list];
      })
      .addCase(checkoutOrder.rejected, (state, action) => {
        state.checkoutLoading = false;
        state.error = action.payload || "Unable to place order.";
      })
      .addCase(logout, () => initialState);
  },
});

export default ordersSlice.reducer;
