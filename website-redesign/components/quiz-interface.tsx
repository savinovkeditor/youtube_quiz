"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Link2, Sparkles, Loader2 } from "lucide-react"

export function QuizInterface() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Backend logic here
    setTimeout(() => setIsLoading(false), 2000)
  }

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12 space-y-4">
          <Badge variant="outline" className="text-sm px-4 py-1">
            Шаг 1
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-balance">Вставьте ссылку на видео</h2>
          <p className="text-xl text-muted-foreground text-pretty">
            Мы автоматически создадим викторину на основе содержания видео
          </p>
        </div>

        <Card className="shadow-2xl border-2 overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-secondary/50 to-background border-b">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Link2 className="w-6 h-6 text-primary" />
              Создать новую викторину
            </CardTitle>
            <CardDescription className="text-base">Поддерживаются все публичные видео YouTube</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="youtube-url" className="text-base font-medium">
                  YouTube URL
                </Label>
                <div className="flex gap-3">
                  <Input
                    id="youtube-url"
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="h-14 text-lg rounded-xl"
                    required
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="px-8 h-14 rounded-xl whitespace-nowrap"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Создание...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Создать
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Example URLs */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Примеры:</p>
                <div className="flex flex-wrap gap-2">
                  {["Образовательное видео", "Лекция", "Туториал", "Документальный фильм"].map((example) => (
                    <Button
                      key={example}
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => setUrl(`https://youtube.com/example-${example.toLowerCase()}`)}
                    >
                      {example}
                    </Button>
                  ))}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {[
            {
              icon: "🎯",
              title: "Умная генерация",
              description: "AI анализирует видео и создает релевантные вопросы",
            },
            {
              icon: "⚡",
              title: "Мгновенно",
              description: "Получите готовую викторину за несколько секунд",
            },
            {
              icon: "🎨",
              title: "Кастомизация",
              description: "Настройте сложность и количество вопросов",
            },
          ].map((feature, i) => (
            <Card key={i} className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
