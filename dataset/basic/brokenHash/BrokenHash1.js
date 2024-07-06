const crypto = require('crypto');

// 'md5' insecure hash
async function main() {
    const data = 'some data here';
    const hash = crypto.createHash('md5');
    hash.update(data);
    const digest = hash.digest('hex');

    console.log(digest);
}

main();
