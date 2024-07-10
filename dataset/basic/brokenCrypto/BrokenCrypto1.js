const crypto = require('crypto');

// 'des' is an insecure algorithm
async function main() {
    try {
        const algorithm = 'des'; // DES algorithm in Node.js is referred to as 'des'
        const iv = crypto.randomBytes(8);
        const cipher = crypto.createCipheriv(algorithm, crypto.randomBytes(8), iv); // Generate a random key
        const encrypted = cipher.update('some plaintext data', 'utf8', 'hex') + cipher.final('hex');
        
        console.log('Encrypted:', encrypted);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();

