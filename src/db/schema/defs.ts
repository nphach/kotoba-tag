import { integer, text, sqliteTable } from "drizzle-orm/sqlite-core";
import { vocab } from "./vocab"

export const defs = sqliteTable('defs', {
    defId: integer('def_id').notNull().primaryKey({ autoIncrement: true}),
    vocabId: integer('vocab_id').notNull().references(() => vocab.vocabId),
    def: text('def').notNull(),
    defLang: text('def_lang', { enum: ['EN', 'JP'] }).notNull()
})
