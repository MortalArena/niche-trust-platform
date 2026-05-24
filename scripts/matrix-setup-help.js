console.log(`
=== إعداد Matrix (Synapse) للتطوير ===

1) شغّل Synapse:
   pnpm docker:up

2) أنشئ مستخدم admin (أول مرة فقط):
   docker exec -it niche-synapse register_new_matrix_user http://localhost:8008 -c /data/homeserver.yaml -a -u nichebot -p nichebot_dev_pass

3) احصل على access token:
   curl -X POST "http://localhost:8008/_matrix/client/v3/login" ^
     -H "Content-Type: application/json" ^
     -d "{\"type\":\"m.login.password\",\"identifier\":{\"type\":\"m.id.user\",\"user\":\"nichebot\"},\"password\":\"nichebot_dev_pass\"}"

4) ضع في .env:
   MATRIX_HOMESERVER=http://localhost:8008
   MATRIX_ADMIN_TOKEN=<access_token>
   NEXT_PUBLIC_MATRIX_ELEMENT_URL=https://app.element.io

5) سجّل Matrix ID لحسابك من صفحة الجروب (@you:localhost) ثم اشترك.

Element Web محلي (اختياري): docker run -p 8080:80 -e DEFAULT_HS_URL=http://localhost:8008 vectorim/element-web
`);
