import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const html = await readFile(new URL('../ui/index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const start = script.indexOf('  const viewStateMemory =');
const end = script.indexOf('  async function call(', start);
assert.ok(start > 0 && end > start);

function create(host) {
  const context = vm.createContext({ window: { parent: host, location: { origin: 'http://localhost' } },
    CATEGORIES: [{ value: '' }, { value: 'recommended' }, { value: 'finance' }],
    currentWorkspace: null, main: { scrollTop: 0 }, searchInput: { value: '' }, syncTabs() {},
    view: 'market', searchQuery: '', marketCategory: '', expandedMarketSections: new Set(),
    explorerFilter: {}, explorerOffset: 0,
  });
  vm.runInContext(script.slice(start, end), context);
  const run = (source) => vm.runInContext(source, context);
  run('viewStateReady = true');
  return { context, run };
}
const host = () => ({ Map, location: { origin: 'http://localhost' } });

test('entire UI script parses', () => { new vm.Script(script); });

test('iframe recreation restores scoped browsing state without retaining arbitrary payloads', () => {
  const parent = host();
  const a = create(parent);
  a.run(`currentWorkspace = { workspaceId: 'A' }; view = 'installed'; searchQuery = 'draw';
    marketCategory = 'finance'; expandedMarketSections.add('finance'); main.scrollTop = 420;
    explorerFilter = { connectionKey: 'key', serverName: 'server', status: 'success', secret: 'never' };
    saveViewState();`);
  const b = create(parent);
  b.run(`currentWorkspace = { workspaceId: 'A' }; restoreViewState(); var render = beginViewRender(); main.scrollTop = 0; finishViewRender(render);`);
  assert.equal(b.context.view, 'installed');
  assert.equal(b.context.searchQuery, 'draw');
  assert.equal(b.context.main.scrollTop, 420);
  assert.equal(b.context.expandedMarketSections.has('finance'), true);
  assert.equal(JSON.stringify([...parent.__mcpConnectorViewStateV1.values()]).includes('never'), false);
  b.run(`currentWorkspace = { workspaceId: 'B' }; restoreViewState();`);
  assert.equal(b.context.view, 'market');
  assert.equal(b.context.searchQuery, '');
  assert.equal(create(host()).run('viewStateMemory.size'), 0, 'Host reload clears memory');
});

test('loading scroll collapse and stale results cannot overwrite restored state', () => {
  const a = create(host());
  a.run(`main.scrollTop = 420; saveViewState(); var old = beginViewRender(); main.scrollTop = 0; saveViewState();`);
  assert.equal(a.run('viewStateMemory.get(viewStateKey()).scroll'), 420);
  a.run('restoreViewState(); var next = beginViewRender(); finishViewRender(old);');
  assert.equal(a.run('viewStateLoading'), true);
  assert.equal(a.context.main.scrollTop, 0);
  a.run('finishViewRender(next)');
  assert.equal(a.context.main.scrollTop, 420);
  a.run(`currentWorkspace = { workspaceId: 'other' };`);
  assert.equal(a.run('isViewRenderCurrent(next)'), false);
});

test('invalid state is bounded, sanitized and memory has an LRU cap', () => {
  const a = create(host());
  const value = a.run(`normalizeViewState({ view: 'bad', category: 'bad', search: 'x'.repeat(900),
    offset: -1, scroll: Infinity, expanded: ['finance', 'finance', 'bad'], token: 'secret' })`);
  assert.equal(value.view, 'market');
  assert.equal(value.search.length, 500);
  assert.equal(value.offset, 0);
  assert.equal(value.scroll, 0);
  assert.equal(value.expanded.length, 1);
  assert.equal(value.token, undefined);
  a.run(`for (let i = 0; i < 40; i++) { currentWorkspace = { workspaceId: String(i) }; saveViewState(); }`);
  assert.equal(a.run('viewStateMemory.size'), 32);
});

test('cross-origin parent is not accessed as a persistence destination', () => {
  const parent = { get location() { throw new Error('SecurityError'); } };
  const a = create(parent);
  assert.doesNotThrow(() => a.run('saveViewState(); restoreViewState()'));
  assert.equal(parent.__mcpConnectorViewStateV1, undefined);
});
