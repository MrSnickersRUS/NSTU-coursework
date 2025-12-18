# NETI WASH - Laundry Booking System

Система бронирования стиральных машин для общежитий НГТУ.

## Технологии

- **Backend**: Go (Gin framework)
- **Database**: PostgreSQL
- **Frontend**: HTML/CSS/JavaScript (Vanilla), TailwindCSS
- **Containerization**: Docker, docker-compose

## Функционал

- ✅ Регистрация и авторизация (JWT)
- ✅ Email верификация и восстановление пароля
- ✅ Бронирование стиральных машин
- ✅ Админ-панель (управление бронями и машинами)
- ✅ PWA поддержка (установка на главный экран)
- ✅ Защита от повторного входа через кнопку "Назад"

## Быстрый старт

### Вариант 1: Docker (рекомендуется)

```bash
# 1. Клонировать репозиторий
git clone <repo-url>
cd coursework

# 2. Создать .env файл
cp .env.example .env
# Отредактируй .env при необходимости

# 3. Запустить все сервисы
docker-compose up -d

# Приложение доступно:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080
# Adminer (DB UI): http://localhost:8081
```

### Вариант 2: Ручной запуск

**Требования:**
- Go 1.21+
- PostgreSQL 15+

```bash
# 1. Настроить PostgreSQL
# Создай базу netiwash

# 2. Создать .env
cp .env.example .env
# Укажи DATABASE_URL

# 3. Запустить backend
cd backend
go run cmd/server/main.go

# 4. В другом терминале - frontend
go run cmd/frontend_server/main.go

# Frontend: http://localhost:3000
# Backend: http://localhost:8080
```

## Структура проекта

```
coursework/
├── backend/
│   ├── cmd/
│   │   ├── server/           # Backend API сервер
│   │   └── frontend_server/  # Static frontend сервер
│   ├── internal/
│   │   ├── handlers/         # HTTP handlers
│   │   ├── service/          # Business logic
│   │   ├── repository/       # Database layer
│   │   ├── models/           # Data models
│   │   └── middleware/       # Auth, CORS, etc.
│   ├── migrations/           # SQL migrations
│   └── Dockerfile
├── frontend/
│   ├── index.html            # Login page
│   ├── register.html         # Registration
│   ├── main.html             # Dashboard
│   ├── bookings.html         # User bookings
│   ├── profile.html          # User profile
│   ├── admin-*.html          # Admin pages
│   ├── js/                   # JavaScript
│   ├── css/                  # Styles
│   └── icons/                # PWA icons
├── docker-compose.yml
└── .env.example
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/verify-email?token=` - Верификация email
- `POST /api/forgot-password` - Запрос сброса пароля
- `POST /api/reset-password` - Сброс пароля

### Machines
- `GET /api/machines` - Список машин

### Bookings (требуют авторизации)
- `GET /api/bookings` - Список своих броней
- `POST /api/bookings` - Создать бронь
- `DELETE /api/bookings/:id` - Отменить бронь

### Admin (требуют роль admin)
- `PUT /api/machines/:id` - Изменить статус машины
- `PATCH /api/bookings/:id/complete` - Досрочно завершить бронь

## Тестовые данные

После первого запуска в БД будут созданы:

**Машины:**
- Машинка #1 (свободна)
- Машинка #2 (свободна)
- Машинка #3 (занята)
- Сушилка #1 (свободна)

**Создай своего пользователя через регистрацию!**

## Безопасность

- ✅ JWT токены для авторизации
- ✅ bcrypt хеширование паролей
- ✅ RBAC (Role-Based Access Control)
- ✅ SQL injection защита (pgx placeholders)
- ✅ CORS настроен
- ✅ Email верификация обязательна

## Разработка

```bash
# Автоматический перезапуск при изменениях (опционально)
go install github.com/cosmtrek/air@latest
air

# Миграции (если нужно)
go run cmd/apply_migration/main.go
```

## Troubleshooting

**Проблема**: "Cannot connect to database"
- Проверь что PostgreSQL запущен
- Проверь DATABASE_URL в .env

**Проблема**: "404 на /api/*"
- Frontend сервер должен проксировать /api на backend
- Убедись что оба сервера запущены

**Проблема**: "Token invalid"
- Очисти localStorage/sessionStorage в браузере
- Перезалогинься

## Автор

Курсовая работа НГТУ

## Лицензия

MIT
