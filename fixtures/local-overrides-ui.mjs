// Isolated UI acceptance: real plugin API and installed MCP bridge; memory-only storage.
// Deliberately excluded from the published package. No production profile is loaded.
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { apply } from '../lib/index.js';
import { isTrustedWebRequest } from '../lib/web.js';

if (!process.env.DSH_HOST_INTEGRATION_ANCHOR) throw new Error('DSH_HOST_INTEGRATION_ANCHOR required');
const require = createRequire(process.env.DSH_HOST_INTEGRATION_ANCHOR);
const bridge = await import(pathToFileURL(require.resolve('@deepseek-ai/dsh-mcp-client')).href);
const { Context } = await import(pathToFileURL(require.resolve('@deepseek-ai/cordis')).href);
const id = 'local-overlay-acceptance';
const key = `${id}-main`;
const entries = new Map(), definitions = new Map(), routes = new Map(), tables = new Map(), disposers = [];
for (const name of ['connections', 'grants', 'catalog', 'snapshots', 'governance', 'connection_scopes', 'tool_catalog']) {
  const data = new Map();
  tables.set(name, {
    async get(key) { return structuredClone(data.get(key)); },
    async put(key, value) { data.set(key, structuredClone(value)); },
    async delete(key) { data.delete(key); },
    entries() { return [...data.entries()].map(([key, value]) => [key, structuredClone(value)])[Symbol.iterator](); },
  });
}
const tools = {
  register(def) { definitions.set(def.name, def); return () => definitions.delete(def.name); },
  schemas() { return [...definitions.values()].map(({ name, description, parameters }) => ({ name, description, parameters })); },
  guard() { return () => {}; },
};
async function start(entry) {
  if (entry.disabled) return;
  entry.ctx = new Context();
  entry.ctx.provide('tools', tools);
  try {
    await bridge.apply(entry.ctx, bridge.Config({ ...entry.options.config, reconnect: { enabled: false } }));
  } catch (error) {
    await entry.ctx.fiber.dispose();
    entry.ctx = null;
    throw error;
  }
}
const loader = {
  entries,
  resolve(id) { if (!entries.has(id)) throw new Error('No entry'); return entries.get(id); },
  async create({ id, name, config, disabled }) {
    const entry = { id, name, options: { config }, disabled };
    await start(entry);
    entries.set(id, entry);
  },
  async update(id, patch) {
    const entry = this.resolve(id);
    if (entry.ctx) await entry.ctx.fiber.dispose();
    entry.ctx = null;
    if ('config' in patch) entry.options.config = patch.config;
    if ('disabled' in patch) entry.disabled = patch.disabled;
    await start(entry);
  },
  async remove(id) { const entry = entries.get(id); if (entry?.ctx) await entry.ctx.fiber.dispose(); entries.delete(id); },
};
const ctx = {
  loader, tools, storageDomain: { open: async () => ({ tables, close: async () => {} }) },
  workspaceRegistry: { list: () => [], get: () => undefined },
  logger: () => ({ info() {}, warn() {}, error() {} }),
  effect(fn) { const dispose = fn(); if (typeof dispose === 'function') disposers.push(dispose); },
  inject(deps, callback) {
    if (deps.includes('webServer') && deps.includes('webRuntime')) callback({
      effect: this.effect, webRuntime: {}, webServer: { register(route) { routes.set(route.path, route.handler); return () => routes.delete(route.path); } },
    });
  },
};
await apply(ctx, {
  catalogUrl: '', catalogTtlMs: 3600000, persistSecrets: true, entryPrefix: 'acceptance', account: 'isolated-ui',
  requestTimeoutMs: 3000, startupTimeoutMs: 5000, refreshSkewMs: 300000, openBrowser: false,
  connectors: [{ id, name: '本地参数隔离验收', vendor: '本机无网络测试', description: '仅用于 #146 验收，不连接外部服务。验收：安装时填写本地参数 {"argsAppend":["--accept-local-overlay"],"env":{"MCP_OVERLAY_FIXTURE":"synthetic-value"}}；在已安装中编辑参数追加中文与空格参数、重连、停用再启用，最后断开连接。默认空参数启动失败是预期行为。', auth: { mode: 'none' }, servers: [{
    serverKey: 'main', serverName: 'overlay_acceptance', transport: 'stdio', command: process.execPath,
    args: [fileURLToPath(new URL('./local-overrides-server.cjs', import.meta.url))],
  }] }],
});
const allowed = new Set(['catalog', 'status', 'scopeContext', 'healthCheck', 'connect', 'editableLocalOverrides', 'applyLocalOverrides', 'setEnabled', 'disconnect', 'reconnect', 'toolsList', 'toolSearch', 'toolDetail', 'exportConfig', 'listSnapshots', 'previewSnapshot', 'restoreSnapshot']);
const server = createServer(async (req, res) => {
  const json = (value, status = 200) => { res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(value)); };
  try {
    if (!isTrustedWebRequest(req, [])) return json({ ok: false }, 403);
    if (req.url === '/mcp-connector/api' && req.method === 'POST') {
      const chunks = []; let size = 0;
      for await (const chunk of req) { size += chunk.length; if (size > 65536) return json({ ok: false }, 413); chunks.push(chunk); }
      const body = Buffer.concat(chunks);
      const { method, params = {} } = JSON.parse(body);
      if (method === 'versionStatus') return json({ ok: true, detail: { installedVersion: 'draft-146-isolated', status: 'idle', updateAvailable: false } });
      if (method === 'migrationPreview') return json({ ok: true, detail: { pendingCount: 0, items: [] } });
      if (!allowed.has(method) || (params.connectorId && params.connectorId !== id) || (params.key && params.key !== key)) return json({ ok: false, message: '隔离验收仅允许自有测试连接器' }, 403);
      const input = { method: req.method, headers: req.headers, socket: req.socket, async *[Symbol.asyncIterator]() { yield body; } };
      const end = res.end.bind(res);
      const writeHead = res.writeHead.bind(res);
      res.writeHead = (status, headers) => {
        const next = { ...headers };
        if (method === 'catalog') delete next['content-length'];
        return writeHead(status, next);
      };
      res.end = (payload) => {
        if (method === 'catalog' && payload) {
          const result = JSON.parse(payload);
          result.detail.items = result.detail.items.filter(item => item.id === id);
          payload = JSON.stringify(result);
        }
        return end(payload);
      };
      return await routes.get('/mcp-connector/api')(input, res);
    }
    const route = [...routes].find(([path]) => req.url === path || (path.endsWith('/ui') && req.url.startsWith(path + '/')));
    if (!route) return json({ ok: false }, 404);
    await route[1](req, res);
  } catch { if (!res.headersSent) json({ ok: false, message: '隔离验收请求失败' }, 500); else res.end(); }
});
server.listen(Number(process.env.MCP_CONNECTOR_UI_PORT || 4174), '127.0.0.1', () => console.log(`Isolated acceptance: http://127.0.0.1:${server.address().port}/mcp-connector/ui/`));
async function close() {
  for (const dispose of disposers.reverse()) await dispose();
  for (const id of [...entries.keys()]) await loader.remove(id);
  server.closeAllConnections();
  server.close();
}
process.once('SIGINT', close);
process.once('SIGTERM', close);
