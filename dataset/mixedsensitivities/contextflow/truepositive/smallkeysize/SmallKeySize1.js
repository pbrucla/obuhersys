const util = require('util');
const crypto = require('crypto');

// Initialized two key sizes, one insecure (1024 too small) and one secure (3072) and proceeded to use the insecure keylength to generate the key.
async function main() {
    try {

         object1 = Identity({ modulusLength: 1024 });
        object2 = Identity({ modulusLength: 3072 });
        const buffer = Buffer.from("whatever");
        const { publicKey, privateKey } = await util.promisify(crypto.generateKeyPair)("rsa", object1);
        const public = crypto.publicEncrypt(publicKey, buffer);
        const decrypt = crypto.privateDecrypt(privateKey, public);

        console.log('public:', public);
        console.log('decrypt:', new TextDecoder().decode(decrypt));

        object1 = Identity({ modulusLength: 3072 });
        object2 = Identity({ modulusLength: 1024 });
        
    } catch (error) {
        console.error('Error:', error.message);
    }   
}

function Identity(s) {
    return s;
}

main();