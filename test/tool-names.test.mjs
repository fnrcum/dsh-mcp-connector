import test from 'node:test';
import assert from 'node:assert/strict';
import { registerTools } from '../lib/tools.js';

// Claude (Anthropic) 的 API 会拒绝任何以 `mcp_` 开头、且 `mcp_` 后不是下划线的
// 工具名，并返回误导性的 400「You're out of extra usage」。Host 把同一组工具名
// 发给所有 Provider，所以这里对所有注册名做静态回归约束：只要上游后续再引入
// `mcp_xxx` 形式的工具名，本测试就会失败，而不是等 Claude 用户整轮请求失败。
const CLAUDE_UNSAFE_TOOL_NAME = /^mcp_(?!_)/;

function captureRegisteredNames(options = {}) {
  const names = [];
  const dispose = registerTools({
    tools: {
      register(def) {
        names.push(def.name);
        return () => {};
      },
    },
  }, {}, options);
  return { names, dispose };
}

test('全部对话工具名都不触发 Claude 的 mcp_ 前缀拒绝规则', () => {
  const { names, dispose } = captureRegisteredNames();
  try {
    assert.equal(names.length, 25);
    assert.equal(new Set(names).size, names.length, 'tool names must be unique');
    for (const name of names) {
      assert.match(name, /^[a-z][a-z0-9_]*$/, `tool name "${name}" must be lowercase snake_case`);
      assert.doesNotMatch(
        name,
        CLAUDE_UNSAFE_TOOL_NAME,
        `tool name "${name}" starts with "mcp_" followed by a non-underscore character and would be rejected by the Claude API with a misleading 400 error`,
      );
      assert.ok(name.startsWith('connector_'), `tool name "${name}" must keep the connector_ prefix`);
    }
    assert.ok(!names.includes('run_code'), 'run_code is reserved for PTC mode');
  } finally {
    dispose();
  }
});

test('精简模式的两个入口同样不触发 Claude 的 mcp_ 前缀拒绝规则', () => {
  const { names, dispose } = captureRegisteredNames({ compact: true });
  try {
    assert.deepEqual(names, ['connector_discover', 'connector_session_tools']);
    for (const name of names) {
      assert.doesNotMatch(name, CLAUDE_UNSAFE_TOOL_NAME);
    }
  } finally {
    dispose();
  }
});

test('精简发现入口的路由表在改名后仍然指向已注册的工具定义', async () => {
  const calls = [];
  const api = Object.fromEntries(['catalog', 'status', 'toolSearch', 'toolDetail'].map((method) => [method, async () => {
    calls.push(method);
    return { ok: true, message: method, detail: { items: [], tool: { description: 'demo', inputSchema: { type: 'object' } }, missing: undefined } };
  }]));
  const tools = new Map();
  const dispose = registerTools({
    tools: {
      register(def) {
        tools.set(def.name, def);
        return () => tools.delete(def.name);
      },
    },
  }, api, { compact: true });
  try {
    const discover = tools.get('connector_discover');
    assert.ok(discover);
    for (const action of ['catalog', 'status', 'search', 'detail']) {
      const input = action === 'search'
        ? { action, query: 'weather' }
        : action === 'detail'
          ? { action, toolName: 'weather' }
          : { action };
      const result = await discover.execute(input);
      assert.equal(result.ok, true, `${action} should route`);
    }
    assert.deepEqual(calls, ['catalog', 'status', 'toolSearch', 'toolDetail']);
  } finally {
    dispose();
  }
});
