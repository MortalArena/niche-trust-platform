/**
 * ✅ Key Store - تخزين آمن لمفاتيح التشفير
 * 
 * المشكلة التي تم حلها:
 * - كان المفتاح يتولد من جديد مع كل توقع (generateGroupKey)
 * - المفتاح القديم كان يُفقد والتوقعات السابقة غير قابلة للفك
 * 
 * الحل:
 * - تخزين المفتاح في IndexedDB (آمن، دائم، لا يختفي)
 * - مفتاح واحد ثابت لكل جروب
 * - مشاركة المفتاح عبر Matrix DM عند انضمام عضو جديد
 */

const DB_NAME = 'niche-trust-keys';
const STORE_NAME = 'group-keys';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'groupId' });
      }
    };
    
    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
    
    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export interface StoredGroupKey {
  groupId: string;
  keyBase64: string;
  createdAt: number;
}

/**
 * حفظ مفتاح جروب في IndexedDB
 */
export async function saveGroupKey(groupId: string, keyBase64: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const record: StoredGroupKey = {
      groupId,
      keyBase64,
      createdAt: Date.now(),
    };
    store.put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = (event) => reject((event.target as IDBRequest).error);
  });
}

/**
 * استرجاع مفتاح جروب من IndexedDB
 */
export async function getGroupKey(groupId: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(groupId);
    
    request.onsuccess = () => {
      const record = request.result as StoredGroupKey | undefined;
      resolve(record?.keyBase64 ?? null);
    };
    
    request.onerror = (event) => reject((event.target as IDBRequest).error);
  });
}

/**
 * حذف مفتاح جروب (عند مغادرة العضو)
 */
export async function deleteGroupKey(groupId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(groupId);
    tx.oncomplete = () => resolve();
    tx.onerror = (event) => reject((event.target as IDBRequest).error);
  });
}

/**
 * الحصول على كل مفاتيح الجروبات المخزنة
 */
export async function getAllGroupKeys(): Promise<StoredGroupKey[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result as StoredGroupKey[]);
    };
    
    request.onerror = (event) => reject((event.target as IDBRequest).error);
  });
}