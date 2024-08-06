const crypto = require("crypto");

// The algo variables are set to an insecure 'des' and a secure cipher 'aes-256-gcm', respectively. The variable with the secure 'aes' algorithm is then used in the branch of the conditional statement.
async function main() {
  try {
    const algo1 = Identity("des");
    const algo2 = Identity("aes-256-gcm");

    const condition = 1;

    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);

    let cipher;
    if (condition < 2) {
      cipher = crypto.createCipheriv(algo2, key, iv);
    } else {
      cipher = crypto.createCipheriv(algo1, key, iv);
    }
    const encrypted = cipher.update("some plaintext data", "utf8", "hex") +
      cipher.final("hex");
    const tag = cipher.getAuthTag();
    console.log("Encrypted:", encrypted);
    console.log("Auth Tag:", tag);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

function Identity(s) {
  return s;
}

main();
