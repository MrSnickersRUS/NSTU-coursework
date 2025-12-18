# Этап 1: Сборка
# Берем официальный образ Go с версией 1.23 и разрешаем toolchain auto-upgrade
FROM golang:1.23-alpine AS builder
ENV GOTOOLCHAIN=auto

# Устанавливаем рабочую папку внутри контейнера
WORKDIR /app

# Сначала копируем файлы зависимостей (чтобы кэшировать слои)
# Копируем go.mod и go.sum (если существует - не упадёт благодаря wildcard)
COPY go.mod go.su[m] ./
# Скачиваем зависимости
RUN go mod download

# Теперь копируем исходный код
COPY . .

# Собираем бинарник.
# -o app : выходной файл назовем "app"
RUN go build -o app .

# Этап 2: Запуск
# Берем супер-легкий Linux (Alpine), весит всего 5 МБ
FROM alpine:latest

WORKDIR /root/

# Копируем ТОЛЬКО скомпилированный файл из первого этапа
COPY --from=builder /app/app .

# Если твоему приложению нужны конфиги (.env или config.yaml), раскомментируй:
# COPY --from=builder /app/.env .

# Открываем порт (тот же, что и в твоем Go-коде, например 8080)
EXPOSE 8080

# Команда запуска
CMD ["./app"]