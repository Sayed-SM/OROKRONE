import { STORAGE_KEYS, CONFIG } from './config.js';

function makeStore(key, event, max = Infinity) {
  const read = () => {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  };
  const write = (ids) => {
    localStorage.setItem(key, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent(event, { detail: ids }));
  };
  return {
    ids: read,
    count: () => read().length,
    has: (id) => read().includes(id),
    toggle(id) {
      const ids = read();
      if (ids.includes(id)) { write(ids.filter((x) => x !== id)); return { added: false }; }
      if (ids.length >= max) return { added: false, full: true };
      write([...ids, id]);
      return { added: true };
    },
    remove(id) { write(read().filter((x) => x !== id)); },
    clear() { write([]); },
  };
}

export const wishlist = makeStore(STORAGE_KEYS.wishlist, 'wishlist:change');
export const compare = makeStore(STORAGE_KEYS.compare, 'compare:change', CONFIG.MAX_COMPARE);
