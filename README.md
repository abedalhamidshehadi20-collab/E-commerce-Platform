# A-SH

A production-style full-stack e-commerce platform built with:

- React + Vite
- React Router
- Axios
- Redux Toolkit
- Django
- Django REST Framework
- JWT authentication
- Supabase PostgreSQL
- Django Admin

The frontend talks only to the Django REST API. Admin operations are handled through Django Admin.

## Project Structure

```text
.
|-- backend/
|   |-- ecommerce/
|   |-- apps/
|   |   |-- users/
|   |   |-- products/
|   |   |-- cart/
|   |   |-- orders/
|   |   `-- contact/
|   `-- requirements.txt
|-- frontend/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- hooks/
|   |   |-- layouts/
|   |   |-- pages/
|   |   `-- store/
|-- database/
|   `-- supabase_schema.sql
`-- docs/
    |-- api-routes.md
    `-- example-requests.md
```

## Features

### Customer Features

- Browse products and categories
- Search, filter, sort, and paginate products
- View product images, stock status, and pricing
- Add, update, and remove cart items
- Checkout with saved or new addresses
- Track orders and view order details
- Manage profile and saved addresses
- Send contact messages

### Admin Features

- Manage users through Django Admin
- Manage categories, products, and product images
- Manage contact messages
- Manage orders and order items
- Upload category and product images

## Backend Setup

### 1. Create and activate a virtual environment

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install backend dependencies

```bash
pip install -r backend/requirements.txt
```

### 3. Configure environment variables

Copy `backend/.env.example` values into your environment or your preferred secrets manager.

Important variables:

- `SECRET_KEY`
- `DEBUG`
- `ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`
- `DATABASE_URL`

Example Supabase connection string:

```env
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

### 4. Run migrations and create an admin user

```bash
python backend/manage.py migrate
python backend/manage.py createsuperuser
```

### 5. Start the API

```bash
python backend/manage.py runserver
```

The backend will be available at `http://127.0.0.1:8000/`.

## Frontend Setup

### 1. Install frontend dependencies

```bash
cd frontend
npm install
```

### 2. Configure frontend environment

Create a `.env` file in `frontend/`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

### 3. Start the frontend

```bash
npm run dev
```

The storefront will be available at `http://127.0.0.1:5173/`.

## Supabase Database

Application SQL schema is included in:

- [database/supabase_schema.sql](database/supabase_schema.sql)

This schema contains:

- application tables
- foreign keys
- constraints
- search indexes
- single-active-cart enforcement
- non-negative stock enforcement
- permanent order pricing storage

For Django-managed environments, keep using Django migrations for framework tables such as auth permissions, admin, sessions, and JWT blacklist tables.

## API Overview

Full route documentation:

- [docs/api-routes.md](docs/api-routes.md)
- [docs/example-requests.md](docs/example-requests.md)

Core endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/categories`
- `GET /api/cart`
- `POST /api/cart/add`
- `PATCH /api/cart/update`
- `DELETE /api/cart/remove`
- `POST /api/orders/checkout`
- `GET /api/orders`
- `GET /api/orders/:id`
- `GET /api/profile`
- `PUT /api/profile`
- `GET /api/addresses`
- `POST /api/addresses`
- `POST /api/contact`

## Verified

The project was sanity-checked locally with:

- `python -m compileall backend`
- `python backend/manage.py makemigrations users products cart orders contact`
- `python backend/manage.py migrate`
- `python backend/manage.py check`
- `npm run build`

## Notes

- Product and category image uploads are supported via Django Admin.
- Cart operations and checkout require authentication.
- Checkout is transactional and decrements stock safely.
- Order totals and item prices are stored permanently at purchase time.
- Stock is protected by both application logic and database constraints.
