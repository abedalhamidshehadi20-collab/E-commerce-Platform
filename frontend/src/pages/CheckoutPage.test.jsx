import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import authReducer from "../store/slices/authSlice";
import cartReducer from "../store/slices/cartSlice";
import ordersReducer from "../store/slices/ordersSlice";
import CheckoutPage from "./CheckoutPage";

const mockAuthApi = vi.hoisted(() => ({
  getAddresses: vi.fn(),
}));

const mockOrdersApi = vi.hoisted(() => ({
  checkout: vi.fn(),
  createPaymentSession: vi.fn(),
  confirmPaymentSession: vi.fn(),
  getOrders: vi.fn(),
  getOrderById: vi.fn(),
}));

vi.mock("../api/authApi", () => ({
  default: mockAuthApi,
}));

vi.mock("../api/ordersApi", () => ({
  default: mockOrdersApi,
}));

const savedAddresses = [
  {
    id: 1,
    label: "Home",
    full_name: "Jordan Lee",
    phone_number: "+1 555 123 4567",
    line1: "123 Market Street",
    line2: "",
    city: "Boston",
    state: "MA",
    postal_code: "02118",
    country: "United States",
    is_default: true,
  },
];

const baseOrder = {
  id: 10,
  order_number: "ORD-20260426-ABC123",
  status: "pending",
  payment_method: "cod",
  payment_status: "unpaid",
  total_price: "120.00",
  shipping_full_name: "Jordan Lee",
  shipping_phone_number: "+1 555 123 4567",
  shipping_line1: "123 Market Street",
  shipping_line2: "",
  shipping_city: "Boston",
  shipping_state: "MA",
  shipping_postal_code: "02118",
  shipping_country: "United States",
  notes: "",
  subtotal: "120.00",
  shipping_cost: "0.00",
  items: [],
};

function renderCheckoutPage({
  authState = {},
  cartState = {},
  ordersState = {},
} = {}) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      cart: cartReducer,
      orders: ordersReducer,
    },
    preloadedState: {
      auth: {
        user: {
          id: 1,
          email: "shopper@example.com",
          full_name: "Jordan Lee",
          phone_number: "+1 555 123 4567",
        },
        addresses: savedAddresses,
        isAuthenticated: true,
        initialized: true,
        loading: false,
        error: "",
        addressesLoading: false,
        addressesError: "",
        profileSaving: false,
        ...authState,
      },
      cart: {
        cart: {
          id: 1,
          items: [
            {
              id: 1,
              quantity: 2,
              line_total: "120.00",
              product: {
                id: 5,
                name: "Noise Cancelling Headphones",
                price: "60.00",
                stock: 10,
                primary_image: "",
              },
            },
          ],
          total_items: 2,
          subtotal: "120.00",
          updated_at: "2026-04-26T10:00:00Z",
        },
        loading: false,
        updating: false,
        error: "",
        ...cartState,
      },
      orders: {
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
        ...ordersState,
      },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/checkout"]}>
        <CheckoutPage />
      </MemoryRouter>
    </Provider>
  );
}

beforeEach(() => {
  mockAuthApi.getAddresses.mockResolvedValue({ data: savedAddresses });
  mockOrdersApi.getOrders.mockResolvedValue({ data: { results: [] } });
  mockOrdersApi.getOrderById.mockResolvedValue({ data: baseOrder });
  mockOrdersApi.checkout.mockReset();
  mockOrdersApi.createPaymentSession.mockReset();
  mockOrdersApi.confirmPaymentSession.mockReset();
});

it("shows required field validation for COD with a new address", async () => {
  const user = userEvent.setup();
  renderCheckoutPage({
    authState: { addresses: [] },
  });

  await user.click(screen.getByRole("button", { name: /new address/i }));
  await user.click(screen.getByRole("button", { name: /^place order$/i }));

  expect(await screen.findAllByText("This field is required.")).toHaveLength(6);
  expect(mockOrdersApi.checkout).not.toHaveBeenCalled();
});

it("places a COD order successfully", async () => {
  const user = userEvent.setup();
  mockOrdersApi.checkout.mockResolvedValue({
    data: {
      ...baseOrder,
      payment_method: "cod",
      payment_status: "unpaid",
    },
  });

  renderCheckoutPage();

  await waitFor(() => {
    expect(screen.getByRole("button", { name: /^place order$/i })).toBeEnabled();
  });
  await user.click(screen.getByRole("button", { name: /^place order$/i }));

  expect(await screen.findByText(/order placed successfully/i)).toBeInTheDocument();
  expect(mockOrdersApi.checkout).toHaveBeenCalledWith({
    payment_method: "cod",
    address_id: 1,
    notes: "",
  });
});

it("shows a declined mock card payment without creating an order", async () => {
  const user = userEvent.setup();
  mockOrdersApi.createPaymentSession.mockResolvedValue({
    data: {
      checkout_session_id: "1c5924f4-4fb5-427b-b7c8-5571fd01ec64",
      provider: "mock",
      status: "requires_payment_method",
      amount: "120.00",
      currency: "usd",
      client_secret: "mock_secret",
      publishable_key: "",
      mock_mode: true,
      message: "Secure card payment is ready.",
    },
  });
  mockOrdersApi.confirmPaymentSession.mockResolvedValue({
    data: {
      checkout_session_id: "1c5924f4-4fb5-427b-b7c8-5571fd01ec64",
      provider: "mock",
      status: "requires_payment_method",
      message: "The test card was declined. Please try another card.",
      order: null,
    },
  });

  renderCheckoutPage();

  await user.click(screen.getByLabelText(/card payment/i));
  await user.click(screen.getByRole("button", { name: /continue to secure card payment/i }));
  await screen.findByText(/mock card payment/i);
  await user.selectOptions(screen.getByLabelText(/test outcome/i), "failed");
  await user.click(screen.getByRole("button", { name: /pay now/i }));

  expect(
    await screen.findByText(/the test card was declined\. please try another card\./i)
  ).toBeInTheDocument();
  expect(screen.queryByText(/order placed successfully/i)).not.toBeInTheDocument();
});

it("completes a mock card payment and finalizes the order", async () => {
  const user = userEvent.setup();
  mockOrdersApi.createPaymentSession.mockResolvedValue({
    data: {
      checkout_session_id: "7c7ac6dc-659f-4e52-8d4e-741bad0ef5d2",
      provider: "mock",
      status: "requires_payment_method",
      amount: "120.00",
      currency: "usd",
      client_secret: "mock_secret",
      publishable_key: "",
      mock_mode: true,
      message: "Secure card payment is ready.",
    },
  });
  mockOrdersApi.confirmPaymentSession.mockResolvedValue({
    data: {
      checkout_session_id: "7c7ac6dc-659f-4e52-8d4e-741bad0ef5d2",
      provider: "mock",
      status: "completed",
      message: "Payment received and your order has been placed.",
      order: {
        ...baseOrder,
        payment_method: "card",
        payment_status: "paid",
      },
    },
  });

  renderCheckoutPage();

  await user.click(screen.getByLabelText(/card payment/i));
  await user.click(screen.getByRole("button", { name: /continue to secure card payment/i }));
  await screen.findByText(/mock card payment/i);
  await user.click(screen.getByRole("button", { name: /pay now/i }));

  expect(await screen.findByText(/order placed successfully/i)).toBeInTheDocument();
  await waitFor(() => {
    expect(mockOrdersApi.confirmPaymentSession).toHaveBeenCalledWith({
      checkout_session_id: "7c7ac6dc-659f-4e52-8d4e-741bad0ef5d2",
      simulate_result: "succeeded",
    });
  });
});
