import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
const DB_URL = "libsql://how-long-is-a-click-puruvj.turso.io";
const DB_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3MTM4NjUzMTcsImlkIjoiY2RkNTgyYTktYTIzZi00MmZkLWI1NjUtNWY5Y2E5N2Y1YWExIn0.ZwOr1P6cQS8YDj_aRpbOkMd789B4DUzBlgJmKHsslEjCd3mt4si4dOr53AwsytHWzlFBquit981tCgAhPTicAg";
const RATE_LIMIT_SECRET = "lalaland";
const clicks = sqliteTable("clicks", {
  id: text("id").notNull().primaryKey(),
  duration: integer("duration", { mode: "number" }).notNull(),
  pointer_type: integer("pointer_type").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp_ms" }).notNull().default(sql`CURRENT_TIMESTAMP`)
});
const schema = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clicks
}, Symbol.toStringTag, { value: "Module" }));
const libsql_client = createClient({
  url: `${DB_URL}`,
  authToken: DB_TOKEN
});
const db = drizzle(libsql_client, { schema });
const perf = typeof performance === "object" && performance && typeof performance.now === "function" ? performance : Date;
const now = () => perf.now();
const isPosInt = (n) => n && n === Math.floor(n) && n > 0 && isFinite(n);
const isPosIntOrInf = (n) => n === Infinity || isPosInt(n);
class TTLCache {
  constructor({
    max = Infinity,
    ttl,
    updateAgeOnGet = false,
    checkAgeOnGet = false,
    noUpdateTTL = false,
    dispose,
    noDisposeOnSet = false
  } = {}) {
    this.expirations = /* @__PURE__ */ Object.create(null);
    this.data = /* @__PURE__ */ new Map();
    this.expirationMap = /* @__PURE__ */ new Map();
    if (ttl !== void 0 && !isPosIntOrInf(ttl)) {
      throw new TypeError(
        "ttl must be positive integer or Infinity if set"
      );
    }
    if (!isPosIntOrInf(max)) {
      throw new TypeError("max must be positive integer or Infinity");
    }
    this.ttl = ttl;
    this.max = max;
    this.updateAgeOnGet = !!updateAgeOnGet;
    this.checkAgeOnGet = !!checkAgeOnGet;
    this.noUpdateTTL = !!noUpdateTTL;
    this.noDisposeOnSet = !!noDisposeOnSet;
    if (dispose !== void 0) {
      if (typeof dispose !== "function") {
        throw new TypeError("dispose must be function if set");
      }
      this.dispose = dispose;
    }
    this.timer = void 0;
    this.timerExpiration = void 0;
  }
  setTimer(expiration, ttl) {
    if (this.timerExpiration < expiration) {
      return;
    }
    if (this.timer) {
      clearTimeout(this.timer);
    }
    const t = setTimeout(() => {
      this.timer = void 0;
      this.timerExpiration = void 0;
      this.purgeStale();
      for (const exp in this.expirations) {
        this.setTimer(exp, exp - now());
        break;
      }
    }, ttl);
    if (t.unref)
      t.unref();
    this.timerExpiration = expiration;
    this.timer = t;
  }
  // hang onto the timer so we can clearTimeout if all items
  // are deleted.  Deno doesn't have Timer.unref(), so it
  // hangs otherwise.
  cancelTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timerExpiration = void 0;
      this.timer = void 0;
    }
  }
  /* istanbul ignore next */
  cancelTimers() {
    process.emitWarning(
      'TTLCache.cancelTimers has been renamed to TTLCache.cancelTimer (no "s"), and will be removed in the next major version update'
    );
    return this.cancelTimer();
  }
  clear() {
    const entries = this.dispose !== TTLCache.prototype.dispose ? [...this] : [];
    this.data.clear();
    this.expirationMap.clear();
    this.cancelTimer();
    this.expirations = /* @__PURE__ */ Object.create(null);
    for (const [key, val] of entries) {
      this.dispose(val, key, "delete");
    }
  }
  setTTL(key, ttl = this.ttl) {
    const current = this.expirationMap.get(key);
    if (current !== void 0) {
      const exp = this.expirations[current];
      if (!exp || exp.length <= 1) {
        delete this.expirations[current];
      } else {
        this.expirations[current] = exp.filter((k) => k !== key);
      }
    }
    if (ttl !== Infinity) {
      const expiration = Math.floor(now() + ttl);
      this.expirationMap.set(key, expiration);
      if (!this.expirations[expiration]) {
        this.expirations[expiration] = [];
        this.setTimer(expiration, ttl);
      }
      this.expirations[expiration].push(key);
    } else {
      this.expirationMap.set(key, Infinity);
    }
  }
  set(key, val, {
    ttl = this.ttl,
    noUpdateTTL = this.noUpdateTTL,
    noDisposeOnSet = this.noDisposeOnSet
  } = {}) {
    if (!isPosIntOrInf(ttl)) {
      throw new TypeError("ttl must be positive integer or Infinity");
    }
    if (this.expirationMap.has(key)) {
      if (!noUpdateTTL) {
        this.setTTL(key, ttl);
      }
      const oldValue = this.data.get(key);
      if (oldValue !== val) {
        this.data.set(key, val);
        if (!noDisposeOnSet) {
          this.dispose(oldValue, key, "set");
        }
      }
    } else {
      this.setTTL(key, ttl);
      this.data.set(key, val);
    }
    while (this.size > this.max) {
      this.purgeToCapacity();
    }
    return this;
  }
  has(key) {
    return this.data.has(key);
  }
  getRemainingTTL(key) {
    const expiration = this.expirationMap.get(key);
    return expiration === Infinity ? expiration : expiration !== void 0 ? Math.max(0, Math.ceil(expiration - now())) : 0;
  }
  get(key, {
    updateAgeOnGet = this.updateAgeOnGet,
    ttl = this.ttl,
    checkAgeOnGet = this.checkAgeOnGet
  } = {}) {
    const val = this.data.get(key);
    if (checkAgeOnGet && this.getRemainingTTL(key) === 0) {
      this.delete(key);
      return void 0;
    }
    if (updateAgeOnGet) {
      this.setTTL(key, ttl);
    }
    return val;
  }
  dispose(_, __) {
  }
  delete(key) {
    const current = this.expirationMap.get(key);
    if (current !== void 0) {
      const value = this.data.get(key);
      this.data.delete(key);
      this.expirationMap.delete(key);
      const exp = this.expirations[current];
      if (exp) {
        if (exp.length <= 1) {
          delete this.expirations[current];
        } else {
          this.expirations[current] = exp.filter((k) => k !== key);
        }
      }
      this.dispose(value, key, "delete");
      if (this.size === 0) {
        this.cancelTimer();
      }
      return true;
    }
    return false;
  }
  purgeToCapacity() {
    for (const exp in this.expirations) {
      const keys = this.expirations[exp];
      if (this.size - keys.length >= this.max) {
        delete this.expirations[exp];
        const entries = [];
        for (const key of keys) {
          entries.push([key, this.data.get(key)]);
          this.data.delete(key);
          this.expirationMap.delete(key);
        }
        for (const [key, val] of entries) {
          this.dispose(val, key, "evict");
        }
      } else {
        const s = this.size - this.max;
        const entries = [];
        for (const key of keys.splice(0, s)) {
          entries.push([key, this.data.get(key)]);
          this.data.delete(key);
          this.expirationMap.delete(key);
        }
        for (const [key, val] of entries) {
          this.dispose(val, key, "evict");
        }
        return;
      }
    }
  }
  get size() {
    return this.data.size;
  }
  purgeStale() {
    const n = Math.ceil(now());
    for (const exp in this.expirations) {
      if (exp === "Infinity" || exp > n) {
        return;
      }
      const keys = [...this.expirations[exp] || []];
      const entries = [];
      delete this.expirations[exp];
      for (const key of keys) {
        entries.push([key, this.data.get(key)]);
        this.data.delete(key);
        this.expirationMap.delete(key);
      }
      for (const [key, val] of entries) {
        this.dispose(val, key, "stale");
      }
    }
    if (this.size === 0) {
      this.cancelTimer();
    }
  }
  *entries() {
    for (const exp in this.expirations) {
      for (const key of this.expirations[exp]) {
        yield [key, this.data.get(key)];
      }
    }
  }
  *keys() {
    for (const exp in this.expirations) {
      for (const key of this.expirations[exp]) {
        yield key;
      }
    }
  }
  *values() {
    for (const exp in this.expirations) {
      for (const key of this.expirations[exp]) {
        yield this.data.get(key);
      }
    }
  }
  [Symbol.iterator]() {
    return this.entries();
  }
}
var ttlcache = TTLCache;
const TTLCache$1 = /* @__PURE__ */ getDefaultExportFromCjs(ttlcache);
class IPRateLimiter {
  rate;
  constructor(rate) {
    this.rate = rate;
  }
  async hash(event) {
    return event.getClientAddress();
  }
}
class IPUserAgentRateLimiter {
  rate;
  constructor(rate) {
    this.rate = rate;
  }
  async hash(event) {
    const ua = event.request.headers.get("user-agent");
    if (!ua)
      return false;
    return event.getClientAddress() + ua;
  }
}
class CookieRateLimiter {
  rate;
  cookieOptions;
  secret;
  requirePreflight;
  cookieId;
  hashFunction;
  constructor(options) {
    this.cookieId = options.name;
    this.secret = options.secret;
    this.rate = options.rate;
    this.requirePreflight = options.preflight;
    this.hashFunction = options.hashFunction ?? defaultHashFunction;
    this.cookieOptions = {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "strict",
      ...options.serializeOptions
    };
  }
  async hash(event) {
    const currentId = await this.userIdFromCookie(event.cookies.get(this.cookieId), event);
    return currentId ? currentId : false;
  }
  async preflight(event) {
    const data = event.cookies.get(this.cookieId);
    if (data) {
      const userId2 = await this.userIdFromCookie(data, event);
      if (userId2)
        return userId2;
    }
    const userId = nanoid();
    event.cookies.set(this.cookieId, userId + ";" + await this.hashFunction(this.secret + userId), this.cookieOptions);
    return userId;
  }
  async userIdFromCookie(cookie, event) {
    const empty = () => {
      return this.requirePreflight ? null : this.preflight(event);
    };
    if (!cookie)
      return empty();
    const [userId, secretHash] = cookie.split(";");
    if (!userId || !secretHash)
      return empty();
    if (await this.hashFunction(this.secret + userId) != secretHash) {
      return empty();
    }
    return userId;
  }
}
let defaultHashFunction;
if (globalThis?.crypto?.subtle) {
  defaultHashFunction = _subtleSha256;
}
async function _subtleSha256(str) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
class RateLimiter {
  store;
  plugins;
  onLimited;
  hashFunction;
  cookieLimiter;
  static TTLTime(unit) {
    switch (unit) {
      case "s":
        return 1e3;
      case "m":
        return 6e4;
      case "h":
        return 60 * 6e4;
      case "2s":
        return 2e3;
      case "5s":
        return 5e3;
      case "10s":
        return 1e4;
      case "15s":
        return 15e3;
      case "30s":
        return 3e4;
      case "45s":
        return 45e3;
      case "15m":
        return 15 * 6e4;
      case "30m":
        return 30 * 6e4;
      case "100ms":
        return 100;
      case "250ms":
        return 250;
      case "500ms":
        return 500;
      case "2h":
        return 2 * 60 * 6e4;
      case "6h":
        return 6 * 60 * 6e4;
      case "12h":
        return 12 * 60 * 6e4;
      case "d":
        return 24 * 60 * 6e4;
      case "ms":
        return 1;
    }
    throw new Error("Invalid unit for TTLTime: " + unit);
  }
  async isLimited(event, extraData) {
    return (await this._isLimited(event, extraData)).limited;
  }
  /**
   * Clear all rate limits.
   */
  async clear() {
    return await this.store.clear();
  }
  /**
   * Check if a request event is rate limited.
   * @param {RequestEvent} event
   * @returns {Promise<boolean>} true if request is limited, false otherwise
   */
  async _isLimited(event, extraData) {
    let limited = void 0;
    for (const plugin of this.plugins) {
      const rate = plugin.rate;
      const id = await plugin.hash(event, extraData);
      if (id === false) {
        if (this.onLimited) {
          const status = await this.onLimited(event, "rejected");
          if (status === true)
            return { limited: false, hash: null, unit: rate[1] };
        }
        return { limited: true, hash: null, unit: rate[1] };
      } else if (id === null) {
        if (limited === void 0)
          limited = true;
        continue;
      } else {
        limited = false;
      }
      if (!id) {
        throw new Error("Empty hash returned from rate limiter " + plugin.constructor.name);
      }
      if (id === true) {
        return { limited: false, hash: null, unit: rate[1] };
      }
      const hash = await this.hashFunction(id);
      const currentRate = await this.store.add(hash, rate[1]);
      if (currentRate > rate[0]) {
        if (this.onLimited) {
          const status = await this.onLimited(event, "rate");
          if (status === true)
            return { limited: false, hash, unit: rate[1] };
        }
        return { limited: true, hash, unit: rate[1] };
      }
    }
    return {
      limited: limited ?? false,
      hash: null,
      unit: this.plugins[this.plugins.length - 1].rate[1]
    };
  }
  constructor(options = {}) {
    this.plugins = [...options.plugins ?? []];
    this.onLimited = options.onLimited;
    this.hashFunction = options.hashFunction ?? defaultHashFunction;
    if (!this.hashFunction) {
      throw new Error("No RateLimiter hash function found. Please set one with the hashFunction option.");
    }
    const IPRates = options.IP ?? options.rates?.IP;
    if (IPRates)
      this.plugins.push(new IPRateLimiter(IPRates));
    const IPUARates = options.IPUA ?? options.rates?.IPUA;
    if (IPUARates)
      this.plugins.push(new IPUserAgentRateLimiter(IPUARates));
    const cookieRates = options.cookie ?? options.rates?.cookie;
    if (cookieRates) {
      this.plugins.push(this.cookieLimiter = new CookieRateLimiter({
        hashFunction: this.hashFunction,
        ...cookieRates
      }));
    }
    if (!this.plugins.length) {
      throw new Error("No plugins set for RateLimiter!");
    }
    this.plugins.sort((a, b) => {
      const diff = RateLimiter.TTLTime(a.rate[1]) - RateLimiter.TTLTime(b.rate[1]);
      return diff == 0 ? a.rate[0] - b.rate[0] : diff;
    });
    const maxTTL = this.plugins.reduce((acc, plugin) => {
      const rate = plugin.rate[1];
      if (rate == "ms") {
        console.warn('RateLimiter: The "ms" unit is not reliable due to OS timing issues.');
      }
      const time = RateLimiter.TTLTime(rate);
      return Math.max(time, acc);
    }, 0);
    this.store = options.store ?? new TTLStore(maxTTL, options.maxItems);
  }
}
class TTLStore {
  cache;
  constructor(maxTTL, maxItems = Infinity) {
    this.cache = new TTLCache$1({
      ttl: maxTTL,
      max: maxItems,
      noUpdateTTL: true
    });
  }
  async clear() {
    return this.cache.clear();
  }
  async add(hash, unit) {
    const currentRate = this.cache.get(hash) ?? 0;
    return this.set(hash, currentRate + 1, unit);
  }
  set(hash, rate, unit) {
    this.cache.set(hash, rate, { ttl: RateLimiter.TTLTime(unit) });
    return rate;
  }
}
const limiter = new RateLimiter({
  // A rate is defined as [number, unit]
  IP: [1e3, "d"],
  // IP address limiter
  IPUA: [100, "h"],
  // IP + User Agent limiter
  cookie: {
    // Cookie limiter
    name: "limiterid",
    // Unique cookie name for this limiter
    secret: RATE_LIMIT_SECRET,
    // Use $env/static/private
    rate: [10, "m"],
    preflight: true
    // Require preflight call (see load function)
  }
});
const load = async (event) => {
  await limiter.cookieLimiter?.preflight(event);
  const [avg, category_average] = await db.batch([
    db.select({ average_duration: sql`AVG(duration)`, count: sql`COUNT(*)` }).from(clicks),
    db.select({
      pointer_type: clicks.pointer_type,
      average_duration: sql`AVG(duration)`,
      count: sql`COUNT(*)`
    }).from(clicks).groupBy(clicks.pointer_type)
  ]);
  return { average: avg[0], category_average };
};
const actions = {
  default: async (event) => {
    if (await limiter.isLimited(event)) {
      return { success: false, message: "Rate limit exceeded" };
    }
    const formdata = await event.request.formData();
    const time = formdata.get("duration");
    const pointer_type = formdata.get("pointer-type");
    try {
      await db.insert(clicks).values({
        id: nanoid(15),
        duration: time,
        pointer_type
      });
      return { success: true, message: "Click recorded 🦄" };
    } catch {
      return { success: false, message: "Failed to record click" };
    }
  }
};
export {
  actions,
  load
};
