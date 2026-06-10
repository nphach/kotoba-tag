import { useEffect, useRef } from 'react'
import { useMachine } from '@xstate/react'
import { flushSync } from 'react-dom'
import { prefetchModel } from '@/lib/api.ts'
import { machine } from '@/lib/machine.ts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Hiragana } from '@/lib/types.ts'
import * as wanakana from 'wanakana'
import './App.css'

function App() {
  const [state, send] = useMachine(machine)
  const defInputRef = useRef<HTMLInputElement>(null)
  const tagInputRef = useRef<HTMLInputElement>(null)

  const { mysteryWord, score, multiplier, timer, wordHistory, tagWord, tagDefinitions, errorMessage } = state.context;

  const inDefPhase = state.matches({ playRound: { presentMystery: "part1" } });
  const inTagPhase = state.matches({ playRound: { presentMystery: "part2" } });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    flushSync(() => {
      send({
        type: 'SUBMIT',
        definition: inDefPhase ? formData.get("d") : undefined,
        tagWord: inTagPhase ? formData.get("t") as Hiragana : undefined
      })
    })
  };

  useEffect(() => {
    prefetchModel()
  }, [])

  useEffect(() => {
    if (inTagPhase && tagInputRef.current) {
      const input = tagInputRef.current
      wanakana.bind(input)
      return () => wanakana.unbind(input)
    }
  }, [inTagPhase])

  useEffect(() => {
    if (inDefPhase) {
      defInputRef.current?.focus()
    } else if (inTagPhase) {
      tagInputRef.current?.focus()
    }
  }, [inDefPhase, inTagPhase]);

  if (state.matches('idle')) {
    return (
      <div className="flex flex-col space-y-6 w-72 md:w-96 px-2">
        <p className="text-4xl font-kosugi">Kotoba Tag!</p>
        <Button onClick={() => send({ type: 'START' })}>start!</Button>
        {errorMessage && (
          <p className="text-red-500 text-xs font-bold">{errorMessage}</p>
        )}
        <a href="https://github.com/nphach/kotoba-tag/tree/main?tab=readme-ov-file#rules">
          view rules on github ‣
        </a>
        <a href="https://nphach.github.io" className="text-xs font-kosugi font-bold">made by nphach</a>
      </div>
    );
  }

  if (state.matches('prepareGame')) {
    return (
      <div className="flex flex-col space-y-6 w-72 md:w-96 px-2">
        <p className="text-4xl font-kosugi">Kotoba Tag!</p>
        <p className="text-sm text-gray-600">preparing game...</p>
        <a href="https://nphach.github.io" className="text-xs font-kosugi font-bold">made by nphach</a>
      </div>
    );
  }

  if (state.matches('complete')) {
    return (
      <div className="flex flex-col space-y-6 w-72 md:w-96 px-2">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>nice!</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4 text-sm text-balance'>
            <p>there are no corresponding words in the word bank</p>
            <p>you've earned a bonus 10x multiplier</p>
            <p className="font-kosugi">日本語が上手ですね ww</p>
            <p className="text-2xl">final score: {score}</p>
          </CardContent>
        </Card>
        <Button onClick={() => send({ type: 'RESTART' })}>restart!</Button>
        <a href="https://nphach.github.io" className="text-xs font-kosugi font-bold">made by nphach</a>
      </div>
    );
  }

  if (state.matches('endGame')) {
    return (
      <div className="flex flex-col space-y-6 w-72 md:w-96 px-2">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>game over!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl">final score: {score}</p>
          </CardContent>
        </Card>
        <Button onClick={() => send({ type: 'RESTART' })}>restart!</Button>
        <a href="https://nphach.github.io" className="text-xs font-kosugi font-bold">made by nphach</a>
      </div>
    );
  }

  return (
    <div className='h-full w-full flex flex-col content-start'>
      <div className="space-y-5 w-72 md:w-96 my-0 py-5 overflow-y-auto px-2">
        <p className="w-full text-4xl font-kosugi">Kotoba Tag!</p>

        <div className="flex justify-between items-center">
          <div className="text-xl font-bold">score: {score}</div>
          <div className="text-md flex flex-col justify-between">
            <div>multiplier: {multiplier}x</div>
            <div>timer: {timer}</div>
          </div>
        </div>

        {/* mystery word card */}
        <Card className="w-full h-min-44 ">
          <CardHeader>
            <CardTitle>mystery word:</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 flex flex-col">
            {mysteryWord.kanji && <span className="text-4xl font-extrabold">{mysteryWord.kanji}</span>}
            {mysteryWord.kanji ? <span className="text-xl font-bold">{mysteryWord.kana}</span> : <span className="text-4xl font-extrabold">{mysteryWord.kana}</span>}
            {inTagPhase &&
              <span className="text-sm text-gray-600">
                {mysteryWord.definitions.join(", ")}
              </span>
            }
          </CardContent>
        </Card>

        {errorMessage && (
          <div className="text-red-500 text-xs font-bold">
            {errorMessage}
          </div>
        )}

        <div className="flex-y space-y-3">
          <form onSubmit={handleSubmit} id="form" className="space-y-4">
            {inDefPhase &&
              <Input
                ref={defInputRef}
                name="d"
                placeholder={"enter definition..."}
                className="text-lg border-purple-500"
              />
            }

            {inTagPhase &&
              <Input
                ref={tagInputRef}
                name="t"
                placeholder={"enter tag word..."}
                className="text-lg border-blue-500"
              />
            }

            <div className="flex gap-2">
              <Button type="submit" className="w-full">
                submit
              </Button>

              {inDefPhase &&
                <Button
                  type="button"
                  onClick={() => send({ type: 'SKIP' })}
                  className="w-full"
                >
                  skip
                </Button>
              }
            </div>
          </form>
        </div>

        {/* tag word card */}
        {tagWord &&
          <Card className="w-full h-min-44 ">
            <CardContent className="space-y-2 flex flex-col p-4">
              <span className="text-xl font-bold">{tagWord}</span>
              <span className="text-sm text-gray-600">
                {tagDefinitions.join(", ")}
              </span>
            </CardContent>
          </Card>}

        {/* word history */}
        <Card>
          <CardHeader>
            <CardTitle>word history:</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 max-w-96">
              {wordHistory.map((word, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-slate-100 rounded-full text-sm"
                >
                  {word}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default App
