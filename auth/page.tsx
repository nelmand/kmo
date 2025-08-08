"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function AuthPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleYandexAuth = async () => {
    setLoading(true)
    try {
      // В реальном проекте здесь будет настроена интеграция с Yandex ID
      // Для демонстрации используем email авторизацию
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google', // В реальности здесь будет yandex
        options: {
          redirectTo: `${window.location.origin}/profile`
        }
      })
      
      if (error) {
        console.error('Ошибка авторизации:', error)
        alert('Ошибка авторизации. Попробуйте позже.')
      }
    } catch (error) {
      console.error('Ошибка:', error)
      alert('Произошла ошибка. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }

  // Временная функция для демонстрации (создает тестового пользователя)
  const handleDemoAuth = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'demo@example.com',
        password: 'demo123456'
      })
      
      if (error) {
        // Если пользователя нет, создаем его
        const { error: signUpError } = await supabase.auth.signUp({
          email: 'demo@example.com',
          password: 'demo123456'
        })
        
        if (!signUpError) {
          router.push('/profile')
        }
      } else {
        router.push('/profile')
      }
    } catch (error) {
      console.error('Ошибка:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Вход в КМО</CardTitle>
          <CardDescription>
            Войдите через Яндекс.ID для участия в Казанских Математических Олимпиадах
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleYandexAuth}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Загрузка...' : 'Войти через Яндекс.ID'}
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Или для демонстрации
              </span>
            </div>
          </div>
          
          <Button 
            onClick={handleDemoAuth}
            disabled={loading}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Демо-вход
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            Нажимая кнопку входа, вы соглашаетесь с условиями использования 
            и политикой конфиденциальности
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
