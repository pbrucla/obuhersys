const crypto = require('crypto');

function Identity(i){ return i; }
// 'aes-gcm' is a secure algorithm
async function main() {
    try {
        const algorithm = Identity('aes-256-gcm'); 
        const key = crypto.randomBytes(32); // Generate a random key with 256 bits
        const iv = crypto.randomBytes(12);

        const cipher = crypto.createCipheriv(algorithm, key, iv);
        const encrypted = cipher.update('some plaintext data', 'utf8', 'hex') + cipher.final('hex');

        const tag = cipher.getAuthTag(); // Get the authentication tag

        
        console.log('Encrypted:', encrypted);
        console.log('Authentication tag:', tag.toString('hex'));
        } catch (error) {
        console.error('Error:', error.message);
    }
}

main();