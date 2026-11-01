import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { EN } from '../ui/locale.js';
import { SHARING_CASE_TEMPLATES } from '../ui/sharing-experience.js';

// Panel and lazy UI modules render user-visible Chinese as msgids. English mode
// must have a real translation for every string this fork ships, including the
// advice sentences passed to t() as variables and the strings copied into
// share templates, which the older regex-based gates cannot see.
const CJK = /[\u3400-\u9fff\uf900-\ufaff]/;

const panel = await readFile(new URL('../ui/index.html', import.meta.url), 'utf8');

function assertTranslated(dictionary, msgid, label) {
  assert.ok(Object.hasOwn(dictionary, msgid), `missing translation for ${label}: ${msgid}`);
  const value = dictionary[msgid];
  assert.ok(typeof value === 'string' && value.trim().length > 0, `empty translation for ${label}: ${msgid}`);
  assert.ok(!CJK.test(value), `untranslated CJK remains in ${label}: ${msgid} -> ${value}`);
}

function panelEntry(msgid, label) {
  const marker = `"${msgid}": "`;
  const start = panel.indexOf(marker);
  assert.notEqual(start, -1, `missing panel English entry for ${label}: ${msgid}`);
  const valueStart = start + marker.length;
  const valueEnd = panel.indexOf('",', valueStart);
  assert.notEqual(valueEnd, -1, `unterminated panel English entry for ${label}: ${msgid}`);
  return panel.slice(valueStart, valueEnd);
}

test('every sharing template string rendered by the UI module has an English translation', () => {
  for (const [templateId, template] of Object.entries(SHARING_CASE_TEMPLATES)) {
    assertTranslated(EN, template.task, `${templateId}.task`);
    for (const [index, step] of template.steps.entries()) {
      assertTranslated(EN, step.name, `${templateId}.steps[${index}]`);
    }
    for (const [index, item] of template.limitations.entries()) {
      assertTranslated(EN, item, `${templateId}.limitations[${index}]`);
    }
  }
});

test('safe connection template instructions and custom name have English translations', () => {
  assertTranslated(
    EN,
    '导入前必须在本机重新填写所有 <REDACTED:REENTER> 值并显式确认；目录引用请回到市场重新授权或确认启动。',
    'safe template instructions',
  );
  assertTranslated(EN, '自定义 MCP 连接', 'safe template custom name');
});

test('panel advice sentences and first-use prompt have English translations', () => {
  const advice = [...panel.matchAll(/withAdvice\('([^']+)'\)/g)].map((match) => match[1]);
  assert.equal(advice.length, 5, 'expected five guidanceFor advice sentences');
  for (const msgid of advice) {
    const value = panelEntry(msgid, 'guidance advice');
    assert.ok(!CJK.test(value), `untranslated CJK remains in guidance advice: ${msgid}`);
  }

  const prompt = panel.match(/const FIRST_USE_PROMPT = '([^']+)';/);
  assert.ok(prompt, 'first-use prompt constant must exist');
  const value = panelEntry(prompt[1], 'first-use prompt');
  assert.ok(!CJK.test(value), 'first-use prompt is still Chinese in English mode');
});

test('host-composed policy, scope and connection labels are re-localized by the panel', () => {
  for (const msgid of ['默认策略', '连接策略', 'Server 策略', 'Tool 策略', '连接已停用', '：']) {
    const value = panelEntry(msgid, 'host-composed label');
    assert.ok(!CJK.test(value), `untranslated CJK remains in host-composed label: ${msgid}`);
  }
  assert.match(panel, /const POLICY_SOURCE_MSGIDS = Object\.freeze\(\{/, 'policy source codes must map back to msgids');
  assert.match(panel, /function localizeHostText\(/, 'host labels must be re-localized before rendering');
  assert.match(panel, /t\(d\.connectionLabel \|\|/, 'connectionLabel must pass through the panel translator');
});
