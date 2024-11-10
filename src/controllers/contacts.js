import * as contactsService from '../services/contacts.js';
import createHttpError from 'http-errors';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';
import { saveFileToUploadDir } from '../utils/saveFileToUploadDir.js';
import { env } from '../utils/env.js';
import { contactSchema, contactUpdateSchema } from '../models/validationSchemas.js'; 
import { validateBody } from '../middlewares/validateBody.js'; 

export const getContacts = async (req, res, next) => {
  try {
    const { page = 1, perPage = 10, sortBy = 'name', sortOrder = 'asc', type, isFavourite } = req.query;
    const query = { userId: req.user._id };

    if (type) {
      query.contactType = type;
    }

    if (typeof isFavourite !== 'undefined') {
      query.isFavourite = isFavourite === 'true';
    }

    const totalItems = await contactsService.countContacts(query);
    const totalPages = Math.ceil(totalItems / perPage);

    const contacts = await contactsService.getContacts(query, {
      sortBy,
      sortOrder,
      skip: (page - 1) * perPage,
      limit: perPage,
    });

    res.status(200).json({
      status: 200,
      message: 'Successfully found contacts!',
      data: {
        data: contacts,
        page: Number(page),
        perPage: Number(perPage),
        totalItems,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getContactById = async (req, res, next) => {
  try {
    const contact = await contactsService.getContactById(req.params.contactId, req.user._id);
    if (!contact) {
      throw createHttpError(404, 'Contact not found');
    }
    res.status(200).json({ status: 200, data: contact });
  } catch (error) {
    next(error);
  }
};

export const addContact = async (req, res, next) => {
  try {
    const { error } = contactSchema.validate(req.body);
    if (error) {
      throw createHttpError(400, `Validation error: ${error.details[0].message}`);
    }

    const contactData = { ...req.body, userId: req.user._id };
    const newContact = await contactsService.addContact(contactData);

    res.status(201).json({
      status: 201,
      message: 'Successfully created a contact!',
      data: newContact,
    });
  } catch (error) {
    if (error.isJoi) {
      return next(createHttpError(400, 'Invalid data'));
    }
    next(createHttpError(500, 'Failed to create contact. Please try again later.'));
  }
};

export const updateContact = [
  validateBody(contactUpdateSchema), 
  async (req, res, next) => {
    try {
      const updatedContact = await contactsService.updateContact(req.params.contactId, req.user._id, req.body);
      if (!updatedContact) {
        throw createHttpError(404, 'Contact not found');
      }
      res.status(200).json({
        status: 200,
        message: 'Successfully updated a contact!',
        data: updatedContact,
      });
    } catch (error) {
      next(error);
    }
  },
];

export const deleteContact = async (req, res, next) => {
  try {
    const deleted = await contactsService.deleteContact(req.params.contactId, req.user._id);
    if (!deleted) {
      throw createHttpError(404, 'Contact not found');
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const updateContactPhoto = async (req, res, next) => {
  const { contactId } = req.params;
  const photo = req.file;

  if (!photo) {
    return next(createHttpError(400, 'Photo is required.'));
  }

  let photoUrl;
  try {
    if (env('ENABLE_CLOUDINARY') === 'true') {
      photoUrl = await saveFileToCloudinary(photo);
    } else {
      photoUrl = await saveFileToUploadDir(photo);
    }

    const updatedContact = await contactsService.updateContact(contactId, req.user._id, { photo: photoUrl });
    if (!updatedContact) {
      throw createHttpError(404, 'Contact not found');
    }

    res.status(200).json({
      status: 200,
      message: 'Contact photo has been successfully updated.',
      data: updatedContact,
    });
  } catch (error) {
    next(error);
  }
};
