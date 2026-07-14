// DuxSession - realtime session shared by setter / lane / phone screens.
// Transport: Supabase Realtime when configured, BroadcastChannel otherwise
// (and always mirrored locally so same-device tabs stay in sync).
(function (root) {
  const ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no lookalikes
  function makeCode(n) {
    let s = ""; for (let i = 0; i < (n || 4); i++) s += ALPHA[Math.floor(Math.random() * ALPHA.length)];
    return s;
  }
  function uid() { return Math.random().toString(36).slice(2, 10); }

  function DuxSession(code, role, meta) {
    this.code = code.toUpperCase();
    this.role = role;
    this.id = uid();
    this.meta = meta || {};
    this.handlers = {};
    this.peersMap = {};
    this._openLocal();
    this._openSupabase();
  }
  DuxSession.prototype.on = function (ev, fn) {
    (this.handlers[ev] = this.handlers[ev] || []).push(fn); return this;
  };
  DuxSession.prototype._emit = function (ev, msg) {
    (this.handlers[ev] || []).forEach(fn => { try { fn(msg.data, msg.from); } catch (e) { console.error(e); } });
  };
  DuxSession.prototype.send = function (ev, data) {
    const msg = { ev, from: { id: this.id, role: this.role, meta: this.meta }, t: Date.now(), data };
    if (this.bc) this.bc.postMessage(msg);
    if (this.chan) this.chan.send({ type: "broadcast", event: "dux", payload: msg });
    return msg;
  };
  DuxSession.prototype._recv = function (msg) {
    if (!msg || msg.from.id === this.id) return;
    if (msg.ev === "__hello__") {
      this.peersMap[msg.from.id] = msg.from;
      this._emit("peers", { data: this.peers(), from: msg.from });
      // answer so the newcomer learns about us
      this.send("__here__", {});
      return;
    }
    if (msg.ev === "__here__") {
      this.peersMap[msg.from.id] = msg.from;
      this._emit("peers", { data: this.peers(), from: msg.from });
      return;
    }
    if (msg.ev === "__bye__") {
      delete this.peersMap[msg.from.id];
      this._emit("peers", { data: this.peers(), from: msg.from });
      return;
    }
    this._emit(msg.ev, msg);
  };
  DuxSession.prototype.peers = function () {
    const self = { id: this.id, role: this.role, meta: this.meta };
    return [self].concat(Object.values(this.peersMap));
  };
  DuxSession.prototype.hello = function () { this.send("__hello__", {}); };
  DuxSession.prototype._openLocal = function () {
    if (typeof BroadcastChannel === "undefined") return;
    this.bc = new BroadcastChannel("dux:" + this.code);
    this.bc.onmessage = (e) => this._recv(e.data);
  };
  DuxSession.prototype._openSupabase = function () {
    const cfg = root.DUX_SUPABASE;
    if (!cfg || !cfg.configured() || !root.supabase) { this.mode = "local"; return; }
    this.mode = "live";
    this.sb = root.supabase.createClient(cfg.url, cfg.anonKey);
    this.chan = this.sb.channel("dux:" + this.code, { config: { broadcast: { self: false } } });
    this.chan.on("broadcast", { event: "dux" }, (p) => this._recv(p.payload));
    this.chan.subscribe((status) => {
      if (status === "SUBSCRIBED") { this._emit("ready", { data: { mode: "live" }, from: null }); this.hello(); }
    });
    window.addEventListener("beforeunload", () => this.send("__bye__", {}));
  };
  // best-effort state persistence (survives refresh when Supabase is live)
  DuxSession.prototype.saveState = async function (state) {
    if (!this.sb) return;
    try {
      await this.sb.from("demo_sessions").upsert(
        { code: this.code, state, updated_at: new Date().toISOString() }, { onConflict: "code" });
    } catch (e) { /* table may not exist yet - fine */ }
  };
  DuxSession.prototype.loadState = async function () {
    if (!this.sb) return null;
    try {
      const { data } = await this.sb.from("demo_sessions").select("state").eq("code", this.code).maybeSingle();
      return data ? data.state : null;
    } catch (e) { return null; }
  };
  root.DuxSession = DuxSession;
  root.DuxSession.makeCode = makeCode;
  if (typeof module !== "undefined") module.exports = { makeCode, uid };
})(typeof self !== "undefined" ? self : globalThis);
