export default [
  {
    name: "initial motivating example - authTag without .final() vuln",
    trigger: {
      type: "constructor",
      lib: "crypto",
      fn: "createDecipheriv",
      args: ["aes-256-gcm"],
    },
    implies: [
      {
        type: "mustCall",
        method: "final",
        implies: [
          {
            type: "mustNotCall",
            method: ".*",
          },
        ],
      },
    ],
  },
  {
    name: "basic/brokenCrypto",
    trigger: {
      type: "constructor",
      lib: "crypto",
      fn: "createCipheriv",
    },
    implies: [
      {
        type: "validateArg",
        index: 0,
        validate: (arg) => !/des|rc-?[245]|blowfish/i.test(arg),
      },
    ],
  },
  {
    name: "basic/brokenHash",
    trigger: {
      type: "constructor",
      lib: "crypto",
      fn: "createHash",
    },
    implies: [
      {
        type: "validateArg",
        index: 0,
        validate: (arg) => !/md[45]|sha1/i.test(arg),
      },
    ],
  },
  {
    name: "basic/ecbMode",
    trigger: {
      type: "constructor",
      lib: "crypto",
      fn: "createCipheriv",
    },
    implies: [
      {
        type: "validateArg",
        index: 0,
        validate: (arg) => arg.toLowerCase() !== "aes-256-ecb",
      },
    ],
  },
  {
    name: "basic/pdkdf2Parameters",
    trigger: {
      type: "constructor",
      lib: "crypto",
      fn: "pbkdf2",
    },
    implies: [
      // Limitation Note: unable to check if salt is static or random, static salt is insecure
      {
        // minimum number of iterations should be at least 10,000
        type: "validateArg",
        index: 2,
        validate: (arg) => arg >= 10000,
      },
      {
        // 'sha-1' insecure hashing algorithm
        type: "validateArg",
        index: 4,
        validate: (arg) => !/md5|sha1/i.test(arg),
      },
    ],
  },
  {
    name: "basic/smallkeysize",
    trigger: {
      type: "function",
      target: "crypto",
      fn: "generateKeyPair",
      args: ["rsa"],
    },
    implies: [
      {
        type: "validateArg",
        index: 1,
        validate: (arg) => arg?.modulusLength >= 2048,
      },
    ],
  },
  {
    name: "basic/smallkeysize sync",
    trigger: {
      type: "function",
      target: "crypto",
      fn: "generateKeyPairSync",
      args: ["rsa"],
    },
    implies: [
      {
        type: "validateArg",
        index: 1,
        validate: (arg) => arg?.modulusLength >= 2048,
      },
    ],
  },
];
