// rhwp가 저장한 HWP 5.0 바이너리의 알려진 어긋남을 한글이 읽는 배치로 고친다(저장 직후 한 번).
//
// 각주·미주 모양(HWPTAG_FOOTNOTE_SHAPE, 28바이트): 한글 2024가 직접 저장한 파일은
//   0  속성 u32 · 4 사용자 기호 · 6 앞 장식 · 8 뒤 장식 · 10 시작 번호 (u16 넷)
//   12 구분선 길이 i32 · 16 구분선 위 여백 · 18 아래 여백 · 20 주석 사이 여백 (u16 셋)
//   22 선 종류 u8 · 23 선 굵기 u8 · 24 선 색 COLORREF
// 인데 rhwp 0.8.7은 12에 길이를 i16으로, 14·16·18에 여백 셋, 20에 ‘미문서화 2바이트’를 쓴다.
// 그래서 한글은 길이를 (위 여백 << 16 | 길이)라는 엄청난 값으로, 위 여백을 0으로 읽어
// 구분선이 단 너비 전체로 늘어나고 선 위 여백이 사라진다(한글 판에 따라 선이 안 보이기도 함).
// 한글 2024 COM으로 확인: 길이 5669를 넣으면 한글은 55711269(=0x0352_1625)로 읽음.
import CFB from 'cfb';
import pako from 'pako';

const TAG_FOOTNOTE_SHAPE = 74;   // HWPTAG_BEGIN(16) + 58

// 구역 스트림(압축 풀린 바이트) 안의 각주·미주 모양 레코드를 고친다. 고친 개수를 돌려준다
export function fixSectionRecords(data) {
  let pos = 0; let fixed = 0;
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  while (pos + 4 <= data.length) {
    const h = dv.getUint32(pos, true); pos += 4;
    const tag = h & 0x3ff; let size = h >>> 20;
    if (size === 0xfff) { if (pos + 4 > data.length) break; size = dv.getUint32(pos, true); pos += 4; }
    if (pos + size > data.length) break;
    // rhwp 배치(실측): 12 길이 i16 · 14 위 여백 · 16 0(빈 2바이트) · 18 아래 여백 · 20 주석 사이 여백 — 아래·사이 여백은 이미 한글 자리에 있다.
    // 한글 배치로: 12–15 길이 i32(부호 확장), 16 위 여백. 16–17이 0이 아니면 이미 한글 배치이거나 모르는 배치라 손대지 않는다
    if (tag === TAG_FOOTNOTE_SHAPE && size === 28 && dv.getUint16(pos + 16, true) === 0) {
      const len16 = dv.getInt16(pos + 12, true); const above = dv.getUint16(pos + 14, true);
      const looksHangul = (len16 < 0 && above === 0xffff) || (len16 >= 0 && above === 0);   // 이미 i32 길이(상위 16비트가 부호 확장)인 한글 배치
      if (!looksHangul) {
        dv.setInt32(pos + 12, len16, true);
        dv.setUint16(pos + 16, above, true);
        fixed++;
      }
    }
    pos += size;
  }
  return fixed;
}

// HWP 파일 바이트 → 고친 HWP 바이트. 고칠 것이 없거나 읽지 못하면 원래 바이트를 그대로 돌려준다
export function fixHwpBytes(bytes, log) {
  try {
    const cfb = CFB.read(bytes, { type: 'array' });
    const header = CFB.find(cfb, '/FileHeader');
    if (!header || !header.content) return bytes;
    const flags = header.content[36] | (header.content[37] << 8);
    const compressed = (flags & 1) === 1; const encrypted = (flags & 2) === 2;
    if (encrypted) return bytes;
    let total = 0;
    for (const e of cfb.FileIndex) {
      if (!e || e.type !== 2 || !/^Section\d+$/.test(e.name)) continue;
      const full = cfb.FullPaths[cfb.FileIndex.indexOf(e)];
      if (!/\/BodyText\/Section\d+$/.test(full)) continue;
      const raw = compressed ? pako.inflateRaw(Uint8Array.from(e.content)) : Uint8Array.from(e.content);
      const n = fixSectionRecords(raw);
      if (!n) continue;
      e.content = compressed ? pako.deflateRaw(raw, { level: 6 }) : raw;
      e.size = e.content.length;
      total += n;
    }
    if (!total) return bytes;
    const out = CFB.write(cfb, { type: 'array', fileType: 'cfb' });
    log?.(`각주 모양 레코드 ${total}개를 한글 배치로 고침(구분선 길이·선 위 여백)`);
    return out instanceof Uint8Array ? out : Uint8Array.from(out);
  } catch (e) {
    log?.(`각주 모양 고치기를 건너뜀: ${String(e && e.message || e).slice(0, 80)}`, 'warn');
    return bytes;
  }
}
