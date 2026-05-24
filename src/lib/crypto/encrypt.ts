import sodium from 'libsodium-wrappers';

let ready = false;

export async function initSodium(): Promise<void> {
  if (!ready) {
    await sodium.ready;
    ready = true;
  }
}

export function generateGroupKey(): Uint8Array {
  return sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES);
}

export function encryptMessage(
  plaintext: string,
  key: Uint8Array
): { ciphertext: string; nonce: string } {
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const messageBytes = sodium.from_string(plaintext);
  const encrypted = sodium.crypto_secretbox_easy(messageBytes, nonce, key);

  return {
    ciphertext: sodium.to_base64(encrypted),
    nonce: sodium.to_base64(nonce),
  };
}

export function decryptMessage(ciphertext: string, nonce: string, key: Uint8Array): string {
  const decrypted = sodium.crypto_secretbox_open_easy(
    sodium.from_base64(ciphertext),
    sodium.from_base64(nonce),
    key
  );
  return sodium.to_string(decrypted);
}

export function exportKey(key: Uint8Array): string {
  return sodium.to_base64(key);
}

export function importKey(keyBase64: string): Uint8Array {
  return sodium.from_base64(keyBase64);
}
