const crypto = require("crypto");

// 'aes-ecb' an insecure algorithm
async function main() {
  try {
    const algorithm = "aes-256-ecb";
    const key = crypto.randomBytes(32); // Generate a random key with 256 bits

    const cipher = crypto.createCipheriv(algorithm, key, null);
    const encrypted = cipher.update("some plaintext data", "utf8", "hex") +
      cipher.final("hex");

    console.log("Encrypted:", encrypted);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
