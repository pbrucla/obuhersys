const util = require('util');
const crypto = require('crypto');


async function main() {
    try {

        let object;
        const condition = 6;
        if (condition > 10) {
            object = { modulusLength: 3072 };
        }
        else {
            if (condition < 0) object = { modulusLength: 3072 };
            // 1024 buffer size is not secure 
            else {
                if (condition > 5) {
                    object = { modulusLength: 3072 };
                }
                else object = { modulusLength: 1024 };
            }
        }
        const buffer = Buffer.from("whatever");
        const { publicKey, privateKey } = await util.promisify(crypto.generateKeyPair)("rsa", object);
        const public = crypto.publicEncrypt(publicKey, buffer);
        const decrypt = crypto.privateDecrypt(privateKey, public);

        console.log('public:', public);
        console.log('decrypt:', new TextDecoder().decode(decrypt));
        
    } catch (error) {
        console.error('Error:', error.message);
    }   
}

main();