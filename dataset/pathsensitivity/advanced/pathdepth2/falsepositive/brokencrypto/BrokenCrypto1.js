const crypto = require('crypto');
async function main() {
    try {
        const condition = 1;
        let cipher;

        if(condition > 0) {
            if(condition > 1) {
                cipher = crypto.createCipheriv('des', crypto.randomBytes(8), crypto.randomBytes(8));
            }
            else{
                cipher = crypto.createCipheriv('aes-256-gcm', crypto.randomBytes(8), crypto.randomBytes(8));
            }
        }
        else{
            cipher = crypto.createCipheriv('bf-cbc', crypto.randomBytes(8), crypto.randomBytes(8));
        }

        const encrypted = cipher.update('some plaintext data', 'utf8', 'hex') + cipher.final('hex');
        console.log("Encrypted: ", encrypted);
    }
    catch(err) {
        console.log("Error: ", err.message);
    }
}

main();