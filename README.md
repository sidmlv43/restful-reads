# Bookstore API

RESTful Bookstore API using Node.js, Express, MongoDB, Mongoose, and JWT authentication.

## Setup

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Seed the database:

```bash
npm run seed
```

4. Start the server:

```bash
npm run dev
```

The app will run on `http://localhost:5000` by default.

## Authentication

### Register

`POST /api/auth/register`

Body:
```json
{
  "name": "Customer User",
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "token": "<jwt-token>"
}
```

### Login

`POST /api/auth/login`

Body:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "token": "<jwt-token>"
}
```

## User Endpoints

### Get profile

`GET /api/users/profile`

Headers:
```http
Authorization: Bearer <token>
```

Response:
```json
{
  "id": "...",
  "name": "...",
  "email": "...",
  "role": "Customer",
  "addresses": [ ... ]
}
```

### List addresses

`GET /api/users/addresses`

### Add address

`POST /api/users/addresses`

Body:
```json
{
  "label": "Home",
  "line1": "123 Main St",
  "line2": "Apt 4",
  "city": "Metropolis",
  "state": "State",
  "postalCode": "12345",
  "country": "Country",
  "isDefault": true
}
```

### Update address

`PUT /api/users/addresses/:id`

Body can include any of the address fields, including `isDefault`.

### Delete address

`DELETE /api/users/addresses/:id`

## Book Endpoints

### List books

`GET /api/books`

Optional query parameters:
- `author`
- `minRating`

### Get book details

`GET /api/books/:id`

### Create book (Admin only)

`POST /api/books`

Body:
```json
{
  "title": "New Book",
  "author": "Author Name",
  "genre": "Fiction",
  "price": 19.99
}
```

### Delete book (Admin only)

`DELETE /api/books/:id`

## Order Endpoints

### Create order (Customer only)

`POST /api/orders`

Body:
```json
{
  "items": [
    { "bookId": "<bookId>", "quantity": 2 }
  ],
  "addressId": "<addressId>"
}
```

The order stores the selected shipping address snapshot.

### List orders

`GET /api/orders`

- Customers see only their own orders
- Admins see all orders

### Get order details

`GET /api/orders/:id`

- Customers can only fetch their own order
- Admins can fetch any order

### Update order status (Admin only)

`PUT /api/orders/:id/status`

Body:
```json
{
  "status": "Processing"
}
```

Valid statuses:
- `Pending`
- `Processing`
- `Shipped`
- `Delivered`

## Rating Endpoints

### Rate a purchased book (Customer only)

`POST /api/books/:id/rate`

Body:
```json
{
  "rating": 5,
  "reviewText": "Great book!",
  "orderId": "<deliveredOrderId>"
}
```

Rules:
- The book must belong to a delivered order for the current user.
- A user can rate the same book only once per purchase.
- The book's `averageRating` is updated automatically.

## Seed Data

The seed script creates:
- 1 Admin user: `admin@example.com` / `adminpass`
- 2 Customer users: `cust1@example.com` / `custpass`, `cust2@example.com` / `custpass`
- 10 sample books

## Environment

Create `.env` from `.env.example`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/bookstore
JWT_SECRET=change_this_secret
PORT=5000
```

## Scripts

- `npm install`
- `npm run seed`
- `npm run dev`
- `npm start`

## Notes

- All protected routes require the `Authorization` header with `Bearer <token>`.
- Customers can only access their own orders and addresses.
- Admins can manage books and update order status.
