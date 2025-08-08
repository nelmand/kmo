import { TournamentCard } from "@/components/tournament-card"
import { MathBackground } from "@/components/math-background"
import { Button } from "@/components/ui/button"
import { supabase, isDemo, demoTournaments } from "@/lib/supabase"
import Link from "next/link"
import { Trophy, Users, Calendar, Award } from 'lucide-react'

async function getRecentTournaments() {
  // If in demo mode, return demo data
  if (isDemo) {
    return demoTournaments
  }

  try {
    const { data: tournaments } = await supabase
      .from('tournaments')
      .select(`
        *,
        tournament_results (
          place,
          score,
          profiles (
            first_name,
            last_name
          )
        )
      `)
      .eq('is_active', true)
      .order('date', { ascending: false })
      .limit(3)

    return tournaments || []
  } catch (error) {
    console.error('Error fetching tournaments:', error)
    // Fallback to demo data if there's an error
    return demoTournaments
  }
}

export default async function HomePage() {
  const tournaments = await getRecentTournaments()

  return (
    <div className="relative min-h-screen">
      <MathBackground />
      
      {/* Demo Notice */}
      {isDemo && (
        <div className="relative z-10 bg-yellow-100 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <div className="container mx-auto px-4 py-2">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
              🚧 Демо-режим: Supabase не настроен. Отображаются тестовые данные.
            </p>
          </div>
        </div>
      )}
      
      {/* Hero Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Казанские Математические Олимпиады
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Присоединяйтесь к Казанскому математическому центру. Участвуйте в олимпиадах, 
            развивайте навыки решения задач и достигайте новых высот в математике.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="w-full sm:w-auto">
                Начать участие
              </Button>
            </Link>
            <Link href="/tournaments">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Посмотреть турниры
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">50+</h3>
              <p className="text-muted-foreground">Проведено турниров</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">1000+</h3>
              <p className="text-muted-foreground">Участников</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">12</h3>
              <p className="text-muted-foreground">Турниров в год</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">95%</h3>
              <p className="text-muted-foreground">Довольных участников</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Tournaments */}
      <section className="relative z-10 py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Последние турниры</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => {
              const topParticipants = tournament.tournament_results
                ?.sort((a, b) => a.place - b.place)
                .slice(0, 3)
                .map(result => ({
                  name: `${result.profiles?.first_name} ${result.profiles?.last_name}`,
                  place: result.place,
                  score: result.score
                })) || []

              return (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  topParticipants={topParticipants}
                />
              )
            })}
          </div>
          
          {tournaments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Пока нет завершенных турниров</p>
            </div>
          )}
          
          <div className="text-center mt-8">
            <Link href="/results">
              <Button variant="outline">Посмотреть все результаты</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
