#!/usr/bin/env python3
"""预生成神经语音（edge-tts）→ 压缩 → 打包成 voice/*.js（base64，file:// 也能加载）
用法: tts_gen.py <jobs.json> <pack_name> [voice] [rate] [pitch]
jobs.json: ["文本", ...] 或 [{"id":..,"text":..,"voice":..,"rate":..,"pitch":..}, ...]
"""
import asyncio, base64, hashlib, json, os, subprocess, sys
import edge_tts
CACHE = '/workspace/tts_cache'; os.makedirs(CACHE, exist_ok=True)
jobs_f, pack = sys.argv[1], sys.argv[2]
dv = sys.argv[3] if len(sys.argv) > 3 else 'zh-CN-XiaoxiaoNeural'
dr = sys.argv[4] if len(sys.argv) > 4 else '-6%'
dp = sys.argv[5] if len(sys.argv) > 5 else '+0Hz'
raw = json.load(open(jobs_f))
jobs = [j if isinstance(j, dict) else {'id': j, 'text': j} for j in raw]
for j in jobs: j.setdefault('voice', dv); j.setdefault('rate', dr); j.setdefault('pitch', dp); j.setdefault('vol', '+0%')
def hk(j): return hashlib.sha1(('|'.join([j['voice'], j['rate'], j['pitch'], j['vol'], j['text']])).encode()).hexdigest()
sem = asyncio.Semaphore(8)
async def one(j):
    h = hk(j); out = f'{CACHE}/{h}.mp3'; small = f'{CACHE}/{h}.s.mp3'
    if not os.path.exists(small):
        async with sem:
            for attempt in range(5):
                try:
                    if not os.path.exists(out) or os.path.getsize(out) < 500:
                        await edge_tts.Communicate(j['text'], j['voice'], rate=j['rate'], pitch=j['pitch'], volume=j['vol']).save(out + '.tmp')
                        os.replace(out + '.tmp', out)
                    break
                except Exception as e:
                    print('retry', attempt, j['text'][:20], e, flush=True); await asyncio.sleep(2 + attempt * 3)
            p = await asyncio.create_subprocess_exec('ffmpeg', '-loglevel', 'error', '-y', '-i', out, '-af',
                'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,loudnorm=I=-18:TP=-2',
                '-ac', '1', '-ar', '24000', '-b:a', '32k', small)
            await p.wait()
    return j['id'], small
async def main():
    res = await asyncio.gather(*[one(j) for j in jobs])
    data = {}; tot = 0
    for k, f in res:
        b = open(f, 'rb').read(); tot += len(b); data[k] = base64.b64encode(b).decode()
    os.makedirs('voice', exist_ok=True)
    with open(f'voice/{pack}.js', 'w') as fo:
        fo.write('VoicePack.add(' + json.dumps(pack) + ',' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ');\n')
    print(pack, len(data), 'clips', round(tot / 1e6, 2), 'MB mp3')
asyncio.run(main())
