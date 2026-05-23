.PHONY: up down db-migrate db-seed db-reset db-shell logs

up:
	docker compose up --build -d

down:
	docker compose down

db-migrate:
	docker compose exec api npx prisma migrate deploy

db-seed:
	docker compose exec api npx tsx prisma/seed.ts

db-reset:
	docker compose exec api npx prisma migrate reset --force

db-shell:
	docker compose exec postgres psql -U postgres analytics

logs:
	docker compose logs -f
