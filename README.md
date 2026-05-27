# PBR Management System

A TypeScript + React project with Vite and Convex backend for managing SI Increments and Ticket Cancellations.

## Features

- **SI Increments Management**: Create, view, and manage SI increment requests with fields including requestee, requested date, shop name, amount, approver, status, and approver comments.
- **Ticket Cancellation Management**: Manage ticket cancellation requests with fields including TPM No, Retailer ID, customer details, and approval tracking.
- **Real-time Database**: Convex backend for seamless data synchronization
- **Responsive UI**: Built with React and styled with modern CSS
- **TypeScript Support**: Full type safety across the application

## Project Structure

```
pbrmanagement/
├── src/
│   ├── components/
│   │   ├── SIIncrements.tsx
│   │   ├── SIIncrements.css
│   │   ├── TicketCancellation.tsx
│   │   └── TicketCancellation.css
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── App.css
│   ├── main.tsx
│   └── index.css
├── convex/
│   ├── schema.ts
│   ├── siIncrements.ts
│   └── ticketCancellation.ts
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── convex.json
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd pbrmanagement
```

2. Install dependencies:
```bash
npm install
```

3. Set up Convex backend:
```bash
npm run convex
```

4. Create a `.env.local` file in the root directory and add your Convex URL:
```
VITE_CONVEX_URL=your_convex_url_here
```

## Running the Application

### Development Server

Start both Vite frontend and Convex backend:

```bash
# Terminal 1: Start Vite dev server
npm run dev

# Terminal 2: Start Convex backend
npm run convex
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Available Features

### SI Increments
- Create new SI increment requests
- View all SI increments in a table
- Track approval status (Pending, Approved, Rejected)
- Add approver comments
- Delete SI increments

### Ticket Cancellations
- Create ticket cancellation requests
- Manage replacement details
- Track customer and retailer information
- Monitor approval workflow
- Delete cancellation requests

## Data Models

### SI Increment
- Requestee
- Requested Date
- Shop Name
- Amount
- Approver
- Status (Pending/Approved/Rejected)
- Approver's Comments
- Date Approved

### Ticket Cancellation
- Requestee
- Requested Date
- TPM No
- Retailer ID
- To Cancel
- Replacement
- Amount
- Reason
- Customer No
- Approver
- Status (Pending/Approved/Rejected)
- Approver's Comments
- Date Approved

## Technologies Used

- **Frontend**: React 18, TypeScript, Vite, CSS3
- **Backend**: Convex (Backend-as-a-Service)
- **Build Tool**: Vite
- **Package Manager**: npm

## License

This project is proprietary and confidential.
