# API Routes

All API routes are prefixed with `/api`.

## Authentication

- `POST /auth/register`
  Registers a new customer and returns JWT tokens.
- `POST /auth/login`
  Returns access and refresh tokens for an existing user.
- `POST /auth/refresh`
  Refreshes the access token.
- `GET /auth/me`
  Returns the authenticated user.

## Products

- `GET /products`
  Product catalog listing with:
  - `search`
  - `category`
  - `min_price`
  - `max_price`
  - `featured`
  - `in_stock`
  - `ordering=price|-price|-created_at`
  - `page`
  - `page_size`
- `GET /products/:id`
  Product detail.
- `GET /categories`
  Lists active categories with product counts.

## Cart

Authentication required for all cart routes.

- `GET /cart`
  Returns the current user cart.
- `POST /cart/add`
  Adds a product to the cart.
- `PATCH /cart/update`
  Updates quantity for an existing cart item.
- `DELETE /cart/remove`
  Removes a product from the cart.

## Orders

Authentication required for all order routes.

- `POST /orders/checkout`
  Validates stock, creates an order, stores order items at purchase price, decreases inventory, and clears the cart.
- `GET /orders`
  Paginated order history for the current user.
- `GET /orders/:id`
  Detailed view of a single order.

## Profile

Authentication required.

- `GET /profile`
  Returns the authenticated user profile.
- `PUT /profile`
  Updates editable profile fields.
- `GET /addresses`
  Returns saved addresses for the current user.
- `POST /addresses`
  Creates a saved address.

## Contact

- `POST /contact`
  Creates a contact message.

## Auth and Permissions Summary

- Public read access:
  - products
  - categories
  - contact
- Authenticated access:
  - cart
  - checkout
  - orders
  - profile
  - addresses
- Admin operations:
  - Django Admin at `/admin/`
