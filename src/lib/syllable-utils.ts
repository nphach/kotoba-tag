import * as wanakana from 'wanakana'

type Hiragana = string & { __brand: 'Hiragana' };

function isHiragana(s: string): s is Hiragana {
    return wanakana.isHiragana(s);
}

function toHiragana(s: string): Hiragana {
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
    if (dakuten.has(h)) {
        return dakuten.get(h) ?? h
    } else if (handakuten.has(h)) {
        return handakuten.get(h) ?? h
    } else if (chiisaiKana.has(h)) {
        return chiisaiKana.get(h) ?? h
    } else {
        return h
    }
}

export function getColumn(h: Hiragana): Hiragana {
    let kana = normalizeKana(h)
    if ('あかさたなはまやらわ'.includes(kana)) {
        return toHiragana('あ')
    } else if ('いきしちにひみり'.includes(kana)) {
        return toHiragana('い')
    } else if ('うくすつぬむゆる'.includes(kana)) {
        return toHiragana('う')
    } else if ('えけせてねへめれ'.includes(kana)) {
        return toHiragana('え')
    } else if ('おこそとのほもよろを'.includes(kana)) {
        return toHiragana('お')
    } else {
        return toHiragana('ん')
    }
}

export function getFirst(h: Hiragana): Hiragana {
    return toHiragana(h[0])
}

export function getLast(h: Hiragana): Hiragana[] {
    let curr = toHiragana(h[h.length - 1])
    let left = toHiragana(h[h.length - 2])
    let nextStr = toHiragana(h.substring(0, h.length - 1))
    if (chiisaiKana.has(curr)) {
        return [chiisaiKana.get(curr) ?? curr].concat(getLast(nextStr))
    } else if (curr === 'ん') {
        return [toHiragana('ん')]
    } else if (
        (curr === 'ー')
        || ((curr === 'あ') && ('あ'.includes(getColumn(left))))
        || ((curr === 'い') && ('いえ'.includes(getColumn(left))))
        || ((curr === 'う') && ('うお'.includes(getColumn(left))))
    ) {
        return [getColumn(left)].concat(getLast(nextStr))
    } else {
        return [curr]
    }
}

export function getCorresponding(h: Hiragana[]): Hiragana[] {
    let res: Hiragana[] = []
    for (let i = 0; i < h.length; i++) {
        let curr = normalizeKana(h[i])
        if (curr === 'ん') {
            res.concat((['な', 'に', 'ぬ', 'ね', 'の'].map(x => toHiragana(x))))
        } else if (correspondingKana.has(curr)) {
            res.concat(curr, correspondingKana.get(curr) ?? curr)
        } else {
            res.concat(curr)
        }
    }
    return res
}