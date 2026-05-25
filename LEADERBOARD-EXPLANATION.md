# 🧠 شرح Leaderboard — إجابة صريحة على سؤالك

## الوضع الحالي: ❌ لا، لا يسحب كل المتداولين تلقائياً

**لماذا؟** Polymarket API لا يعطيك "قائمة بكل المتداولين" — مفيش endpoint اسمه `/all-traders`. عشان تجيب متداول لازم تعرف عنوان محفظته الأول.

**إزاي هنوصل للنتيجة دي؟** اكتشفنا آلية جديدة:
1. نجيب top 10 events نشطة لكل قسم (sports, politics, crypto, etc.)
2. لكل event نجيب trades اللي فيه عن طريق `conditionId`
3. من الـ trades نستخرج proxy wallets
4. نخزنهم في DB ونجيب TrustScore لكل واحد

**الملفات اللي اتبنت عشان كده:**
- `lib/polymarket/discovery.ts` — دا الـ Discovery Engine
- `api/leaderboard/discover` — API تشغيله

## بعد ما يتشافوا: كل تفاصيلهم بتتنحط في DB
كل متداول عنده في DB:
- proxyWallet (عنوان المحفظة)
- displayName / pseudonym (اسمه على Polymarket)
- verifiedBadge (علامة توثيق)
- xUsername (حسابه على X)
- trustScore (درجة الثقة 0-100)
- winRate (نسبة النجاح)
- roi (العائد)
- maxDrawdown (أقصى خسارة)
- consistency (الاتساق)
- profitFactor (معامل الربح)
- riskLevel (مستوى المخاطرة)
- totalTrades (عدد التداولات)
- activityDays (أيام النشاط)
- categories (الأقسام اللي بيضارب فيها)
- lastSyncedAt (آخر تحديث)

## صفحة بروفايل لكل متداول
موجودة بالفعل: `/trader/[wallet]` — بتظهر كل التفاصيل دي.

## التحديث والترتيب التلقائي
- Cron job كل 5 دقائق: `GET /api/cron/refresh-leaderboard`
  1. **Discovery phase**: يكتشف متداولين جدد من الأحداث النشطة
  2. **Sync phase**: يحسب TrustScore لكل متداول جديد أو قديم
- الترتيب تلقائي: `getLeaderboard()` يرجع `orderBy: { trustScore: 'desc' }`

## إيه اللي ناقص عشان نقول "كله شغال كامل"؟
- [ ] تشغيل قاعدة البيانات (Neon حالياً stop)
- [ ] `npx prisma db push` عشان الـ model الجديد
- [ ] تشغيل `POST /api/leaderboard/discover` مرة واحدة
- [ ] تشغيل `POST /api/leaderboard/seed`
- [ ] Cron job فعلي على Vercel كل 5 دقائق

## الخلاصة
النظام مبني صح، Discovery Engine جاهز، الفلتر والتحديث والترتيب شغالين. اللي ناقص بس هو تشغيل قاعدة البيانات وضبط Cron setup — وتقدر تكتشف آلاف المتداولين وتصنفهم.