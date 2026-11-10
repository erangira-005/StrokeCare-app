// Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
// Entries made without signal wait here and are sent, in order, when the phone reconnects.
// Privacy: only the waiting entries are kept on the phone, and each is deleted as soon as the server accepts it.
import { ref } from 'vue'

const KEY = 'sc-outbox'

export interface QueuedWrite {
  id: string
  method: string
  path: string
  body: unknown
  created: string
}

export const pendingCount = ref(read().length)

function read(): QueuedWrite[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}
function write(items: QueuedWrite[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    /* storage full or blocked: nothing more we can do offline */
  }
  pendingCount.value = items.length
}

export function enqueue(item: Omit<QueuedWrite, 'id' | 'created'>) {
  const items = read()
  items.push({ ...item, id: crypto.randomUUID(), created: new Date().toISOString() })
  write(items)
}

export function clearQueue() {
  write([])
}

/** Send waiting entries. Stops at the first network failure; drops entries the server rejects as invalid. */
export async function flush(send: (item: QueuedWrite) => Promise<Response>): Promise<{ sent: number; dropped: number }> {
  let sent = 0
  let dropped = 0
  for (const item of read()) {
    let r: Response
    try {
      r = await send(item)
    } catch {
      break
    }
    if (r.status >= 500 || r.status === 401) break
    write(read().filter((i) => i.id !== item.id))
    if (r.ok) sent++
    else dropped++
  }
  return { sent, dropped }
}
