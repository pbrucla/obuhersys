const crypto = require("crypto");

// 'rc2' is an insecure algorithm
async function main() {
  try {
    const algorithm = "rc2";
    const iv = crypto.randomBytes(8);
    const cipher = crypto.createCipheriv(algorithm, crypto.randomBytes(8), iv); // Generate a random key
    const encrypted = cipher.update("some plaintext data", "utf8", "hex") +
      cipher.final("hex");

    console.log("Encrypted:", encrypted);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
