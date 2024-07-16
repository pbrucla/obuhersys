const crypto = require('crypto');

// The algo variables are set to a broken hash 'md5' and a secure hash 'sha256', but only the secure algo is used to create the hash.
async function main() {
    const data = 'some data here';
    const algo1 = 'md5';
    const algo2 = 'sha256';
    const hash = crypto.createHash(algo2);
    hash.update(data);
    const digest = hash.digest('hex');

    console.log(digest);
}

main();
