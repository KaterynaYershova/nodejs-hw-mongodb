import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String },
  isFavourite: { type: Boolean, default: false },
  contactType: {  
    type: String,
    enum: ['work', 'home', 'personal', 'other'],
    required: true,
    default: 'personal',
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { versionKey: false, timestamps: true }); 

export default mongoose.model('Contact', contactSchema);
