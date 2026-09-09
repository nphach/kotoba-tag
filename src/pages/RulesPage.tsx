import { SiteBranding, SiteFooter } from "@/components/site-chrome.tsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettings } from "@/lib/settings-context.tsx";
import { Link } from "react-router-dom";

function RulesPage() {
  const { settings } = useSettings();

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] w-full items-center justify-center overflow-y-auto py-4 text-left sm:px-4 sm:py-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-5">
        <div className="flex w-full max-w-5xl flex-col gap-4 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
          <SiteBranding className="text-center sm:text-left" />
          <Button variant="outline" asChild>
            <Link to="/">back to game</Link>
          </Button>
        </div>

        <Card className="w-full max-w-5xl">
          <CardHeader>
            <CardTitle className="text-2xl font-kosugi">rules</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 text-sm leading-6 md:grid-cols-[1.3fr_1fr] md:gap-8">
            <section className="space-y-3 md:row-span-3">
              <h2 className="text-base font-bold">how to play</h2>
              <p>
                When the game begins, you get a random mystery word in Japanese
                and a timer ({settings.timerSeconds} seconds with your current
                settings). First, enter a correct English definition. Then keep
                the game going shiritori-style by entering a Japanese tag word.
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  The tag word must be Japanese, a noun, and at least two kana
                  long.
                </li>
                <li>
                  The first syllable should match the last syllable of the
                  mystery word.
                </li>
                <li>
                  If the mystery word ends in ん, the tag word may begin with
                  any n-syllable.
                </li>
                <li>
                  If the mystery word ends with chouon or youon, the tag word
                  may begin with the kana or its elongated vowel.
                </li>
                <li>Dakuten and handakuten may be ignored or added.</li>
                <li>
                  The tag word must be new. Previous mystery words, tag words,
                  and same-kana words cannot be reused.
                </li>
              </ul>
            </section>

            <section className="space-y-3 rounded-lg bg-muted/50 p-4">
              <h2 className="text-base font-bold">examples</h2>
              <ul className="space-y-3">
                <li>
                  <span className="font-bold">basic:</span> はな can tag to
                  なつ.
                </li>
                <li>
                  <span className="font-bold">ん ending:</span> じかん can tag
                  to におう or のみもの.
                </li>
                <li>
                  <span className="font-bold">chouon / youon:</span> コーヒー
                  can tag to ひま or いろ; じてんしゃ can tag to した or やすみ.
                </li>
                <li>
                  <span className="font-bold">dakuten:</span> はなび can tag to
                  ひきこもり or びじん.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold">ending the game</h2>
              <p>
                The game ends if time runs out before you give both a definition
                and tag word, or if Kotoba Tag cannot find another mystery word
                from the word bank.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold">points</h2>
              <p>
                Correct definitions and valid tag words are each worth 10 points.
                A multiplier starts at 5x each turn and decreases every 5
                seconds while the timer runs.
              </p>
            </section>
          </CardContent>
        </Card>

        <SiteFooter className="w-full max-w-5xl pb-2 sm:text-left" />
      </div>
    </main>
  );
}

export default RulesPage;
