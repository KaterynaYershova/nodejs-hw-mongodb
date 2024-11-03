import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, 
        required: true,
        ref: 'User' 
    },
    accessToken: {
        type: String,
        required: true 
    },
    refreshToken: {
        type: String,
        required: true 
    },
    accessTokenValidUntil: {
        type: Date,
        required: true 
    },
    refreshTokenValidUntil: {
        type: Date,
        required: true 
    }
}, { timestamps: true }); 

sessionSchema.statics.removeExpiredSessions = async function() {
    const now = new Date(); 
    await this.deleteMany({ refreshTokenValidUntil: { $lt: now } }); 
};

const Session = mongoose.model('Session', sessionSchema); 
export default Session; 
