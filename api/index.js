// Vercel serverless function entry point
// Imports the Express app built from server/serverless.ts
// Updated: Dec 2, 2025 - Force rebuild

const serverModule = await import('../dist/serverless.js');

// Export the Express app for Vercel serverless
export default serverModule.default;
