// Browser-side service — calls Vercel API routes.
// DATABASE_URL never appears here; it lives server-side in api/inventory.ts.
// Callers handle errors — these throw on failure.

export async function syncInventory(key: string, value: unknown): Promise<void> {
  const res = await fetch('/api/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function loadAllInventory(): Promise<Record<string, unknown>> {
  const res = await fetch('/api/inventory');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Record<string, unknown>;
}
