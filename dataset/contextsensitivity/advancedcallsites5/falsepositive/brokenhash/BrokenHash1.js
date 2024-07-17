const crypto = require('crypto');

// Five variables are set to names of secure and insecure algorithms. One variable containing a secure algo is then used to initialize a hash.
async function main() {
    const data = 'some data here';
    const algo1 = 'md5';
    const algo2 = 'sha256';
    const algo3 = 'md5';
    const algo4 = 'sha1';
    const algo5 = 'md2';
    const hash = crypto.createHash(algo2);
    hash.update(data);
    const digest = hash.digest('hex');

    console.log(digest);
}

main();
