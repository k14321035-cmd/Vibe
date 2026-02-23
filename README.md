<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your VibeZone app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:** Node.js

1. **Install Dependencies** (do this once)

   **Frontend:**

   ```bash
   npm install
   ```

   **Backend:**

   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment**
   - Ensure `.env` or `.env.local` exists in `backend/` (can be copied from `.env.example`).

3. **Run the App** (requires two terminals)

   **Terminal 1 (Backend):**

   ```bash
   cd backend
   npm run dev
   ```

   _Runs on http://localhost:3001_

   **Terminal 2 (Frontend):**

   ```bash
   npm run dev
   ```

   _Runs on http://localhost:3000_
