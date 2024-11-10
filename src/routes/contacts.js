import express from 'express';
import * as ctrl from '../controllers/contacts.js';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';
import { validateBody } from '../middlewares/validateBody.js';
import { contactSchema, contactUpdateSchema } from '../models/validationSchemas.js';
import { isValidId } from '../middlewares/isValidId.js';
import { authenticate } from '../middlewares/authenticate.js';
import { upload } from '../middlewares/multer.js';

const router = express.Router();

router.use(authenticate);

router.get('/', ctrlWrapper(ctrl.getContacts));

router.get('/:contactId', isValidId, ctrlWrapper(ctrl.getContactById));

router.post('/', upload.single('photo'), validateBody(contactSchema), ctrlWrapper(ctrl.addContact));

router.patch('/:contactId', isValidId, validateBody(contactUpdateSchema), ctrlWrapper(ctrl.updateContact));

router.delete('/:contactId', isValidId, ctrlWrapper(ctrl.deleteContact));

router.patch(
  '/:contactId/photo',
  isValidId,
  upload.single('photo'), 
  ctrlWrapper(ctrl.updateContactPhoto) 
);

export default router;
