import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const evidenceUrl = new URL(
  '../marketing/campaign-0.2.45/data-evidence/reviews/2026-10-16-p3.json',
  import.meta.url,
);

test('P3 data-source review is bounded, reproducible, and preserves policy exclusions', async () => {
  const report = JSON.parse(await readFile(evidenceUrl, 'utf8'));
  assert.equal(report.schemaVersion, 1);
  assert.ok(report.candidates.length > 0 && report.candidates.length <= 3);
  assert.deepEqual(report.candidates.map((item) => item.id), [
    'hkex-filings',
    'unesco-uis-education-statistics',
    'shumi-crypto-market-intelligence',
  ]);
  assert.deepEqual(report.candidates.map((item) => item.status), [
    'DEFERRED',
    'DEFERRED',
    'DEFERRED',
  ]);
  assert.deepEqual(report.policy.doNotList, [
    'dsh-qixin-insight-mcp-oauth',
    'dsh-plugin-xparse',
    'shuidi-enterprise-data',
    'mcp-cnbs',
    'chinese-law-mcp',
  ]);
  assert.deepEqual(report.scope.outOfScope, ['national-stats-mcp']);

  for (const candidate of report.candidates) {
    assert.ok(candidate.endpoint.startsWith('https://'));
    assert.ok(candidate.repository.startsWith('https://github.com/'));
    assert.ok(candidate.officialRegistry.startsWith('https://registry.modelcontextprotocol.io/'));
    assert.ok(candidate.license);
    assert.ok(candidate.maintenance.lastPushAt);
    assert.ok(candidate.runtime.checkedAt);
    assert.ok(candidate.runtime.toolsCount > 0);
    assert.match(candidate.runtime.responseSha256, /^[a-f0-9]{64}$/);
    assert.equal(candidate.credentialsStored, false);
    assert.equal(candidate.rawResponseStored, false);
    assert.ok(candidate.blockers.length > 0);
  }

  for (const candidate of report.candidates.slice(0, 2)) {
    assert.equal(candidate.protocolStatus, 'PASS');
    assert.match(candidate.validationScope, /^protocol-and-.+-metadata-only$/);
    assert.equal(candidate.businessDataValidated, false);
    assert.equal(candidate.runtime.callStatus, 'success');
    assert.equal(candidate.runtime.credentialScan, 'pass');
  }

  assert.equal(report.itjuziPostListingReview.status, 'healthy-partial');
  assert.equal(report.itjuziPostListingReview.unauthenticatedBoundary.isError, true);
  assert.equal(report.itjuziPostListingReview.credentialsStored, false);
  assert.equal(report.itjuziPostListingReview.rawResponseStored, false);

  const serialized = JSON.stringify(report);
  assert.doesNotMatch(serialized, /(?:Bearer|api[_ -]?key|token|secret)\s*[:=]\s*[A-Za-z0-9._~+\/-]{20,}/i);
});
