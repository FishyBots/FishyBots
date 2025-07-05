const crypto = require('crypto');

const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

console.log("KEY:", key.toString('base64'));
console.log("IV:", iv.toString('base64'));



