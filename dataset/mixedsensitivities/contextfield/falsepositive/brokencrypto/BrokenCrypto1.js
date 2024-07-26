const crypto = require('crypto');

// Names of a secure and an insecure cipher (des) are stored in an object's field by using the Identity function. The secure one is then used to finalize the cipher object.
async function main() {
    try {
        const cryptoclass = new CryptoClass();
        cryptoclass.cipher1 = Identity('des'); 
        cryptoclass.cipher2 = Identity('aes-256-gcm');
        const key = crypto.randomBytes(32);
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(cryptoclass.cipher2, key, iv); // Generate a random key
        const encrypted = cipher.update('some plaintext data', 'utf8', 'hex') + cipher.final('hex');
        const tag = cipher.getAuthTag();
        console.log('Encrypted:', encrypted);
        console.log('Auth Tag:', tag);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

function Identity(s) {
    return s;
}

class CryptoClass {
    constructor() {
        this.cipher1 = '';
        this.cipher2 = '';
    }
}

main();
