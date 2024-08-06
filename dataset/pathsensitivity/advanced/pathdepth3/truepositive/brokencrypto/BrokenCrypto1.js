const crypto = require("crypto");

async function main() {
  try {
    const condition = 2;
    let cipher;

    if (condition > 10) {
      cipher = crypto.createCipheriv(
        "des",
        crypto.randomBytes(8),
        crypto.randomBytes(8),
      );
    } else {
      if (condition > 0) {
        if (condition > 3) {
          cipher = crypto.createCipheriv(
            "aes-256-gcm",
            crypto.randomBytes(8),
            crypto.randomBytes(8),
          );
        } else {
          cipher = crypto.createCipheriv(
            "rc4",
            crypto.randomBytes(8),
            crypto.randomBytes(8),
          );
        }
      } else {
        cipher = crypto.createCipheriv(
          "rc2",
          crypto.randomBytes(8),
          crypto.randomBytes(8),
        );
      }
    }

    const encrypted = cipher.update("some plaintext data", "utf8", "hex") +
      cipher.final("hex");
    console.log("Encrypted: ", encrypted);
  } catch (err) {
    console.log("Error: ", err.message);
  }
}

main();
