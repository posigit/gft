# Presken GFT Deployment Guide

This guide provides step-by-step instructions for deploying the Presken Guest Feedback Tracker (GFT) application. The frontend will be deployed on Vercel, and the backend will be deployed on Render.

## Prerequisites

1. GitHub account (for connecting to Vercel and Render)
2. Vercel account (for frontend deployment)
3. Render account (for backend deployment)
4. MongoDB Atlas account (for database)

## Part 1: Frontend Deployment on Vercel

### Step 1: Prepare Your Repository

Ensure your repository is pushed to GitHub with the following files:
- `vercel.json` (already created)
- `.env.production` (already created)

### Step 2: Deploy to Vercel

1. Log in to [Vercel](https://vercel.com/)
2. Click "Add New" > "Project"
3. Import your GitHub repository
4. Configure the project:
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Root Directory: `./` (leave as is)
5. Add Environment Variables (if needed):
   - `REACT_APP_API_URL`: Your backend URL (e.g., https://presken-gft-api.onrender.com/api)
6. Click "Deploy"

### Step 3: Verify Deployment

1. Once deployment is complete, Vercel will provide a URL for your frontend application
2. Open the URL in your browser to verify that the frontend is working

## Part 2: Backend Deployment on Render

### Step 1: Prepare MongoDB Atlas

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster if you don't have one
3. Set up database access:
   - Create a database user with appropriate permissions
   - Set a secure password
4. Set up network access:
   - Add IP access list entry: `0.0.0.0/0` (to allow access from anywhere)
5. Get your MongoDB connection string

### Step 2: Deploy to Render

1. Log in to [Render](https://render.com/)
2. Click "New" > "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - Name: `presken-gft-api`
   - Environment: `Node`
   - Region: Choose the region closest to your users
   - Branch: `main` (or your default branch)
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render will automatically assign a port, but we set this as a fallback)
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A secure random string for JWT token signing
   - `JWT_REFRESH_SECRET`: Another secure random string for refresh tokens
   - `JWT_EXPIRES_IN`: `24h`
   - `JWT_REFRESH_EXPIRES_IN`: `7d`
6. Click "Create Web Service"

### Step 3: Verify Backend Deployment

1. Once deployment is complete, Render will provide a URL for your backend API
2. Test the API by visiting `https://your-render-url.onrender.com/` (you should see the welcome message)

## Part 3: Connect Frontend to Backend

1. Update the frontend environment variable in Vercel:
   - Go to your project settings in Vercel
   - Navigate to "Environment Variables"
   - Add or update `REACT_APP_API_URL` with your Render backend URL
2. Redeploy the frontend if necessary

## Part 4: Final Verification

1. Open your frontend application URL
2. Try to log in with the default credentials:
   - Super Admin: `admin@presken.com / admin123`
   - Hotel Admin: `awolowo@presken.com / awolowo111`
3. Verify that all features are working correctly

## Troubleshooting

### CORS Issues

If you encounter CORS issues, ensure that your backend CORS configuration allows requests from your Vercel domain:

1. Update the CORS configuration in `server/src/index.js`:

```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-vercel-domain.vercel.app'] 
    : 'http://localhost:3000',
  credentials: true
}));
```

2. Add your Vercel domain to the environment variables in Render:
   - `FRONTEND_URL`: `https://your-vercel-domain.vercel.app`

### Database Connection Issues

If the backend cannot connect to MongoDB:

1. Verify that your MongoDB Atlas connection string is correct
2. Ensure that the database user has the correct permissions
3. Check that the IP access list includes `0.0.0.0/0` or the specific IP of your Render service

### JWT Token Issues

If authentication is not working:

1. Ensure that `JWT_SECRET` and `JWT_REFRESH_SECRET` are set correctly in your Render environment variables
2. Check that the token expiration times are appropriate for your use case

## Maintenance

### Updating the Application

1. Push changes to your GitHub repository
2. Vercel and Render will automatically rebuild and deploy the updated application

### Monitoring

1. Use Vercel and Render dashboards to monitor your application's performance and logs
2. Set up alerts for critical errors or downtime

---

Congratulations! Your Presken Guest Feedback Tracker is now deployed and ready to use.