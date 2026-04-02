# DriveHub - Vehicle Rental Platform

A complete vehicle rental platform with user and admin interfaces built with Next.js 16, MongoDB, and modern web technologies.

## Features

### User Features
- Browse available vehicles with filters
- View detailed vehicle information
- Book vehicles with date selection
- Manage bookings from personal dashboard
- Cancel bookings
- User authentication (signup/login)

### Admin Features
- Complete vehicle management (CRUD)
- View all bookings
- Filter bookings by status
- Update booking status
- Admin dashboard with statistics
- Fleet management overview

## Tech Stack

- **Frontend**: Next.js 16 with React 19
- **UI Components**: shadcn/ui with Tailwind CSS
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcryptjs
- **Styling**: Tailwind CSS with custom theme

## Project Structure

```
app/
├── api/
│   ├── auth/
│   │   ├── login/route.ts
│   │   └── register/route.ts
│   ├── vehicles/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   └── bookings/
│       ├── route.ts
│       └── [id]/route.ts
├── auth/
│   ├── login/page.tsx
│   └── register/page.tsx
├── admin/
│   ├── dashboard/page.tsx
│   ├── vehicles/page.tsx
│   └── bookings/page.tsx
├── vehicles/
│   └── [id]/page.tsx
├── dashboard/page.tsx
├── page.tsx
└── layout.tsx

lib/
├── db.ts
├── auth.ts
├── context/
│   └── AuthContext.tsx
└── models/
    ├── User.ts
    ├── Vehicle.ts
    └── Booking.ts
```

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```env
MONGODB_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/vehicle-rental
JWT_SECRET=your-secret-key-change-in-production
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Usage Guide

### For Users

1. **Visit Landing Page**: Go to the home page to browse available vehicles
2. **View Details**: Click on any vehicle to see full details
3. **Create Account**: Click "Sign Up" to create a new account
4. **Book Vehicle**: Fill in rental dates and locations, then book
5. **Manage Bookings**: Access your dashboard to view and cancel bookings

### For Admins

1. **Access Admin Panel**: Go to `/admin/dashboard`
   - You need admin credentials to access this section
2. **Manage Vehicles**: 
   - Add new vehicles with details (price, seats, fuel type, etc.)
   - Edit existing vehicle information
   - Delete vehicles from the fleet
3. **Manage Bookings**:
   - View all customer bookings
   - Filter by status (pending, confirmed, completed, cancelled)
   - Update booking status
   - Cancel bookings if needed
4. **Dashboard Stats**:
   - See total vehicles and availability
   - Monitor booking statistics

## Creating Admin User

To create an admin user, modify the registration API or use MongoDB directly:

```bash
# In MongoDB
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login user

### Vehicles
- `GET /api/vehicles` - Get all vehicles
- `GET /api/vehicles?available=true` - Get available vehicles
- `POST /api/vehicles` - Create vehicle (admin only)
- `GET /api/vehicles/[id]` - Get vehicle details
- `PUT /api/vehicles/[id]` - Update vehicle (admin only)
- `DELETE /api/vehicles/[id]` - Delete vehicle (admin only)

### Bookings
- `GET /api/bookings` - Get all bookings (admin)
- `GET /api/bookings?userId=[id]` - Get user bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/[id]` - Get booking details
- `PUT /api/bookings/[id]` - Update booking status
- `DELETE /api/bookings/[id]` - Delete booking

## Database Models

### User
- name
- email (unique)
- password (hashed)
- phone
- role (user/admin)
- timestamps

### Vehicle
- name
- make
- model
- year
- category (economy, compact, sedan, suv, luxury)
- pricePerDay
- fuelType (petrol, diesel, hybrid, electric)
- transmission (manual, automatic)
- seats
- description
- image URL
- available (boolean)
- timestamps

### Booking
- userId (reference to User)
- vehicleId (reference to Vehicle)
- startDate
- endDate
- status (pending, confirmed, completed, cancelled)
- totalPrice
- pickupLocation
- dropoffLocation
- timestamps

## Theme Customization

The application uses a modern blue/teal color scheme with customizable design tokens in `app/globals.css`:

- **Primary**: Deep blue (#45 0.15 250)
- **Secondary**: Cyan/Teal (#65 0.12 180)
- **Accent**: Purple (#55 0.18 280)
- **Sidebar**: Dark navy background

## Performance Optimizations

- Server-side rendering for critical pages
- Client-side state management with Context API
- Image optimization with Next.js Image component
- Responsive design for all screen sizes
- Efficient database queries with MongoDB indexes

## Security Features

- Password hashing with bcryptjs
- JWT token-based authentication
- Protected admin routes
- Input validation on all forms
- Secure API endpoints

## Future Enhancements

- Payment integration (Stripe)
- Email notifications
- Vehicle ratings and reviews
- Advanced search filters
- SMS notifications
- Insurance options
- Multi-language support

## Troubleshooting

### MongoDB Connection Issues
- Verify MONGODB_URI is correct
- Check MongoDB Atlas network access
- Ensure credentials are URL-encoded

### Authentication Issues
- Clear browser cookies and localStorage
- Verify JWT_SECRET is set
- Check that user role is correctly set in database

### Booking Issues
- Ensure dates are in correct format
- Verify vehicle availability
- Check user is logged in before booking

## License

MIT License - Feel free to use this project for your needs.

## Support

For issues or questions, please create an issue in the repository or contact the development team.
