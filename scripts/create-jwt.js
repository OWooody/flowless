const jwt = require('jsonwebtoken');

const payload = {
  sub: 'user_123', // User ID
  org: 'org_456',  // Organization ID
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiry
};

const secret = 'your-secret-key'; // Use a strong secret in production
const token = jwt.sign(payload, secret);

console.log('Your JWT token:');
console.log(token); 