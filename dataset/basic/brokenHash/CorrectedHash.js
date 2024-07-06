const crypto = require('crypto');

// 'SHA-256' is a secure hash
async function main() {
    const data = 'some data here';
    const hash = crypto.createHash('SHA-256');
    hash.update(data);
    const digest = hash.digest('hex');

    console.log(digest);
}

main();
