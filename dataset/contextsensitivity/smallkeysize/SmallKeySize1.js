
const util = require('util');
const crypto = require('crypto');

// 1024 buffer size is not secure 

function Identity(i)
{
    return i; 
}
async function main() {
    try {

        const object = Identity({ modulusLength: 1024 });
        const object2 = Identity({modulusLength: 2048 }); 
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
