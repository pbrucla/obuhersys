const crypto = require('crypto');

// a static value is insecurely used as initialization vector (iv) to initialize a cipher 'aes-256-gcm'
async function main() {
  try {
    const algorithm = 'aes-256-gcm';
    const key = crypto.randomBytes(32); // Generate a random key with 256 bits
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = cipher.update('some plaintext data', 'utf8', 'hex') +
      cipher.final('hex');

    const tag = cipher.getAuthTag(); // Get the authentication tag

    console.log('Encrypted:', encrypted);
    console.log('Authentication tag:', tag.toString('hex'));

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = decipher.update(Buffer.from(encrypted, 'hex'));
    console.log('Decrypted:', decrypted.toString());
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
