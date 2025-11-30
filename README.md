# Sequenza

# Running with Docker

```
docker compose -f compose.prod.yaml --env-file .env.prod up -d
```

see `.example.env.prod` for example variables needed

# Contributing

Adding a new adjustment or FX:

1. define behavior
2. create factory function and register globally
3. add to app switch

Adding new field type:

1. define input field
2. define how its form should be rendered in `ValueInput.svelte`
