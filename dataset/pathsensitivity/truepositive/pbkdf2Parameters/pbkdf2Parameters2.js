const crypto = require('crypto');

let iterations;
const password = 'your-password'; 
const keyLength = 32; 
const digest = 'sha256';
const condition  = 0;
const salt = crypto.randomBytes(16);

if (condition>1) {
    iterations = 1000000;
}
else {
   iterations = 100;
}

crypto.pbkdf2(password, salt, iterations, keyLength, digest, (err, derivedKey) => {
    if (err) throw err;
    console.log('Derived key:', derivedKey.toString('hex'));
});
