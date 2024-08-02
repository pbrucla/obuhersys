import crypto from 'node:crypto';
import { Cipher } from 'node:crypto';

// some random data
const data: Buffer[] = [crypto.randomBytes(256)];
const key = 'potato'.repeat(Math.ceil(32 / 6)).substring(0, 32);
const iv = 'beetroot';

const cipher: Cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const chunks: Buffer[] = [];
for (const chunk of data) {
  chunks.push(cipher.update(chunk));
}

chunks.push(cipher.final()); // crucial line

const decrypted: Buffer = Buffer.concat(chunks);
console.log('Completed.');
