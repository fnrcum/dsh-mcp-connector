/**
 * 安全回归：内联事件处理器里的字符串实参。
 *
 * 背景（已复现的真实漏洞）：`esc()` 只做 HTML 转义，但它的输出曾被直接放进
 * `onclick="f('${esc(id)}')"`。HTML 解析器会在 JS 解析前把 `&#39;` 解回 `'`，
 * 于是目录里 id 为 `x');alert(1)//` 的条目可以在面板同源执行任意脚本
 * （stored XSS，可进而调用整个 /mcp-connector/api 白名单）。
 *
 * 本测试按浏览器真实的解析顺序复现攻击：取出属性原始值 → 解码字符引用 →
 * 交给 JS 解析执行，确认任何载荷都只能成为一个普通字符串实参。
 */
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const uiSource = (await readFile(new URL('../ui/index.html', import.meta.url), 'utf8')).replace(/\r\n?/g, '\n');

// Test the shipped implementation, not a duplicate that could drift from it.
const helperSource = ['esc', 'jsString'].map((name) => {
  const match = uiSource.match(new RegExp(`  function ${name}\\([^]*?\\n  }`));
  assert.ok(match, `missing production helper: ${name}`);
  return match[0];
}).join('\n');
const { esc, jsString } = vm.runInNewContext(`${helperSource}; ({ esc, jsString })`);

/** 取出属性值并按浏览器规则解码字符引用（`&amp;` 必须最后解码）。 */
function decodeAttribute(raw) {
  return raw
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

const PAYLOADS = [
  "x');alert(document.domain);//",
  'x&#39;);alert(1);//',
  'a"b',
  '</script><img src=x onerror=alert(1)>',
  'back\\slash',
  'line\nbreak',
  '`tick${1}`',
  '${alert(1)}',
  'plain-key',
];

test('jsString 生成的实参在 HTML 解码后仍只是普通字符串，不产生可执行语句', () => {
  for (const payload of PAYLOADS) {
    const rawAttribute = decodeAttribute(`onclick="window.__mcp.showDetail(${jsString(payload)})"`);
    const body = rawAttribute.slice('onclick="'.length, -1);
    let received;
    let alerted = false;
    const sandbox = {
      window: { __mcp: { showDetail: (key) => { received = key; } } },
      document: { domain: 'dsh.example' },
      alert: () => { alerted = true; },
    };
    vm.runInNewContext(body, sandbox);
    assert.equal(alerted, false, `载荷不应执行脚本：${JSON.stringify(payload)}`);
    assert.equal(received, payload, `载荷应原样作为实参传入：${JSON.stringify(payload)}`);
  }
});

test('对照：只用 esc() 拼内联处理器会让单引号逃逸（漏洞成因，防止被"修复"回去）', () => {
  const payload = "x');alert(document.domain);//";
  const rawAttribute = decodeAttribute(`onclick="window.__mcp.showDetail('${esc(payload)}')"`);
  const body = rawAttribute.slice('onclick="'.length, -1);
  let alerted = false;
  const sandbox = {
    window: { __mcp: { showDetail: () => {} } },
    document: { domain: 'dsh.example' },
    alert: () => { alerted = true; },
  };
  vm.runInNewContext(body, sandbox);
  assert.equal(alerted, true, '这正是 H1：仅 HTML 转义不足以防住内联处理器注入');
});

test('UI 不把取值直接插入内联事件处理器的字符串字面量', () => {
  // 允许的写法：${jsString(x)} / ${keyJs} / ${idJs} / 无参数调用。
  // 禁止的写法：onclick="…('${…}')" —— 单引号包裹的插值。
  const offenders = [];
  const attrPattern = /\bon(?:click|change|keydown|input)="([^"]*)"/g;
  for (const match of uiSource.matchAll(attrPattern)) {
    const body = match[1];
    const interpolations = body.match(/\$\{[^}]+\}/g) ?? [];
    for (const interpolation of interpolations) {
      const inner = interpolation.slice(2, -1).trim();
      if (/^jsString\(.+\)$/.test(inner)) continue;
      if (/^(?:keyJs|idJs|itemIdJs|deviceIdJs)$/.test(inner)) continue;
      // 允许：整段语句插值，但其值必须是本文件里写死的两个安全常量之一。
      // （`${reauthAction}` 是由 idJs 拼出的固定调用串，不含外部文本。）
      if (inner === 'reauthAction') {
        assert.match(uiSource, /const reauthAction = credentialAuth \? `window\.__mcp\.openConfig\(\$\{idJs\}\)` : `window\.__mcp\.showDetail\(\$\{idJs\}\)`;/,
          'reauthAction 必须保持为由 idJs 拼出的固定调用串');
        continue;
      }
      offenders.push(`${match[0].slice(0, 60)}… ← ${interpolation}`);
    }
  }
  assert.deepEqual(offenders, [], '内联处理器只能插入已做 JS+HTML 双层转义的值');
});

test('所有内联处理器的插值都不落在引号字符串里', () => {
  // 更直接的守卫：属性里出现 '${ 或 "${ 或 `${ 就说明插值被引号包裹了。
  const quoted = uiSource.match(/\bon(?:click|change|keydown|input)="[^"]*(?:'\$\{|\"\$\{|\`\$\{)[^"]*"/g) ?? [];
  assert.deepEqual(quoted, [], '内联处理器不得用引号包裹插值');
});

test('jsString 双层编码：JS 层用 JSON.stringify，属性层用 esc', () => {
  assert.equal(jsString("it's"), '&quot;it&#39;s&quot;');
  assert.equal(jsString('a"b'), '&quot;a\\&quot;b&quot;');
  assert.equal(jsString(''), '&quot;&quot;');
  assert.equal(jsString(null), '&quot;&quot;');
  assert.equal(jsString(42), '&quot;42&quot;');
});
