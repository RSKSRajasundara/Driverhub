# Quick Start Guide - DriveHub Vehicle Rental

## 5-Minute Setup

### Step 1: Prerequisites
- Node.js 18+ installed
- MongoDB account (free tier available at mongodb.com/cloud/atlas)

### Step 2: Clone & Install
```bash
# Install dependencies
pnpm install
```

### Step 3: Configure Environment
Create `.env.local` file:
```env
MONGODB_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/vehicle-rental
JWT_SECRET=your-secure-random-secret-key
```

### Step 4: Start Development Server
```bash
pnpm dev
```

Visit http://localhost:3000 - you should see the landing page!

## Quick Navigation

| Route | Purpose | Access |
|-------|---------|--------|
| `/` | Landing page & vehicle browsing | Everyone |
| `/auth/login` | User login | Not logged in |
| `/auth/register` | User signup | Not logged in |
| `/vehicles/[id]` | Vehicle details & booking | Everyone |
| `/dashboard` | My bookings | Logged in users |
| `/admin/dashboard` | Admin overview | Admin users |
| `/admin/vehicles` | Manage vehicles | Admin users |
| `/admin/bookings` | Manage bookings | Admin users |

## Test the Flow

### 1. Create User Account
- Click "Sign Up" button
- Fill in details: name, email, phone, password
- Submit form → redirects to home page

### 2. Add Test Vehicle (as Admin)
- First, modify your user role to admin in MongoDB
- Go to `/admin/vehicles`
- Click "Add Vehicle"
- Fill in vehicle details:
  - Name: "Toyota Camry 2024"
  - Make: "Toyota"
  - Model: "Camry"
  - Year: 2024
  - Category: "sedan"
  - Price per day: $75
  - Fuel type: "petrol"
  - Transmission: "automatic"
  - Seats: 5
- Click "Add Vehicle"

### 3. Book Vehicle (as User)
- Logout from admin
- Login as regular user
- Click on vehicle card
- Fill booking form:
  - Start Date: Pick any future date
  - End Date: Pick a date after start date
  - Pickup: "Airport Terminal A"
  - Dropoff: "City Center Hotel"
- Click "Book Now"
- See total price calculated automatically

### 4. Manage Booking
- Go to `/dashboard`
- See your booking listed
- You can cancel or view details

### 5. Admin Management
- Login as admin
- Go to `/admin/bookings`
- Filter bookings by status
- Update booking status
- Cancel bookings

## Key Features to Try

✨ **User Features**
- Browse vehicles on landing page
- View detailed vehicle specs
- Book vehicles with date picker
- See real-time price calculation
- Manage your bookings
- Cancel bookings

✨ **Admin Features**
- Add vehicles with complete info
- Edit vehicle details
- Delete vehicles
- View all bookings
- Filter bookings by status
- Update booking statuses
- View fleet statistics

## Common Issues & Solutions

### MongoDB Connection Error
**Problem**: Can't connect to MongoDB
**Solution**: 
- Check MONGODB_URI format
- Ensure cluster IP whitelist includes your IP
- Verify username/password are correct (URL-encode special characters)

### JWT Error
**Problem**: Token errors on login
**Solution**:
- Set JWT_SECRET in .env.local
- Make sure it's a strong random string
- Restart dev server after setting env

### Admin Access Denied
**Problem**: Can't access `/admin/dashboard`
**Solution**:
- Update user role in MongoDB to "admin"
- Command: `db.users.updateOne({email: "your-email"}, {$set: {role: "admin"}})`
- Logout and login again

### Booking Not Saving
**Problem**: Booking submission fails
**Solution**:
- Make sure logged in (goes to login if not)
- Check all fields are filled
- Verify vehicle exists in database
- Check browser console for error details

## Development Commands

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Run production server
pnpm start

# Lint code
pnpm lint
```

## File Modification Guide

### Add New Vehicle Category
1. Edit `lib/models/Vehicle.ts` - update category enum
2. Edit `/admin/vehicles/page.tsx` - add option in select

### Change Color Theme
Edit `app/globals.css` - modify OKLch color values in `:root` section

### Add New Booking Status
1. Edit `lib/models/Booking.ts` - update status enum
2. Update `/admin/bookings/page.tsx` - add new status button/option

### Customize Vehicle Fields
1. Add field to `lib/models/Vehicle.ts`
2. Update API routes in `app/api/vehicles/`
3. Update admin form in `/admin/vehicles/page.tsx`
4. Update detail page in `/vehicles/[id]/page.tsx`

## API Testing

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Get All Vehicles
```bash
curl http://localhost:3000/api/vehicles
```

### Get Available Vehicles
```bash
curl http://localhost:3000/api/vehicles?available=true
```

## Next Steps

1. **Customize Theme** - Edit colors in `app/globals.css`
2. **Add More Fields** - Extend models and forms
3. **Deploy to Vercel** - Push to GitHub and connect Vercel
4. **Add Payments** - Integrate Stripe for payment processing
5. **Add Notifications** - Set up email notifications

## Production Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Connect GitHub to Vercel
3. Set environment variables in Vercel dashboard:
   - MONGODB_URI
   - JWT_SECRET
4. Deploy!

### Security Checklist

- [ ] Change JWT_SECRET to strong random string
- [ ] Use production MongoDB cluster
- [ ] Enable MongoDB Atlas IP whitelist
- [ ] Set NEXT_PUBLIC_API_URL to production URL
- [ ] Enable HTTPS
- [ ] Review security headers

## Support Resources

- **Setup Issues**: See `SETUP.md`
- **Full Documentation**: See `PROJECT_SUMMARY.md`
- **Database Help**: MongoDB Atlas docs
- **Next.js Docs**: nextjs.org
- **shadcn/ui**: ui.shadcn.com

---

**You're all set!** 🚀 Start exploring the application and customize it for your needs.
