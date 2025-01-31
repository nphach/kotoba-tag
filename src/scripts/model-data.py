from bs4 import BeautifulSoup
import random
import math
import json
import html
from nltk.corpus import wordnet as wn

jmd_fp = "/Users/nikki/Desktop/kotoba tag/src/data/model/JMdict_e"
train_fp = "train_2.json"
cv_fp = "cv_2.json"
test_fp = "test_2.json"

def get_antonyms(word):
    antonyms = set()
    for syn in wn.synsets(word):
        for lemma in syn.lemmas():
            for antonym in lemma.antonyms():
                antonyms.add(antonym.name())
    return list(antonyms)

def is_simple(gloss):
    return len(gloss.split()) == 1

with open(jmd_fp, 'r') as f:
    soup = BeautifulSoup(f, 'lxml-xml')

out = []
all_glosses = []

for e in soup.find_all('entry'):
    for s in e.find_all('sense'):
        g = [html.unescape(x.string.strip()) for x in s.find_all('gloss')]
        all_glosses.extend(g)

        if (len(g) > 1):
            for i in range(len(g) - 1):
                for j in range(i + 1, len(g)):
                    out.append([[g[i], g[j]], True])

for gloss in all_glosses:
    if is_simple(gloss):
        antonyms = get_antonyms(gloss)
        for antonym in antonyms:
            out.append([[gloss, antonym], False])

random.shuffle(out)
l = len(out)
train = out[0:math.floor(l * 0.6)]
cv = out[math.floor(l * 0.6): math.floor(l * 0.8)]
test = out[math.floor(l * 0.8):l]

with open(train_fp, "w") as f:
    json.dump(train, f, ensure_ascii=False, indent=2)
with open(cv_fp, "w") as f:
    json.dump(cv, f, ensure_ascii=False, indent=2)
with open(test_fp, "w") as f:
    json.dump(test, f, ensure_ascii=False, indent=2)