# Testing Guide - DriveHub Vehicle Rental System

## Test Users

### Regular User Account
```
Email: user@example.com
Password: password123
Role: user
```

### Admin Account
```
Email: admin@example.com
Password: admin123
Role: admin
```

**Note**: These are example credentials. You'll need to create actual accounts through the registration page first.

## Test Scenarios

### Scenario 1: Complete User Booking Flow

**Goal**: Register, browse vehicles, and make a booking

**Steps**:
1. Go to http://localhost:3000
2. Click "Sign Up"
3. Fill form with:
   - Name: "John Doe"
   - Email: "john@example.com"
   - Phone: "555-1234"
   - Password: "password123"
4. Submit → Auto redirects to home
5. Click on any vehicle card
6. Fill booking form:
   - Start Date: Select date 7 days from now
   - End Date: Select date 14 days from now
   - Pickup: "Downtown Airport"
   - Dropoff: "City Center Hotel"
7. Click "Book Now"
8. Go to `/dashboard` to see booking
9. View booking details or cancel

**Expected Results**:
- ✅ User created successfully
- ✅ Login automatic after registration
- ✅ Vehicle displays with all details
- ✅ Price calculated: (days × price_per_day)
- ✅ Booking appears in dashboard
- ✅ Can cancel booking (if not completed)

### Scenario 2: Admin Vehicle Management

**Goal**: Add, edit, and delete vehicles

**Steps**:
1. Login as admin: admin@example.com
2. Go to `/admin/dashboard`
3. Click "Manage Vehicles"
4. Click "Add Vehicle"
5. Fill form:
   - Name: "Honda CR-V 2024"
   - Make: "Honda"
   - Model: "CR-V"
   - Year: 2024
   - Category: "suv"
   - Price/Day: $85
   - Fuel: "hybrid"
   - Transmission: "automatic"
   - Seats: 5
6. Click "Add Vehicle"
7. Try editing: Click "Edit" on any vehicle
8. Modify price to $95
9. Click "Update Vehicle"
10. Try deleting: Click "Delete" and confirm
11. Verify vehicle removed from list

**Expected Results**:
- ✅ Vehicle form displays correctly
- ✅ Vehicle added to list
- ✅ Can edit vehicle details
- ✅ Changes reflected immediately
- ✅ Delete removes vehicle
- ✅ Stats update in dashboard

### Scenario 3: Admin Booking Management

**Goal**: View, filter, and manage bookings

**Steps**:
1. Login as admin
2. Go to `/admin/bookings`
3. View all bookings (should include test bookings)
4. Click status filter buttons to view:
   - All bookings
   - Pending bookings
   - Confirmed bookings
   - Completed bookings
   - Cancelled bookings
5. Select a booking and change status
6. Verify status updates immediately
7. Try cancelling a booking

**Expected Results**:
- ✅ All bookings display
- ✅ Filters work correctly
- ✅ Status options appear for active bookings
- ✅ Status changes immediately
- ✅ Can delete bookings
- ✅ Booking cards show full details

### Scenario 4: Authentication Flow

**Goal**: Test login, logout, and session management

**Steps**:
1. Go to `/auth/login`
2. Try wrong password → Error message
3. Login with correct credentials
4. Verify redirected to home page
5. Check header shows user name
6. Click "Logout"
7. Verify redirected to home page
8. Try accessing `/dashboard` → Redirects to login
9. Login again
10. Verify session persists after page refresh

**Expected Results**:
- ✅ Wrong password shows error
- ✅ Login works with correct credentials
- ✅ User name appears in header
- ✅ Logout clears session
- ✅ Protected routes redirect to login
- ✅ Session persists across pages

### Scenario 5: Vehicle Browsing

**Goal**: Test vehicle display and filtering

**Steps**:
1. Go to home page
2. Scroll through all available vehicles
3. Check vehicle cards display:
   - Vehicle image
   - Vehicle name
   - Number of seats
   - Category
   - Price per day
4. Click on vehicle → Detail page loads
5. Check detail page shows:
   - Full vehicle image
   - Make, Model, Year
   - Seats, Fuel Type, Transmission
   - Description
   - Booking form
6. Go back to home page
7. Verify "Available Vehicles" section

**Expected Results**:
- ✅ All vehicles load and display
- ✅ Vehicle cards are responsive
- ✅ Links work correctly
- ✅ Detail page shows all information
- ✅ Images display (or placeholder if missing)
- ✅ Booking form interactive

## API Testing

### Test Endpoints with cURL

#### 1. Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "phone": "555-1234"
  }'
```

#### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Response includes JWT token:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f...",
    "name": "Test User",
    "email": "test@example.com",
    "role": "user"
  }
}
```

#### 3. Get All Vehicles
```bash
curl http://localhost:3000/api/vehicles
```

#### 4. Get Available Vehicles Only
```bash
curl "http://localhost:3000/api/vehicles?available=true"
```

#### 5. Get Vehicle by ID
```bash
curl http://localhost:3000/api/vehicles/507f1f77bcf86cd799439011
```

#### 6. Create Booking
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439012",
    "vehicleId": "507f1f77bcf86cd799439011",
    "startDate": "2024-12-01T00:00:00Z",
    "endDate": "2024-12-08T00:00:00Z",
    "pickupLocation": "Airport",
    "dropoffLocation": "Downtown"
  }'
```

#### 7. Get User Bookings
```bash
curl "http://localhost:3000/api/bookings?userId=507f1f77bcf86cd799439012"
```

#### 8. Update Booking Status
```bash
curl -X PUT http://localhost:3000/api/bookings/507f1f77bcf86cd799439013 \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
```

## Test Data to Add

### Sample Vehicles to Create

**Vehicle 1: Budget Car**
- Name: "Toyota Corolla 2024"
- Make: "Toyota"
- Model: "Corolla"
- Year: 2024
- Category: "economy"
- Price: $45/day
- Fuel: "petrol"
- Transmission: "automatic"
- Seats: 5

**Vehicle 2: Mid-Range SUV**
- Name: "Nissan Rogue 2024"
- Make: "Nissan"
- Model: "Rogue"
- Year: 2024
- Category: "suv"
- Price: $75/day
- Fuel: "hybrid"
- Transmission: "automatic"
- Seats: 5

**Vehicle 3: Luxury Car**
- Name: "BMW 7 Series 2024"
- Make: "BMW"
- Model: "7 Series"
- Year: 2024
- Category: "luxury"
- Price: $150/day
- Fuel: "diesel"
- Transmission: "automatic"
- Seats: 5

## Performance Testing

### Load Testing

Test with multiple bookings:
1. Create 5-10 test bookings
2. Check admin dashboard loads quickly
3. Filter bookings by different statuses
4. Verify no lag in UI updates

### Responsive Design Testing

Test on different screen sizes:
- Desktop (1920×1080) ✅
- Tablet (768×1024) ✅
- Mobile (375×667) ✅

Use Chrome DevTools to test responsive design:
1. Press F12
2. Click device toggle button
3. Test different device presets

## Error Handling Tests

### 1. Invalid Email
- Try signup with invalid email format
- Should show validation error

### 2. Weak Password
- Try signup with password < 6 chars
- Should show validation error

### 3. Missing Fields
- Try form submission with empty fields
- Should show required field errors

### 4. Duplicate Email
- Try registering with existing email
- Should show "User already exists" error

### 5. Wrong Credentials
- Login with wrong email/password
- Should show "Invalid credentials" error

### 6. Invalid Date Range
- Try booking with end date before start date
- Should show validation error

## Security Testing

### 1. Token Validation
- Get login token
- Try accessing `/dashboard` with valid token
- Should work
- Try modifying token and accessing
- Should fail with 401 error

### 2. Admin Route Protection
- Try accessing `/admin/dashboard` as regular user
- Should redirect to home page
- Login as user, should still be blocked
- Login as admin, should allow access

### 3. CORS Testing
- API should handle requests properly
- Check browser console for CORS errors
- Should be none in normal operation

## Cleanup After Testing

1. Delete test users from MongoDB
2. Delete test bookings
3. Delete test vehicles (keep one for demo)
4. Verify no personal data remains

## Success Criteria

All scenarios should complete with:
- ✅ No console errors
- ✅ No broken links
- ✅ Proper error handling
- ✅ Responsive on all devices
- ✅ Fast load times
- ✅ Database changes reflected immediately

---

**Happy Testing!** 🧪 Report any issues found during testing.
