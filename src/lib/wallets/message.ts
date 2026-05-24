export function buildSignInMessage(): string {
  return `Sign in to Niche Trust\nNonce: ${crypto.randomUUID()}\nTimestamp: ${Date.now()}`;
}
