import * as contactsService from '../services/contacts.js';
import createError from 'http-errors';

export const getContacts = async (req, res, next) => {
  try {
    const { page = 1, perPage = 10, sortBy = 'name', sortOrder = 'asc', type, isFavourite } = req.query;

    const query = {};
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
      limit: perPage
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
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getContactById = async (req, res, next) => {
  try {
    const contact = await contactsService.getContactById(req.params.contactId);
    if (!contact) {
      throw createError(404, 'Contact not found');
    }
    res.status(200).json({ status: 200, data: contact });
  } catch (error) {
    next(error);
  }
};

export const addContact = async (req, res, next) => {
  if (!req.body.name || !req.body.phoneNumber) {
    throw createError(400, 'Name and phone number are required.');
  }

  try {
    const newContact = await contactsService.addContact(req.body);
    res.status(201).json({ status: 201, message: 'Successfully created a contact!', data: newContact });
  } catch (error) {
    next(error);
  }
};

export const updateContact = async (req, res, next) => {
  try {
    const updatedContact = await contactsService.updateContact(req.params.contactId, req.body);
    if (!updatedContact) {
      throw createError(404, 'Contact not found');
    }
    res.status(200).json({ status: 200, message: "Successfully patched a contact!", data: updatedContact });
  } catch (error) {
    next(error);
  }
};

export const deleteContact = async (req, res, next) => {
  try {
    const deleted = await contactsService.deleteContact(req.params.contactId);
    if (!deleted) {
      throw createError(404, 'Contact not found');
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
