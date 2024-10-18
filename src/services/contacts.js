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

export const getContactById = async (contactId) => {
  return await Contact.findById(contactId);
};

export const addContact = async (contactData) => {
  return await Contact.create(contactData);
};

export const updateContact = async (contactId, contactData) => {
  return await Contact.findByIdAndUpdate(contactId, contactData, { new: true });
};

export const deleteContact = async (contactId) => {
  return await Contact.findByIdAndDelete(contactId);
};