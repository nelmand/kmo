#!/usr/bin/env bash
set -euo pipefail

# === 1. Опрос пользователя ===
read -p "Введите ваш IP или домен: " IP_DOMAIN
read -p "Введите ваш email для SSL: " EMAIL
read -p "Введите имя пользователя для входа: " DASH_USER
read -p "Введите пароль для входа: " DASH_PASS

if [ -z "$IP_DOMAIN" ]; then echo "IP или домен пустой!"; exit 1; fi

# === 4. Клонирование репозитория Supabase self-hosted ===
cd ~
cd supabase-selfhost/docker

# === 8. Выпуск SSL сертификата ===
certbot --nginx -d $IP_DOMAIN --agree-tos -m $EMAIL --redirect --non-interactive

# === 9. Настройка UFW (фаервол) ===
# Запрет всех входящих, разрешить исходящие
ufw default deny incoming
ufw default allow outgoing
# Разрешить SSH, HTTP, HTTPS
ufw allow ssh
ufw allow http
ufw allow https
# Закрыть порты Supabase (54321–54324)
ufw deny proto tcp from any to any port 54321:54324
# Включить UFW без интерактивного подтверждения
ufw --force enable

# === 10. Финальный вывод ===
echo "
 Установка Supabase self-hosted завершена!"
echo "  Dashboard: https://$IP_DOMAIN"
echo "  Username: $DASH_USER"
echo "  Password: $DASH_PASS"
echo "  Postgres password: $POSTGRES_PASS"
echo "  JWT_SECRET: $JWT_SECRET"
echo "  ANON_KEY: $ANON_KEY"
echo "  SERVICE_ROLE_KEY: $SERVICE_KEY"
