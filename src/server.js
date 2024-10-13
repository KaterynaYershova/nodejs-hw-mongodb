import express from 'express';
import logger from 'morgan';
import cors from 'cors';
import contactsRouter from './routes/contacts.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';

const app = express();

app.use(logger('dev'));
app.use(cors());
app.use(express.json());

app.use('/contacts', contactsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
