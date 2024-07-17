const util = require('util');
const crypto = require('crypto');

// Five different keysize variables are stored in variables. One variable with a sufficient keysize is then used to generate a KeyPair.
async function main() {
    try {
        const object1 = { modulusLength: 1024 };
        const object2 = { modulusLength: 3072 };
        const object3 = { modulusLength: 128 };
        const object4 = { modulusLength: 256 };
        const object5 = { modulusLength: 512 };
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
