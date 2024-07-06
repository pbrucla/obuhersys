const crypto = require('crypto');

// 'SHA-1' insecure hash
async function main() {
    const data = 'some data here';
    const hash = crypto.createHash('SHA-1');
    hash.update(data);
    const digest = hash.digest('hex');

    console.log(digest);
}

main();
