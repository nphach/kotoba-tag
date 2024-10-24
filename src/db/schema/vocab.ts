import { integer, text, sqliteTable } from "drizzle-orm/sqlite-core";

export const vocab = sqliteTable('vocab', {
    vocabId: integer('vocab_id').notNull().primaryKey({ autoIncrement: true}),
    kanji: text('kanji'),
    kana: text('kana').notNull(),
    jlptLevel: text('jlpt_level', { enum: ['N1', 'N2', 'N3', 'N4', 'N5'] }).notNull()
})
