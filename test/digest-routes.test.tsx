import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const line = (o: object) => JSON.stringify(o);
const normal = [
  line({ at: '2026-10-28T01:00:00+01:00', job: 'zeta', status: 'ok', owner: 'ann' }),
  line({ at: '2026-10-28T01:05:00+01:00', job: 'alpha', status: 'retry', owner: null, error: 'timeout' }),
  line({ at: '2026-10-28T01:10:00+01:00', job: 'alpha', status: 'fail', owner: null }),
].join('\n');

type Body = { night: string; rows: { job: string; runs: number }[]; badLines: number };

let dir: string;
let app: ReturnType<typeof createApp>;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'rig-digest-'));
  writeFileSync(join(dir, '2026-10-01.jsonl'), normal + '\n');
  writeFileSync(join(dir, '2026-10-02.jsonl'), '');
  writeFileSync(join(dir, '2026-10-03.jsonl'), normal + '\n{not json\n');
  app = createApp({ adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir: dir });
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const page = (n: string) => app.request(`/digest/${n}`);
const json = (n: string) => app.request(`/api/digest/${n}`);

describe('digest routes', () => {
  it('normal night: page 200 with jobs', async () => {
    const res = await page('2026-10-01');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('digest 2026-10-01');
    expect(html).toContain('timeout');
    expect(html).not.toContain('nothing ran');
    expect(html).not.toContain('parse');
  });

  it('normal night: JSON 200, rows sorted, badLines 0', async () => {
    const res = await json('2026-10-01');
    const body = (await res.json()) as Body;
    expect(res.status).toBe(200);
    expect(body.night).toBe('2026-10-01');
    expect(body.badLines).toBe(0);
    expect(body.rows.map((r) => r.job)).toEqual(['alpha', 'zeta']);
    expect(body.rows[0]?.runs).toBe(2);
  });

  it('page and JSON list the same jobs in the same order', async () => {
    const html = await (await page('2026-10-01')).text();
    const body = (await (await json('2026-10-01')).json()) as Body;
    const fromPage = [...html.matchAll(/<tr><td>([^<]*)<\/td>/g)].map((m) => m[1]);
    expect(fromPage).toEqual(body.rows.map((r) => r.job));
  });

  it('empty night: page says nothing ran, JSON has no rows', async () => {
    const res = await page('2026-10-02');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
    const jres = await json('2026-10-02');
    expect(jres.status).toBe(200);
    expect(await jres.json()).toEqual({ night: '2026-10-02', rows: [], badLines: 0 });
  });

  it('night with a bad line: counted, rest still shown', async () => {
    const html = await (await page('2026-10-03')).text();
    expect(html).toMatch(/1 line didn(&#39;|')t parse/);
    expect(html).toContain('alpha');
    const body = (await (await json('2026-10-03')).json()) as Body;
    expect(body.badLines).toBe(1);
    expect(body.rows).toHaveLength(2);
  });

  it('missing night is 404 on both routes', async () => {
    expect((await page('2026-10-09')).status).toBe(404);
    const res = await json('2026-10-09');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'no such night' });
  });

  it('malformed night param is 404 on both routes', async () => {
    for (const bad of ['today', '2026-1-1', '..%2Fpackage', '2026-10-01.jsonl']) {
      expect((await page(bad)).status).toBe(404);
      expect((await json(bad)).status).toBe(404);
    }
  });
});
