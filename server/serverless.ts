// Serverless entry point for Vercel
// This file exports the Express app without starting a server
import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Initialize the app
let isInitialized = false;
let initPromise: Promise<void> | null = null;

async function initializeApp() {
  if (isInitialized) return;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    try {
      await registerRoutes(app);
      
      // Error handler
      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
      });
      
      isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize app:', error);
      initPromise = null;
      throw error;
    }
  })();
  
  return initPromise;
}

// Export a handler that ensures initialization before handling requests
export default async (req: any, res: any) => {
  await initializeApp();
  return app(req, res);
};

