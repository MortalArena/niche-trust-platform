'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MARKET_CATEGORIES } from '@/lib/markets/categories';
import { EXPERT_SERVICE_TYPES } from '@/lib/experts/service-types';

export function CreateGroupForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categorySlug, setCategorySlug] = useState('crypto');
  const [subcategorySlug, setSubcategorySlug] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('50');
  const [yearlyPrice, setYearlyPrice] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [serviceTypes, setServiceTypes] = useState<string[]>(['private-groups']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const category = MARKET_CATEGORIES.find((c) => c.slug === categorySlug);

  const toggleType = (slug: string) => {
    setServiceTypes((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          categorySlug,
          subcategorySlug: subcategorySlug || undefined,
          monthlyPriceUsd: parseFloat(monthlyPrice) || 0,
          yearlyPriceUsd: yearlyPrice ? parseFloat(yearlyPrice) : undefined,
          isPublic,
          allowPublicComments: allowComments,
          serviceTypes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to create group');
        return;
      }

      router.push(`/groups/${data.group.id}`);
      router.refresh();
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Group name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!isPublic} onChange={(e) => setIsPublic(!e.target.checked)} />
          Private paid group (encrypted Matrix chat)
        </label>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">What you offer in this group</label>
        <div className="grid gap-2 sm:grid-cols-2">
          {EXPERT_SERVICE_TYPES.map((s) => (
            <label key={s.slug} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={serviceTypes.includes(s.slug)}
                onChange={() => toggleType(s.slug)}
              />
              {s.icon} {s.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Market category</label>
        <select
          value={categorySlug}
          onChange={(e) => {
            setCategorySlug(e.target.value);
            setSubcategorySlug('');
          }}
          className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        >
          {MARKET_CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </div>

      {category?.subcategories && category.subcategories.length > 0 && (
        <div>
          <label className="mb-1 block text-sm text-[var(--text-secondary)]">Subcategory</label>
          <select
            value={subcategorySlug}
            onChange={(e) => setSubcategorySlug(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          >
            <option value="">—</option>
            {category.subcategories.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={allowComments}
          onChange={(e) => setAllowComments(e.target.checked)}
        />
        Allow public comments (signed-in users on public listing)
      </label>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-[var(--text-secondary)]">Monthly ($)</label>
          <input
            type="number"
            min="0"
            value={monthlyPrice}
            onChange={(e) => setMonthlyPrice(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--text-secondary)]">Yearly ($)</label>
          <input
            type="number"
            min="0"
            value={yearlyPrice}
            onChange={(e) => setYearlyPrice(e.target.value)}
            placeholder="Optional"
            className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creating…' : 'Create group + encrypted chat room'}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
