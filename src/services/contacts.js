import Contact from '../models/contact.js';

export const getContacts = async () => {
  return await Contact.find();
};

export const getContactById = async (contactId) => {
  return await Contact.findById(contactId);
};

export const addContact = async (contactData) => {
  return await Contact.create(contactData);
};

export const updateContact = async (contactId, contactData) => {
  const updatedContact = await Contact.findByIdAndUpdate(contactId, contactData, { new: true });
  if (!updatedContact) {
    throw new Error('Contact not found');
  }
  return updatedContact;
};

export const deleteContact = async (contactId) => {
  const result = await Contact.findByIdAndDelete(contactId);
  return result !== null;
};

