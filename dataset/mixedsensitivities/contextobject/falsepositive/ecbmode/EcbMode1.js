const crypto = require('crypto');

// The algo variables are set to an insecure mode 'ecb' and a secure mode 'gcm', respectively, but only the secure mode is used in the cipher.
async function main() {
    try {
        const algoConfig1 = ConfigClass.GetObject('aes-256-ecb');
        const algoConfig2 = ConfigClass.GetObject('aes-256-gcm'); 
        const key = crypto.randomBytes(32); // Generate a random key with 256 bits
        const iv = crypto.randomBytes(12);

        const cipher = crypto.createCipheriv(algoConfig2.algorithm, key, iv);
        const encrypted = cipher.update('some plaintext data', 'utf8', 'hex') + cipher.final('hex');

        const tag = cipher.getAuthTag(); // Get the authentication tag

        
        console.log('Encrypted:', encrypted);
        console.log('Authentication tag:', tag.toString('hex'));
        } catch (error) {
        console.error('Error:', error.message);
    }
}

class ConfigClass {
    constructor() {
        this.algorithm = '';
    }
    static GetObject(algo) {
        const object = new ConfigClass();
        object.algorithm = algo;
        return object;
    }
}

main();
