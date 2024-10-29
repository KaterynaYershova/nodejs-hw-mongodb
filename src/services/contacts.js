import Contact from '../models/contact.js';

export const countContacts = async (query) => {
  return await Contact.countDocuments(query);
};

export const getContacts = async (query, { sortBy, sortOrder, skip, limit }) => {
  return await Contact.find(query)
    .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
    .skip(skip)
    .limit(limit);
};

export const getContactById = async (contactId, userId) => {
  return await Contact.findOne({ _id: contactId, userId });
};

export const addContact = async (contactData) => {
  return await Contact.create(contactData);
};

export const updateContact = async (contactId, userId, contactData) => {
  return await Contact.findOneAndUpdate(
    { _id: contactId, userId },
    contactData,
    { new: true }
  );
};

export const deleteContact = async (contactId, userId) => {
  return await Contact.findOneAndDelete({ _id: contactId, userId });
};
