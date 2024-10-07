from bs4 import BeautifulSoup
import sys
import requests
import time
import csv

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

url = sys.argv[1]

response = requests.get(url + '/collections/wikipedia_jlpt', headers = headers)
soup = BeautifulSoup(response.content, 'html.parser')

section = soup.find_all('div', class_='infopanel')

links_by_jlpt = {
    "N5": [],
    "N4": [],
    "N3": [],
    "N2": [],
    "N1": []
}

# get and organize links by jlpt level
count = 5
for s in section:
    for l in s.find_all('a'):
        links_by_jlpt["N" + str(count)].append(l['href'])
    count -= 1

# initialize vocab.csv
with open('vocab.csv','w') as vocab_csv:
    fieldnames = ['vocab_id', 'kanji', 'kana', 'jlpt_level']
    c = csv.DictWriter(vocab_csv, fieldnames = fieldnames)
    c.writeheader()

# initialize def.csv
with open('def.csv','w') as def_csv:
    fieldnames = ['def_id', 'vocab_id', 'def', 'def_lang']
    c = csv.DictWriter(def_csv, fieldnames = fieldnames)
    c.writeheader()

# function that gets kanji and hiragana from div
def parse_vocab(v):
    kanji_str = ""
    kana_str = ""

    for a in v.find('a').contents:
        if isinstance(a, str):
            kanji_str += a
            kana_str += a
        elif a.name == 'span':
            furigana = a.find('div', class_='furigana').string
            kanji = a.find('div', class_='f_kanji').string
            kanji_str += kanji
            kana_str += furigana
    
    if kanji_str == kana_str:
        kanji_str = None

    return kanji_str, kana_str

for jlpt, links in links_by_jlpt.items():
    for l in links:
        response = requests.get(url + l, headers = headers)
        soup = BeautifulSoup(response.content, 'html.parser')

        vocab = soup.find_all('div', class_='jukugorow first last')

        for v in vocab:
            vocab_added = False
            is_noun = False

            for d in v.find_all('div', class_ = 'vm'):
                if d.find_all('div'):
                    if "noun" in str(d.find_all('div')) and "adjectival noun" not in str(d.find_all('div')):
                        is_noun = True
                    else:
                         is_noun = False
                
                if is_noun == True:
                    with open('vocab.csv', 'r') as vocab_csv:
                        reader = csv.reader(vocab_csv)
                        next(reader, None)
                        vocab_id = sum(1 for row in reader)

                    if vocab_added == False:
                        vocab_id += 1
                        with open('vocab.csv', 'a') as vocab_csv:
                            kanji, kana = parse_vocab(v)
                            writer = csv.writer(vocab_csv)
                            writer.writerow([vocab_id, kanji, kana, jlpt])
                        vocab_added = True
                    
                    with open('def.csv', 'r') as def_csv:
                        reader = csv.reader(def_csv)
                        next(reader, None)
                        def_id = sum(1 for row in reader) + 1
                    
                    with open('def.csv', 'a') as def_csv:
                        for i in d.children:
                            if isinstance(i, str):
                                definition = i.strip()
                        writer = csv.writer(def_csv)
                        writer.writerow([def_id, vocab_id, definition, "EN"])

        time.sleep(3)