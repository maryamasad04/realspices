# 🚀 Authentication Implementation Checklist

## Phase 1: Backend Setup ✅ COMPLETED

- [x] Create users table schema
- [x] Create JWT utility (sign, verify, extract)
- [x] Create signup endpoint (`/api/auth/signup`)
- [x] Create login endpoint (`/api/auth/login`)
- [x] Create profile endpoint (`/api/auth/profile`)
- [x] Update cart API with JWT verification
- [x] Update user API with JWT verification
- [x] Update address API with JWT verification

## Phase 2: Run Database Migration

- [ ] Open PostgreSQL client (psql, DBeaver, or similar)
- [ ] Connect to your `realspices` database
- [ ] Copy entire contents of: `database/users_schema.sql`
- [ ] Paste and execute the SQL
- [ ] Verify users table created: `SELECT * FROM public.users;`

## Phase 3: Environment Setup

- [ ] Create or update `.env.local` file in project root
- [ ] Add: `JWT_SECRET=your-super-secret-key-change-in-production`
- [ ] Save file

## Phase 4: Test Authentication Flow

### Test 1: Signup
```bash
npm run dev
# Visit http://localhost:3000/login
# Click "User Login" → "Sign up"
# Fill form: Name, Email, Password
# Click Sign up
# Should redirect to home page
```

### Test 2: Check Token
```javascript
// Open browser DevTools Console
localStorage.getItem('authToken')
// Should show a token starting with "eyJ"
```

### Test 3: Login Again
```bash
# Clear browser storage and revisit login
localStorage.clear()
# Now try login with credentials you just created
```

### Test 4: Protected Routes
```bash
# Try accessing cart/orders - should work with token
# Try accessing without token - should redirect to login
```

## Phase 5: Verify API Endpoints (Optional)

```bash
# Get signup token first
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}' | jq -r '.token')

# Test profile endpoint
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

## ✅ Success Indicators

- User can signup with name, email, password
- User can login with email and password
- Token is stored in localStorage after login
- User data loads on homepage after login
- Cart operations work (save/update/delete)
- User can access addresses
- Logging out clears token and redirects to login

## 🆘 If Something Breaks

1. **"users" table doesn't exist** → Run migration (Phase 2)
2. **JWT_SECRET error** → Set environment variable (Phase 3)
3. **Token not working** → Clear localStorage and retry
4. **Passwords not matching** → Use same password as signup
5. **Bearer token invalid** → Token is expired (7 days)

## 🎯 Production Checklist

- [ ] Change JWT_SECRET to strong random string
- [ ] Set up email verification
- [ ] Use HTTPS only
- [ ] Consider refresh tokens
- [ ] Add rate limiting
- [ ] Set secure cookie options
- [ ] Enable CORS properly
- [ ] Add password reset functionality

---

**Status**: ✅ Authentication system ready to use!
