# Rare Brew Location Management System

A modern, comprehensive location management system for Rare Brew's tea distribution network. Built with Next.js 14, TypeScript, and Prisma.

## Features

- **Modern UI/UX**: Clean, responsive interface built with React and Tailwind CSS
- **Authentication**: Google Workspace (GSuite) OAuth integration
- **Location Management**: Add, edit, archive, and manage locations with full CRUD operations
- **Shopify Integration**: Automatic sync with Shopify orders and product data
- **Geocoding**: Automatic address validation and coordinate lookup
- **Expiration Management**: Automatic tracking and warnings for location expirations
- **Real-time Updates**: Live data updates with React Query
- **Audit Trail**: Complete history of all location changes
- **Role-based Access**: Admin, Manager, and Viewer roles

## Tech Stack

### Frontend
- **Next.js 14** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Query (TanStack Query)** for server state
- **React Hook Form** with Zod validation
- **Lucide React** for icons

### Backend
- **Next.js API Routes**
- **Prisma** ORM with PostgreSQL
- **NextAuth.js** for authentication
- **Shopify Admin API** integration
- **Google Maps Geocoding API**

### Database
- **PostgreSQL** with Prisma schema
- **Location data** with full audit trail
- **Product caching** from Shopify
- **System settings** and update logs

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Google OAuth credentials
- Shopify API access
- Google Maps API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rarebrew-location-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/rarebrew_locations"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-nextauth-secret-key"
   
   # Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ALLOWED_EMAIL_DOMAINS="rarebrew.com"
   
   # Shopify
   SHOPIFY_SHOP_NAME="your-shop-name"
   SHOPIFY_ACCESS_TOKEN="your-shopify-access-token"
   
   # Google Maps
   GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Google OAuth sign-in
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get session status

### Locations
- `GET /api/locations` - List locations with filtering
- `POST /api/locations` - Create new location
- `GET /api/locations/[id]` - Get single location
- `PUT /api/locations/[id]` - Update location
- `DELETE /api/locations/[id]` - Archive location
- `GET /api/locations/stats` - Get location statistics

### Products
- `GET /api/products` - List all products
- `POST /api/products/sync` - Sync from Shopify
- `GET /api/products/categories` - Get product categories

### System
- `POST /api/system/update` - Manual update trigger
- `GET /api/system/settings` - Get system settings
- `PUT /api/system/settings` - Update system settings
- `GET /api/system/health` - System health check

## Database Schema

The system uses the following main tables:

- **locations** - Main location data with full audit trail
- **products** - Cached Shopify product data
- **location_products** - Many-to-many relationship
- **location_history** - Complete audit trail
- **users** - User accounts and roles
- **system_settings** - Global configuration
- **update_logs** - Sync and update history

## Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Database Setup

For production, use a managed PostgreSQL service:

- **Vercel Postgres** (recommended for Vercel deployment)
- **Supabase**
- **Railway**
- **AWS RDS**

### Environment Variables

Ensure all required environment variables are set in your production environment.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

### Code Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── auth/           # Authentication pages
│   └── globals.css     # Global styles
├── components/         # React components
├── hooks/             # Custom React hooks
├── lib/               # Utility libraries
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is proprietary to Rare Brew.

## Support

For support, contact the development team or create an issue in the repository.
