// Isolated browser regression: no DSH profile, credentials, API or MCP processes.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../ui/index.html', import.meta.url), 'utf8');
const helpers = ['esc', 'jsString'].map(name => {
  const match = source.match(new RegExp(`  function ${name}\\([^]*?\\n  }`));
  if (!match) throw new Error(`Missing helper ${name}`);
  return match[0];
}).join('\n');
const html = `<!doctype html><meta charset="utf-8"><title>Isolated handler regression</title>
<h1>Production handler escaping regression</h1><button id="run">Run browser regression</button><pre id="result">Not run</pre>
<div id="cases"></div><script>${helpers}
document.querySelector('#run').onclick = () => {
  const payloads = ["x');window.injected=true;//", 'a"b', 'back\\\\slash', 'line\\nbreak', 'x&#39;', '\\u2028', '\\u2029'];
  let passed = 0;
  window.record = value => { window.received = value; };
  for (const payload of payloads) {
    for (const event of ['click', 'change', 'keydown', 'input']) {
      window.injected = false; window.received = undefined;
      document.querySelector('#cases').innerHTML = '<button on' + event + '="window.record(' + jsString(payload) + ')">test</button>';
      document.querySelector('#cases button').dispatchEvent(new Event(event));
      if (window.injected || window.received !== payload) throw new Error('escaping regression');
      passed++;
    }
  }
  window.injected = false;
  document.querySelector('#cases').innerHTML = '<button onclick="window.record(&#39;' + esc(payloads[0]) + '&#39;)">control</button>';
  document.querySelector('#cases button').click();
  if (!window.injected) throw new Error('vulnerable control did not reproduce');
  document.querySelector('#cases').replaceChildren();
  document.querySelector('#result').textContent = 'PASS: ' + passed + ' production-helper browser cases; vulnerable control reproduced. No DSH API accessed.';
};
</script>`;
const server = createServer((_req, res) => { res.setHeader('content-type', 'text/html; charset=utf-8'); res.end(html); });
server.listen(0, '127.0.0.1', () => console.log('http://127.0.0.1:' + server.address().port));
