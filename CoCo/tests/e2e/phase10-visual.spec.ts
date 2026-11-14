import { expect, test } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { bootstrapOwner, login } from './auth-helpers';

test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1,
  launchOptions: { args: ['--disable-lcd-text', '--font-render-hinting=none'] } });
test('G10-T03 SC105 report picker: source geometry and pixel comparison, no runtime baseline update', async ({ page }, info) => {
  await bootstrapOwner(page); await login(page);
  await page.getByRole('link', { name: 'Báo cáo', exact: true }).click();
  await page.evaluate(()=>document.fonts.ready);
  // G10-D05 approves this exact source-derived crop for version control. CI
  // reads it directly and never requires the private CODEX directory.
  const references=path.resolve('tests/visual/references');
  const metadata=JSON.parse(await readFile(path.join(references,'SC105-picker.json'),'utf8'));
  const expected=await readFile(path.join(references,'SC105-picker.png'));
  const clip={x:476,y:198,width:913,height:396}, sourceDimensions={width:1440,height:900};
  expect(metadata.source.sha256).toBe('114c0f7d92f587e8518008590673f9892bb80b8229746ab1ae4d291f71b0b72d');
  expect(metadata.source.viewport).toEqual(sourceDimensions); expect(metadata.source.clip).toEqual(clip);
  expect(createHash('sha256').update(expected).digest('hex')).toBe(metadata.baseline.sha256);
  expect([expected.readUInt32BE(16),expected.readUInt32BE(20)]).toEqual([913,396]);
  expect(metadata.comparison).toMatchObject({dpr:1,threshold:.2,maxDiffPixelRatio:.01,geometryTolerancePx:2,masks:[]});
  const baseline=info.snapshotPath('SC105-picker.png');
  await mkdir(path.dirname(baseline),{recursive:true});
  // Copy only approved immutable source pixels, never application output.
  await writeFile(baseline,expected);
  const actual=await page.screenshot({clip});
  await writeFile(info.outputPath('SC105-picker-actual.png'),actual);
  const boxes=[];
  for(const button of await page.locator('.report-choice').all()) boxes.push(await button.boundingBox());
  await writeFile(info.outputPath('SC105-geometry.json'),JSON.stringify({sourceSha256:metadata.source.sha256,baselineSha256:metadata.baseline.sha256,
    scope:'Report picker component only; not a full SC105 verdict',clip,viewport:sourceDimensions,dpr:1,
    fontNormalization:['--disable-lcd-text','--font-render-hinting=none'],threshold:.2,maxDiffPixelRatio:.01,geometryTolerancePx:2,boxes},null,2));
  const targets=[{x:476,y:198,width:287,height:190},{x:789,y:198,width:287,height:190},{x:1102,y:198,width:287,height:190},
    {x:476,y:404,width:287,height:190},{x:789,y:404,width:287,height:190}];
  expect(boxes).toHaveLength(5);
  for(let i=0;i<targets.length;i++)for(const key of ['x','y','width','height'] as const) {
    expect.soft(Math.abs(boxes[i]![key]-targets[i][key]),`card ${i+1} ${key}`).toBeLessThanOrEqual(2);
  }
  expect(actual).toMatchSnapshot('SC105-picker.png',{threshold:.2,maxDiffPixelRatio:.01});
});
