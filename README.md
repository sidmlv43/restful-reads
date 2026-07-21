# Bookstore API

A RESTful bookstore backend built with Node.js, Express, MongoDB, Mongoose, JWT authentication, and file upload support.

## Overview

This API supports:

- user registration/login
- role-based access control (`Admin` and `Customer`)
- product catalog with books, descriptions, and images
- cart management
- address management
- checkout and order creation
- book rating and review workflows
- multipart file upload for book images via `multer`

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
npm start
```

The server starts on `http://localhost:5000` by default.

## Environment Variables

Required variables in `.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/bookstore
JWT_SECRET=change_this_secret
PORT=5000
```

## Seed Data

The seed script creates:

- 20 Admin users (`admin@example.com`, `admin2@example.com`, ..., `admin20@example.com`)
- 20 Customer users (`cust1@example.com`, ..., `cust20@example.com`)
- 220 seeded books with `description` and `images`

Default credentials:

- Admin: `admin@example.com` / `adminpass`
- Customer: `cust1@example.com` / `custpass`

## APIs

### Common List Query Options

All list endpoints support:

- `page` - Page number (default `1`)
- `limit` - Page size (default `10`, max `100`)
- `sort` - Sort fields (`sort=-createdAt,title`)
- `select` - Select fields (`select=title,author,price`)

Example:

```http
GET /api/books?page=2&limit=5&sort=-createdAt&select=title,author
```

### Error Format

Errors use this shape:

```json
{
  "message": "Error message",
  "details": "Optional additional details"
}
```

## Authentication

### Register

`POST /api/auth/register`

Request body:

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

Request body:

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

## Book Endpoints

### List books

`GET /api/books`

Optional filters:

- `author` - Filter by author name
- `minRating` - Filter by minimum average rating
- `page`, `limit`, `sort`, `select`

Example:

```http
GET /api/books?author=J.K. Rowling&minRating=4&page=1&limit=10
```

Response:

```json
{
  "page": 1,
  "limit": 10,
  "total": 42,
  "pages": 5,
  "results": [ ... ]
}
```

### Get single book

`GET /api/books/:id`

Response:

```json
{
  "data": {
    "_id": "...",
    "title": "...",
    "description": "...",
    "images": ["/uploads/123.jpg"],
    "author": "...",
    "genre": "...",
    "price": 199,
    "ratingsCount": 0,
    "averageRating": 0
  }
}
```

### Create book (Admin only)

`POST /api/books`

Content type: `multipart/form-data`

Fields:

- `title` (string)
- `author` (string)
- `genre` (string)
- `price` (number)
- `description` (string)
- `images` (up to 5 image files)

Example `curl`:

```bash
curl -X POST http://localhost:5000/api/books \
  -H "Authorization: Bearer <token>" \
  -F "title=New Book" \
  -F "author=Author Name" \
  -F "genre=Fiction" \
  -F "price=19.99" \
  -F "description=A short description" \
  -F "images=@./cover1.jpg" \
  -F "images=@./cover2.jpg"
```

Response:

```json
{
  "_id": "...",
  "title": "New Book",
  "description": "A short description",
  "images": [
    "/uploads/1680000000000-cover1.jpg",
    "/uploads/1680000000000-cover2.jpg"
  ],
  "author": "Author Name",
  "genre": "Fiction",
  "price": 19.99,
  "ratingsCount": 0,
  "averageRating": 0,
  "createdAt": "..."
}
```

### Update book (Admin only)

`PATCH /api/books/:id`

Content type: `multipart/form-data`

Use the same fields as create; uploaded `images` replace the `images` array when present.

Example `curl`:

```bash
curl -X PATCH http://localhost:5000/api/books/<bookId> \
  -H "Authorization: Bearer <token>" \
  -F "price=24.99" \
  -F "images=@./new-cover.jpg"
```

### Delete book (Admin only)

`DELETE /api/books/:id`

### Notes

- Images are stored to the local `uploads/` directory.
- Static files are served at `http://localhost:5000/uploads/<filename>`.
- Each book can contain a maximum of 5 images.

## User Endpoints

All user routes require `Authorization: Bearer <token>`.

### Profile

`GET /api/users/profile`

Response:

```json
{
  "id": "...",
  "name": "...",
  "email": "...",
  "role": "Customer",
  "addresses": [ ... ],
  "cart": {
    "itemCount": 0,
    "summary": {
      "subtotal": 0,
      "tax": 0,
      "total": 0,
      "taxRate": 0.08
    }
  }
}
```

### Cart

#### Get cart

`GET /api/users/cart`

#### Add item to cart

`POST /api/users/cart/items`

Body:

```json
{
  "bookId": "<bookId>",
  "quantity": 2
}
```

#### Update cart item quantity

`PUT /api/users/cart/items/:bookId`

Body:

```json
{
  "quantity": 3
}
```

#### Remove cart item

`DELETE /api/users/cart/items/:bookId`

#### Clear cart

`DELETE /api/users/cart`

#### Checkout cart

`POST /api/users/cart/checkout`

Body:

```json
{
  "addressId": "<addressId>"
}
```

Response summary:

```json
{
  "message": "Order created successfully",
  "order": { ... },
  "summary": {
    "subtotal": 39.98,
    "tax": 3.2,
    "total": 43.18,
    "taxRate": 0.08
  },
  "cart": {
    "_id": "...",
    "itemCount": 0
  }
}
```

### Addresses

#### List addresses

`GET /api/users/addresses`

#### Add address

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

#### Update address

`PUT /api/users/addresses/:id`

Body can include any address field.

#### Delete address

`DELETE /api/users/addresses/:id`

## Order Endpoints

### Create order (Customer only)

`POST /api/orders`

Use cart items by default:

```json
{
  "addressId": "<addressId>"
}
```

Or explicitly provide items:

```json
{
  "items": [{ "bookId": "<bookId>", "quantity": 2 }],
  "addressId": "<addressId>"
}
```

### List orders

`GET /api/orders`

Customers see their own orders, admins see all.

### Get order details

`GET /api/orders/:id`

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

### Rate a book (Customer only)

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

- The user must have purchased the book in an order.
- Ratings are only allowed for owned orders.
- A user can rate a book once per purchase.

## Project Structure

- `index.js` - Express app setup and static upload serving
- `config/db.js` - MongoDB connection
- `controllers/` - request handlers
- `routes/` - endpoint definitions
- `models/` - Mongoose schemas
- `middleware/` - auth and error middleware
- `utils/` - generic handlers and query utilities
- `seed.js` - seed script

## Notes

- Book images are uploaded via `multipart/form-data` and stored in `uploads/`.
- Uploaded images are served from `/uploads/<filename>`.
- The seed script regenerates users, books, and the `carts` collection.
- The `images` array in `Book` is limited to 5 entries by schema validation.

## Scripts

- `npm install` - install dependencies
- `npm run seed` - seed the database
- `npm start` - start the server with nodemon

## Notes

- All protected routes require the `Authorization` header with `Bearer <token>`.
- Customers can only access their own orders and addresses.
- Admins can manage books and update order status.
- Response keys for paginated lists use `results` instead of model names.
- Mongoose validation errors return `400 Bad Request` with field-level details.
