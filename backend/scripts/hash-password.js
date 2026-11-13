// Usage: npm run admin:hash -- "your password"
// Prints a line to paste into backend/.env so the plain password never has to be stored.
import { hashPassword } from '../src/utils/auth.js';

const password = process.argv[2];
if (!password || password.length < 8) {
  console.error('Give a password of at least 8 characters, for example:\n  npm run admin:hash -- "a long passphrase"');
  process.exit(1);
}
console.log(`ADMIN_PASSWORD_HASH=${hashPassword(password)}`);
