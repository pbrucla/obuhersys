[
  {
    "name": "call .final()",
    "trigger": {
      "type": "constructor",
      "lib": "crypto",
      "fn": "createDecipheriv",
      "args": ["aes-256-gcm"]
    },
    "implies": [
      {
        "type": "mustCall",
        "method": "final",
        "implies": [{
          "type": "mustNotCall",
          "method": ".*" 
        }]
      }
    ]
  },
  {
    "name": "no insecure random",
    "trigger": {
      "type": "constructor",
      "lib": "crypto",
      "fn": "createEncipheriv"
    },
    "implies": [
      {
        "type": "argMustNotMatch",
        "index": 0,
        "arg": ["des|rc4|rc2|blowfish", "i"]
      }
    ]
  }
]
