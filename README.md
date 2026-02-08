# CashTrack Frontend

Vendor Payment Management System - Frontend Application

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your backend API URL

4. Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Features

### Vendor Features
- Dashboard with statistics and monthly charts
- Create withdrawal/deposit requests
- View and pick available requests
- Upload payment slips
- Verify received payments
- Real-time notifications

### Super Admin Features
- System overview dashboard
- Vendor management
- Create new vendor accounts
- View all vendor statistics
- System-wide analytics

## Technology Stack
- React 18 with TypeScript
- Ant Design for UI components
- Axios for API calls with interceptors
- Recharts for data visualization
- React Router for navigation
- Vite for build tooling
