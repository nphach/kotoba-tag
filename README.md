# コトバタッグ！
### **Kotoba Tag!** - *shiritori* for Japanese language learning
Based off of *shiritori* is Kotoba Tag, where a player will need to quickly translate Japanese vocabulary and keep the game going with their own Japanese words. Race the clock, sharpen your vocab skills and aim for a high score!

- [Local Development](#local-development)
- [Deployment](#deployment)
- [To Do](#to-do)
- [Rules](#rules)
- [About](#about)
- [Features](#features)
- [Potential Problems/ Topics to Explore](#potential-problems-topics-to-explore)
- [Resources](#more-resources)

### Local Development

Kotoba Tag runs as two processes: a **Vite/React frontend** and a **FastAPI backend** ([`src/server.py`](src/server.py)). The word bank is bundled JSON — no database is required to play.

#### Prerequisites

- Node.js 18+
- Python 3.10+
- A [HuggingFace access token](https://huggingface.co/settings/tokens) with permission to call [`nphach/jp-parallel-gloss`](https://huggingface.co/nphach/jp-parallel-gloss)

#### One-time setup

```bash
npm run setup
```

This creates a Python virtual environment, installs dependencies, and copies [`.env.example`](.env.example) to `.env` if needed.

Edit `.env` and set your `HUGGINGFACE_TOKEN`. The other required variable (`HF_SIMILARITY_URL`) has a sensible default.

#### Run locally

Start both the frontend and API together:

```bash
npm run dev:all
```

Or run them in separate terminals:

```bash
npm run dev          # frontend → http://localhost:5173
npm run dev:server   # API      → http://127.0.0.1:8000
```

In dev mode the frontend sends API requests to the same origin; Vite proxies them to `http://127.0.0.1:8000` ([`vite.config.ts`](vite.config.ts)). This avoids CORS issues when Vite picks a non-default port (e.g. 5175). The first game start may take a moment while the HuggingFace model warms up.

Verify the API is running:

```bash
curl http://127.0.0.1:8000/health
```

#### npm scripts

| Script | Description |
|--------|-------------|
| `npm run setup` | One-time local dev setup (venv, deps, `.env`) |
| `npm run dev:all` | Frontend + API concurrently |
| `npm run dev` | Vite dev server only |
| `npm run dev:server` | FastAPI dev server only |
| `npm run build` | Production frontend build |
| `npm test` | Run Vitest suite |

### Deployment

Production deployment is defined in [`render.yaml`](render.yaml) as a Render Blueprint with two services:

| Service | Type | Description |
|---------|------|-------------|
| `kotoba-tag-server` | Python web | FastAPI backend (`requirements.txt`) |
| `kotoba-tag-app` | Static site | Vite build output (`dist/`) |

#### Deploy to Render

1. Push this repo to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com/), create a **Blueprint** from `render.yaml`.
3. Set **`HUGGINGFACE_TOKEN`** on the `kotoba-tag-server` service (marked `sync: false` in the blueprint).
4. Confirm **`HF_SIMILARITY_URL`** is set (defaults can be added in the Render dashboard if not inherited).
5. Deploy. The static site build sets `VITE_API_URL` to the server URL automatically.

The API server uses [`requirements.txt`](requirements.txt) (FastAPI + httpx proxy). [`server-requirements.txt`](server-requirements.txt) is for the ML training pipeline only — not needed at runtime.

CORS for production origins is configured in [`src/server.py`](src/server.py). Localhost is allowed automatically when not running on Render.

### To Do
- scrape Japanese-to-Japanese definitions (Japanese WordNet?)
- verbose error handling
- settings UI

### Rules
#### How to Play
When the game begins, the player is given a random **Mystery Word** from the Word Bank, and a 30 second timer begins. The Mystery Word will be given in Japanese. The player needs to enter the **Definition**, a correct translation of the Mystery Word in English. The player can keep submitting answers until the timer has elapsed, or they may skip. Once the player answers with a valid Definition, they must continue the game *shiritori*-style by entering a **Tag Word**. The Tag Word should fit the following conditions:

- the Tag Word must be given in Japanese, be a noun and be at least two kana long
- the first syllable of the Tag Word should correspond to the last syllable of the Mystery Word
> example: hana (はな) → natsu (なつ)
- if the Mystery Word ends with an "n" (ん) the Tag Word may begin with any n-syllable (な, に, ぬ, ね, の)
> example: jikan (じかん) → niou (におう) *or* nomimono (のみもの)
- if the Mystery Word ends with *chouon* or *youon*, the Tag Word may begin with either hiragana or the 'elongated' vowel
> example: koohii (コーヒー) → hima (ひま) *or* iro (いろ), sensei (せんせい) → sekai (せかい) *or* eigo (えいご) *or* ichigo (いちご), jitensha (じてんしゃ) → shita (した) *or* yasumi (やすみ)
- *Dakuten* and *handakuten* may be ignored (or added)
> example: hanabi (はなび) → hikikomori (ひきこもり) *or* bijin (びじん), naka (なか) → kamera (カメラ) *or* gakusei (がくせい)
- the Tag Word must be new (not a previous Mystery Word nor previously given Tag Word)
- words spelled with the same *kana* but different *kanji* are not permitted and may not be repeated

The player may keep submitting Tag Words until a valid one is given (fits all above criteria). Once a player's Tag Word is accepted, a new Mystery Word from the Word Bank and timer is given. The player will continue giving Definitions and Tag Words until they can best Kotoba Tag!

#### Ending the Game
The game ends on either of the following events:
- the player runs out of time before giving a Definition an Tag Word
- Kotoba Tag cannot come up with another Mystery Word from the Word Bank, earning the player a **Complete**!

#### Points System
The player is given 10 points for each correct Definition and 10 points for each valid Tag Word. During the timer for each turn, a points multiplier will be active that increases the number of points as each answer is accepted. The multiplier begins at 5x and decreases every 5 seconds.

### About
#### Definition Validation Using SentenceTransformers
Across languages, glosses may be direct translations of a word, such as ねぎ, scallions. They may also be indirect translations or explainations of the word, such as *kitsune* きつね which can be translated as: foxes that possess paranormal abilities; fox-like spirits of traditional Japanese folklore; shape-shifting fox spirit; and so on. In Japanese, different glosses may be associated with the same *kana*. To be able to recognize such glosses entered by the player, I integrated machine learning into the definition validation phase of the game. To acheive this I:
- created a dataset of over 4M+ parallel/non-parallel glosses from the [JMDict](https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project) database and antonym/synonym pairs from [WordNet](https://wordnet.princeton.edu/)
- used this data to finetune CrossEncoder and SentenceTransformer models to make predictions of similarity between definitions
- uploaded the model to [HuggingFace](https://huggingface.co/nphach/jp-parallel-gloss) to be able to loaded and used in other programs
```
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("nphach/jp-parallel-gloss", device="mps" if torch.backends.mps.is_available() else "cpu")
sentences1 = model.encode("hi")
sentences2 = model.encode(["hello", "world"])
similarity = model.predict(sentences1, sentences2)
```

### Features
*In progress:*
- varying difficulties reflecting each JLPT level
- an online leaderboard
- custom settings (timer, multiplier, ん ending rule, kana/ romaji, furigana)
- import your own Anki deck to be used in the Kotoba Word bank
- view history of words and export them as Anki cards
- play online with others (co-op against Kotoba Tag, or versus without Mystery Words)

### Potential Problems/ Topics to Explore

### More Resources
- https://en.wikipedia.org/wiki/Shiritori
- https://dictionary.goo.ne.jp (Japanese-to-Japanese dictionary)
- https://www.kanshudo.com/collections/wikipedia_jlpt (flashcards of Wikipedia's JLPT vocab by level)
- https://www.kaggle.com/datasets/robinpourtaud/jlpt-words-by-level (Japanese vocab by JLPT from tanos.co.uk dataset)
- https://www.edrdg.org/wiki/index.php/Main_Page (JMdict Japanese-English dictionary database)
- https://wordnet.princeton.edu/ (WordNet, lexical database)
- https://huggingface.co/docs/api-inference/index (HuggingFace's Inference API)