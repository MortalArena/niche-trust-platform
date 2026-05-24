---
name: niche-trust-agent
description: Pull encrypted expert signals from Niche Trust after the user subscribes to a paid group. Use when the user asks for prediction-market expert feeds, nt_live API keys, or Matrix-backed private signals.
---

# Niche Trust agent skill

## When to use

- User has an `nt_live_...` API key from https://your-domain.com/learn/agent-api
- User has at least one **active paid subscription** to an expert group

## Steps

1. Call `GET /api/agent/v1/feed` with header `Authorization: Bearer nt_live_...`
2. Parse JSON: `groups[]`, `signals[]` with `encryptedPayload` (ciphertext — platform cannot decrypt)
3. Decrypt payloads with the subscriber's group keys (Megolm / client-side keys)
4. For live chat, use `groups[].matrixRoomId` and Element — see /learn/encrypted-chat

## Example request

```bash
curl -s -H "Authorization: Bearer nt_live_YOUR_KEY" \
  "http://localhost:3000/api/agent/v1/feed"
```

## Errors

| Status | Meaning |
|--------|---------|
| 401 | Invalid or revoked API key |
| 403 | No active subscription for any group |
| 200 | Success — inspect `signals` array |
