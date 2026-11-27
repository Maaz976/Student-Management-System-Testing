# Student Management System (SQE Assignment 3)

A full-stack Student Management System built with Node.js, Express, HTML, CSS, and JavaScript, used as the System Under Test (SUT) for **SE3002 - Software Quality Engineering (Assignment 3)**.

> Adapted from [tanishkayadav10/student-management](https://github.com/tanishkayadav10/student-management) with syntax fixes in `backend/routes/attendance.js` and `backend/routes/subjects.js`.

## Features

- Admin Authentication (`POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`)
- Student CRUD & Search (`GET/POST/PUT/DELETE /api/students`)
- Subject CRUD (`GET/POST/PUT/DELETE /api/subjects`)
- Attendance Tracking & Stats (`GET/POST/PUT /api/attendance`)
- Marks Entry, Grade Calculation & Result Card Generation (`GET/POST/PUT/DELETE /api/marks`, `GET /api/marks/result/:studentId`)

## Tech Stack

- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Backend:** Node.js, Express.js, Express Session, `bcryptjs`, `cors`, `uuid`
- **Data Store:** In-memory store (`backend/config/db.js`)

## Setup & Execution Instructions

### Prerequisites

- Node.js (v18+ recommended; tested on v24.20.0)
- npm

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Start the Application

```bash
npm start
```

- Web UI: `http://localhost:3000`
- API Base URL: `http://localhost:3000/api`
- Health Check: `GET http://localhost:3000/api/health`
- Default Admin Credentials: `admin` / `admin123`

## Project Structure

```text
student-management/
├── backend/
│   ├── config/db.js
│   ├── middleware/auth.js
│   ├── routes/
│   │   ├── attendance.js
│   │   ├── auth.js
│   │   ├── marks.js
│   │   ├── students.js
│   │   └── subjects.js
│   ├── package.json
│   └── server.js
└── frontend/
    ├── css/styles.css
    ├── js/
    │   ├── api.js
    │   ├── app.js
    │   └── utils.js
    └── index.html
```
