const crypto = require('crypto');

function encrypt(text, key, iv) {
    const keyBuffer = Buffer.isBuffer(key) ? key : Buffer.from(key, 'base64');
    const ivBuffer = Buffer.isBuffer(iv) ? iv : Buffer.from(iv, 'base64');

    if (keyBuffer.length !== 32) throw new Error("Clé invalide : doit faire 32 bytes");
    if (ivBuffer.length !== 16) throw new Error("IV invalide : doit faire 16 bytes");

    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, ivBuffer);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { encryptedData: encrypted };
}

function decrypt(encryptedData, key, iv) {
    const keyBuffer = Buffer.isBuffer(key) ? key : Buffer.from(key, 'base64');
    const ivBuffer = Buffer.isBuffer(iv) ? iv : Buffer.from(iv, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = { encrypt, decrypt };