# Sequenza

# Running with Docker

## Environment Variables

| Variable    | Description                        | Example                                                                |
| ----------- | ---------------------------------- | ---------------------------------------------------------------------- |
| MONGODB_URI | MongoDB connection string          | `mongodb://admin:<adminPassword>@host:27017/<dbName>?authSource=admin` |
| ORIGIN      | Allowed origin for SvelteKit forms | `http://localhost:3000`, `https://my-domain.com`, etc.                 |
| PORT        | Port to run application on         | 3000                                                                   |

```
docker run -p 3000:3000 -e MONGODB_URI="<mongodb url here>" -e ORIGIN="<origin here>" -e PORT=3000 sequenza
```

# Contributing

Adding a new adjustment or FX:

1. define behavior
2. create factory function and register globally
3. add to app switch

Adding new field type:

1. define input field
2. define how its form should be rendered in `ValueInput.svelte`
