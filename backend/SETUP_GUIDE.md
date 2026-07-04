# Backend Setup Guide

## Project Structure
```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── cartController.js (UPDATED)
│   │   ├── orderController.js (UPDATED)
│   │   ├── addressController.js (NEW)
│   │   ├── wishlistController.js (NEW)
│   │   ├── reviewController.js (NEW)
│   │   ├── contactController.js (NEW)
│   │   └── adminController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── cartRoutes.js
│   │   ├── orderRoutes.js (UPDATED)
│   │   ├── addressRoutes.js (NEW)
│   │   ├── wishlistRoutes.js (NEW)
│   │   ├── reviewRoutes.js (NEW)
│   │   ├── contactRoutes.js (NEW)
│   │   └── adminRoutes.js
│   ├── middleware/
│   ├── utils/
│   └── index.js (UPDATED)
├── prisma/
│   └── schema.prisma (UPDATED)
├── package.json
└── .env
```

## Setup Steps

### 1. Update Prisma Schema
✅ Already done - schema.prisma updated with all new models

### 2. Database Tables
✅ Already created in Supabase with all columns

### 3. Install Dependencies
All required packages are already in package.json:
- Express.js
- Prisma Client
- JWT & bcrypt for auth
- CORS

### 4. Environment Variables
Make sure your `.env` has:
```
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

## API Endpoints Summary

### Cart Management
- `GET /api/cart` - Get user's cart
- `POST /api/cart/items` - Add product to cart
- `PUT /api/cart/items/:itemId` - Update quantity
- `DELETE /api/cart/items/:itemId` - Remove item
- `DELETE /api/cart/clear` - Clear entire cart

### Orders
- `POST /api/orders` - Create order from cart
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order status
- `DELETE /api/orders/:id` - Cancel order

### Addresses
- `GET /api/address` - List user's addresses
- `POST /api/address` - Add new address
- `PUT /api/address/:id` - Update address
- `DELETE /api/address/:id` - Delete address
- `PATCH /api/address/:id/default` - Set as default

### Wishlist
- `GET /api/wishlist` - Get wishlist
- `POST /api/wishlist` - Add product
- `DELETE /api/wishlist/:productId` - Remove product
- `GET /api/wishlist/:productId/check` - Check if in wishlist

### Reviews
- `GET /api/reviews/product/:productId` - Get product reviews
- `POST /api/reviews/product/:productId` - Create review
- `GET /api/reviews/user/all` - Get user's reviews
- `PUT /api/reviews/:reviewId` - Update review
- `DELETE /api/reviews/:reviewId` - Delete review

### Contacts
- `POST /api/contact` - Submit contact message
- `GET /api/contact` - Get all messages (admin)
- `GET /api/contact/:id` - Get message details
- `GET /api/contact/user/my-contacts` - Get own messages
- `PUT /api/contact/:id/status` - Update status
- `DELETE /api/contact/:id` - Delete message

## Key Changes Made

### 1. Prisma Schema (`prisma/schema.prisma`)
- Updated User model to map to `user` table
- Updated Product model to map to `product` table
- Added all 9 new models (Address, Category, Cart, CartItem, Order, OrderItem, Inventory, Payment, Review, Wishlist, Contact)
- Added proper relationships and foreign keys

### 2. Controllers Updated
- **cartController.js** - Fixed field names to match schema (cart_id, product_id, etc.)
- **orderController.js** - Updated to require address_id, uses new field names

### 3. New Controllers
- **addressController.js** - CRUD operations for addresses
- **wishlistController.js** - Add/remove wishlist items
- **reviewController.js** - Create/read/update/delete reviews
- **contactController.js** - Handle contact messages

### 4. Route Setup
All new routes integrated into main index.js:
- `/api/address`
- `/api/wishlist`
- `/api/reviews`
- `/api/contact`

## Testing the API

### 1. Start the server
```bash
npm run dev
```

### 2. Test endpoints with Postman or curl
```bash
# Create cart (auto-creates if doesn't exist)
curl -X GET http://localhost:5000/api/cart \
  -H "Authorization: Bearer YOUR_TOKEN"

# Add to cart
curl -X POST http://localhost:5000/api/cart/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"productId": "123", "quantity": 1}'
```

## Common Issues

### Issue: "relation does not exist"
- Make sure all tables are created in Supabase
- Run the SQL schema provided earlier

### Issue: "foreign key constraint"
- Ensure foreign key references use correct table names (user, product)
- Check that all referenced rows exist

### Issue: BigInt errors
- Product IDs are BigInt in database
- Always convert to BigInt when querying: `BigInt(productId)`

## Next Steps

1. ✅ Supabase tables created
2. ✅ Prisma schema updated
3. ✅ All controllers created
4. ✅ All routes created
5. ✅ Main server updated
6. 🔄 **Start server**: `npm run dev`
7. 🔄 Test all endpoints
8. 🔄 Update frontend to use new endpoints

---

## Frontend Integration

When integrating from frontend:

1. **Add to Cart**: POST `/api/cart/items` with productId and quantity
2. **View Cart**: GET `/api/cart`
3. **Checkout**: POST `/api/orders` with addressId
4. **Address Management**: Use `/api/address` endpoints
5. **Wishlist**: Use `/api/wishlist` endpoints
6. **Reviews**: Use `/api/reviews` endpoints

See `API_DOCUMENTATION.md` for complete endpoint details.
