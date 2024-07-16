const crypto = require('crypto');

// Two different iterations counts, one too litte and thus insecure (iterations1) and one with a secure amount of iterations (iteration2) are initialized. The secure number of iterations (iterations2) is then used in the parameter for the pbkdf2 function.
const salt = crypto.randomBytes(16);
const iterations1 = 1000;
const iterations2 = 100000;
const password = 'your-password'; 
const keyLength = 32; 
const digest = 'sha256';

crypto.pbkdf2(password, salt, iterations2, keyLength, digest, (err, derivedKey) => {
    if (err) throw err;
    console.log('Derived key:', derivedKey.toString('hex'));
});
