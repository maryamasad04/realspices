# Saffron E-commerce API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 1. Cart Endpoints

### Get Cart
- **GET** `/cart`
- **Auth**: Required
- **Response**: Cart with all items and total price

### Add to Cart
- **POST** `/cart/items`
- **Auth**: Required
- **Body**:
  ```json
  {
    "productId": "123",
    "quantity": 2
  }
  ```

### Update Cart Item
- **PUT** `/cart/items/:itemId`
- **Auth**: Required
- **Body**:
  ```json
  {
    "quantity": 3
  }
  ```

### Remove from Cart
- **DELETE** `/cart/items/:itemId`
- **Auth**: Required

### Clear Cart
- **DELETE** `/cart/clear`
- **Auth**: Required

---

## 2. Order Endpoints

### Create Order
- **POST** `/orders`
- **Auth**: Required
- **Body**:
  ```json
  {
    "addressId": "uuid-here"
  }
  ```

### Get User Orders
- **GET** `/orders`
- **Auth**: Required

### Get Order by ID
- **GET** `/orders/:id`
- **Auth**: Required

### Update Order Status
- **PUT** `/orders/:id`
- **Auth**: Required
- **Body**:
  ```json
  {
    "status": "pending|confirmed|shipped|delivered|cancelled"
  }
  ```

### Cancel Order
- **DELETE** `/orders/:id`
- **Auth**: Required

---

## 3. Address Endpoints

### Get User Addresses
- **GET** `/address`
- **Auth**: Required

### Create Address
- **POST** `/address`
- **Auth**: Required
- **Body**:
  ```json
  {
    "full_name": "John Doe",
    "phone": "1234567890",
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "pincode": "10001",
    "country": "USA",
    "is_default": false
  }
  ```

### Update Address
- **PUT** `/address/:id`
- **Auth**: Required
- **Body**: Same as create (all fields optional)

### Delete Address
- **DELETE** `/address/:id`
- **Auth**: Required

### Set Default Address
- **PATCH** `/address/:id/default`
- **Auth**: Required

---

## 4. Wishlist Endpoints

### Get Wishlist
- **GET** `/wishlist`
- **Auth**: Required

### Add to Wishlist
- **POST** `/wishlist`
- **Auth**: Required
- **Body**:
  ```json
  {
    "productId": "123"
  }
  ```

### Remove from Wishlist
- **DELETE** `/wishlist/:productId`
- **Auth**: Required

### Check if Product in Wishlist
- **GET** `/wishlist/:productId/check`
- **Auth**: Required

---

## 5. Review Endpoints

### Get Product Reviews
- **GET** `/reviews/product/:productId`
- **Auth**: Not required

### Create Review
- **POST** `/reviews/product/:productId`
- **Auth**: Required
- **Body**:
  ```json
  {
    "rating": 5,
    "comment": "Great product!"
  }
  ```

### Get User Reviews
- **GET** `/reviews/user/all`
- **Auth**: Required

### Update Review
- **PUT** `/reviews/:reviewId`
- **Auth**: Required
- **Body**:
  ```json
  {
    "rating": 4,
    "comment": "Updated comment"
  }
  ```

### Delete Review
- **DELETE** `/reviews/:reviewId`
- **Auth**: Required

---

## 6. Contact Endpoints

### Create Contact Message
- **POST** `/contact`
- **Auth**: Not required
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "subject": "Question",
    "message": "I have a question about..."
  }
  ```

### Get All Contacts (Admin)
- **GET** `/contact`
- **Auth**: Required

### Get Contact by ID (Admin)
- **GET** `/contact/:id`
- **Auth**: Required

### Get User's Contacts
- **GET** `/contact/user/my-contacts`
- **Auth**: Required

### Update Contact Status
- **PUT** `/contact/:id/status`
- **Auth**: Required
- **Body**:
  ```json
  {
    "status": "new|in progress|resolved"
  }
  ```

### Delete Contact
- **DELETE** `/contact/:id`
- **Auth**: Required

---

## Error Responses

All endpoints return errors in this format:
```json
{
  "error": "Error message here"
}
```

## Success Responses

Most endpoints return:
```json
{
  "success": true,
  "message": "Operation completed",
  "data": { /* response data */ }
}
```

---

## Database Schema

### Tables Created:
1. **address** - User delivery addresses
2. **category** - Product categories
3. **cart** - Shopping carts
4. **cartitem** - Items in cart
5. **order** - User orders
6. **orderitem** - Items in orders
7. **inventory** - Inventory tracking
8. **payment** - Order payments
9. **review** - Product reviews
10. **wishlist** - Wishlist items
11. **contacts** - Contact messages

---

## Status Values

### Order Status
- `pending` - Order placed, awaiting payment
- `confirmed` - Payment confirmed
- `shipped` - Order shipped
- `delivered` - Order delivered
- `cancelled` - Order cancelled

### Contact Status
- `new` - New message
- `in progress` - Being reviewed
- `resolved` - Resolved

---

## Notes
- All UUIDs in responses use string format
- Timestamps are in ISO 8601 format
- Decimal values (prices) are returned as numbers
- BigInt product IDs are handled internally
