const crypto = require("crypto");

// a static value is insecurely used as initialization vector (iv) to initialize a cipher 'aes-256-gcm'
async function main() {
  try {
    const algorithm = "aes-256-gcm";
    const key = crypto.randomBytes(32); // Generate a random key with 256 bits
    let iv;
    const condition = -1;

    if (condition > 1) {
      iv = crypto.randomBytes(12);
    } else {
      if (condition < 0) iv = crypto.randomBytes(12);
      else iv = Buffer.from("abcdefghijkl", "utf8");
    }

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = cipher.update("some plaintext data", "utf8", "hex") +
      cipher.final("hex");

    const tag = cipher.getAuthTag(); // Get the authentication tag

    console.log("Encrypted:", encrypted);
    console.log("Authentication tag:", tag.toString("hex"));
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
