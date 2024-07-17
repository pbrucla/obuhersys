const crypto = require('crypto');

// The algo variables are set to an insecure 'des' and a secure cipher 'aes-256-gcm', respectively. But only the latter one is utilized to initialize the cipher object.
async function main() {
    try {
        const algo1 = 'des'; 
        const algo2 = 'aes-256-gcm'
        const key = crypto.randomBytes(32);
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(algo2, key, iv); // Generate a random key
        const encrypted = cipher.update('some plaintext data', 'utf8', 'hex') + cipher.final('hex');
        const tag = cipher.getAuthTag();
        console.log('Encrypted:', encrypted);
        console.log('Auth Tag:', tag);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();
