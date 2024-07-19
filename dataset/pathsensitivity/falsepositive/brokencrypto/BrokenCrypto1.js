const crypto = require('crypto');
async function main() {
    try {
        const condition = 0;
        let cipher;
        if (condition>1) {
            //insecure algo
            cipher = crypto.createCipheriv('des', crypto.randomBytes(8), crypto.randomBytes(8));
            
        }
        else {
            // secure algo
            cipher = crypto.createCipheriv('aes-256-gcm', crypto.randomBytes(8), crypto.randomBytes(8));
        }
        const encrypted = cipher.update('some plaintext data', 'utf8', 'hex') + cipher.final('hex');
        console.log("Encrypted: ", encrypted);
    }
    catch(err) {
        console.log("Error: ", err.message);
    }
}

main();