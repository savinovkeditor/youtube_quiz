"use client";

import { AuthForm } from "@/components/auth/auth-form";

export default function AuthPage() {
  const handleAuthSuccess = () => {
    // Небольшая задержка для сохранения сессии, затем полная перезагрузка страницы
    setTimeout(() => {
      window.location.href = "/";
    }, 100);
  };

  return (
    <main className="min-h-screen py-20 px-4 bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Добро пожаловать</h1>
          <p className="text-muted-foreground">
            Войдите или зарегистрируйтесь для доступа к викторинам
          </p>
        </div>

        <AuthForm onSuccess={handleAuthSuccess} />
      </div>
    </main>
  );
}
