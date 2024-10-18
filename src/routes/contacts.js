import express from 'express';
import * as ctrl from '../controllers/contacts.js';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';
import { validateBody } from '../middlewares/validateBody.js';
import { contactSchema } from '../models/validationSchemas.js';
import { isValidId } from '../middlewares/isValidId.js';

const router = express.Router();

router.get('/', ctrlWrapper(ctrl.getContacts));
router.get('/:contactId', isValidId, ctrlWrapper(ctrl.getContactById));
router.post('/', validateBody(contactSchema), ctrlWrapper(ctrl.addContact));
router.patch('/:contactId', isValidId, validateBody(contactSchema), ctrlWrapper(ctrl.updateContact));
router.delete('/:contactId', isValidId, ctrlWrapper(ctrl.deleteContact));

export default router;
