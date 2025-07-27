In the future, I want to replace this system with a more robust one. Help me craft a prompt for a rebuild of this system using modern react and css frameworks. It should include detailed workflows and all requirements necessary for an AI agent to craft the application from scratch using modern standards and best practices. I would like for the "source of truth" of location data to reside within this system instead of Shopify. It should better integrate the map data updater functionality, provide the ability to manually trigger updates, allow for editing and archiving not just manual but also automatically added locations, configure location expiration date. All SKU/product information should be pulled from Shopify instead of being hard coded. There only needs to be one page, the Location Management page which will allow for all of this functionality as well as adding a new location. There is no need for a separate page for adding locations, nor an approval system. Assume the admin/approver will be the person adding locations. Ask me any follow up questions regarding tech stack, workflow, or requirements before building the prompt.


Evaluate this existing project and then rebuild it from scratch.

## Project Overview
Rebuild a comprehensive location management system for Rare Brew's tea distribution network. This system will serve as the single source of truth for all location data, integrating Shopify order data, manual location management, and automated map updates. The system should replace the current Node.js/Express implementation with a modern React-based solution.

## Tech Stack Requirements

### Frontend
- **React 18+** with TypeScript for type safety
- **Next.js 14+** (App Router) for full-stack capabilities and optimal performance
- **Tailwind CSS** for responsive, utility-first styling
- **React Query (TanStack Query)** for server state management and caching
- **React Hook Form** for form handling with validation
- **Zustand** for client-side state management
- **Lucide React** for consistent iconography

### Backend
- **Next.js API Routes** for backend functionality
- **Prisma** as ORM with **PostgreSQL** database
- **NextAuth.js** for Google Workspace (GSuite) authentication
- **Shopify Admin API** for product/SKU data
- **Google Maps Geocoding API** for address validation
- **@slack/web-api** for Slack integrations

### Deployment
- **Vercel** for hosting (optimal for Next.js) with instructions on how to set up
- **PostgreSQL** on Vercel with instructions on how to set up
- **Environment variables** for all API keys and configuration

## Core Functionality Requirements

### 1. Authentication & Authorization
- Google Workspace (GSuite) OAuth integration
- Role-based access (Admin, Manager, Viewer)
- Session management with secure cookies
- Automatic logout on session expiration

### 2. Location Data Management
- **Unified Location Model** with the following fields:
  - `id` (UUID)
  - `name` (string)
  - `address` (object with street, city, state, zip, country)
  - `coordinates` (latitude, longitude)
  - `contact` (object with name, email, phone)
  - `products` (array of product IDs)
  - `status` (enum: 'active', 'archived', 'expired')
  - `source` (enum: 'manual', 'shopify')
  - `salesChannel` (string)
  - `dealOwner` (string)
  - `expirationDate` (date, configurable per location)
  - `archiveReason` (string, for manually archived locations)
  - `createdAt`, `updatedAt`, `archivedAt` (timestamps)
  - `metadata` (JSON for additional data)

### 3. Product/SKU Management
- **Dynamic Product Loading** from Shopify Admin API
- **Product Caching** with 24-hour refresh cycle
- **Product Categories** (Loose Tea, Sparkling Tea, etc.)
- **Product Search & Filtering** in location forms
- **Product Validation** against Shopify inventory

### 4. Location Lifecycle Management
- **Add Location**: Manual entry with address geocoding
- **Edit Location**: Update any field with audit trail
- **Archive Location**: Manual archiving with reason
- **Auto-Archive**: Automatic archiving on expiration
- **Expiration Warnings**: 30, 14, and 7-day warnings
- **Bulk Operations**: No bulk operations necessary

### 5. Data Integration
- **Shopify Order Processing**: Daily sync of new orders
- **Customer Location Extraction**: From Shopify customer data
- **Geocoding**: Automatic address validation and coordinate lookup
- **Data Migration**: Import existing locations from current system
- **Shopify Asset Updates**: Push location data to Shopify for public map consumption

### 6. Shopify Integration & Update System
- **Asset File Updates**: Push location data to Shopify assets for public map consumption
- **Data Validation**: Ensure data integrity before pushing to Shopify
- **Scheduled Updates**: Daily automated Shopify sync
- **Manual Trigger**: Admin-initiated updates
- **Real-time Updates**: Immediate updates when locations are modified
- **Update History**: Track all update operations
- **Error Handling**: Comprehensive error handling for Shopify API failures and logging

## User Interface Requirements

### Single Page Application
- **Location Management Dashboard**: Primary interface
- **Responsive Design**: Desktop-first with mobile support
- **Modern UI/UX**: Clean, intuitive interface

### Dashboard Components
1. **Statistics Cards** (clickable for filtering):
   - Total Locations
   - Active Locations
   - Expiring Soon (30 days)
   - Archived Locations

2. **Search & Filter Bar**:
   - Text search (name, address, contact)
   - Status filter (dropdown)
   - Product filter (multi-select)
   - Date range filter
   - Expiration filter

3. **Location Grid/List View**:
   - Card-based layout
   - Status indicators
   - Expiration warnings
   - Quick actions (Edit, Archive)
   - Responsive design

4. **System Status View**:
   - Shopify sync status
   - Last update timestamp
   - Error logs and notifications
   - System health indicators

5. **Add/Edit Location Modal**:
   - Form validation
   - Address autocomplete
   - Product multi-select
   - Expiration date picker
   - Real-time geocoding

### Configuration Panel
- **Global Settings**:
  - Default expiration period (x days from latest order)
  - Warning thresholds
  - Update frequency
  - Notification preferences

## Database Schema

### Tables
1. **locations** (main location data)
2. **products** (cached Shopify products)
3. **location_products** (many-to-many relationship)
4. **location_history** (audit trail)
5. **system_settings** (global configuration)
6. **update_logs** (sync history)

### Indexes
- Location status and expiration dates
- Geographic coordinates
- Product relationships
- Search text fields

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Google OAuth
- `POST /api/auth/signout` - Logout
- `GET /api/auth/session` - Session status

### Locations
- `GET /api/locations` - List with filtering
- `POST /api/locations` - Create location
- `GET /api/locations/[id]` - Get single location
- `PUT /api/locations/[id]` - Update location
- `DELETE /api/locations/[id]` - Archive location
- `GET /api/locations/stats` - Dashboard statistics

### Products
- `GET /api/products` - List all products
- `POST /api/products/sync` - Sync from Shopify
- `GET /api/products/categories` - Product categories

### System
- `POST /api/system/update` - Manual update trigger
- `GET /api/system/settings` - Get settings
- `PUT /api/system/settings` - Update settings
- `GET /api/system/health` - System status

## Workflow Specifications

### Location Addition Workflow
1. Admin clicks "Add Location"
2. Form opens with validation
3. Address entered → automatic geocoding
4. Products selected from Shopify data
5. Expiration date set (default or custom)
6. Location saved → status: 'active'
7. Real-time data update
8. Optional notifications sent

### Expiration Management Workflow
1. Daily job checks expiration dates
2. 30/14/7 day warnings sent
3. On expiration → status: 'expired'
4. Auto-archive after grace period
5. Notification to admin

### Shopify Sync Workflow
1. Scheduled daily sync
2. Fetch new orders from Shopify
3. Extract customer locations
4. Geocode new addresses
5. Match against existing locations
6. Add new locations → status: 'active'
7. Update existing locations if needed, including expiration dates
8. Log sync results

### Manual Update Workflow
1. Admin clicks "Update Now"
2. Show progress indicator
3. Execute Shopify sync
4. Update location data
5. Send completion notification
6. Log update details

## Error Handling & Monitoring

### Error Categories
- **Shopify API errors** (rate limits, auth issues)
- **Geocoding errors** (invalid addresses)
- **Database errors** (connection, constraints)
- **Authentication errors** (expired sessions)

### Monitoring
- **Health checks** for all external APIs
- **Performance metrics** (response times, sync duration)
- **Error logging** with stack traces
- **User activity tracking** (audit trail)

## Security Requirements

### Data Protection
- **Input validation** on all forms
- **SQL injection prevention** via Prisma
- **XSS protection** via React sanitization
- **CSRF protection** for all mutations
- **Rate limiting** on API endpoints

### Access Control
- **Google Workspace authentication**
- **Session management**
- **Role-based permissions**
- **Audit logging**

## Performance Requirements

### Optimization
- **Server-side rendering** for initial load
- **Client-side caching** with React Query
- **Database query optimization**
- **CDN integration** for static assets

### Scalability
- **Pagination** for large location lists
- **Virtual scrolling** for performance
- **Background processing** for heavy operations

## Migration Strategy

### Data Import
1. **Export current data** from existing system
2. **Transform data** to new schema
3. **Import locations** with source tracking
4. **Validate imported data**
5. **Update Shopify integration**

### Deployment
1. **Staging environment** setup
2. **Data migration** testing
3. **User acceptance testing**
4. **Production deployment**
5. **Monitoring setup**

## Testing Requirements

### Test Coverage
- **Unit tests** for all utilities
- **Integration tests** for API endpoints
- **E2E tests** for critical workflows
- **Performance tests** for large datasets

### Quality Assurance
- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for formatting
- **Husky** for pre-commit hooks

## Documentation Requirements

### Technical Documentation
- **API documentation** with examples
- **Database schema** documentation
- **Deployment guide**
- **Troubleshooting guide**

### User Documentation
- **Admin user guide**
- **Feature walkthroughs**
- **FAQ section**

## Success Criteria

### Functional Requirements
- ✅ All current functionality preserved
- ✅ Modern, responsive UI
- ✅ Real-time updates
- ✅ Comprehensive location management
- ✅ Shopify integration
- ✅ Expiration management
- ✅ Audit trail

### Performance Requirements
- ✅ Page load times < 2 seconds
- ✅ Search results < 500ms
- ✅ Shopify sync < 30 seconds
- ✅ 99.9% uptime
- ✅ Handle 10,000+ locations

### User Experience
- ✅ Intuitive navigation
- ✅ Fast search and filtering
- ✅ Clear status indicators
- ✅ Helpful error messages
- ✅ Mobile responsiveness

This system should provide a robust, scalable foundation for Rare Brew's location management needs while maintaining simplicity and ease of maintenance. 