const crypto = require('crypto');

// Two different digest algorithms are initialized, one insecure (digest1) and one secure (digest2). The secure digest is then used as the parameter in the pbkdf2 function.
const salt = crypto.randomBytes(16);
const iterations = 1000000;
const password = 'your-password'; 
const keyLength = 32; 
const digest1 = 'sha1';
const digest2 = 'sha256';

crypto.pbkdf2(password, salt, iterations, keyLength, digest2, (err, derivedKey) => {
    if (err) throw err;
    console.log('Derived key:', derivedKey.toString('hex'));
});
