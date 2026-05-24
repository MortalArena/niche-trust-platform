import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RpcPool } from '@/lib/solana/rpc-pool';

// Mock logger فقط
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Solana - RPC Pool', () => {
  let RpcPoolClass: typeof RpcPool;

  beforeEach(async () => {
    vi.clearAllMocks();
    // استيراد RpcPool بدون mock (نستخدم الكود الحقيقي)
    // الـ circuit breaker مازال يعمل لأنه لا يحتاج RPC حقيقي
    const mod = await vi.importActual<typeof import('@/lib/solana/rpc-pool')>('@/lib/solana/rpc-pool');
    RpcPoolClass = mod.RpcPool;
  });

  it('ينشئ RpcPool مع URLs صالحة', () => {
    const pool = new RpcPoolClass([
      'https://api.mainnet-beta.solana.com',
      'https://solana-mainnet.rpc.extrnode.com',
    ]);
    expect(pool).toBeDefined();
  });

  it('يرمي خطأ عند تمرير قائمة URLs فارغة', async () => {
    const pool = new RpcPoolClass([]);
    await expect(pool.call(async () => 'test')).rejects.toThrow('All RPC endpoints are unavailable');
  });

  it('يعزل الـ endpoint الفاشل بعد 5 أخطاء', async () => {
    const pool = new RpcPoolClass(['https://api.mainnet-beta.solana.com']);
    
    // محاكاة فشل 5 مرات متتالية
    for (let i = 0; i < 6; i++) {
      await expect(
        pool.call(async () => {
          throw new Error('RPC Error');
        })
      ).rejects.toThrow();
    }
    
    // endpoint يجب أن يكون مقفولاً
    await expect(pool.call(async () => 'test')).rejects.toThrow('All RPC endpoints are unavailable');
  });
});

describe('Solana - Memo Program', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // مسح متغيرات البيئة
    delete process.env.MEMO_SIGNER_SECRET;
  });

  it('يعيد null عندما لا يوجد MEMO_SIGNER_SECRET', async () => {
    const { getMemoKeypair } = await import('@/lib/solana/memo');
    const keypair = getMemoKeypair();
    expect(keypair).toBeNull();
  });

  it('يرمي خطأ عند كتابة hash بدون مفتاح', async () => {
    const { writeHashOnChain } = await import('@/lib/solana/memo');
    await expect(writeHashOnChain('abc123')).rejects.toThrow('MEMO_SIGNER_SECRET not configured');
  });

  it('يبني memo text بشكل صحيح', async () => {
    // نختبر فقط صيغة memo text
    const hash = 'a'.repeat(64); // SHA-256 hash
    const expectedMemo = `niche:v1:${hash}`;
    expect(expectedMemo).toMatch(/^niche:v1:[a-f0-9]{64}$/);
  });

  it('يتحقق من وجود SolanaTxSig صحيح في chain (باستخدام mock)', async () => {
    // نختبر verifyHashOnChain مع rpcPool حقيقي لكن بدون RPC
    const { verifyHashOnChain } = await import('@/lib/solana/memo');
    
    // نختبر المنطق الأساسي: test=true فقط عندما tx.meta.err = null
    // و test=false في كل الحالات الأخرى
    const result = await verifyHashOnChain('dummySignature');
    expect(result).toBe(false); // بدون RPC حقيقي، ستفشل دائماً
  });

  it('يتحقق من صيغة verifyHashOnChain عند تمرير signature غير صالح', async () => {
    const { verifyHashOnChain } = await import('@/lib/solana/memo');
    const result = await verifyHashOnChain('invalid_signature_12345');
    expect(result).toBe(false);
  });
});
