import { test } from 'node:test';
import assert from 'node:assert/strict';
import { injectWebRoutes } from '../lib/web.js';
import { Context } from '@deepseek-ai/cordis';

for (const name of ['webStartup', 'webRuntime']) {
  test('real Cordis service lifecycle: ' + name, async () => {
    const ctx = new Context();
    const routes = new Map();
    try {
      ctx.provide('webServer', { register(route) {
        assert.ok(!routes.has(route.path));
        routes.set(route.path, route);
        return () => routes.delete(route.path);
      } });
      injectWebRoutes(ctx, { versionStatus: async () => ({ detail: { installedVersion: 'test' } }) });
      const stop = ctx.provide(name, { trustedHosts: ['trusted.example'] });
      await new Promise(resolve => setImmediate(resolve));
      assert.equal(routes.size, 3);
      assert.equal((await request(routes, 'trusted.example')).status, 200);
      stop();
      await new Promise(resolve => setImmediate(resolve));
      assert.equal(routes.size, 0);
    } finally {
      await ctx.fiber.dispose();
    }
  });
}

function harness() {
  const callbacks = new Map();
  const routes = new Map();
  const ctx = { inject(deps, callback) {
    assert.equal(deps[0], 'webServer');
    assert.equal(deps.length, 2);
    callbacks.set(deps[1], callback);
  } };
  injectWebRoutes(ctx, { versionStatus: async () => ({ detail: { installedVersion: 'test' } }) });
  return { routes, activate(name, trustedHosts = []) {
    const effects = [];
    callbacks.get(name)({
      [name]: { trustedHosts },
      webServer: { register(route) {
        assert.ok(!routes.has(route.path), 'no duplicate routes');
        routes.set(route.path, route);
        return () => routes.delete(route.path);
      } },
      effect(fn) { effects.push(fn()); },
    });
    return () => effects.reverse().forEach(fn => fn());
  } };
}

async function request(routes, host, origin = 'http://' + host) {
  const req = {
    method: 'POST', headers: { host, origin },
    async *[Symbol.asyncIterator]() {
      yield Buffer.from('{"method":"versionStatus"}');
    },
  };
  const res = { writeHead(status) { this.status = status; }, end(body) { this.body = body; } };
  await routes.get('/mcp-connector/api').handler(req, res);
  return res;
}

for (const service of ['webRuntime', 'webStartup']) {
  test(service + ' alone mounts UI, API, events; disposes and remounts', async () => {
    const h = harness();
    assert.equal(h.routes.size, 0);
    const stop = h.activate(service, ['trusted.example']);
    assert.equal(h.routes.size, 3);
    assert.ok(h.routes.has('/mcp-connector/ui'));
    assert.ok(h.routes.has('/mcp-connector/events'));
    assert.equal((await request(h.routes, '127.0.0.1:3080')).status, 200);
    assert.equal((await request(h.routes, 'trusted.example')).status, 200);
    assert.equal((await request(h.routes, 'evil.example')).status, 403);
    assert.equal((await request(h.routes, 'trusted.example', 'http://evil.example')).status, 403);
    stop();
    assert.equal(h.routes.size, 0);
    h.activate(service)();
    assert.equal(h.routes.size, 0);
  });
}

test('both services prefer new trust configuration; removal falls back without duplicate routes', async () => {
  const h = harness();
  const oldStop = h.activate('webRuntime', ['old.example']);
  const newStop = h.activate('webStartup', ['new.example']);
  assert.equal((await request(h.routes, 'new.example')).status, 200);
  assert.equal((await request(h.routes, 'old.example')).status, 403);
  newStop();
  assert.equal((await request(h.routes, 'old.example')).status, 200);
  oldStop();
  assert.equal(h.routes.size, 0);
});

test('legacy service arriving after new service does not override new trust', async () => {
  const h = harness();
  const newStop = h.activate('webStartup', ['new.example']);
  const oldStop = h.activate('webRuntime', ['old.example']);
  assert.equal((await request(h.routes, 'old.example')).status, 403);
  oldStop();
  assert.equal(h.routes.size, 3);
  newStop();
  assert.equal(h.routes.size, 0);
});
