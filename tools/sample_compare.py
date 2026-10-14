# 학술지 프로파일(pdf_profile.py)과 우리 산출물 프로파일(output_profile.mjs)을 학회별로 나란히 놓는다
# python -X utf8 tools/sample_compare.py tests/audit_fable2/samples
import sys, json, glob, os, collections
d = sys.argv[1]
MAP = json.load(open(os.path.join(d, 'map.json'), encoding='utf-8')) if os.path.exists(os.path.join(d, 'map.json')) else {'구보학회': 'gubo', '국어국문학회': 'korlanlit', '국제어문학회': 'iall', '상허학보': 'sanghur'}
def fmt(x): return '-' if x is None else x
def mode(vals):
    vals = [v for v in vals if v is not None]
    return collections.Counter(vals).most_common(1)[0][0] if vals else None
for folder, id in MAP.items():
    samples = [json.load(open(f, encoding='utf-8')) for f in sorted(glob.glob(os.path.join(d, folder + '_*.json')))]
    outf = os.path.join(d, f'_out_{id}.json')
    out = json.load(open(outf, encoding='utf-8')) if os.path.exists(outf) else None
    if not samples or not out: print(f'== {folder}: 자료 없음'); continue
    print(f'\n== {folder} ({id}) — 학술지 실측 vs 투고틀 산출')
    rows = []
    rows.append(('용지 mm', [s['page_mm'] for s in samples], out['page_mm']))
    rows.append(('왼쪽/오른쪽 여백 mm', [(s['margins_mm']['left'], s['margins_mm']['right']) for s in samples], (out['margins_mm']['left'], out['margins_mm']['right'])))
    rows.append(('본문 글꼴', [s['body']['font'] for s in samples], out['body']['font']))
    rows.append(('본문 크기 pt', [s['body']['size_pt'] for s in samples], out['body']['size_pt']))
    rows.append(('본문 줄간격 %', [s['body']['line_spacing_pct'] for s in samples], f"{out['body']['line_spacing_pct']} (측정 {out['body']['measured_spacing_pct']})"))
    rows.append(('각주 글꼴/크기', [(s['footnote'] or {}).get('font') and f"{s['footnote']['font']} {s['footnote']['size_pt']}" for s in samples], f"측정 줄간격 {out['footnote'].get('measured_pitch_pt')}pt"))
    rows.append(('각주 줄간격 %', [(s['footnote'] or {}).get('line_spacing_pct') for s in samples], '-'))
    rows.append(('제목', [s['title'] and f"{s['title']['font']} {s['title']['size_pt']}{' B' if s['title']['bold'] else ''}{' 가운데' if s['title']['center'] else ''}" for s in samples], out['title'] and f"{out['title']['font']} {out['title']['size_pt']}{' B' if out['title']['bold'] else ''} {out['title']['align']}"))
    rows.append(('장 제목', [s['h1'] and f"{s['h1']['font']} {s['h1']['size_pt']}{' B' if s['h1']['bold'] else ''}" for s in samples], out['h1'] and f"{out['h1']['font']} {out['h1']['size_pt']}{' B' if out['h1']['bold'] else ''}"))
    for k, label in (('abstractKo', '국문초록 표지'), ('abstractEn', 'Abstract 표지'), ('refHead', '참고문헌 표지'), ('tocHead', '목차 표지'), ('keywords', '주제어 줄')):
        rows.append((label, [(s['marks'].get(k) or {}).get('size') and f"{s['marks'][k]['font']} {s['marks'][k]['size']}{' B' if s['marks'][k]['bold'] else ''}{' 가운데' if s['marks'][k]['center'] else ''} “{s['marks'][k]['sample'][:10]}”" for s in samples], (out['marks'].get(k) or {}).get('size') and f"{out['marks'][k]['font']} {out['marks'][k]['size']}{' B' if out['marks'][k]['bold'] else ''} {out['marks'][k]['align']} “{out['marks'][k]['sample'][:10]}”"))
    rows.append(('초록 본문', [s['abstract_body'] and f"{s['abstract_body']['font']} {s['abstract_body']['size_pt']} 들여 {s['abstract_body']['indent_from_left_mm']}mm" for s in samples], out['abstract_body'] and f"{out['abstract_body']['font']} {out['abstract_body']['size']} {out['abstract_body']['ls']}% 들여 {round(out['abstract_body']['indent_pt']*0.3528,1)}mm 여백 {round(out['abstract_body']['marginLeft_pt']*0.3528,1)}mm"))
    rows.append(('참고문헌 항목', [s['ref_body'] and f"{s['ref_body']['font']} {s['ref_body']['size_pt']} 들여 {s['ref_body']['indent_from_left_mm']}mm" for s in samples], out['ref_body'] and f"{out['ref_body']['font']} {out['ref_body']['size']} {out['ref_body']['ls']}% 내어 {round(-out['ref_body']['indent_pt']*0.3528,1)}mm"))
    for label, got, ours in rows:
        print(f'  {label:14s} | 학술지: ' + ' / '.join(str(fmt(g)) for g in got) + f'\n  {"":14s} | 투고틀: {fmt(ours)}')
    print('  게재 글꼴 목록:', ' / '.join(', '.join(s['fonts_used'][:5]) for s in samples))
