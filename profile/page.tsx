"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase, Profile, Tournament, isDemo, demoTournaments } from "@/lib/supabase"
import { User } from "@supabase/supabase-js"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    if (isDemo) {
      // Create a demo user
      const demoUser = {
        id: 'demo-user-id',
        email: 'demo@example.com'
      } as User
      
      setUser(demoUser)
      await loadTournaments()
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth')
      return
    }

    setUser(user)
    await loadProfile(user.id)
    await loadTournaments()
    setLoading(false)
  }

  const loadProfile = async (userId: string) => {
    if (isDemo) return

    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (data) {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const loadTournaments = async () => {
    if (isDemo) {
      // Filter demo tournaments to show only future ones
      const futureTournaments = demoTournaments.filter(t => 
        new Date(t.registration_deadline) > new Date()
      )
      setTournaments(futureTournaments)
      return
    }

    try {
      const { data } = await supabase
        .from('tournaments')
        .select('*')
        .eq('is_active', true)
        .gte('registration_deadline', new Date().toISOString())
        .order('date', { ascending: true })

      setTournaments(data || [])
    } catch (error) {
      console.error('Error loading tournaments:', error)
      setTournaments([])
    }
  }

  const saveProfile = async () => {
    if (!user) return

    if (isDemo) {
      // Simulate saving in demo mode
      setSaving(true)
      setTimeout(() => {
        setSaving(false)
        alert('Профиль сохранен! (демо-режим)')
      }, 1000)
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profile,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      alert('Профиль сохранен!')
    } catch (error) {
      console.error('Ошибка сохранения:', error)
      alert('Ошибка сохранения профиля')
    } finally {
      setSaving(false)
    }
  }

  const registerForTournament = async (tournamentId: string) => {
    if (!user) return

    try {
      if (isDemo) {
        alert('Регистрация успешна! (демо-режим)')
        return
      }

      const { error } = await supabase
        .from('tournament_registrations')
        .insert({
          user_id: user.id,
          tournament_id: tournamentId
        })

      if (error) throw error

      // Отправляем вебхук в n8n
      await fetch('/api/webhooks/tournament-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user.id,
          full_name: `${profile.last_name} ${profile.first_name} ${profile.middle_name}`,
          school: profile.school,
          class: profile.class_number,
          tournament_id: tournamentId,
          registration_date: new Date().toISOString()
        })
      })

      alert('Вы успешно зарегистрированы на турнир!')
      
    } catch (error) {
      console.error('Ошибка регистрации:', error)
      alert('Ошибка регистрации на турнир')
    }
  }

  const isProfileComplete = () => {
    return profile.last_name && profile.first_name && profile.middle_name &&
           profile.birth_date && profile.city && profile.school &&
           profile.class_number && profile.parent_name && profile.teacher_name
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Загрузка...</div>
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {isDemo && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Демо-режим: Supabase не настроен. Данные не сохраняются.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Form - rest remains the same */}
        <Card>
          <CardHeader>
            <CardTitle>Личные данные</CardTitle>
            <CardDescription>
              Заполните обязательные поля для участия в турнирах
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="last_name">Фамилия *</Label>
                <Input
                  id="last_name"
                  value={profile.last_name || ''}
                  onChange={(e) => setProfile({...profile, last_name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="first_name">Имя *</Label>
                <Input
                  id="first_name"
                  value={profile.first_name || ''}
                  onChange={(e) => setProfile({...profile, first_name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="middle_name">Отчество *</Label>
                <Input
                  id="middle_name"
                  value={profile.middle_name || ''}
                  onChange={(e) => setProfile({...profile, middle_name: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="birth_date">Дата рождения *</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={profile.birth_date || ''}
                  onChange={(e) => setProfile({...profile, birth_date: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="city">Город *</Label>
                <Input
                  id="city"
                  value={profile.city || ''}
                  onChange={(e) => setProfile({...profile, city: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="school">Школа *</Label>
                <Input
                  id="school"
                  value={profile.school || ''}
                  onChange={(e) => setProfile({...profile, school: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="class_number">Класс *</Label>
                <Select
                  value={profile.class_number?.toString() || ''}
                  onValueChange={(value) => setProfile({...profile, class_number: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите класс" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(11)].map((_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1} класс
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="parent_name">ФИО родителя *</Label>
              <Input
                id="parent_name"
                value={profile.parent_name || ''}
                onChange={(e) => setProfile({...profile, parent_name: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="teacher_name">ФИО учителя математики *</Label>
              <Input
                id="teacher_name"
                value={profile.teacher_name || ''}
                onChange={(e) => setProfile({...profile, teacher_name: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="tutor_name">Педагог кружка / репетитор</Label>
              <Input
                id="tutor_name"
                value={profile.tutor_name || ''}
                onChange={(e) => setProfile({...profile, tutor_name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({...profile, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email || ''}
                  onChange={(e) => setProfile({...profile, email: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="telegram_username">Telegram (@username)</Label>
              <Input
                id="telegram_username"
                value={profile.telegram_username || ''}
                onChange={(e) => setProfile({...profile, telegram_username: e.target.value})}
                placeholder="@username"
              />
            </div>

            <Button onClick={saveProfile} disabled={saving} className="w-full">
              {saving ? 'Сохранение...' : 'Сохранить профиль'}
            </Button>
          </CardContent>
        </Card>

        {/* Tournaments - rest remains the same */}
        <Card>
          <CardHeader>
            <CardTitle>Доступные турниры</CardTitle>
            <CardDescription>
              {isProfileComplete() 
                ? 'Выберите турниры для участия'
                : 'Заполните обязательные поля профиля для регистрации'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tournaments.length === 0 ? (
              <p className="text-muted-foreground">Нет доступных турниров</p>
            ) : (
              <div className="space-y-4">
                {tournaments.map((tournament) => (
                  <div key={tournament.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{tournament.name}</h3>
                      <Badge variant={tournament.format === 'online' ? 'default' : 'secondary'}>
                        {tournament.format === 'online' ? 'Онлайн' : 
                         tournament.format === 'offline' ? 'Очно' : 'Гибрид'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground space-x-4 mb-3">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(tournament.date).toLocaleDateString('ru-RU')}
                      </div>
                      {tournament.max_participants && (
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          до {tournament.max_participants}
                        </div>
                      )}
                    </div>

                    {tournament.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {tournament.description}
                      </p>
                    )}

                    <Button
                      onClick={() => registerForTournament(tournament.id)}
                      disabled={!isProfileComplete()}
                      size="sm"
                      className="w-full"
                    >
                      Зарегистрироваться
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
