# Event Challenge API

API backend da plataforma de eventos e ingressos, desenvolvida como parte de um desafio técnico.

## Tecnologias

- **[Bun](https://bun.sh)** — runtime e package manager
- **[Elysia](https://elysiajs.com)** — framework web
- **[TypeScript](https://www.typescriptlang.org)** — tipagem estática
- **[Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)** — acesso seguro ao Firebase
- **[Cloud Firestore](https://firebase.google.com/docs/firestore)** — banco de dados

## Instalação

```bash
bun install
```

## Desenvolvimento

```bash
bun dev
```

O servidor sobe em `http://localhost:3001` por padrão.

A documentação Swagger fica disponível em `http://localhost:3001/docs`.

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha os valores:

```bash
cp .env.example .env
```

| Variável | Descrição |
|----------|-----------|
| `PORT` | Porta do servidor (padrão: `3000`) |
| `CORS_ORIGIN` | Origem permitida pelo CORS (ex: `http://localhost:3001`) |
| `ORGANIZER_ID` | ID do organizador mockado (enquanto não há autenticação) |
| `FIREBASE_PROJECT_ID` | ID do projeto no Firebase |
| `FIREBASE_CLIENT_EMAIL` | E-mail da conta de serviço |
| `FIREBASE_PRIVATE_KEY` | Chave privada da conta de serviço (com `\n` escapados) |

### Como obter as credenciais do Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com)
2. Vá em **Configurações do projeto > Contas de serviço**
3. Clique em **Gerar nova chave privada**
4. Copie os valores do JSON gerado para as variáveis de ambiente

> **Importante:** A `FIREBASE_PRIVATE_KEY` deve ser colocada como uma única linha com `\n` literal (não quebras de linha reais). O projeto trata isso automaticamente.

## Firebase

A API utiliza o **Firebase Admin SDK** para se comunicar com o **Cloud Firestore**.

Toda a persistência é feita diretamente no Firestore — não há banco de dados local, mocks ou seeds obrigatórios.

### Estrutura do Firestore

```
events/
  {eventId}     → dados do evento

tickets/
  {ticketId}    → dados do ingresso
```

## Deploy no Render

O projeto já está preparado para subir no **Render** com o runtime nativo via **Docker + Bun**.

### Estratégia adotada

Para evitar surpresas com versões de runtime do Render, foi preparado um **Dockerfile multi-stage baseado em `oven/bun:1.3.14-alpine`**. Ele roda os testes na etapa `prerelease` e publica só os artefatos de produção (sem `devDependencies`) na etapa final, rodando como usuário `bun` (menos privilégios).

Além disso, há um `render.yaml` (Blueprint) para criar o serviço via **Infraestrutura como Código**, com todas as variáveis esperadas já declaradas (basta preencher no dashboard).

### Passo a passo

1. **Commit e push** das alterações atuais (incluindo `Dockerfile`, `.dockerignore`, `render.yaml`).

2. **Opção A — Render Blueprint (recomendado):**
   - No dashboard do Render, clique em **YAML** > **Deploy from YAML**
   - Cole o conteúdo de `render.yaml` (ou aponte para o repositório + caminho do arquivo)
   - **Ajuste `repo:`** para a URL real do seu repositório (está com placeholder `your-org`)
   - Preencha as variáveis sensíveis marcadas com `sync: false`

3. **Opção B — Web Service manual:**
   - Clique em **New +** > **Web Service** e selecione o repositório
   - **Runtime:** escolha **Docker** (não Bun nativo)
   - **Branch:** `main` (ou a que preferir)
   - **Root Directory:** `.`
   - **Dockerfile Path:** `./Dockerfile`
   - **Build Command:** (automático pelo Dockerfile)
   - **Start Command:** (automático pelo `ENTRYPOINT`)
   - **Instance Size:** **Starter** ou superior (Firebase Admin SDK gasta um pouco de memória no cold start)

4. **Variáveis de ambiente obrigatórias (Render Dashboard > Environment):**

| Variável | Exemplo / dica |
|---|---|
| `PORT` | `3000` (porta exposta no Dockerfile) |
| `CORS_ORIGIN` | Ex: `https://seu-frontend.onrender.com` ou `*` em testes |
| `ORGANIZER_ID` | ID do organizador padrão (enquanto sem auth) |
| `FIREBASE_PROJECT_ID` | `meu-projeto-123ab` |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk@meu-projeto-123ab.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | **Cole a chave JSON inteira** (com `\n` ou quebras de linha). O código já faz `.replace(/\\n/g, "\n")`. |

5. **Health check:** O Render usará o caminho `/docs/json` (Swagger OpenAPI JSON) que sempre retorna `200`. Alternativamente, pode trocar por `/api/events` se preferir.

6. **Primeiro deploy:** Ao terminar, acesse `https://<seu-servico>.onrender.com/docs` — se abrir o Swagger, deu certo.

### Dicas importantes

- **Cold starts:** Render pausa serviços do plano Starter sem tráfego por 15 min. O primeiro request pode demorar ~5–15s; os demais são rápidos. Para evitar, suba para plano de pagamento ou configure um ping cron (UptimeRobot etc.).
- **Firebase Private Key:** Copie exatamente o valor do JSON baixado. Não precisa escapar quebras de linha manualmente, o setup já trata isso.
- **Bun.lock:** O Dockerfile usa `bun install --frozen-lockfile`. **Sempre** rode `bun install` após mudar dependências para atualizar o `bun.lockb` (ou builds falharão).
- **`render.yaml` Blueprint:** Ele foi criado com runtime `docker`. Se você quiser testar o runtime **Bun nativo** do Render (beta), remova o `runtime: docker` e use `buildCommand: bun install` + `startCommand: bun start`.

---

## Endpoints

### Eventos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/events` | Listar eventos publicados |
| `GET` | `/api/events?search=festival` | Buscar eventos por termo |
| `GET` | `/api/events/:id` | Detalhes de um evento |
| `POST` | `/api/events` | Criar novo evento |
| `PATCH` | `/api/events/:id/publish` | Publicar evento |

### Organizador

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/organizer/events` | Listar eventos do organizador |
| `GET` | `/api/organizer/stats` | Estatísticas do organizador |

### Ingressos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/events/:id/tickets` | Comprar ingresso |
| `GET` | `/api/tickets/:id` | Consultar ingresso |
| `POST` | `/api/tickets/:code/validate` | Validar ingresso (portaria) |

## Exemplos

### Listar eventos

```bash
GET /api/events
GET /api/events?search=festival
```

```json
{
  "data": [
    {
      "id": "abc123",
      "title": "Festival de Música Maranhense",
      "status": "published",
      "ticketPrice": 89.90,
      "availableTickets": 450
    }
  ],
  "total": 1
}
```

---

### Consultar evento

```bash
GET /api/events/abc123
```

```json
{
  "id": "abc123",
  "title": "Festival de Música Maranhense",
  "description": "Uma noite dedicada à música maranhense.",
  "date": "2026-09-20",
  "time": "20:00",
  "venue": "Centro de Convenções",
  "address": "São Luís - MA",
  "capacity": 1000,
  "ticketPrice": 89.90,
  "ticketsSold": 550,
  "availableTickets": 450,
  "status": "published"
}
```

---

### Criar evento

```bash
POST /api/events
Content-Type: application/json

{
  "title": "Festival de Música Maranhense",
  "description": "Uma noite dedicada à música maranhense.",
  "imageUrl": "https://example.com/event.jpg",
  "date": "2026-09-20",
  "time": "20:00",
  "venue": "Centro de Convenções",
  "address": "São Luís - MA",
  "capacity": 1000,
  "ticketPrice": 89.90
}
```

Resposta `201 Created`:
```json
{
  "id": "newEventId",
  "status": "draft",
  ...
}
```

---

### Publicar evento

```bash
PATCH /api/events/abc123/publish
```

---

### Comprar ingresso

```bash
POST /api/events/abc123/tickets
Content-Type: application/json

{
  "buyerName": "João Silva",
  "buyerEmail": "joao@email.com",
  "quantity": 2
}
```

Resposta `201 Created`:
```json
{
  "id": "ticket-123",
  "code": "EVT-8F3K92",
  "eventId": "abc123",
  "buyerName": "João Silva",
  "buyerEmail": "joao@email.com",
  "quantity": 2,
  "totalPrice": 179.80,
  "status": "valid"
}
```

---

### Consultar ingresso

```bash
GET /api/tickets/ticket-123
```

```json
{
  "id": "ticket-123",
  "code": "EVT-8F3K92",
  "buyerName": "João Silva",
  "quantity": 2,
  "totalPrice": 179.80,
  "status": "valid",
  "event": {
    "id": "abc123",
    "title": "Festival de Música Maranhense",
    "date": "2026-09-20",
    "time": "20:00",
    "venue": "Centro de Convenções"
  }
}
```

---

### Validar ingresso (portaria)

```bash
POST /api/tickets/EVT-8F3K92/validate
```

Ingresso válido:
```json
{
  "valid": true,
  "ticket": {
    "id": "ticket-123",
    "code": "EVT-8F3K92",
    "buyerName": "João Silva",
    "event": {
      "id": "abc123",
      "title": "Festival de Música Maranhense"
    }
  }
}
```

Ingresso já utilizado:
```json
{
  "valid": false,
  "message": "Ingresso já utilizado."
}
```

---

### Estatísticas do organizador

```bash
GET /api/organizer/stats
```

```json
{
  "totalEvents": 5,
  "publishedEvents": 4,
  "totalTicketsSold": 320,
  "totalRevenue": 28500,
  "upcomingEvents": 2
}
```

## Códigos de erro

| HTTP | Código | Descrição |
|------|--------|-----------|
| 400 | `EVENT_NOT_PUBLISHED` | Evento não está publicado |
| 404 | `EVENT_NOT_FOUND` | Evento não encontrado |
| 404 | `TICKET_NOT_FOUND` | Ingresso não encontrado |
| 409 | `INSUFFICIENT_CAPACITY` | Ingressos insuficientes |
| 500 | `INTERNAL_ERROR` | Erro interno do servidor |

## Estrutura do projeto

```
src/
├── config/
│   └── firebase.ts           # Inicialização Firebase Admin
├── modules/
│   ├── events/
│   │   ├── event.types.ts
│   │   ├── event.schema.ts
│   │   ├── event.repository.ts
│   │   ├── event.service.ts
│   │   └── event.routes.ts
│   ├── tickets/
│   │   ├── ticket.types.ts
│   │   ├── ticket.schema.ts
│   │   ├── ticket.repository.ts
│   │   ├── ticket.service.ts
│   │   └── ticket.routes.ts
│   └── organizer/
│       └── organizer.routes.ts
├── shared/
│   └── errors.ts
├── app.ts
└── index.ts
```
