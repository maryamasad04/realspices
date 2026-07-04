# Saffron E-commerce Backend

A complete backend API for an e-commerce platform built with Node.js, Express, Prisma, and PostgreSQL.

## Features

- **User Authentication**: JWT-based authentication with bcrypt password hashing
- **Product Management**: CRUD operations for products with filtering and search
- **Shopping Cart**: Add, update, remove items with stock validation
- **Order Management**: Place orders, payment processing, order tracking
- **Admin Dashboard**: User management, product management, order management, analytics
- **Role-Based Access Control**: User and Admin roles with protected routes

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **CORS**: Enabled for frontend integration

## Project Structure

```
backend/
├── src/
│   ├── index.js                 # Main server entry point
│   ├── routes/
│   │   ├── authRoutes.js        # Authentication routes
│   │   ├── productRoutes.js     # Product routes
│   │   ├── cartRoutes.js        # Cart routes
│   │   ├── orderRoutes.js       # Order routes
│   │   └── adminRoutes.js       # Admin routes
│   ├── controllers/
│   │   ├── authController.js    # Auth logic
│   │   ├── productController.js # Product logic
│   │   ├── cartController.js    # Cart logic
│   │   ├── orderController.js   # Order logic
│   │   └── adminController.js   # Admin logic
│   ├── middleware/
│   │   ├── auth.js              # JWT verification & authorization
│   │   └── errorHandler.js      # Global error handling
│   ├── prisma/
│   │   └── schema.prisma        # Database schema
│   └── utils/
│       ├── jwt.js               # JWT utilities
│       └── prisma.js            # Prisma client
├── package.json
├── .env.example
└── README.md
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the backend directory:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=5000
NODE_ENV=development
```

**Note**: Update `DATABASE_URL` with your actual Supabase PostgreSQL credentials.

### 3. Initialize Database

Generate Prisma Client:

```bash
npm run prisma:generate
```

Run database migrations:

```bash
npm run prisma:migrate
```

### 4. Start the Server

Development mode (with auto-reload):

```bash
npm run dev
```

Production mode:

```bash
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT).

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/signup` | Public | Register new user |
| POST | `/login` | Public | Login user |
| POST | `/logout` | Protected | Logout user |
| GET | `/profile` | Protected | Get user profile |

### Products (`/api/products`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | Get all products (with filters) |
| GET | `/:id` | Public | Get product by ID |
| POST | `/` | Admin | Create new product |
| PUT | `/:id` | Admin | Update product |
| DELETE | `/:id` | Admin | Delete product |

**Query Parameters for GET /**:
- `category` - Filter by category
- `minPrice` - Filter by minimum price
- `maxPrice` - Filter by maximum price
- `search` - Search in name and description

### Cart (`/api/cart`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Protected | Get user's cart |
| POST | `/items` | Protected | Add item to cart |
| PUT | `/items/:itemId` | Protected | Update cart item quantity |
| DELETE | `/items/:itemId` | Protected | Remove item from cart |
| DELETE | `/clear` | Protected | Clear entire cart |

### Orders (`/api/orders`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Protected | Create order from cart |
| GET | `/` | Protected | Get user's orders |
| GET | `/:id` | Protected | Get order details |
| POST | `/:orderId/payment` | Protected | Process payment (mock) |
| DELETE | `/:id` | Protected | Cancel order |

### Admin (`/api/admin`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/dashboard` | Admin | Get dashboard statistics |
| GET | `/users` | Admin | Get all users |
| GET | `/users/:id` | Admin | Get user details |
| PUT | `/users/:id/role` | Admin | Update user role |
| DELETE | `/users/:id` | Admin | Delete user |
| GET | `/orders` | Admin | Get all orders |
| PUT | `/orders/:id/status` | Admin | Update order status |

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Database Schema

### Models

- **User**: User accounts with authentication
- **Product**: Product catalog
- **Cart**: Shopping cart (one per user)
- **CartItem**: Items in cart
- **Order**: Order records
- **OrderItem**: Products in orders

### Enums

- **Role**: USER, ADMIN
- **PaymentStatus**: PENDING, COMPLETED, FAILED, REFUNDED
- **OrderStatus**: PROCESSING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED

## Example Requests

### Register a New User

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

### Create a Product (Admin)

```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "name": "Saffron Premium",
    "description": "High quality saffron threads",
    "price": 49.99,
    "category": "Spices",
    "stock": 100,
    "imageUrl": "https://example.com/image.jpg"
  }'
```

### Add to Cart

```bash
curl -X POST http://localhost:5000/api/cart/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <user_token>" \
  -d '{
    "productId": "product-uuid",
    "quantity": 2
  }'
```

### Place an Order

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <user_token>"
```

## Additional Prisma Commands

Open Prisma Studio (Database GUI):

```bash
npm run prisma:studio
```

Reset database (WARNING: Deletes all data):

```bash
npx prisma migrate reset
```

## Error Handling

The API uses standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

Error responses follow this format:

```json
{
  "error": "Error message",
  "details": "Additional details (optional)"
}
```

## Production Deployment

1. Set `NODE_ENV=production` in environment variables
2. Use a strong, unique `JWT_SECRET`
3. Enable SSL/TLS for database connections
4. Configure proper CORS origins
5. Use a process manager (PM2, systemd)
6. Set up logging and monitoring
7. Enable rate limiting and security headers

## License

ISC

## Author

Saffron E-commerce Team
