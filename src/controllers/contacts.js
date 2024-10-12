import * as contactsService from '../services/contacts.js';
import createError from 'http-errors';

export const getContacts = async (req, res, next) => {
  const contacts = await contactsService.getContacts();
  res.status(200).json({ status: 200, data: contacts });
};

export const getContactById = async (req, res, next) => {
  const contact = await contactsService.getContactById(req.params.contactId);
  if (!contact) {
    throw createError(404, 'Contact not found');
  }
  res.status(200).json({ status: 200, data: contact });
};

export const addContact = async (req, res, next) => {
  const newContact = await contactsService.addContact(req.body);
  res.status(201).json({ status: 201, message: 'Successfully created a contact!', data: newContact });
};

export const updateContact = async (req, res, next) => {
  const updatedContact = await contactsService.updateContact(req.params.contactId, req.body);
  if (!updatedContact) {
    throw createError(404, 'Contact not found');
  }
  res.status(200).json({ status: 200, message: 'Successfully patched a contact!', data: updatedContact });
};

export const deleteContact = async (req, res, next) => {
  const deleted = await contactsService.deleteContact(req.params.contactId);
  if (!deleted) {
    throw createError(404, 'Contact not found');
  }
  res.status(204).send();
};
