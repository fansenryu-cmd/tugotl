# 학술지 PDF의 편집 서식 프로파일: python tools/pdf_profile.py <pdf> [--pages 1-10] [--json out.json]
# 용지 크기·본문 영역(여백)·본문 글꼴/크기/줄 간격·각주 글꼴/크기·제목·장 제목·초록·참고문헌 줄을 PyMuPDF로 뽑는다(본문 내용은 저장하지 않고 수치와 표지 문구만).
import sys, json, re, collections
import fitz  # PyMuPDF

PT2MM = 25.4 / 72

def parse_args(argv):
    pdf = argv[1]; pages = None; out = None
    for i, a in enumerate(argv):
        if a == '--pages': lo, hi = argv[i + 1].split('-'); pages = (int(lo) - 1, int(hi) - 1)
        if a == '--json': out = argv[i + 1]
    return pdf, pages, out

def lines_of(page):
    """줄 단위: (y, x0, x1, 글꼴, 크기, 굵게, 글)"""
    d = page.get_text('dict')
    out = []
    for b in d['blocks']:
        if b.get('type') != 0: continue
        for ln in b['lines']:
            spans = [s for s in ln['spans'] if s['text'].strip()]
            if not spans: continue
            main = max(spans, key=lambda s: len(s['text']))
            text = ''.join(s['text'] for s in spans)
            x0 = min(s['bbox'][0] for s in spans); x1 = max(s['bbox'][2] for s in spans)
            y = round(spans[0]['bbox'][3], 1)
            bold = bool(main['flags'] & 16) or 'Bold' in main['font'] or 'bold' in main['font'].lower()
            out.append(dict(y=y, x0=round(x0, 1), x1=round(x1, 1), font=main['font'], size=round(main['size'], 1), bold=bold, text=text.strip()))
    out.sort(key=lambda l: (l['y'], l['x0']))
    return out

def mode(vals):
    c = collections.Counter(vals); return c.most_common(1)[0][0] if c else None

RE_H1 = re.compile(r'^(\d{1,2}\s*[.．]|[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+\s*[.．]|[IVX]+\s*[.．])\s*\S')
RE_ABS_KO = re.compile(r'^[<＜\[〔❙▌•]?\s*(국문\s*초록|국문\s*요약|초록|요약)\s*[>＞\]〕❙]?\s*$')
RE_ABS_EN = re.compile(r'^[<＜\[〔❙▌•]?\s*(Abstract|ABSTRACT)\s*[>＞\]〕❙]?\s*$')
RE_REF = re.compile(r'^[<＜\[〔❙▌•]?\s*(참고\s*문헌|참고자료|References?)\s*[>＞\]〕❙]?\s*$')
RE_TOC = re.compile(r'^[<＜\[〔❙▌•〈]?\s*(목\s*차|차\s*례)\s*[>＞\]〕❙〉]?\s*$')
RE_KW = re.compile(r'^[<＜\[〔❙▌•]?\s*(주제어|핵심어|키워드|Key\s*words?|Keywords?)\s*[>＞\]〕❙:：]')
RE_FN = re.compile(r'^\d{1,3}\)\s*\S')

def profile(pdf, pages=None):
    doc = fitz.open(pdf)
    lo, hi = (0, doc.page_count - 1) if pages is None else pages
    hi = min(hi, doc.page_count - 1)
    p0 = doc[lo]; W, H = p0.rect.width, p0.rect.height
    all_lines = []  # (page, line)
    for pn in range(lo, hi + 1):
        for l in lines_of(doc[pn]): all_lines.append((pn, l))
    if not all_lines: return {'error': '글 없음'}
    # 본문 후보: 가장 흔한 (글꼴, 크기)
    body_key = mode([(l['font'], l['size']) for _, l in all_lines if len(l['text']) > 20])
    body = [l for _, l in all_lines if (l['font'], l['size']) == body_key]
    # 각주 후보: 본문보다 작고 쪽 아래쪽에 있으며 'n)'로 시작하는 줄이 포함된 (글꼴, 크기)
    fn_key = None
    small = [(l['font'], l['size']) for _, l in all_lines if l['size'] < body_key[1] - 0.3 and l['y'] > H * 0.55]
    if small:
        cands = collections.Counter(small).most_common(4)
        for k, _ in cands:
            if any(RE_FN.match(l['text']) for _, l in all_lines if (l['font'], l['size']) == k): fn_key = k; break
        if fn_key is None: fn_key = cands[0][0]
    # 본문 영역(여백): 본문 줄의 x 범위, 쪽마다 좌우 여백 분포
    x0s = sorted(l['x0'] for l in body); x1s = sorted(l['x1'] for l in body)
    left = x0s[len(x0s) // 10] if x0s else 0; right = x1s[-max(1, len(x1s) // 10)] if x1s else W
    # 줄 간격: 같은 쪽에서 본문 줄 y 차이의 최빈값
    gaps = []
    for pn in range(lo, hi + 1):
        ys = sorted(l['y'] for p, l in all_lines if p == pn and (l['font'], l['size']) == body_key)
        gaps += [round(b - a, 1) for a, b in zip(ys, ys[1:]) if 5 < b - a < 40]
    pitch = mode(gaps)
    fn_gaps = []
    for pn in range(lo, hi + 1):
        ys = sorted(l['y'] for p, l in all_lines if p == pn and fn_key and (l['font'], l['size']) == fn_key)
        fn_gaps += [round(b - a, 1) for a, b in zip(ys, ys[1:]) if 4 < b - a < 30]
    fn_pitch = mode(fn_gaps)
    # 첫 쪽: 제목(가장 큰 글), 저자(제목 아래 짧은 줄), 초록·주제어·목차 표지
    first = [l for p, l in all_lines if p == lo]
    title = max(first, key=lambda l: l['size']) if first else None
    marks = {}
    for p, l in all_lines:
        t = l['text']
        for name, rx in (('abstractKo', RE_ABS_KO), ('abstractEn', RE_ABS_EN), ('refHead', RE_REF), ('tocHead', RE_TOC), ('keywords', RE_KW)):
            if name not in marks and rx.match(t): marks[name] = dict(page=p + 1, font=l['font'], size=l['size'], bold=l['bold'], x0=l['x0'], center=abs((l['x0'] + l['x1']) / 2 - (left + right) / 2) < 12, sample=t[:30])
    h1 = [l for p, l in all_lines if RE_H1.match(l['text']) and len(l['text']) < 60 and (l['size'] > body_key[1] + 0.3 or l['bold'])]
    h1_key = mode([(l['font'], l['size'], l['bold']) for l in h1]) if h1 else None
    # 초록 본문: 초록 표지 다음 줄들의 (글꼴, 크기)
    abs_body = None
    if 'abstractKo' in marks:
        pg = marks['abstractKo']['page'] - 1; seq = [l for p, l in all_lines if p == pg]
        idx = next((i for i, l in enumerate(seq) if RE_ABS_KO.match(l['text'])), None)
        if idx is not None and idx + 1 < len(seq): nxt = [l for l in seq[idx + 1:idx + 6] if len(l['text']) > 15]; abs_body = (nxt[0]['font'], nxt[0]['size'], nxt[0]['x0']) if nxt else None
    # 참고문헌 항목: 참고문헌 표지 뒤 줄
    ref_body = None
    if 'refHead' in marks:
        pg = marks['refHead']['page'] - 1; seq = [l for p, l in all_lines if p == pg]
        idx = next((i for i, l in enumerate(seq) if RE_REF.match(l['text'])), None)
        if idx is not None: nxt = [l for l in seq[idx + 1:idx + 8] if len(l['text']) > 15]; ref_body = (nxt[0]['font'], nxt[0]['size'], nxt[0]['x0']) if nxt else None
    # 본문 들여쓰기: 본문 줄 가운데 왼쪽 여백보다 2~25pt 안쪽에서 시작하는 줄(문단 첫 줄)의 x0 최빈값
    ind = [round(l['x0'] - left, 1) for l in body if 2 < l['x0'] - left < 25]
    body_indent = mode(ind) if ind else 0
    # 참고문헌 내어쓰기: 참고문헌 표지 뒤 같은 글꼴/크기 줄의 x0가 두 값(첫 줄·이어지는 줄)으로 갈리면 그 차이
    ref_hanging = None; ref_key = None
    if 'refHead' in marks:
        pg = marks['refHead']['page'] - 1; seq = [l for p, l in all_lines if pg <= p <= pg + 2]
        idx = next((i for i, l in enumerate(seq) if RE_REF.match(l['text'])), None)
        if idx is not None:
            after = [l for l in seq[idx + 1:] if len(l['text']) > 8]
            if after:
                ref_key = mode([(l['font'], l['size']) for l in after[:30]])
                xs = sorted(set(round(l['x0'], 0) for l in after if (l['font'], l['size']) == ref_key))
                if len(xs) >= 2: ref_hanging = round((xs[1] - xs[0]) * PT2MM, 1)
    # 인용문: 본문보다 0.5~1.5pt 작고 좌우가 본문 영역보다 안쪽인 줄
    qs = [l for _, l in all_lines if body_key[1] - 1.6 < l['size'] < body_key[1] - 0.4 and l['x0'] > left + 8 and l['x1'] < right - 8 and len(l['text']) > 15 and l['y'] < H * 0.75]
    quote = {'font': mode([l['font'] for l in qs]), 'size_pt': mode([l['size'] for l in qs]), 'left_margin_mm': round((mode([round(l['x0'], 0) for l in qs]) - left) * PT2MM, 1), 'n_lines': len(qs)} if len(qs) >= 3 else None
    fonts = collections.Counter(l['font'] for _, l in all_lines).most_common(8)
    return {
        'file': pdf.split('/')[-1].split('\\')[-1], 'pages': f'{lo + 1}-{hi + 1}',
        'page_mm': [round(W * PT2MM, 1), round(H * PT2MM, 1)],
        'margins_mm': {'left': round(left * PT2MM, 1), 'right': round((W - right) * PT2MM, 1)},
        'body': {'font': body_key[0], 'size_pt': body_key[1], 'line_pitch_pt': pitch, 'line_spacing_pct': round(pitch / body_key[1] * 100) if pitch else None},
        'footnote': {'font': fn_key[0], 'size_pt': fn_key[1], 'line_pitch_pt': fn_pitch, 'line_spacing_pct': round(fn_pitch / fn_key[1] * 100) if fn_key and fn_pitch else None} if fn_key else None,
        'title': {'font': title['font'], 'size_pt': title['size'], 'bold': title['bold'], 'center': abs((title['x0'] + title['x1']) / 2 - W / 2) < 15} if title else None,
        'h1': {'font': h1_key[0], 'size_pt': h1_key[1], 'bold': h1_key[2], 'samples': [l['text'][:20] for l in h1[:4]]} if h1_key else None,
        'marks': marks,
        'abstract_body': {'font': abs_body[0], 'size_pt': abs_body[1], 'indent_from_left_mm': round((abs_body[2] - left) * PT2MM, 1)} if abs_body else None,
        'ref_body': {'font': ref_body[0], 'size_pt': ref_body[1], 'indent_from_left_mm': round((ref_body[2] - left) * PT2MM, 1)} if ref_body else None,
        'body_indent_mm': round(body_indent * PT2MM, 1) if body_indent else 0,
        'ref_hanging_mm': ref_hanging,
        'quote': quote,
        'fonts_used': [f for f, _ in fonts],
    }

if __name__ == '__main__':
    pdf, pages, out = parse_args(sys.argv)
    res = profile(pdf, pages)
    s = json.dumps(res, ensure_ascii=False, indent=1)
    if out: open(out, 'w', encoding='utf-8').write(s)
    sys.stdout.reconfigure(encoding='utf-8'); print(s)
