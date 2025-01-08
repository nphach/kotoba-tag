import * as wanakana from 'wanakana'
import { Hiragana } from './types.ts'

export function isHiragana(s: string): s is Hiragana {
    return wanakana.isHiragana(s);
}

export function toHiragana(s: string): Hiragana {
    if (isHiragana(s)) {
        return s;
    }
    throw new Error('invalid Hiragana string');
}

const dakuten = new Map<Hiragana, Hiragana>([
    ['が', 'か'], ['ぎ', 'き'], ['ぐ', 'く'], ['げ', 'け'], ['ご', 'こ'],
    ['ざ', 'さ'], ['じ', 'し'], ['ず', 'す'], ['ぜ', 'せ'], ['ぞ', 'そ'],
    ['だ', 'た'], ['ぢ', 'ち'], ['づ', 'つ'], ['で', 'て'], ['ど', 'と'],
    ['ば', 'は'], ['び', 'ひ'], ['ぶ', 'ふ'], ['べ', 'へ'], ['ぼ', 'ほ']
].map(([key, value]) => [toHiragana(key), toHiragana(value)]));

const handakuten = new Map<Hiragana, Hiragana>([
    ['ぱ', 'は'], ['ぴ', 'ひ'], ['ぷ', 'ふ'], ['ぺ', 'へ'], ['ぽ', 'ほ']
].map(([key, value]) => [toHiragana(key), toHiragana(value)]));

const chiisaiKana = new Map<Hiragana, Hiragana>([
    ['ぁ', 'あ'], ['ぃ', 'い'], ['ぅ', 'う'], ['ぇ', 'え'], ['ぉ', 'お'],
    ['ゃ', 'や'], ['ゅ', 'ゆ'], ['ょ', 'よ']
].map(([key, value]) => [toHiragana(key), toHiragana(value)]));

const correspondingKana = new Map<Hiragana, Hiragana[]>(([
    ['か', ['が']], ['き', ['ぎ']], ['く', ['ぐ']], ['け', ['げ']], ['こ', ['ご']],
    ['さ', ['ざ']], ['し', ['じ']], ['す', ['ず']], ['せ', ['ぜ']], ['そ', ['ぞ']],
    ['は', ['ば', 'ぱ']], ['ひ', ['び', 'ぴ']], ['ふ', ['ぶ', 'ぷ']], ['へ', ['べ', 'ぺ']], ['ほ', ['ぼ', 'ぽ']]
] as [string, string[]][])
    .map(([key, value]) => [toHiragana(key), value.map(toHiragana)]));

export function normalizeKana(h: Hiragana): Hiragana {
    return h.split('').map((k: string): string => {
        if (dakuten.has(k as Hiragana)) {
            return dakuten.get(k as Hiragana) ?? k;
        } else if (handakuten.has(k as Hiragana)) {
            return handakuten.get(k as Hiragana) ?? k;
        } else if (chiisaiKana.has(k as Hiragana)) {
            return chiisaiKana.get(k as Hiragana) ?? k;
        } else {
            return k;
        }
    }).join('') as Hiragana
}


export function getColumn(h: Hiragana): Hiragana {
    if (h.length > 1) {
        throw new Error('cannot get column for >1 kana')
    }
    let kana = normalizeKana(h)
    if ('あかさたなはまやらわ'.includes(kana)) {
        return 'あ' as Hiragana
    } else if ('いきしちにひみり'.includes(kana)) {
        return 'い' as Hiragana
    } else if ('うくすつぬむゆる'.includes(kana)) {
        return 'う' as Hiragana
    } else if ('えけせてねへめれ'.includes(kana)) {
        return 'え' as Hiragana
    } else if ('おこそとのほもよろを'.includes(kana)) {
        return 'お' as Hiragana
    } else {
        return 'ん' as Hiragana
    }
}

export function getFirst(h: Hiragana): Hiragana {
    return h[0] as Hiragana
}

export function getLast(h: Hiragana): Hiragana[] {
    let curr = h[h.length - 1] as Hiragana
    let left = h[h.length - 2] as Hiragana
    let nextStr = h.substring(0, h.length - 1) as Hiragana
    if (chiisaiKana.has(curr)) {
        return [chiisaiKana.get(curr) ?? curr].concat(getLast(nextStr))
    } else if (curr === 'ん') {
        return ['ん' as Hiragana]
    } else if (
        (curr === 'ー')
        || ((curr === 'あ') && ('あ'.includes(getColumn(left))))
        || ((curr === 'い') && ('いえ'.includes(getColumn(left))))
        || ((curr === 'う') && ('うお'.includes(getColumn(left))))
    ) {
        return [getColumn(left), curr].concat(getLast(nextStr))
    } else {
        return [curr]
    }
}

export function getCorresponding(h: Hiragana[]): Hiragana[] {
    let res: Hiragana[] = []
    for (let i = 0; i < h.length; i++) {
        let curr = normalizeKana(h[i])
        if (curr === 'ん') {
            res.push(...['な', 'に', 'ぬ', 'ね', 'の'] as Hiragana[])
        } else if (correspondingKana.has(curr)) {
            res.push(curr, ...(correspondingKana.get(curr) ?? [curr]))
        } else {
            res.push(curr)
        }
    }
    return res
}