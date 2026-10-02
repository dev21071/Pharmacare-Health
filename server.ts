import path from 'path';
import type { Request, Response } from 'express';
import { app } from './server/app.ts';
import { watchdog } from './server/watchdog.ts';

const PORT = Number(process.env.PORT) || 3000;

export async function startServer() {
  // Start background watchdog for missed dose tracking
  watchdog.start();

  // Vite middleware or production static serving
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(path.join(process.cwd(), 'dist'), (req, res, next) => next());
    app.use('/', (await import('express')).default.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PharmaCare server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL && !process.env.VERCEL_ENV && process.env.NODE_ENV !== 'test') {
  startServer().catch(err => {
    console.error('Failed to start PharmaCare server:', err);
    process.exit(1);
  });
}

export default app;
export { app };
