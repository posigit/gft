# Presken GFT Deployment Quick Guide

## Frontend Deployment (Vercel)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure build settings:
   - Framework: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`
4. Add environment variables:
   - `REACT_APP_API_URL`: Your backend URL (e.g., https://presken-gft-api.onrender.com/api)
5. Deploy

## Backend Deployment (Render)

1. Push your code to GitHub
2. Connect your repository to Render
3. Configure build settings:
   - Environment: Node
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add environment variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A secure random string
   - `JWT_REFRESH_SECRET`: Another secure random string
   - `JWT_EXPIRES_IN`: `24h`
   - `JWT_REFRESH_EXPIRES_IN`: `7d`
   - `FRONTEND_URL`: Your Vercel frontend URL (e.g., https://presken-gft.vercel.app)
5. Deploy

## Important Notes

- Make sure your MongoDB Atlas database is properly configured and accessible
- Update the CORS settings if you encounter cross-origin issues
- For detailed deployment instructions, refer to the [deployment-guide.md](./deployment-guide.md) file

## Default Login Credentials

- Super Admin: `admin@presken.com / admin123`
- Hotel Admin: `awolowo@presken.com / awolowo111`