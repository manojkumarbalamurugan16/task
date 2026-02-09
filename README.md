# Multi-Box Task Application

A full-stack web application for managing groups and dynamic input boxes with selection, copy, and delete functionality.

## Tech Stack

- **Frontend**: React.js, React Router, Axios, CSS3
- **Backend**: Node.js, Express.js
- **Database**: MySQL

## Features

1. **MultiBox Page** (`/multiBox`)
   - Create/Edit groups with unique names
   - Group name suggestions while typing
   - Dynamic text box creation
   - Copy, selection toggle, and delete functionality for each text box
   - Fraction display showing selected/total count (⅕, ⅖, ⅗, ⅘, etc.)
   - Save functionality to database

2. **View List Page** (`/viewListInfo`)
   - List all groups sorted by modified date (newest first)
   - View details popup with all input information
   - Edit groups
   - Delete groups (soft delete)

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Database Setup

1. Create a MySQL database:
```sql
CREATE DATABASE taskdb;
```

2. Run the schema file to create tables:
```bash
mysql -u root -p taskdb < server/database/schema.sql
```

Or manually execute the SQL from `server/database/schema.sql`

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `server` directory:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=taskdb
PORT=3001
FRONTEND_URL=http://localhost:5173
```

4. Start the backend server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the project root:
```bash
cd ..
```

2. Install dependencies:
```bash
npm install
```

3. Update the API base URL in `src/config/api.js` if needed:
```javascript
export const API_BASE_URL = 'http://localhost:3001/api';
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Project Structure

```
task/
├── server/                 # Backend server
│   ├── database/
│   │   ├── connection.js  # MySQL connection pool
│   │   └── schema.sql     # Database schema
│   ├── routes/
│   │   ├── groups.js      # Group API routes
│   │   └── inputs.js      # Input API routes
│   ├── server.js          # Express server setup
│   └── package.json       # Backend dependencies
├── src/
│   ├── components/
│   │   ├── MultiBox.jsx   # Main multi-box component
│   │   ├── MultiBox.css
│   │   ├── ViewListInfo.jsx # List view component
│   │   └── ViewListInfo.css
│   ├── config/
│   │   └── api.js         # API configuration (base URL)
│   ├── services/
│   │   └── api.js         # API service functions
│   ├── App.jsx            # Main app component with routing
│   └── main.jsx           # React entry point
└── package.json           # Frontend dependencies
```

## API Endpoints

### Groups
- `GET /api/groups` - Get all groups
- `GET /api/groups/:id` - Get group by ID
- `GET /api/groups/search/:name` - Search groups by name
- `GET /api/groups/check/:name` - Check if group name exists
- `POST /api/groups` - Create new group
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group

### Inputs
- `GET /api/inputs/group/:groupId` - Get all inputs for a group
- `GET /api/inputs/:id` - Get input by ID
- `POST /api/inputs` - Create new input
- `PUT /api/inputs/:id` - Update input
- `DELETE /api/inputs/:id` - Soft delete input
- `POST /api/inputs/bulk` - Bulk save inputs for a group

## Configuration

### Changing Base URL

To change the API base URL for production:

1. **Frontend**: Edit `src/config/api.js`:
```javascript
export const API_BASE_URL = 'https://your-domain.com/api';
```

2. **Backend**: Update CORS settings in `server/server.js` and `.env` file:
```env
FRONTEND_URL=https://your-domain.com
```

## Usage

1. Navigate to `http://localhost:5173/multiBox` to create a new group
2. Enter a unique group name
3. Type names and click "+" to add text boxes
4. Use the icons to copy, select, or delete text boxes
5. Click "Save" to save to database
6. Navigate to `http://localhost:5173/viewListInfo` to view all groups
7. Click the details icon to see full information
8. Click the edit icon to modify a group
9. Click the delete icon to remove a group

## Database Schema

### dbGroup Table
- `Id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `groupName` (VARCHAR(255), UNIQUE)
- `createdAt` (TIMESTAMP)
- `modifiedAt` (TIMESTAMP)

### dbInputs Table
- `Id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `groupID` (INT, FOREIGN KEY -> dbGroup.Id)
- `Name` (VARCHAR(255))
- `isSelected` (BOOLEAN)
- `isDeleted` (BOOLEAN)
- `orderNum` (INT)
- `createdAt` (TIMESTAMP)
- `modifiedAt` (TIMESTAMP)

## Notes

- Group names must be unique
- Deletes are soft deletes (isDeleted flag)
- Inputs are ordered by orderNum
- Fraction display shows Unicode fractions (⅕, ⅖, ⅗, ⅘) for counts up to 5
