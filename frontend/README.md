# Business Lead Generator

A web application to generate business leads based on keywords and location using Google Maps API.

## Features

- Search for businesses based on keywords and location
- Customizable search radius and result limit
- View detailed business information including name, address, phone, and website
- Export results to CSV format

## Setup Instructions

### Backend (FastAPI)

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows, use: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   - Create a `.env` file in the backend directory
   - Add your Google Maps API key: `GOOGLE_MAPS_API_KEY=your_key_here`

5. Run the backend server:
   ```
   uvicorn app.main:app --reload
   ```

### Frontend (Next.js)

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Create a `.env.local` file in the frontend directory
   - Add the API URL: `NEXT_PUBLIC_API_URL=http://localhost:8000`

4. Run the development server:
   ```
   npm run dev
   ```

5. Access the application at http://localhost:3000

## Google Maps API Setup

1. Go to the Google Cloud Console
2. Create a new project
3. Enable the Places API and Maps JavaScript API
4. Create API credentials and restrict them appropriately
5. Add the API key to the backend `.env` file