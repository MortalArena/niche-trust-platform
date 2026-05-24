import { Keypair } from '@solana/web3.js';

const kp = Keypair.generate();
const base64 = Buffer.from(kp.secretKey).toString('base64');

console.log('Public key (fund with a little SOL on mainnet/devnet):');
console.log(kp.publicKey.toBase58());
console.log('');
console.log('Add to .env:');
console.log(`MEMO_SIGNER_SECRET="${base64}"`);
