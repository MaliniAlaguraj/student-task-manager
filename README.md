# Smart Campus Complaint Management System

React (Vite) frontend + Node/Express backend + SQLite database. No paid services or API keys.

```
smart-campus-complaints/
├── backend/            Express API + SQLite (complaints.db is created automatically)
│   ├── package.json
│   └── server.js
└── frontend/           React app (Vite, React Router, Lucide icons)
    ├── package.json, vite.config.js, index.html
    └── src/ main.jsx, App.jsx, api.js, styles.css, pages/{Landing,Student,Admin}.jsx
```

## Run it (needs Node.js 18+)
Open two terminals in VS Code (Terminal > New Terminal, then the split icon).

Terminal 1 - backend:
    cd backend
    npm install
    npm start          # http://localhost:5000

Terminal 2 - frontend:
    cd frontend
    npm install
    npm run dev        # http://localhost:5173

Open http://localhost:5173. Start the backend first.

## Demo
- Student: Student Portal > Submit complaint. Seed register numbers: 21CS001, 21EC014, 21CS045.
- Admin: Admin Dashboard > login with `admin` / `admin123` (demo credentials only).

## Test scenarios
1. Submit: fill the form with an empty field to see validation errors, then submit properly. A toast shows the new ID (e.g. CMP-1007) and you land on "My complaints".
2. Search: "Track by ID" with CMP-1002 shows its status and dates; a wrong ID shows an error.
3. Filter: in Admin > All complaints, search "projector", filter by category Wi-Fi, filter by status Pending, then Clear filters.
4. Status update: change a status in the table, or use the eye icon for the details view. Last updated changes.
5. Cross-portal: keep the student tab open on "My complaints" for 21CS001 and change that complaint in admin; the student view refreshes within about 8 seconds.
6. Persistence: stop and restart both servers. All data remains (stored in backend/complaints.db). Delete that file to reset to the sample data.

## API
POST /api/complaints, GET /api/complaints?registerNo=, GET /api/complaints/:id,
POST /api/admin/login, GET /api/admin/complaints, GET /api/admin/stats, PATCH /api/admin/complaints/:id/status
