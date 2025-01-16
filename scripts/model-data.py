from bs4 import BeautifulSoup
import random
import math
import json
import html

jmd_fp = "/JMdict_e"
train_fp = ""
cv_fp = ""
test_fp = ""

with open(jmd_fp, 'r') as f:
    soup = BeautifulSoup(f, 'lxml-xml')

out = []
saved_gloss = None

for e in soup.find_all('entry'):
    for s in e.find_all('sense'):
        g = [html.unescape(x.string.strip()) for x in s.find_all('gloss')]
        
        if (len(g) == 1):
            if (saved_gloss == None):
                saved_gloss = g
            elif (g != saved_gloss):
                out.append([saved_gloss + g, False])
                saved_gloss = None
        elif (len(g) > 1):
            for i in range(len(g) - 1):
                for j in range(i + 1, len(g)):
                    out.append([[g[i], g[j]], True])

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