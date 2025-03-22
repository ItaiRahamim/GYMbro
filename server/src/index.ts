import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import apiRoutes from './routes';
import passport from 'passport';
import './config/passport';
import fs from 'fs';
import https from 'https';
import http from 'http';
import swaggerSpec from './config/swagger';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Express = express();
const port = process.env.PORT || 5000;
const httpsPort = process.env.HTTPS_PORT || 5443;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'https://localhost:3000',
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(passport.initialize());

// Helper function to verify uploads directory
const verifyUploadsDirectory = () => {
  const uploadsPath = path.join(__dirname, '../uploads');
  console.log('[Server] Checking uploads directory:', uploadsPath);
  
  if (!fs.existsSync(uploadsPath)) {
    console.error('[Server] CRITICAL ERROR: Uploads directory does not exist!');
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log('[Server] Created missing uploads directory');
  } else {
    console.log('[Server] Uploads directory exists');
    
    // Check posts directory
    const postsPath = path.join(uploadsPath, 'posts');
    if (!fs.existsSync(postsPath)) {
      console.error('[Server] Posts directory does not exist!');
      fs.mkdirSync(postsPath, { recursive: true });
      console.log('[Server] Created missing posts directory');
    } else {
      // List some files to verify content
      try {
        const files = fs.readdirSync(postsPath);
        console.log(`[Server] Found ${files.length} files in posts directory`);
        if (files.length > 0) {
          console.log('[Server] Sample files:', files.slice(0, 5));
        }
      } catch (err) {
        console.error('[Server] Error reading posts directory:', err);
      }
    }
  }
  
  return uploadsPath;
};

// Serve uploaded files with improved logging
const uploadsDir = verifyUploadsDirectory();
app.use('/uploads', express.static(uploadsDir));
console.log(`[Server] Static files middleware configured for path: ${uploadsDir}`);

// API routes
app.get('/', (req: Request, res: Response) => {
  res.send('GYMbro2 API is running');
});

// Use API routes
app.use('/api', apiRoutes);

// Add Swagger documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
console.log('[Server] Swagger documentation route set up at /api-docs');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || '';
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// SSL options
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, '../ssl/server.key')),
  cert: fs.readFileSync(path.join(__dirname, '../ssl/server.cert'))
};

// Start server
connectDB().then(() => {
  // Create HTTPS server
  const httpsServer = https.createServer(sslOptions, app);
  httpsServer.listen(httpsPort, () => {
    console.log(`HTTPS Server running on port ${httpsPort}`);
  });

  // Also start HTTP server for development (optional)
  // In production, you would typically redirect HTTP to HTTPS
  const httpServer = http.createServer(app);
  httpServer.listen(port, () => {
    console.log(`HTTP Server running on port ${port} (for development only)`);
  });
});

export default app; 