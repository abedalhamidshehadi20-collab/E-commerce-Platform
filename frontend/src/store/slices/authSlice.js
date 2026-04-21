import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import authApi from "../../api/authApi";
import { getApiErrorMessage } from "../../api/apiClient";
import {
  clearStoredTokens,
  hasStoredTokens,
  setStoredTokens,
} from "../../utils/storage";

const initialState = {
  user: null,
  addresses: [],
  isAuthenticated: hasStoredTokens(),
  initialized: false,
  loading: false,
  error: "",
  addressesLoading: false,
  addressesError: "",
  profileSaving: false,
};

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await authApi.register(payload);
      const { access, refresh, user } = response.data;
      setStoredTokens({ access, refresh });
      return user;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await authApi.login(payload);
      const { access, refresh, user } = response.data;
      setStoredTokens({ access, refresh });
      return user;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.me();
      return response.data;
    } catch (error) {
      clearStoredTokens();
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await authApi.updateProfile(payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const fetchAddresses = createAsyncThunk(
  "auth/fetchAddresses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.getAddresses();
      return response.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const createAddress = createAsyncThunk(
  "auth/createAddress",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await authApi.createAddress(payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      clearStoredTokens();
      state.user = null;
      state.addresses = [];
      state.isAuthenticated = false;
      state.error = "";
      state.initialized = true;
    },
    markAuthReady(state) {
      state.initialized = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.initialized = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unable to register.";
        state.initialized = true;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.initialized = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unable to log in.";
        state.initialized = true;
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.initialized = true;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "";
        state.user = null;
        state.isAuthenticated = false;
        state.initialized = true;
      })
      .addCase(updateProfile.pending, (state) => {
        state.profileSaving = true;
        state.error = "";
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.profileSaving = false;
        state.user = { ...state.user, ...action.payload };
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.profileSaving = false;
        state.error = action.payload || "Unable to update profile.";
      })
      .addCase(fetchAddresses.pending, (state) => {
        state.addressesLoading = true;
        state.addressesError = "";
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.addressesLoading = false;
        state.addresses = action.payload;
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.addressesLoading = false;
        state.addressesError = action.payload || "Unable to load addresses.";
      })
      .addCase(createAddress.pending, (state) => {
        state.addressesLoading = true;
        state.addressesError = "";
      })
      .addCase(createAddress.fulfilled, (state, action) => {
        state.addressesLoading = false;
        if (action.payload.is_default) {
          state.addresses = state.addresses.map((address) => ({
            ...address,
            is_default: false,
          }));
        }
        state.addresses = [action.payload, ...state.addresses];
      })
      .addCase(createAddress.rejected, (state, action) => {
        state.addressesLoading = false;
        state.addressesError = action.payload || "Unable to save address.";
      });
  },
});

export const { logout, markAuthReady } = authSlice.actions;
export default authSlice.reducer;
