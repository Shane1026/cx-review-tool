.PHONY: up down logs build install dev test

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

build:
	docker compose build

install:
	pip install -r backend/requirements.txt
	cd frontend && npm install

dev:
	cd backend && uvicorn main:app --reload --port 8000 &
	cd frontend && npm run dev

test:
	python -m pytest tests/test_api.py -v
