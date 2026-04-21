import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import productsApi from "../../api/productsApi";
import { getApiErrorMessage } from "../../api/apiClient";

const initialState = {
  items: [],
  categories: [],
  pagination: {
    count: 0,
    total_pages: 0,
    current_page: 1,
    next: null,
    previous: null,
  },
  selectedProduct: null,
  loading: false,
  detailLoading: false,
  categoriesLoading: false,
  error: "",
};

export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await productsApi.getProducts(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const fetchProductDetails = createAsyncThunk(
  "products/fetchProductDetails",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await productsApi.getProductById(productId);
      return response.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const fetchCategories = createAsyncThunk(
  "products/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const response = await productsApi.getCategories();
      return response.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.results || [];
        state.pagination = {
          count: action.payload.count,
          total_pages: action.payload.total_pages,
          current_page: action.payload.current_page,
          next: action.payload.next,
          previous: action.payload.previous,
        };
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unable to load products.";
      })
      .addCase(fetchProductDetails.pending, (state) => {
        state.detailLoading = true;
        state.error = "";
      })
      .addCase(fetchProductDetails.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductDetails.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload || "Unable to load product.";
      })
      .addCase(fetchCategories.pending, (state) => {
        state.categoriesLoading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.categories = action.payload || [];
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.error = action.payload || "Unable to load categories.";
      });
  },
});

export default productsSlice.reducer;
