"use client";

import { useRouter } from "next/navigation";
import { UserProfile } from "@/components/auth/user-profile";
import { AuthNav } from "@/components/auth/auth-nav";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();

  const handleSignOut = () => {
    router.push("/");
  };

  return (
    <main className="min-h-screen py-20 px-4 bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto max-w-md">
        <div className="flex justify-end mb-8">
          <AuthNav />
        </div>

        <div className="text-center mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Вернуться на главную
            </Button>
          </Link>

          <h1 className="text-3xl font-bold mb-2">Профиль</h1>
          <p className="text-muted-foreground">
            Управление вашим аккаунтом
          </p>
        </div>

        <UserProfile onSignOut={handleSignOut} />
      </div>
    </main>
  );
}
