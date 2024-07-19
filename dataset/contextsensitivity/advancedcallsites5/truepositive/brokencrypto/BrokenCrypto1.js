const crypto = require('crypto');

// Five different variables are set to names of different insecure and secure ciphers. One variable containing an insecure algo is then used to initialize the cipher.
async function main() {
    try {
        const algo1 = Identity('des'); 
        const algo2 = Identity('aes-256-gcm');
        const algo3 = Identity('md5');
        const algo4 = Identity('sha1');
        const algo5 = Identity('rc2');
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