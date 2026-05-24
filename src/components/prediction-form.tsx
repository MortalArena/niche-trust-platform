'use client';

import { useState, useEffect } from 'react';
import { initSodium, encryptMessage, generateGroupKey, exportKey, importKey } from '@/lib/crypto/encrypt';
import { hashMessage } from '@/lib/crypto/hash';
import { saveGroupKey, getGroupKey } from '@/lib/crypto/key-store';

export function PredictionForm() {
  const [text, setText] = useState('');
  const [groupId, setGroupId] = useState<string>('default');
  const [visibility, setVisibility] = useState<'public' | 'group' | 'private'>('group');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ id: string; contentHash: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sodiumReady, setSodiumReady] = useState(false);

  useEffect(() => {
    initSodium().then(() => setSodiumReady(true));
  }, []);

  /**
   * ✅ الحصول على أو إنشاء مفتاح تشفير ثابت للجروب
   * - مفتاح واحد لكل جروب، يُخزَّن في IndexedDB
   * - لا يتم توليد مفتاح جديد مع كل توقع
   */
  async function getOrCreateGroupKey(groupId: string): Promise<Uint8Array> {
    const storedKeyBase64 = await getGroupKey(groupId);
    
    if (storedKeyBase64) {
      // ✅ مفتاح موجود — نستخدمه (التوقعات القديمة قابلة للفك)
      return importKey(storedKeyBase64);
    }

    // ❌ مفتاح غير موجود — ننشئ مفتاحاً جديداً ثابتاً
    const newKey = generateGroupKey();
    await saveGroupKey(groupId, exportKey(newKey));
    return newKey;
  }

  const handlePublish = async () => {
    if (!text.trim()) return;
    if (!sodiumReady) {
      setError('Encryption library not loaded yet. Please wait...');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // ✅ استخدام مفتاح ثابت للجروب — وليس مفتاحاً جديداً
      const groupKey = await getOrCreateGroupKey(groupId);
      
      // تشفير النص بمفتاح الجروب
      const { ciphertext, nonce } = encryptMessage(text, groupKey);
      const contentHash = await hashMessage(text);

      const res = await fetch('/api/prediction/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encryptedPayload: ciphertext,
          nonce,
          contentHash,
          visibility,
          groupId: visibility === 'group' ? groupId : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Publish failed');
        return;
      }

      setResult({ id: data.id, contentHash: data.contentHash });
      setText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Encryption or publish error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-4 text-lg font-semibold">Publish encrypted prediction</h2>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your prediction here..."
        className="mb-4 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm focus:border-violet-600 focus:outline-none"
        rows={5}
      />

      <div className="mb-4 flex gap-2">
        {(['public', 'group', 'private'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVisibility(v)}
            className={`rounded px-3 py-1 text-xs capitalize ${
              visibility === v ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handlePublish}
        disabled={loading || !text.trim() || !sodiumReady}
        className="w-full rounded-lg bg-violet-600 py-2 font-medium text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {!sodiumReady ? 'Loading encryption...' : loading ? 'Publishing...' : 'Publish & attest hash'}
      </button>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {result && (
        <div className="mt-4 rounded-lg bg-zinc-950 p-3 text-xs">
          <p className="text-green-400">✅ Published successfully</p>
          <p className="mt-1 break-all font-mono text-zinc-500">Hash: {result.contentHash}</p>
          <a
            href={`/api/prediction/verify/${result.contentHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-blue-400 hover:underline"
          >
            🔍 Verify on-chain →
          </a>
        </div>
      )}
    </div>
  );
}
