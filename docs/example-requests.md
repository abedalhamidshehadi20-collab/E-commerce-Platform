# Example Requests

## Register

```bash
curl -X POST http://127.0.0.1:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jordan",
    "last_name": "Lee",
    "email": "jordan@example.com",
    "phone_number": "+1-555-111-2222",
    "password": "StrongPass123!",
    "confirm_password": "StrongPass123!"
  }'
```

## Login

```bash
curl -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jordan@example.com",
    "password": "StrongPass123!"
  }'
```

## Get Current User

```bash
curl http://127.0.0.1:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## List Products

```bash
curl "http://127.0.0.1:8000/api/products?search=headphones&category=2&min_price=50&max_price=300&ordering=-price&page=1"
```

## Product Detail

```bash
curl http://127.0.0.1:8000/api/products/1
```

## Get Cart

```bash
curl http://127.0.0.1:8000/api/cart \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Add To Cart

```bash
curl -X POST http://127.0.0.1:8000/api/cart/add \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "quantity": 2
  }'
```

## Update Cart Item

```bash
curl -X PATCH http://127.0.0.1:8000/api/cart/update \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "quantity": 3
  }'
```

## Remove Cart Item

```bash
curl -X DELETE http://127.0.0.1:8000/api/cart/remove \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1
  }'
```

## Checkout

Using a saved address:

```bash
curl -X POST http://127.0.0.1:8000/api/orders/checkout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "address_id": 5,
    "notes": "Leave at the front desk"
  }'
```

Using a new address:

```bash
curl -X POST http://127.0.0.1:8000/api/orders/checkout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Jordan Lee",
    "phone_number": "+1-555-111-2222",
    "line1": "123 Market Street",
    "line2": "Suite 5",
    "city": "San Francisco",
    "state": "CA",
    "postal_code": "94105",
    "country": "United States",
    "save_address": true,
    "label": "Office",
    "notes": "Ring the bell"
  }'
```

## Get Orders

```bash
curl http://127.0.0.1:8000/api/orders \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Update Profile

```bash
curl -X PUT http://127.0.0.1:8000/api/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jordan",
    "last_name": "Lee",
    "username": "jordanlee",
    "phone_number": "+1-555-111-2222",
    "avatar": "https://example.com/avatar.jpg"
  }'
```

## Add Address

```bash
curl -X POST http://127.0.0.1:8000/api/addresses \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Home",
    "full_name": "Jordan Lee",
    "phone_number": "+1-555-111-2222",
    "line1": "123 Market Street",
    "line2": "",
    "city": "San Francisco",
    "state": "CA",
    "postal_code": "94105",
    "country": "United States",
    "is_default": true
  }'
```

## Contact Message

```bash
curl -X POST http://127.0.0.1:8000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jordan Lee",
    "email": "jordan@example.com",
    "subject": "Question about shipping",
    "message": "How long does delivery usually take?"
  }'
```
