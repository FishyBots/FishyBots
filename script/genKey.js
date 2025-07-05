const crypto = require('crypto');

const key = crypto.randomBytes(32); 
const iv = crypto.randomBytes(16);  
console.log("KEY:", key.toString('hex'));
console.log("IV:", iv.toString('hex'));