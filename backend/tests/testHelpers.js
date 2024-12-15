const admin = require('firebase-admin');

// Initialize Firebase Admin with test credentials
const serviceAccount = require('../config/firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function generateTestToken() {
  // Create a test user in Firebase
  const uid = 'test-user-' + Date.now();
  const customToken = await admin.auth().createCustomToken(uid);
  
  // Exchange custom token for ID token
  const idToken = await admin.auth().createSessionCookie(customToken, {
    expiresIn: 60 * 60 * 1000 // 1 hour
  });
  
  return idToken;
}

module.exports = {
  generateTestToken
};