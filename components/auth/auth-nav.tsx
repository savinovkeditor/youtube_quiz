"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import Link from "next/link";

export function AuthNav() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // Перезагружаем страницу для корректного обновления состояния
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {user ? (
        <>
          <span className="text-sm text-muted-foreground">
            {user.email}
          </span>
          <Link href="/profile">
            <Button variant="outline" size="sm">
              <User className="w-4 h-4 mr-2" />
              Профиль
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </Button>
        </>
      ) : (
        <Link href="/auth">
          <Button size="sm">
            Войти
          </Button>
        </Link>
      )}
    </div>
  );
}
