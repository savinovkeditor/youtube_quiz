import { Card, CardContent } from "@/components/ui/card"
import { Brain, Users, Trophy, BarChart3, Globe, Shield } from "lucide-react"

export function Features() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered",
      description: "Интеллектуальный анализ видео для создания качественных вопросов",
    },
    {
      icon: Users,
      title: "Совместная работа",
      description: "Делитесь викторинами с друзьями и учениками",
    },
    {
      icon: Trophy,
      title: "Геймификация",
      description: "Система баллов и достижений для мотивации обучения",
    },
    {
      icon: BarChart3,
      title: "Аналитика",
      description: "Отслеживайте прогресс и результаты в реальном времени",
    },
    {
      icon: Globe,
      title: "Мультиязычность",
      description: "Поддержка видео на любом языке",
    },
    {
      icon: Shield,
      title: "Безопасность",
      description: "Ваши данные защищены современным шифрованием",
    },
  ]

  return (
    <section className="py-20 px-4 bg-secondary/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-balance">Все необходимое для обучения</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Мощная платформа с инновационными функциями для эффективного образования
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <Card key={i} className="border-2 hover:border-primary/50 hover:shadow-xl transition-all duration-300">
              <CardContent className="pt-8 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
