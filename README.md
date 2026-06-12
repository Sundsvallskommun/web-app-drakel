# web-app-drakel

Handläggarapplikation byggd på **caremanagement** , med draken-likt utseende. Bantad fork av `web-app-starter`: ingen casedata/supportmanagement, ingen Prisma, ingen admin — bara backend (BFF) + frontend.

Arkitektur, konventioner och kontraktsflöde dokumenteras i [AGENTS.md](./AGENTS.md). Läs den först.

## APIer

- **caremanagement** anropas **direkt** på en egen host (`CAREMANAGEMENT_BASE_URL`), inte via WSO2-gatewayen, och kräver i dev ingen auth.
- Eventuella **andra APIer** går den vanliga vägen via gatewayen (`API_BASE_URL` + OAuth2 client-credentials) och listas i [`backend/src/config/api-config.ts`](./backend/src/config/api-config.ts). Applikationsanvändaren i WSO2 måste prenumerera på dem.

## Utveckling

### Krav

- Node >= 20 LTS
- Yarn

### 1. Installera dependencies

```
cd backend && yarn install
cd ../frontend && yarn install
```

### 2. Env-filer

**Frontend:**

```
cd frontend
cp .env-example .env
```

**Backend:**

```
cd backend
cp .env.example.local .env.development.local
```

Fyll i `.env.development.local`. Viktiga nycklar:

| Nyckel | Beskrivning |
|---|---|
| `CLIENT_KEY` / `CLIENT_SECRET` | WSO2-applikation som abonnerar på de gateway-APIer som anropas |
| `SAML_ENTRY_SSO` | URL till SAML IDP |
| `SAML_IDP_PUBLIC_CERT` | Ska matcha IDP:ns cert |
| `SAML_PRIVATE_KEY` / `SAML_PUBLIC_KEY` | Behövs korrekt endast mot en riktig IDP |
| `AUTHORIZED_GROUPS` | Kommaseparerade AD-grupper som får använda appen |
| `ADMIN_GROUP` | AD-grupp för admin |
| `MUNICIPALITY_ID` | Kommunkod (`2281`). **Backend-only** — frontend är tenant-agnostisk |
| `CAREMANAGEMENT_BASE_URL` | caremanagement-host |
| `CAREMANAGEMENT_NAMESPACE` | t.ex. `FINANCIAL_ASSISTANCE`. **Backend-only** |
| `CAREMANAGEMENT_TYPE_SLUG` | Valfri, default `financial-assistance` (binder ärendet till sin typ-modul) |

`MUNICIPALITY_ID` + `CAREMANAGEMENT_NAMESPACE` injiceras av backend i caremanagement-URL:erna — frontend känner aldrig till dem.

### 3. Synca datakontrakt

Typning flödar via genererade datakontrakt (se AGENTS.md):

1. **Backend** — i `/backend` kör `yarn generate:contracts` för att hämta OpenAPI och generera `src/data-contracts/<api>/` (modeller; aldrig handredigera).
2. **Frontend** — starta backend (`yarn dev`), kör sedan `yarn generate:contracts` i `/frontend` för att generera `src/data-contracts/backend/` från backendens swagger.

Backendens curerade responses/DTO:er (i `src/responses`, `src/dtos`) är det som frontend genererar typer från.

### 4. Kör

```
cd backend && yarn dev      # http://localhost:3001/api
cd frontend && yarn dev     # http://localhost:3000
```

## Språkstöd (i18n)

Appen kör **App Router** med [`next-i18n-router`](https://github.com/i18nexus/next-i18n-router). Locales konfigureras i [`frontend/src/app/i18nConfig.ts`](./frontend/src/app/i18nConfig.ts) (default `sv`).

Översättningsfiler ligger i `frontend/public/locales/<locale>/<namespace>.json`. Namespaces laddas per route i respektive `layout.tsx` via `initLocalization`. Lägg till ett språk genom att skapa en ny locale-mapp och lägga till språket i `i18nConfig.ts`.

## Deploy

Backend och frontend deployas som **två separata containrar** byggda från respektive `Dockerfile` (ingen docker-compose). Deploy-plattformen måste sätta env-variablerna på containrarna:

- **Backend** kräver (annars startar `validateEnv` inte): `NODE_ENV, PORT, SECRET_KEY, BASE_URL_PREFIX, API_BASE_URL, CLIENT_KEY, CLIENT_SECRET, MUNICIPALITY_ID, CAREMANAGEMENT_BASE_URL, CAREMANAGEMENT_NAMESPACE, AUTHORIZED_GROUPS, ADMIN_GROUP, SAML_*` (+ valfri `CAREMANAGEMENT_TYPE_SLUG`).
- **Frontend** kräver `NEXT_PUBLIC_API_URL` (URL till backend).
