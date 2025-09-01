# Todo App

A modern, full-stack Todo application built with Vue.js (frontend) and Node.js (backend). This app allows users to manage their tasks efficiently with a clean, responsive interface and Google authentication.

## Features

- Add, edit, and delete todos
- Mark todos as complete/incomplete
- Sort and filter todos by ID, title, priority, or date
- Google Sign-In/Sign-Out integration
- Responsive and modern UI
- Backend API for persistent storage

## Project Structure

```
├── index.html
├── jsconfig.json
├── package.json
├── vite.config.js
├── public/
│   └── favicon.ico
├── src/
│   ├── main.js
│   ├── assets/
│   └── components/
│       ├── Dropdown.vue
│       ├── Todos.vue
│       └── icons/
│           └── ...
└── vueBackend/
    ├── backend.js
    └── package.json
```

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm

### Setup

#### Frontend
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open your browser at `http://localhost:5173` (or the port shown in the terminal).

#### Backend
1. Navigate to the `vueBackend` directory:
   ```bash
   cd vueBackend
   ```
2. Install backend dependencies:
   ```bash
   npm install
   ```
3. Start the backend server:
   ```bash
   node backend.js
   ```
4. The backend will run on `http://localhost:3000` by default.

## API Endpoints
- `GET /api/getTodos` — Fetch all todos
- `POST /api/saveFile` — Save todos (called automatically when leaving the site)

## Customization
- Update Google API credentials in `src/main.js` as needed.
- Modify UI components in `src/components/` for custom features or styles.

## License
MIT
