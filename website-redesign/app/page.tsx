import { QuizHero } from "@/components/quiz-hero"
import { QuizInterface } from "@/components/quiz-interface"
// import { Features } from "@/components/features"

export default function Home() {
  return (
    <main className="min-h-screen">
      <QuizHero />
      <QuizInterface />
    </main>
  )
}
