# Bookstore API

RESTful Bookstore API using Node.js, Express, MongoDB, Mongoose, and JWT authentication.

## Architecture

- **ApiUtils** (`utils/ApiUtils.js`): Centralized query parameter parsing for pagination, filtering, sorting, and field selection.
- **HandlerFactory** (`utils/handlerFactory.js`): Generic CRUD handlers (list, getOne, createOne, updateOne, deleteOne) with built-in pagination and filtering.
- **ApiError** (`utils/ApiError.js`): Consistent error handling with status codes and details.
- **Global Error Handler** (`middleware/errorHandler.js`): Centralized error response formatting.

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

## Query Parameters

All list endpoints support:

- **`page`** (default: `1`) - Page number for pagination
- **`limit`** (default: `10`, max: `100`) - Results per page
- **`sort`** - Sort by fields (comma-separated, prefix with `-` for descending)
  - Example: `sort=createdAt` or `sort=-createdAt,title`
- **`select`** - Select specific fields (comma-separated)
  - Example: `select=title,author,price`
- **Custom filters** - Model-specific filters (e.g., `author=Tolkien`, `minRating=4`)

### Example Requests

```
GET /api/books?page=1&limit=10&sort=-createdAt&select=title,author
GET /api/orders?page=1&limit=5&sort=-createdAt
GET /api/books?author=Tolkien&minRating=4
```

## List Response Format

All paginated list endpoints return:

```json
{
  "page": 1,
  "limit": 10,
  "total": 42,
  "pages": 5,
  "results": [...]
}
```

## Error Response Format

Errors are formatted consistently via the global error handler:

```json
{
  "message": "Error message",
  "details": "Optional additional details"
}
```

Common HTTP status codes:

- `400 Bad Request` - Invalid input or validation failure
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate or conflicting operation
- `500 Internal Server Error` - Server error

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

### Get cart

`GET /api/users/cart`

Response:

```json
{
  "cart": {
    "_id": "...",
    "user": "...",
    "items": [
      {
        "book": {
          "_id": "...",
          "title": "...",
          "price": 19.99
        },
        "quantity": 2,
        "price": 19.99
      }
    ],
    "summary": {
      "subtotal": 39.98,
      "tax": 3.2,
      "total": 43.18,
      "taxRate": 0.08
    }
  }
}
```

### Add item to cart

`POST /api/users/cart/items`

Body:

```json
{
  "bookId": "<bookId>",
  "quantity": 2
}
```

### Update cart item quantity

`PUT /api/users/cart/items/:bookId`

Body:

```json
{
  "quantity": 3
}
```

### Remove item from cart

`DELETE /api/users/cart/items/:bookId`

### Clear cart

`DELETE /api/users/cart`

### Checkout cart

`POST /api/users/cart/checkout`

Body:

```json
{
  "addressId": "<addressId>"
}
```

Response:

```json
{
  "message": "Order created successfully",
  "order": {
    "_id": "...",
    "user": "...",
    "items": [
      {
        "book": {
          "_id": "...",
          "title": "...",
          "price": 19.99
        },
        "quantity": 2,
        "price": 19.99
      }
    ],
    "shippingAddress": {
      "addressId": "...",
      "label": "Home",
      "line1": "123 Main St",
      "city": "Metropolis",
      "state": "State",
      "postalCode": "12345",
      "country": "Country"
    }
  },
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

This creates an order from the current cart and clears the cart after a successful checkout.

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

`GET /api/books?page=1&limit=10&sort=-createdAt&minRating=4&author=Author`

Optional query parameters:

- `author` - Filter by author name
- `minRating` - Filter by minimum average rating
- `page`, `limit`, `sort`, `select` - Standard pagination parameters

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

### Get book details

`GET /api/books/:id`

Response:

```json
{
  "data": { ... }
}
```

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

Body (either provide items explicitly or use the current cart):

```json
{
  "addressId": "<addressId>"
}
```

Or explicitly:

```json
{
  "items": [{ "bookId": "<bookId>", "quantity": 2 }],
  "addressId": "<addressId>"
}
```

If `items` are not supplied, the API uses the authenticated user's cart as the source for the order. After a successful checkout, the cart is cleared.

Success response:

```json
{
  "message": "Order created successfully",
  "order": { "_id": "...", "user": "...", "items": [ ... ] },
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

The order stores the selected shipping address snapshot.

### List orders

`GET /api/orders?page=1&limit=10`

Query parameters:

- `page`, `limit`, `sort`, `select` - Standard pagination parameters

Response:

```json
{
  "page": 1,
  "limit": 10,
  "total": 5,
  "pages": 1,
  "results": [ ... ]
}
```

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

- `npm install` - Install dependencies
- `npm run seed` - Seed database
- `npm run dev` - Run development server with nodemon
- `npm start` - Start production server

## Architecture Notes

- **Global Error Handler**: All async errors are caught and forwarded to the centralized error middleware via `next(err)`.
- **Factory Pattern**: Repeated CRUD logic is abstracted into `handlerFactory` for DRY code.
- **Query Parsing**: `ApiUtils` extracts and validates pagination, sorting, filtering, and selection from request queries.
- **Address Schema**: Separated into `models/Address.js` for reuse in `User` and `Order` models.
- **Role-Based Access**: Middleware `auth.js` and `roles.js` enforce JWT and role-based access control.

## Notes

- All protected routes require the `Authorization` header with `Bearer <token>`.
- Customers can only access their own orders and addresses.
- Admins can manage books and update order status.
- Response keys for paginated lists use `results` instead of model names.
- Mongoose validation errors return `400 Bad Request` with field-level details.
