# DriveHub Architecture Documentation

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  USER INTERFACE                      ADMIN INTERFACE             │
│  ───────────────                      ────────────────            │
│  • Landing Page          ┌────────────────────────────────┐     │
│  • Vehicle Browse        │  • Dashboard                   │     │
│  • Vehicle Details       │  • Vehicle Management          │     │
│  • Booking Form          │  • Booking Management          │     │
│  • User Dashboard        │  • Statistics & Reports        │     │
│  • Auth Pages (Login)    └────────────────────────────────┘     │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  STATE MANAGEMENT                    ROUTING                     │
│  ────────────────                    ───────                     │
│  • AuthContext                       • Next.js 16 Router         │
│  • Local Storage                     • Dynamic Routes [id]       │
│  • Session Management                • Route Groups (auth/admin) │
│                                                                   │
│  CLIENT-SIDE LOGIC                   FORM HANDLING               │
│  ──────────────────                  ──────────────              │
│  • Data Fetching                     • Validation                │
│  • Error Handling                    • Submission                │
│  • Loading States                    • Error Messages            │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                       API LAYER (ROUTES)                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  AUTHENTICATION ENDPOINTS             VEHICLE ENDPOINTS          │
│  ─────────────────────────            ─────────────────          │
│  POST /api/auth/register              GET    /api/vehicles      │
│  POST /api/auth/login                 POST   /api/vehicles      │
│                                       GET    /api/vehicles/[id] │
│                                       PUT    /api/vehicles/[id] │
│                                       DELETE /api/vehicles/[id] │
│                                                                   │
│  BOOKING ENDPOINTS                                               │
│  ──────────────────                                              │
│  GET    /api/bookings                                           │
│  POST   /api/bookings                                           │
│  GET    /api/bookings/[id]                                      │
│  PUT    /api/bookings/[id]                                      │
│  DELETE /api/bookings/[id]                                      │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  AUTHENTICATION SERVICE               BOOKING SERVICE            │
│  ──────────────────────               ───────────────            │
│  • generateToken()                    • Calculate Price          │
│  • verifyToken()                      • Validate Dates           │
│  • Password Hashing                   • Update Status            │
│  • User Validation                    • Create Booking           │
│                                                                   │
│  VEHICLE SERVICE                                                 │
│  ────────────────                                                │
│  • Fetch Vehicles                                                │
│  • Apply Filters                                                 │
│  • Manage Availability                                           │
│  • CRUD Operations                                               │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                      DATA ACCESS LAYER                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  USER MODEL                   VEHICLE MODEL                      │
│  ───────────                  ──────────────                     │
│  • name                       • name                             │
│  • email (unique)             • make/model/year                  │
│  • password (hashed)          • category                         │
│  • phone                      • pricePerDay                      │
│  • role (user/admin)          • fuelType                         │
│  • timestamps                 • transmission                     │
│                               • seats                            │
│                               • available                        │
│                               • image URL                        │
│                               • timestamps                       │
│                                                                   │
│  BOOKING MODEL                                                   │
│  ──────────────                                                  │
│  • userId (ref: User)                                            │
│  • vehicleId (ref: Vehicle)                                      │
│  • startDate/endDate                                             │
│  • status (pending/confirmed/completed/cancelled)               │
│  • totalPrice                                                    │
│  • pickupLocation/dropoffLocation                               │
│  • timestamps                                                    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│                    MongoDB Atlas                                 │
│                                                                   │
│  Collections:                          Indexes:                  │
│  • users                               • users._id (primary)     │
│  • vehicles                            • users.email (unique)    │
│  • bookings                            • vehicles._id (primary)  │
│                                        • bookings._id (primary)  │
│                                        • bookings.userId         │
│                                        • bookings.vehicleId      │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### User Registration Flow

```
USER INTERFACE                API LAYER              DATABASE
        │                         │                      │
        │ 1. Fill form            │                      │
        │─────────────────────→   │                      │
        │                         │ 2. POST /register    │
        │                         │                      │
        │                         │ 3. Hash password     │
        │                         │                      │
        │                         │ 4. Create user       │
        │                         │─────────────────────→│
        │                         │                      │
        │                         │← 5. User created     │
        │                         │                      │
        │ 6. Generate JWT token   │                      │
        │←─────────────────────   │                      │
        │                         │                      │
        │ 7. Store token          │                      │
        │ 8. Redirect to home     │                      │
```

### Vehicle Booking Flow

```
USER                    API                    DATABASE
│                       │                        │
│ 1. View vehicle       │                        │
├──────────────────────→│                        │
│                       │ 2. GET /vehicles/[id]  │
│                       │───────────────────────→│
│                       │                        │
│                       │← 3. Vehicle data       │
│←──────────────────────│                        │
│                       │                        │
│ 4. Fill booking form  │                        │
│ (dates, locations)    │                        │
│                       │                        │
│ 5. Submit booking     │                        │
├──────────────────────→│                        │
│                       │ 6. Calculate price    │
│                       │ 7. POST /bookings      │
│                       │───────────────────────→│
│                       │                        │
│                       │← 8. Booking created   │
│                       │                        │
│ 9. Show confirmation  │                        │
│←──────────────────────│                        │
│                       │                        │
│ 10. Redirect dashboard│                        │
```

### Admin Vehicle Management Flow

```
ADMIN UI                API                    DATABASE
│                       │                        │
│ 1. Access vehicle form│                        │
│                       │                        │
│ 2. Fill vehicle data  │                        │
│                       │                        │
│ 3. Submit form        │                        │
├──────────────────────→│                        │
│                       │ 4. Validate data       │
│                       │ 5. POST /vehicles      │
│                       │───────────────────────→│
│                       │                        │
│                       │← 6. Vehicle created   │
│                       │                        │
│ 7. Show success msg   │                        │
│←──────────────────────│                        │
│                       │ 8. GET updated list   │
│ 9. Refresh table      │←───────────────────────│
│                       │                        │
```

## Component Hierarchy

```
App (Root Layout)
├── Header
│   ├── Logo
│   ├── Navigation
│   │   ├── Browse link
│   │   └── Auth buttons/User menu
│   └── User profile (if logged in)
│
├── Main Content
│   ├── Landing Page (/page.tsx)
│   │   ├── Hero Section
│   │   ├── Vehicle Grid
│   │   │   └── Vehicle Cards
│   │   └── Footer
│   │
│   ├── Vehicle Detail (/vehicles/[id])
│   │   ├── Vehicle Image
│   │   ├── Specifications
│   │   └── Booking Sidebar
│   │
│   ├── Auth Pages (/auth/*)
│   │   ├── Login Form
│   │   └── Register Form
│   │
│   ├── User Dashboard (/dashboard)
│   │   ├── Header
│   │   ├── Bookings List
│   │   │   └── Booking Cards
│   │   └── Footer
│   │
│   └── Admin Pages (/admin/*)
│       ├── Admin Header
│       ├── Navigation
│       ├── Dashboard
│       │   ├── Stats Cards
│       │   ├── Recent Vehicles Table
│       │   └── Quick Links
│       ├── Vehicle Management
│       │   ├── Vehicle Form
│       │   └── Vehicles Table
│       └── Booking Management
│           ├── Filter Buttons
│           ├── Bookings Table
│           └── Detail Cards
│
└── Footer
    └── Copyright info
```

## Authentication Flow

```
1. USER REGISTRATION
   ├─ User fills form
   ├─ Validate input
   ├─ Hash password with bcryptjs
   ├─ Save to database
   ├─ Generate JWT token
   └─ Return token to client

2. USER LOGIN
   ├─ User enters credentials
   ├─ Find user by email
   ├─ Compare password hash
   ├─ If valid, generate JWT token
   ├─ Store token in localStorage
   └─ Redirect to dashboard/home

3. PROTECTED ROUTES
   ├─ Check for JWT token
   ├─ If missing, redirect to login
   ├─ If present, verify token
   ├─ If valid, allow access
   └─ If invalid, redirect to login

4. LOGOUT
   ├─ Clear localStorage token
   ├─ Clear user context
   └─ Redirect to home page
```

## State Management

### AuthContext
```
AuthContext
├── user: { id, name, email, phone, role }
├── token: JWT token string
├── loading: boolean
├── login(): Promise<void>
├── register(): Promise<void>
└── logout(): void
```

### LocalStorage Keys
```
• token: JWT authentication token
• user: User object JSON
```

## Error Handling Strategy

```
API Errors
├── 400: Bad Request
│   ├── Validation errors
│   └── Missing fields
├── 401: Unauthorized
│   ├── Invalid credentials
│   └── Missing token
├── 404: Not Found
│   ├── Resource doesn't exist
│   └── Booking/vehicle not found
├── 409: Conflict
│   ├── User already exists
│   └── Duplicate email
└── 500: Server Error
    └── Unexpected error

UI Error Handling
├── Show error message to user
├── Log error to console
├── Provide recovery options
└── Maintain application state
```

## Performance Optimization

### Client-Side
- LocalStorage for token persistence
- Lazy component loading
- Image optimization
- Responsive design
- Efficient re-renders

### Server-Side
- Database indexing
- Query optimization
- API response caching
- Efficient aggregations
- Proper pagination ready

## Security Layers

```
Level 1: Input Validation
├── Client-side validation
├── Server-side validation
└── Type checking (TypeScript)

Level 2: Authentication
├── JWT tokens
├── Token expiration
└── Secure token storage

Level 3: Authorization
├── Role-based access
├── Protected routes
└── Admin-only endpoints

Level 4: Data Protection
├── Password hashing
├── Secure connections
└── Error message filtering

Level 5: Database
├── Input sanitization
├── Parameterized queries
└── Access control
```

## Deployment Architecture

```
┌─────────────────────────────────────┐
│      Vercel (Next.js Hosting)       │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────────────┐  │
│  │    Next.js Application       │  │
│  │  • Pages                     │  │
│  │  • API Routes                │  │
│  │  • Static Assets             │  │
│  │  • Image Optimization        │  │
│  └──────────────────────────────┘  │
│           ▼                         │
│  ┌──────────────────────────────┐  │
│  │   Environment Variables      │  │
│  │  • MONGODB_URI               │  │
│  │  • JWT_SECRET                │  │
│  └──────────────────────────────┘  │
└────────────┬──────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│    MongoDB Atlas (Database)          │
├──────────────────────────────────────┤
│  • users collection                  │
│  • vehicles collection               │
│  • bookings collection               │
│  • Automated backups                 │
│  • Replica sets for HA               │
└──────────────────────────────────────┘
```

## Technology Decisions

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 16 | SSR, Fast refresh, API routes |
| UI Components | shadcn/ui | Pre-built, accessible, customizable |
| Styling | Tailwind CSS | Utility-first, responsive, efficient |
| Database | MongoDB | Flexible schema, scalable, reliable |
| Authentication | JWT + bcryptjs | Stateless, secure, industry standard |
| Language | TypeScript | Type safety, better IDE support |
| State | Context API | Simple, built-in, sufficient for this scale |
| ORM | Mongoose | Schema validation, middleware hooks |

---

This architecture provides a solid foundation for a production-ready vehicle rental platform with clear separation of concerns, scalability, and security.
