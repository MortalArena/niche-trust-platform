import { describe, it, expect, beforeAll } from 'vitest';
import { initSodium, generateGroupKey, encryptMessage, decryptMessage, exportKey, importKey } from '@/lib/crypto/encrypt';
import { hashMessage } from '@/lib/crypto/hash';

describe('Crypto - libsodium encryption', () => {
  beforeAll(async () => {
    await initSodium();
  });

  it('يشفر ويفك تشفير رسالة بشكل صحيح', () => {
    const key = generateGroupKey();
    const plaintext = 'شراء BTC عند 65000 والهدف 72000';

    const { ciphertext, nonce } = encryptMessage(plaintext, key);
    const decrypted = decryptMessage(ciphertext, nonce, key);

    expect(decrypted).toBe(plaintext);
    expect(ciphertext).not.toBe(plaintext);
  });

  it('يولد مفاتيح مختلفة في كل مرة', () => {
    const key1 = generateGroupKey();
    const key2 = generateGroupKey();

    expect(key1).not.toEqual(key2);
    expect(key1.length).toBeGreaterThan(0);
    expect(key2.length).toBeGreaterThan(0);
  });

  it('يفشل فك التشفير بمفتاح خاطئ', () => {
    const key1 = generateGroupKey();
    const key2 = generateGroupKey();
    const plaintext = 'رسالة سرية';

    const { ciphertext, nonce } = encryptMessage(plaintext, key1);

    expect(() => decryptMessage(ciphertext, nonce, key2)).toThrow();
  });

  it('يصدّر ويستورد المفتاح بشكل صحيح', () => {
    const originalKey = generateGroupKey();
    const exported = exportKey(originalKey);
    const importedKey = importKey(exported);

    expect(importedKey).toEqual(originalKey);
    expect(typeof exported).toBe('string');
    expect(exported.length).toBeGreaterThan(0);
  });

  it('يشفر ويفك رسالة طويلة (5000 حرف)', () => {
    const key = generateGroupKey();
    const longText = 'A'.repeat(5000);

    const { ciphertext, nonce } = encryptMessage(longText, key);
    const decrypted = decryptMessage(ciphertext, nonce, key);

    expect(decrypted).toBe(longText);
  });

  it('يشفر ويفك رسالة فارغة', () => {
    const key = generateGroupKey();
    const emptyText = '';

    const { ciphertext, nonce } = encryptMessage(emptyText, key);
    const decrypted = decryptMessage(ciphertext, nonce, key);

    expect(decrypted).toBe(emptyText);
  });
});

describe('Crypto - SHA-256 hash', () => {
  it('يحسب SHA-256 hash بشكل صحيح', async () => {
    const hash = await hashMessage('Hello, World!');
    expect(hash).toHaveLength(64); // SHA-256 = 64 hex chars
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('يعطي نفس الـ hash لنفس النص', async () => {
    const text = 'شراء BTC عند 65000';
    const hash1 = await hashMessage(text);
    const hash2 = await hashMessage(text);
    expect(hash1).toBe(hash2);
  });

  it('يعطي hash مختلف لنصوص مختلفة', async () => {
    const hash1 = await hashMessage('نص أول');
    const hash2 = await hashMessage('نص ثاني');
    expect(hash1).not.toBe(hash2);
  });

  it('يعمل على نصوص طويلة جداً', async () => {
    const longText = 'A'.repeat(100000);
    const hash = await hashMessage(longText);
    expect(hash).toHaveLength(64);
  });

  it('يعمل على نصوص بأحرف خاصة', async () => {
    const specialText = '!@#$%^&*()_+{}[]|\\:;"\'<>,.?/~`你好العربية';
    const hash = await hashMessage(specialText);
    expect(hash).toHaveLength(64);
  });
});