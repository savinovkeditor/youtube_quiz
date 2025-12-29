"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, User } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface UserProfileProps {
  onSignOut?: () => void;
}

export function UserProfile({ onSignOut }: UserProfileProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
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
    onSignOut?.();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="w-4 h-4 border border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
        Загрузка...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Профиль пользователя
        </CardTitle>
        <CardDescription>Информация о вашем аккаунте</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Email</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">ID пользователя</p>
          <p className="text-xs text-muted-foreground font-mono">{user.id}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Дата регистрации</p>
          <p className="text-sm text-muted-foreground">
            {new Date(user.created_at).toLocaleDateString('ru-RU')}
          </p>
        </div>

        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Выйти
        </Button>
      </CardContent>
    </Card>
  );
}
