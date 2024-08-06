const util = require('util');
const crypto = require('crypto');


async function main() {
    try {

        let object;
        const condition = 0;
        if (condition > 1) {
            object = { modulusLength: 3072 };
        }
        else {
            // 1024 buffer size is not secure 
            object = { modulusLength: 1024 };
        }
        const buffer = Buffer.from("whatever");
        const { publicKey, privateKey } = await util.promisify(crypto.generateKeyPair)("rsa", object);
        const encrypted = crypto.publicEncrypt(publicKey, buffer);
        const decrypt = crypto.privateDecrypt(privateKey, encrypted);

        console.log('public:', encrypted);
        console.log('decrypt:', new TextDecoder().decode(decrypt));
        
    } catch (error) {
        console.error('Error:', error.message);
    }   
}

main();