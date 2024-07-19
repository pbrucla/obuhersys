const crypto = require('crypto');

// The algo variables are set to an insecure mode 'ecb' and a secure mode 'gcm', respectively, but only the insecure mode is used in the cipher.
async function main() {
    try {
        const algo1 = 'aes-256-ecb';
        const algo2 = 'aes-256-gcm'; 
        const key = crypto.randomBytes(32); // Generate a random key with 256 bits
        const iv = null;

        const cipher = crypto.createCipheriv(algo1, key, iv);
        const aad = Buffer.from('additional_authenticated_data', 'utf8');
        cipher.setAAD(aad, { plaintextLength: 'some plaintext data'.length });

        const encrypted = cipher.update('some plaintext data', 'utf8', 'hex') + cipher.final('hex');

        const tag = cipher.getAuthTag(); // Get the authentication tag
        
        
        console.log('Encrypted:', encrypted);
        console.log('Authentication tag:', tag.toString('hex'));
        } catch (error) {
        console.error('Error:', error.message);
    }
}



main();