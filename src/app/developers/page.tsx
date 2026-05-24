import { redirect } from 'next/navigation';

/** Legacy URL — tools live under Learn now */
export default function DevelopersRedirect() {
  redirect('/learn/agent-api');
}
