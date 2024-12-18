const admin = require('firebase-admin');

// Initialize Firebase Admin with your service account
// You'll need to download this JSON from Firebase Console
const serviceAccount = require('../config/firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Middleware to verify Firebase token
const auth = async (req, res, next) => {
  try {
    // Debug: Log the incoming authorization header
    console.log('Auth header:', req.headers.authorization);

    const token = req.headers.authorization?.split('Bearer ')[1];

    // Debug: Log if we found a token
    console.log('Token extracted:', !!token);
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    // Debug: Log successful token verification
    console.log('Token verified for user:', decodedToken.uid);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || ''
    };
    
    next();
  } catch (error) {
    // Debug: Log the specific error
    console.error('Auth Middleware Error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { auth };