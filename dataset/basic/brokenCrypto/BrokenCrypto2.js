const crypto = require('crypto');

// 'rc4' is an insecure algorithm
async function main() {
    try {
        const algorithm = 'rc4'; 
        const cipher = crypto.createCipheriv(algorithm, crypto.randomBytes(8), null); // Generate a random key
        const encrypted = cipher.update('some plaintext data', 'utf8', 'hex') + cipher.final('hex');
        
        console.log('Encrypted:', encrypted);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();

