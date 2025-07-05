const crypto = require('crypto')

function encrypt(text, key, iv) {
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { encryptedData: encrypted, iv: iv.toString('hex'), key: key.toString('hex') };
}

function decrypt(encryptedData, keyHex, ivHex) {
    const keyBuffer = Buffer.from(keyHex, 'hex');
    const ivBuffer = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = {encrypt, decrypt}