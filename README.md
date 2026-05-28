# SLPCMS - Street Light Project & Contract Management System

A comprehensive web-based application for managing street light infrastructure projects, contracts, BOQ, IPC payments, and document workflows for the **Addis Ababa City Administration Electric Service Authority**.

## Technology Stack

### Frontend
- **Next.js 14** (React Framework)
- **TypeScript** (Type Safety)
- **TailwindCSS** (Utility-first CSS)
- **ShadCN UI / Radix UI** (Component Library)
- **React Hook Form + Zod** (Form Validation)
- **Axios** (HTTP Client)
- **Recharts** (Charts & Analytics)
- **Lucide React** (Icons)
- **next-themes** (Dark/Light Mode)

### Backend
- **NestJS** (Node.js Framework)
- **Prisma ORM** (Database ORM)
- **PostgreSQL** (Database)
- **JWT Authentication** (Access + Refresh Tokens)
- **bcrypt** (Password Hashing)
- **Passport.js** (Authentication middleware)
- **Multer** (File Uploads)
- **Helmet** (Security Headers)

### DevOps
- **Docker** & **Docker Compose** (Containerization)
- **NGINX** (Reverse Proxy)
- **Ubuntu Server 24.04 LTS** (Target Deployment)

## System Features

### Modules
1. **Authentication & Authorization** - JWT-based auth with role-based access control (7 roles)
2. **Dashboard** - Real-time stats, charts, alerts, and KPIs
3. **Project Management** - Create, track, and manage street light projects
4. **Contract Management** - Contract registration, amendments, variation orders, extensions
5. **BOQ Management** - Bill of Quantities with item tracking and approval workflow
6. **IPC/Payment Management** - Interim Payment Certificates with verification and approval
7. **Contractor Management** - Contractor and consultant registry
8. **Document Management** - File upload, categorization, version tracking, download
9. **Reporting** - Multiple report types with data tables
10. **Notifications** - In-app notification system
11. **Audit Log** - Comprehensive activity tracking

### User Roles
| Role | Description |
|------|-------------|
| SUPER_ADMIN | Full system access |
| DIRECTOR | Director level access |
| PROJECT_MANAGER | Project management |
| CONTRACT_ENGINEER | Contract engineering |
| CONSULTANT | Consultant access |
| CONTRACTOR | Contractor access |
| FINANCE_OFFICER | Finance operations |

## Project Structure

```
slpcms/
├── frontend/                # Next.js Frontend Application
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   │   ├── login/       # Login page
│   │   │   └── (dashboard)/ # Protected dashboard pages
│   │   │       ├── dashboard/
│   │   │       ├── projects/
│   │   │       ├── contracts/
│   │   │       ├── boq/
│   │   │       ├── ipc/
│   │   │       ├── contractors/
│   │   │       ├── reports/
│   │   │       ├── documents/
│   │   │       ├── users/
│   │   │       ├── notifications/
│   │   │       └── settings/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── layout/      # Sidebar, Navbar, AppShell
│   │   │   └── ui/          # Button, Card, Table, Dialog, etc.
│   │   └── lib/             # Utilities, API client, Auth context
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── backend/                 # NestJS Backend API
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts          # Sample data
│   ├── src/
│   │   ├── auth/            # Authentication module
│   │   ├── users/           # User management
│   │   ├── projects/        # Project management
│   │   ├── contracts/       # Contract management
│   │   ├── boq/             # BOQ management
│   │   ├── ipc/             # IPC/Payment management
│   │   ├── contractors/     # Contractor management
│   │   ├── documents/       # Document management
│   │   ├── reports/         # Reporting
│   │   ├── dashboard/       # Dashboard statistics
│   │   ├── notifications/   # Notification system
│   │   └── audit-log/       # Audit logging
│   ├── uploads/             # Uploaded files directory
│   ├── package.json
│   └── tsconfig.json
│
├── docker/                  # Docker configuration
│   ├── docker-compose.yml
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── nginx.conf
│
└── README.md
```

## Quick Start (Development)

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- npm or yarn

### 1. Backend Setup

```bash
cd backend
npm install

# Set up environment variables (copy .env.example to .env and configure)
# Default .env is provided for development

# Run database migrations
npx prisma migrate dev --name init

# Seed sample data
npm run prisma:seed

# Start development server
npm run start:dev
```

The backend API will be available at `http://localhost:4000/api/v1`.

### 2. Frontend Setup

```bash
cd frontend
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:8080`.

### Default Login Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@slpcms.gov.et | admin123 | SUPER_ADMIN |
| director@slpcms.gov.et | admin123 | DIRECTOR |
| pm@slpcms.gov.et | admin123 | PROJECT_MANAGER |
| engineer@slpcms.gov.et | admin123 | CONTRACT_ENGINEER |
| finance@slpcms.gov.et | admin123 | FINANCE_OFFICER |

## Docker Deployment (Production)

### Prerequisites
- Docker 24+
- Docker Compose 2+

### Deploy with Docker

```bash
# Clone the repository
git clone <repository-url>
cd slpcms

# Build and start all services
docker compose -f docker/docker-compose.yml up -d --build

# Run database migrations
docker exec slpcms-backend npx prisma migrate deploy

# Seed database (first time only)
docker exec slpcms-backend npx prisma db seed

# Check logs
docker compose -f docker/docker-compose.yml logs -f
```

### Access the Application
- Frontend: `http://localhost:8080`
- API: `http://localhost:4000/api/v1`
- Database: `localhost:5432`

### Prerequisites

```bash
# On your server (192.168.100.205)
ssh user@192.168.100.205
```

### Deploy via Git

```bash
# Clone the repository directly on the server
git clone https://github.com/Natnaelsf/SL-project-management-system.git ~/slpcms
cd ~/slpcms

# Deploy with Docker
docker compose -f docker/docker-compose.yml up -d --build

# Seed database (first time only)
docker exec slpcms-backend npx prisma db seed
```

### Access the Application
- Frontend: `http://192.168.100.205` (via NGINX, port 80)
- Direct frontend: `http://192.168.100.205:8080`
- API: `http://192.168.100.205/api/v1`

## Ubuntu VPS Deployment

### Requirements
- Ubuntu Server 24.04 LTS
- Docker & Docker Compose installed

### 1. Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
exit  # reconnect after this
```

### 2. Clone and Deploy
```bash
ssh user@192.168.100.205
git clone https://github.com/Natnaelsf/SL-project-management-system.git ~/slpcms
cd ~/slpcms

# Build and start all services
docker compose -f docker/docker-compose.yml up -d --build

# Seed database
docker exec slpcms-backend npx prisma db seed
```

### 3. Configure Firewall
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Useful Docker Commands

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/profile` - Get current user profile

### Users
- `GET /api/v1/users` - List users (paginated)
- `POST /api/v1/users` - Create user
- `GET /api/v1/users/:id` - Get user by ID
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Soft delete user

### Projects
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/:id` - Get project details
- `PATCH /api/v1/projects/:id` - Update project
- `PATCH /api/v1/projects/:id/progress` - Update progress
- `GET /api/v1/projects/delayed` - Get delayed projects
- `GET /api/v1/projects/stats` - Get project statistics
- `DELETE /api/v1/projects/:id` - Soft delete

### Contracts
- `GET /api/v1/contracts` - List contracts
- `POST /api/v1/contracts` - Create contract
- `GET /api/v1/contracts/:id` - Get contract details
- `PATCH /api/v1/contracts/:id` - Update contract
- `POST /api/v1/contracts/:id/amendments` - Add amendment
- `GET /api/v1/contracts/:id/amendments` - Get amendments
- `POST /api/v1/contracts/:id/variations` - Add variation order
- `GET /api/v1/contracts/:id/variations` - Get variations
- `POST /api/v1/contracts/:id/extensions` - Add extension
- `GET /api/v1/contracts/:id/extensions` - Get extensions

### BOQ
- `GET /api/v1/boq` - List BOQ items
- `POST /api/v1/boq` - Create BOQ item
- `GET /api/v1/boq/:id` - Get BOQ item
- `PATCH /api/v1/boq/:id` - Update BOQ item
- `PATCH /api/v1/boq/:id/approve` - Approve/reject BOQ item
- `GET /api/v1/boq/project/:projectId/summary` - Get BOQ summary

### IPC/Payments
- `GET /api/v1/ipc` - List IPC payments
- `POST /api/v1/ipc` - Create IPC
- `GET /api/v1/ipc/:id` - Get IPC details
- `PATCH /api/v1/ipc/:id/status` - Update IPC status
- `POST /api/v1/ipc/:id/verify` - Verify IPC quantities
- `POST /api/v1/ipc/:id/payments` - Add payment
- `GET /api/v1/ipc/:id/payments` - Get payments

### Contractors
- `GET /api/v1/contractors` - List contractors
- `GET /api/v1/contractors/all` - List simple (no pagination)
- `POST /api/v1/contractors` - Create contractor
- `GET /api/v1/contractors/:id` - Get contractor details
- `PATCH /api/v1/contractors/:id` - Update contractor

### Documents
- `GET /api/v1/documents` - List documents
- `POST /api/v1/documents/upload` - Upload file
- `GET /api/v1/documents/:id` - Get document details
- `GET /api/v1/documents/:id/download` - Download file

### Dashboard
- `GET /api/v1/dashboard` - Get dashboard statistics
- `GET /api/v1/dashboard/charts` - Get chart data

### Reports
- `GET /api/v1/reports/project-progress` - Project progress report
- `GET /api/v1/reports/financial` - Financial report
- `GET /api/v1/reports/contract-status` - Contract status report
- `GET /api/v1/reports/ipc` - IPC payment report
- `GET /api/v1/reports/delayed-projects` - Delayed projects report
- `GET /api/v1/reports/contractor-performance` - Contractor performance

### Notifications
- `GET /api/v1/notifications` - List notifications
- `GET /api/v1/notifications/unread-count` - Get unread count
- `PATCH /api/v1/notifications/:id/read` - Mark as read
- `POST /api/v1/notifications/mark-all-read` - Mark all as read

### Audit Logs
- `GET /api/v1/audit-logs` - List audit logs (Super Admin & Director only)

## Security Features
- ✅ JWT Authentication (access + refresh tokens)
- ✅ Role-Based Access Control (7 roles)
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ Rate limiting (ThrottlerModule)
- ✅ Helmet security headers
- ✅ CORS configuration
- ✅ Input validation (class-validator)
- ✅ SQL injection protection (Prisma ORM)
- ✅ XSS protection
- ✅ HTTPS-ready configuration
- ✅ Environment variable protection
- ✅ Soft delete functionality
- ✅ Audit logging

## Performance Optimizations
- ✅ Paginated API responses
- ✅ Database indexing
- ✅ Prisma query optimization
- ✅ Lazy loading components
- ✅ Next.js static generation where applicable
- ✅ NGINX caching for static files
- ✅ Gzip compression

## License
This project is developed for the Addis Ababa City Administration Electric Service Authority.
