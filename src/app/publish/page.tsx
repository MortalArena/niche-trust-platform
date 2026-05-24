'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function PublishPage() {
  const { data: session } = useSession();
  const { publicKey, signMessage } = useWallet();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('price_action');
  const [asset, setAsset] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [question, setQuestion] = useState('');
  const [predictedOutcome, setPredictedOutcome] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [visibility, setVisibility] = useState('group');
  const [groupId, setGroupId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      if (!session?.user?.id) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      // Build prediction text from form
      const predictionText = JSON.stringify({
        title,
        description,
        asset: asset || undefined,
        entryPrice: entryPrice ? parseFloat(entryPrice) : undefined,
        targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
        stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
        question: question || undefined,
        predictedOutcome: predictedOutcome || undefined,
        timeframe: timeframe || undefined,
      });

      // Compute SHA-256 hash using built-in Web Crypto API
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(predictionText));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Simple client-side "encryption" (base64 encode since we trust HTTPS for transport)
      // In production: use libsodium with group key
      const encryptedPayload = btoa(predictionText);
      const nonce = 'local'; // Simplified for MVP

      const body: Record<string, any> = {
        title,
        description: description || undefined,
        category,
        asset: asset || undefined,
        entryPrice: entryPrice ? parseFloat(entryPrice) : undefined,
        targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
        stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
        question: question || undefined,
        predictedOutcome: predictedOutcome || undefined,
        timeframe: timeframe || undefined,
        externalUrl: externalUrl || undefined,
        encryptedPayload,
        nonce,
        contentHash,
        visibility,
        groupId: groupId || undefined,
        expiresAt: timeframe ? new Date(Date.now() + parseTimeframe(timeframe)).toISOString() : undefined,
      };

      const res = await fetch('/api/prediction/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'فشل النشر');
      }

      setResult(data);
      
      // Reset form
      setTitle('');
      setDescription('');
      setAsset('');
      setEntryPrice('');
      setTargetPrice('');
      setStopLoss('');
      setQuestion('');
      setPredictedOutcome('');
      setExternalUrl('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session, title, description, category, asset, entryPrice, targetPrice, stopLoss, question, predictedOutcome, timeframe, externalUrl, visibility, groupId]);

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">نشر توقع جديد</h1>
        <p className="text-gray-600">يرجى تسجيل الدخول بالمحفظة أولاً</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">نشر توقع جديد</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
          <p className="text-green-700 font-medium">✅ تم النشر بنجاح!</p>
          <p className="text-sm text-gray-600 mt-1">
            Hash: <code className="bg-gray-100 px-1 rounded">{result.contentHash.slice(0, 16)}...</code>
          </p>
          <p className="text-sm text-gray-600">
            On-chain: {result.onChainStatus === 'confirmed' ? '✅ مؤكد' : '⏳ قيد الانتظار'}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">عنوان التوقع *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-lg p-2"
            placeholder="مثال: BTC سيصل إلى 100,000$ خلال شهر"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">وصف (اختياري)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded-lg p-2"
            rows={3}
            placeholder="شرح تفصيلي للتوقع..."
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-1">نوع التوقع</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border rounded-lg p-2"
          >
            <option value="price_action">تحليل سعري (Price Action)</option>
            <option value="binary">نعم/لا (Binary)</option>
            <option value="multiple_choice">اختيار من متعدد</option>
            <option value="numerical">رقمي (Numerical)</option>
            <option value="polymarket">Polymarket</option>
            <option value="kalshi">Kalshi</option>
            <option value="stock">سهم عادي</option>
            <option value="manual">يدوي</option>
          </select>
        </div>

        {/* Asset (for price_action) */}
        {(category === 'price_action' || category === 'stock') && (
          <div>
            <label className="block text-sm font-medium mb-1">الأصل/العملة</label>
            <input
              type="text"
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              className="w-full border rounded-lg p-2"
              placeholder="مثال: BTC, SOL, ETH, أو عنوان العقد"
            />
          </div>
        )}

        {/* Price fields */}
        {category === 'price_action' && (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">سعر الدخول</label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full border rounded-lg p-2"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">السعر المستهدف</label>
              <input
                type="number"
                step="any"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="w-full border rounded-lg p-2"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">وقف الخسارة</label>
              <input
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className="w-full border rounded-lg p-2"
                placeholder="0.00"
              />
            </div>
          </div>
        )}

        {/* Binary / Question */}
        {category === 'binary' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">السؤال</label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full border rounded-lg p-2"
                placeholder="مثال: هل سيصل BTC إلى 100,000$ قبل نهاية العام؟"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">التوقع</label>
              <select
                value={predictedOutcome}
                onChange={(e) => setPredictedOutcome(e.target.value)}
                className="w-full border rounded-lg p-2"
              >
                <option value="">-- اختر --</option>
                <option value="yes">نعم</option>
                <option value="no">لا</option>
              </select>
            </div>
          </>
        )}

        {/* Timeframe */}
        <div>
          <label className="block text-sm font-medium mb-1">الإطار الزمني</label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-full border rounded-lg p-2"
          >
            <option value="">-- اختر --</option>
            <option value="1h">ساعة</option>
            <option value="4h">4 ساعات</option>
            <option value="24h">يوم</option>
            <option value="7d">أسبوع</option>
            <option value="30d">شهر</option>
            <option value="90d">3 أشهر</option>
            <option value="365d">سنة</option>
            <option value="lifetime">غير محدد</option>
          </select>
        </div>

        {/* External URL (for Polymarket/Kalshi) */}
        {(category === 'polymarket' || category === 'kalshi') && (
          <div>
            <label className="block text-sm font-medium mb-1">رابط السوق الخارجي</label>
            <input
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              className="w-full border rounded-lg p-2"
              placeholder="https://polymarket.com/event/..."
            />
          </div>
        )}

        {/* Visibility */}
        <div>
          <label className="block text-sm font-medium mb-1">الرؤية</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="w-full border rounded-lg p-2"
          >
            <option value="public">عام - يرى الجميع</option>
            <option value="group">خاص - للمشتركين فقط</option>
            <option value="private">سري - أنا فقط</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || !title}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading ? 'جاري النشر...' : '📡 نشر التوقع'}
        </button>
      </form>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
        <p className="font-medium mb-2">🔒 ملاحظة الخصوصية:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>يتم حساب بصمة (Hash) للتوقع وتسجيلها على Solana</li>
          <li>هذا يثبت أن التوقع وُجد في هذا التوقيت دون كشف محتواه</li>
          <li>التوقيع على السلسلة مجاني تقريباً (~$0.0008)</li>
          <li>التوقعات الخاصة للمشتركين فقط ترى في غرف Matrix المشفرة</li>
        </ul>
      </div>
    </div>
  );
}

function parseTimeframe(tf: string): number {
  const units: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
    '365d': 365 * 24 * 60 * 60 * 1000,
    'lifetime': 365 * 24 * 60 * 60 * 1000 * 10, // 10 years
  };
  return units[tf] || 24 * 60 * 60 * 1000;
}