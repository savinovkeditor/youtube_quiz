"use client"

export function QuizHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-secondary/20 to-background">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 py-12 md:py-16">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto gap-8">
          {/* Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance">
              Создавайте интерактивные викторины <span className="text-primary">на основе YouTube видео</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
              Превратите любое видео в увлекательное обучающее путешествие с автоматически генерируемыми вопросами и
              интерактивными викторинами
            </p>
          </div>

          {/* CTA Buttons */}
        </div>
      </div>
    </section>
  )
}
