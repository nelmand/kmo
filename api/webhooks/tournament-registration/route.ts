import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Валидация данных
    const requiredFields = ['user_id', 'full_name', 'school', 'class', 'tournament_id', 'registration_date']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // В реальном проекте здесь будет URL вашего n8n webhook
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/tournament-registration'
    
    // Отправляем данные в n8n
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.N8N_WEBHOOK_TOKEN || ''}`
      },
      body: JSON.stringify({
        user_id: body.user_id,
        full_name: body.full_name,
        school: body.school,
        class: body.class,
        tournament_id: body.tournament_id,
        registration_date: body.registration_date,
        timestamp: new Date().toISOString()
      })
    })

    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.statusText}`)
    }

    // Логируем успешную отправку
    console.log('Tournament registration webhook sent successfully:', {
      user_id: body.user_id,
      tournament_id: body.tournament_id,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook sent successfully' 
    })

  } catch (error) {
    console.error('Webhook error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to send webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Документация API endpoint
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/webhooks/tournament-registration',
    method: 'POST',
    description: 'Webhook для отправки данных о регистрации на турнир в n8n',
    required_fields: [
      'user_id',
      'full_name', 
      'school',
      'class',
      'tournament_id',
      'registration_date'
    ],
    example_payload: {
      user_id: 'uuid-string',
      full_name: 'Иванов Иван Иванович',
      school: 'МБОУ СОШ №1',
      class: 10,
      tournament_id: 'uuid-string',
      registration_date: '2024-01-15T10:30:00Z'
    },
    environment_variables: [
      'N8N_WEBHOOK_URL - URL вебхука n8n',
      'N8N_WEBHOOK_TOKEN - Токен авторизации (опционально)'
    ]
  })
}
