const util = require('util');
const crypto = require('crypto');

// Names of a secure and an insecure keysize length (1024) are stored in an object's field by using the Identity function. The insecure one is then used to finalize the keypair.
async function main() {
    try {
        const keysizeclass = new KeySizeClass();
        keysizeclass.size1 = Identity({ modulusLength: 1024 });
        keysizeclass.size2 = Identity({ modulusLength: 3072 });
        const buffer = Buffer.from("whatever");
        const { publicKey, privateKey } = await util.promisify(crypto.generateKeyPair)("rsa", keysizeclass.size1);
        const encrypted = crypto.publicEncrypt(publicKey, buffer);
        const decrypt = crypto.privateDecrypt(privateKey, encrypted);

        console.log('public:', encrypted);
        console.log('decrypt:', new TextDecoder().decode(decrypt));
        
    } catch (error) {
        console.error('Error:', error.message);
    }   
}

function Identity(s) {
    return s;
}

class KeySizeClass {
    constructor() {
        this.size1 = '';
        this.size2 = '';
    }
}

main();