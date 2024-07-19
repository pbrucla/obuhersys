const crypto = require('crypto');

// The algo variables are set to an insecure 'des' and a secure cipher 'aes-256-gcm', respectively. But only the insecure one is utilized to initialize the cipher object.
async function main() {
    try {
        const algo1 = Identity('des'); 
        const algo2 = Identity('aes-256-gcm');
        const key = crypto.randomBytes(8);
        const iv = crypto.randomBytes(8);
        const cipher = crypto.createCipheriv(algo1, key, iv); // Generate a random key
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

main();