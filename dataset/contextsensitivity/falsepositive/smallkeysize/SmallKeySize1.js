const util = require('util');
const crypto = require('crypto');

// Initialized two key sizes, one insecure (1024 too small) and one secure (3072) and proceeded to use the secure keylength to generate the key.
async function main() {
    try {

        const object1 = { modulusLength: 1024 };
        const object2 = { modulusLength: 3072 };
        const buffer = Buffer.from("whatever");
        const { publicKey, privateKey } = await util.promisify(crypto.generateKeyPair)("rsa", object2);
        const public = crypto.publicEncrypt(publicKey, buffer);
        const decrypt = crypto.privateDecrypt(privateKey, public);

        console.log('public:', public);
        console.log('decrypt:', new TextDecoder().decode(decrypt));
        
    } catch (error) {
        console.error('Error:', error.message);
    }   
}

main();
