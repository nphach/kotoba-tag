from bs4 import BeautifulSoup
import random
import math
import json
import html
from nltk.corpus import wordnet as wn

if __name__ == "__main__":
    jmd_fp = "/Users/nikki/Desktop/kotoba tag/src/data/model/JMdict_e"
    train_fp = "src/data/model/train.json"
    cv_fp = "src/data/model/cv.json"
    test_fp = "src/data/model/test.json"

    def get_antonyms(word):
        antonyms = set()
        for syn in wn.synsets(word):
            for lemma in syn.lemmas():
                for antonym in lemma.antonyms():
                    antonyms.add(antonym.name())
        return list(antonyms)

    def get_synonyms(word):
        synonyms = set()
        for syn in wn.synsets(word):
            for lemma in syn.lemmas():
                for synonym in lemma.similar_tos():
                    synonyms.add(synonym.name())
                for synonym in lemma.also_sees():
                    synonyms.add(synonym.name())
        return list(synonyms)

    def is_simple(gloss):
        return len(gloss.split(" ")) == 1

    with open(jmd_fp, 'r') as f:
        soup = BeautifulSoup(f, 'lxml-xml')

    out = []
    saved_gloss = None
    all_glosses = []

    for e in soup.find_all('entry'):
        for s in e.find_all('sense'):
            g = [html.unescape(x.string.strip()) for x in s.find_all('gloss')]
            all_glosses.extend(g)

            if (len(g) == 1):
                if is_simple(g[0]):
                    antonyms = get_antonyms(g[0])
                    all_glosses.extend(antonyms)
                    for antonym in antonyms:
                        out.append([[g[0], antonym], False])
                    synonyms = get_synonyms(g[0])
                    all_glosses.extend(synonyms)
                    for synonym in synonyms:
                        out.append([[g[0], synonym], True])
                if (saved_gloss == None):
                    saved_gloss = g
                elif (g != saved_gloss):
                    out.append([saved_gloss + g, False])
                    saved_gloss = None
            elif (len(g) > 1):
                antonyms = []
                synonyms = []
                for x in g:
                    if is_simple(x):
                        antonyms.extend(get_antonyms(x))
                        synonyms.extend(get_synonyms(x))
                all_glosses.extend(antonyms)
                all_glosses.extend(synonyms)
                for i in range(len(g) - 1):
                    for antonym in antonyms:
                        out.append([[g[i], antonym], False])
                    for synonym in synonyms:
                        out.append([[g[i], synonym], True])
                    for j in range(i, len(g)):
                        out.append([[g[i], g[j]], True])

    num_random_negatives = 10
    # random negatives
    for gloss in all_glosses:
        for _ in range(num_random_negatives):
            rand = random.choice(all_glosses)
            if gloss != rand and rand not in get_synonyms(gloss):
                out.append([[gloss, rand], False])

    random.shuffle(out)
    l = len(out)
    train = out[0:math.floor(l * 0.8)]
    cv = out[math.floor(l * 0.8): math.floor(l * 0.9)]
    test = out[math.floor(l * 0.9):l]

    with open(train_fp, "w") as f:
        json.dump(train, f, ensure_ascii=False, indent=2)
    with open(cv_fp, "w") as f:
        json.dump(cv, f, ensure_ascii=False, indent=2)
    with open(test_fp, "w") as f:
        json.dump(test, f, ensure_ascii=False, indent=2)