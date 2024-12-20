import { useState } from 'react'
import { useMachine } from '@xstate/react'
import { machine } from './lib/machine.ts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Hiragana } from './lib/types.ts'
import './App.css'

function App() {
  const [state, send] = useMachine(machine)
  const [input, setInput] = useState('')

  const { mysteryWord, score, multiplier, timer, wordHistory } = state.context;

  const inDefinitionPhase = state.matches({ playRound: { presentMystery: "part1" } });
  const inTagPhase = state.matches({ playRound: { presentMystery: "part2" } });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send({ type: 'SUBMIT', definition: inDefinitionPhase ? input : undefined, tagWord: inTagPhase ? input as Hiragana : undefined });
    setInput('');
  };

  if (state.matches('idle')) {
    return (
      <div className="space-y-6 w-72 md:w-96 px-2">
        <p className="text-4xl font-kosugi">Kotoba Tag!</p>
        <Button onClick={() => send({ type: 'START' })} className="w-">start!</Button>
      </div>
    );
  }

  if (state.matches('endGame')) {
    return (
      <div className="space-y-6 w-72 md:w-96 px-2">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>game over!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl">final score: {score}</p>
          </CardContent>
        </Card>
        <Button onClick={() => send({ type: 'RESTART' })} className="w-">restart!</Button>
      </div>

    );
  }

  return (
    <div className='h-full w-full flex content-start'>
      <div className="space-y-6 w-72 md:w-96 my-0 py-20 overflow-y-auto px-2">
        <p className="w-full text-4xl font-kosugi">Kotoba Tag!</p>

        <div className="flex justify-between items-center">
          <div className="text-xl font-bold">score: {score}</div>
          <div className="text-md flex flex-col justify-between">
            <div>multiplier: {multiplier}x</div>
            <div>timer: {timer}</div>
          </div>
        </div>

        {/* mystery word card */}
        <Card className="w-full h-44">
          <CardHeader>
            <CardTitle>mystery word:</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 flex flex-col">
            {mysteryWord.kanji && <span className="text-4xl font-extrabold">{mysteryWord.kanji}</span>}
            {mysteryWord.kanji ? <span className="text-xl font-bold">{mysteryWord.kana}</span> : <span className="text-4xl font-extrabold">{mysteryWord.kana}</span>}
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={input}
            id="input"
            onChange={(e) => setInput(e.target.value)}
            placeholder={inDefinitionPhase ? "enter definition..." : "enter tag word..."}
            className="text-lg"
          />
          <Button type="submit" className="w-full">
            submit
          </Button>
        </form>

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
