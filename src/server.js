import express from 'express';
import logger from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import contactsRouter from './routes/contacts.js';
import authRouter from './routes/auth.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { UPLOAD_DIR } from './constants/index.js';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../docs/swagger.json'; 

export const setupServer = () => {
  const app = express();

  app.use(logger('dev'));
  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());

  app.use('/uploads', express.static(UPLOAD_DIR));

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.use('/contacts', contactsRouter);
  app.use('/auth', authRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

const app = setupServer();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
