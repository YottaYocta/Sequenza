# Sequenza

# Deploying

Create a file .env.prod with the contents matching that of `.env.prod` and run

```
docker compose -f compose.prod.yaml --env-file .env.prod up -d
```

# Running Locally

1. Clone the repository and run `docker-compose up -t compose.dev.yaml`. This starts a local instance of MongoDB.
2. Create a file called `.env` in the root of the project and copy the contents of `.example.env.dev`
3. Run `pnpm i && pnpm run dev`
