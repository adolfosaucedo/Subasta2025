// ======== IMPORTS PRINCIPALES ========
import session from 'express-session';
import createError from 'http-errors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from 'morgan';
import livereload from 'livereload';
import connectLiveReload from 'connect-livereload';
import helmet from 'helmet';

// ======== CONFIGURAR RUTAS ========
import indexRouter from './routes/indexRouter.js';
import rolesRouter from './routes/rolesRouter.js';
import usuariosRouter from './routes/usuariosRouter.js';
import usuariosRolesRouter from './routes/usuariosRolesRouter.js';
import bienesRouter from './routes/bienesRouter.js';
import uploadRouter from './routes/uploadRouter.js';
import subastasRouter from './routes/subastasRouter.js';
import pujasRouter from './routes/pujasRouter.js';
import pagoSimuladoRouter from './routes/pagoSimuladoRouter.js';
import adjudicacionesRouter from './routes/adjudicacionesRouter.js';
import pagosRouter from './routes/pagosRouter.js';

// ======== VARIABLES GLOBALES ========
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const isDev = process.env.NODE_ENV !== 'production';

// ======== HARDENING BÁSICO + CSP (dev relajado) ========
app.disable('x-powered-by');

if (isDev) {
  // En desarrollo: permitir inline scripts y LiveReload
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "default-src": ["'self'"],
          "script-src": [
            "'self'",
            "'unsafe-inline'",        // permite <script> inline en dev
            "http://localhost:35729"  // LiveReload
          ],
          "connect-src": [
            "'self'",
            "ws://localhost:35729",   // WebSocket LiveReload
            "http://localhost:35729"
          ],
          "img-src": ["'self'", "data:"],
          "style-src": ["'self'", "'unsafe-inline'"], // estilos inline en dev
        },
      },
    })
  );
} else {
  // En producción: CSP por defecto (sin inline ni livereload)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      // puedes endurecer más la CSP aquí si lo deseas
    })
  );
}

// Si luego usás proxy/NGINX:
// app.set('trust proxy', 1);

// ======== VIEW ENGINE ========
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// ======== MIDDLEWARES BASE ========
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ======== 🔄 LIVE RELOAD (solo en desarrollo) ========
if (isDev) {
  const liveReloadServer = livereload.createServer();
  liveReloadServer.watch([
    path.join(__dirname, 'views'),
    path.join(__dirname, 'public'),
  ]);
  app.use(connectLiveReload());
  liveReloadServer.server.once('connection', () => {
    setTimeout(() => liveReloadServer.refresh('/'), 100);
  });
}

// ======== 🔐 SESIÓN EXPRESS ========
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'subastas-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      // secure: true, // habilitar si usás HTTPS + trust proxy
      maxAge: 1000 * 60 * 60 * 8, // 8h
    },
  })
);

// ======== VARIABLES GLOBALES PARA LAS VISTAS ========
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// ======== ARCHIVOS ESTÁTICOS ========
app.use(express.static(path.join(__dirname, 'public')));

// ======== RUTAS PRINCIPALES ========
app.use('/', indexRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/usuarios', usuariosRouter); // registro/verificación
app.use('/api/usuarios_roles', usuariosRolesRouter);
app.use('/api/bienes', bienesRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/subastas', subastasRouter);
app.use('/api/pujas', pujasRouter);
app.use('/api/pago-simulado', pagoSimuladoRouter);
app.use('/api/adjudicaciones', adjudicacionesRouter);
app.use('/api/pagos', pagosRouter);

// ======== ERRORES ========
// 404
app.use((req, res, next) => next(createError(404)));

// Handler general
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

export default app;
