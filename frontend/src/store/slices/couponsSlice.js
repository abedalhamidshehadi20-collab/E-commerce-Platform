import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import couponsApi from "../../api/couponsApi";
import { getApiErrorMessage } from "../../api/apiClient";
import { logout } from "./authSlice";

const initialState = {
  list: [],
  loading: false,
  applyLoading: false,
  error: "",
  applyError: "",
  appliedCoupon: null,
};

export const fetchCoupons = createAsyncThunk(
  "coupons/fetchCoupons",
  async (_, { rejectWithValue }) => {
    try {
      const response = await couponsApi.getCoupons();
      return response.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const applyCoupon = createAsyncThunk(
  "coupons/applyCoupon",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await couponsApi.applyCoupon(payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

const couponsSlice = createSlice({
  name: "coupons",
  initialState,
  reducers: {
    clearAppliedCoupon(state) {
      state.appliedCoupon = null;
      state.applyError = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoupons.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unable to load coupons.";
      })
      .addCase(applyCoupon.pending, (state) => {
        state.applyLoading = true;
        state.applyError = "";
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.applyLoading = false;
        state.appliedCoupon = action.payload;
      })
      .addCase(applyCoupon.rejected, (state, action) => {
        state.applyLoading = false;
        state.applyError = action.payload || "Unable to apply coupon.";
      })
      .addCase(logout, () => initialState);
  },
});

export const { clearAppliedCoupon } = couponsSlice.actions;
export default couponsSlice.reducer;
