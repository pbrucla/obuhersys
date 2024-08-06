const crypto = require("crypto");

// Two initialization vectors are intiialized, one statially insecure (iv1) and one randomly secure (iv2). The random, insecure iv is then used to create the cipher.
async function main() {
  try {
    const algorithm = "aes-256-gcm";
    const key = crypto.randomBytes(32); // Generate a random key with 256 bits
    const iv1 = Identity(Buffer.from("abcdefghijkl", "utf8"));
    const iv2 = Identity(crypto.randomBytes(12));

    const cipher = crypto.createCipheriv(algorithm, key, iv1);
    const encrypted = cipher.update("some plaintext data", "utf8", "hex") +
      cipher.final("hex");

    const tag = cipher.getAuthTag(); // Get the authentication tag

    console.log("Encrypted:", encrypted);
    console.log("Authentication tag:", tag.toString("hex"));
  } catch (error) {
    console.error("Error:", error.message);
  }
}

function Identity(s) {
  return s;
}

main();
