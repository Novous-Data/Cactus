/* Saving: this browser (always) plus the viewer's Claude account (when the page can). */

const Store = {
  KEY: 'windowsill-cactus-v1',
  db: null,
  ref: null,
  cloudOn: false,
  chain: Promise.resolve(),
  dirtyCloud: false,

  loadLocal() {
    const S = local.get(this.KEY);
    return S && S.v === SAVE_VERSION && S.plant ? S : null;
  },
  saveLocal(S) {
    if (!S) return;
    S.updatedAt = Date.now();
    local.set(this.KEY, S);
  },
  clearLocal() { local.remove(this.KEY); },

  /* Resolves the cloud copy (or null). Never throws. */
  async init() {
    try {
      if (!window.claude || typeof window.claude.use !== 'function') return null;
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (!db || !user) return null;
      const id = await user.id();
      if (!id) return null;
      this.db = db;
      this.ref = db.doc(`data/users/${id}/save`);
      this.cloudOn = true;
      const snap = await this.ref.get();
      const data = snap.exists ? snap.data() : null;
      return data && data.v === SAVE_VERSION && data.plant ? JSON.parse(JSON.stringify(data)) : null;
    } catch (e) {
      this.cloudOn = false;
      return null;
    }
  },

  /* One write at a time; later calls coalesce into the next write. */
  saveCloud(S) {
    if (!this.cloudOn || !S) return;
    this.pending = S;
    if (this.writing) return;
    this.writing = true;
    this.chain = this.chain.then(async () => {
      while (this.pending) {
        const snap = JSON.parse(JSON.stringify(this.pending));
        this.pending = null;
        try {
          await this.ref.set(snap);
        } catch (e) {
          if (e?.code === 'invalid_argument' || e?.code === 'revoked' || e?.code === 'not_granted') this.cloudOn = false;
          if (e?.code === 'unavailable') { await sleep(1500 + Math.random() * 1500); try { await this.ref.set(snap); } catch { /* try next time */ } }
          break;
        }
      }
      this.writing = false;
    });
  },

  async clearCloud() {
    if (!this.cloudOn) return;
    try { await this.ref.delete(); } catch { /* ignore */ }
  },
};
