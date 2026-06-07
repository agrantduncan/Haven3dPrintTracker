// Browser-side service — calls Vercel API routes.
// DATABASE_URL never appears here; it lives server-side in api/inventory.ts.

export async function syncInventory(key: string, value: unknown): Promise<void> {
  try {
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.error('[db] syncInventory failed for key:', key, err instanceof Error ? err.message : '');
  }
}

export async function loadAllInventory(): Promise<Record<string, unknown>> {
  try {
    const res = await fetch('/api/inventory');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as Record<string, unknown>;
  } catch (err) {
    console.error('[db] loadAllInventory failed:', err instanceof Error ? err.message : '');
    return {};
  }
}
