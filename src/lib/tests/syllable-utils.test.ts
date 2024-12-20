import { describe, it, expect, expectTypeOf } from 'vitest'
import * as syl from '../syllable-utils.ts'
import { Hiragana } from '../types.ts'

describe('isHiragana', () => {
    it('should return true for valid Hiragana strings', () => {
        expect(syl.isHiragana('あいうえお')).toBe(true)
        expect(syl.isHiragana('ひらがな')).toBe(true)
    })

    it('should return false for non-Hiragana strings', () => {
        expect(syl.isHiragana('abc')).toBe(false)
        expect(syl.isHiragana('アイウエオ')).toBe(false)
        expect(syl.isHiragana('漢字')).toBe(false)
    })

    it('should narrow type to Hiragana', () => {
        const testString = 'あ' as string
        if (syl.isHiragana(testString)) {
            expectTypeOf(testString).toEqualTypeOf<Hiragana>()
        }
    })
})

describe('toHiragana', () => {
    it('should return input for valid Hiragana strings', () => {
        expect(syl.toHiragana('あいうえお')).toBe('あいうえお')
    })

    it('should throw an error for non-Hiragana strings', () => {
        expect(() => syl.toHiragana('abc')).toThrow('invalid Hiragana string')
        expect(() => syl.toHiragana('アイウエオ')).toThrow('invalid Hiragana string')
        expect(() => syl.toHiragana('漢字')).toThrow('invalid Hiragana string')
    })

    it('should return a value of type Hiragana', () => {
        const x = syl.toHiragana('あ')
        expectTypeOf(x).toEqualTypeOf<Hiragana>()
    })
})

describe.concurrent('normalizeKana', () => {
    it('should strip dakuten from hiragana', () => {
        expect(syl.normalizeKana('が' as Hiragana)).toBe('か')
        expect(syl.normalizeKana('できます' as Hiragana)).toBe('てきます')
    })

    it('should strip handakuten from hiragana', () => {
        expect(syl.normalizeKana('ぱ' as Hiragana)).toBe('は')
        expect(syl.normalizeKana('ぽかぽか' as Hiragana)).toBe('ほかほか')
    })

    it('should do nothing to normal hiragana', () => {
        expect(syl.normalizeKana('あ' as Hiragana)).toBe('あ')
        expect(syl.normalizeKana('わ' as Hiragana)).toBe('わ')
        expect(syl.normalizeKana('ん' as Hiragana)).toBe('ん')
    })

    it('should do nothing to normal hiragana', () => {
        expect(syl.normalizeKana('あ' as Hiragana)).toBe('あ')
        expect(syl.normalizeKana('わ' as Hiragana)).toBe('わ')
        expect(syl.normalizeKana('ん' as Hiragana)).toBe('ん')
    })
})

describe.concurrent('getColumn', () => {
    it('should throw an error for input longer than one kana', () => {
        expect(() => syl.getColumn('こんにちは' as Hiragana)).toThrow('cannot get column for >1 kana')
    })

    it('should get corresponding vowel column', () => {
        expect(syl.getColumn('ぴ' as Hiragana)).toBe('い')
        expect(syl.getColumn('あ' as Hiragana)).toBe('あ')
        expect(syl.getColumn('ん' as Hiragana)).toBe('ん')
    })
})

describe.concurrent('getFirst', () => {
    it('should get the first kana from hiragana string', () => {
        expect(syl.getFirst('ひらがな' as Hiragana)).toBe('ひ')
        expect(syl.getFirst('わ' as Hiragana)).toBe('わ')
    })
})

describe.concurrent('getLast', () => {
    it('should get last two kana for chouon syllables', () => {
        expect(syl.getLast('こーひー' as Hiragana).sort).toEqual(['い', 'ひ'].sort)
        expect(syl.getLast('こーひー' as Hiragana).sort).toEqual(['ひ', 'い'].sort)
    })

    it('should get last two kana for youon syllables', () => {
        expect(syl.getLast('きゃ' as Hiragana).sort).toEqual(['き', 'や'].sort)
        expect(syl.getLast('きゃ' as Hiragana).sort).toEqual(['や', 'き'].sort)
    })

    it('should get all chouon and youon kana in last syllable', () => {
        expect(syl.getLast('ねこきゃー' as Hiragana).sort).toEqual(['き', 'や', 'あ'].sort)
    })

    it('should get single kana for regular syllables', () => {
        expect(syl.getLast('でも' as Hiragana)).toEqual(['も'])
        expect(syl.getLast('じかん' as Hiragana)).toEqual(['ん'])
    })
})

describe.concurrent('getCorresponding', () => {
    it('should get all n-kana for ん', () => {
        expect(syl.getCorresponding(['ん'] as Hiragana[]).sort).toEqual(['な', 'に', 'ぬ', 'ね', 'の'].sort)
    })

    it('should get any corresponding dakuten, handakuten for normal kana', () => {
        expect(syl.getCorresponding(['わ'] as Hiragana[])).toEqual(['わ'])
        expect(syl.getCorresponding(['か'] as Hiragana[]).sort).toEqual(['か', 'が'].sort)
        expect(syl.getCorresponding(['は'] as Hiragana[]).sort).toEqual(['は', 'ば', 'ぱ'].sort)
    })

    it('should get any corresponding normal kana, handakuten for dakuten', () => {
        expect(syl.getCorresponding(['で'] as Hiragana[]).sort).toEqual(['で', 'て'].sort)
    })

    it('should get any corresponding normal kana, dakuten for handakuten', () => {
        expect(syl.getCorresponding(['ぷ'] as Hiragana[]).sort).toEqual(['ふ', 'ぶ'].sort)
    })

    it('should get corresponding kana for all kana', () => {
        expect(syl.getCorresponding(['ん', 'ぽ'] as Hiragana[]).sort).toEqual(['ほ', 'ぼ', 'ぽ', 'な', 'に', 'ぬ', 'ね', 'の'].sort)
    })
})