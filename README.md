# CDN — Fitz Digital

Central de mídia com login por senha única, biblioteca de audiobooks, upload de
áudios e player moderno (visualização de frequências, controle de velocidade
detalhado, público/privado e link de compartilhamento).

Stack: **Next.js (App Router) + Prisma + PostgreSQL**.

---

## 1. Rodar localmente

Pré-requisitos: Node.js 20+ e um PostgreSQL acessível.

```bash
npm install
cp .env.example .env      # edite os valores
npx prisma migrate dev --name init
npm run dev
```

Acesse http://localhost:3000 → cai na tela de login.
Senha padrão: `cdn@2030` (definida em `APP_PASSWORD`).

---

## 2. Variáveis de ambiente (.env)

| Variável       | Para que serve                                              |
| -------------- | ----------------------------------------------------------- |
| `DATABASE_URL` | String de conexão do PostgreSQL (pegue no EasyPanel).       |
| `APP_PASSWORD` | A senha única de acesso. Troque quando quiser.              |
| `AUTH_SECRET`  | Chave aleatória p/ assinar a sessão. Gere com `openssl rand -base64 32`. |
| `AUDIO_DIR`    | Pasta persistente dos áudios (no EasyPanel, um volume).     |

---

## 3. Deploy no EasyPanel

1. **Crie um serviço PostgreSQL** no seu projeto. Anote a string de conexão.
2. **Crie um serviço de App** apontando para este repositório (build via Dockerfile incluído).
3. Em **Ambiente**, defina as variáveis da tabela acima.
   - `DATABASE_URL` → use o **host interno** do banco (nome do serviço), ex.: `postgresql://postgres:SENHA@meu-db:5432/cdn`
4. Em **Recursos / Volumes**, monte um volume persistente em `/app/uploads`
   e defina `AUDIO_DIR=/app/uploads` (senão os áudios somem a cada deploy).
5. Deploy. As migrações do banco rodam sozinhas na subida (ver Dockerfile).

> Importante: o WordPress antigo NÃO é usado aqui. Este é um app novo e independente.

---

## 4. Onde mexer depois

- **Cores da marca:** `src/lib/theme.ts` — único lugar. Troque os hex e o site todo muda.
- **Logo:** `src/components/Logo.tsx` — substitua pelo logo oficial (SVG/PNG).
- **Senha:** variável `APP_PASSWORD` (não precisa mexer no código).
- **Nova categoria além de Audiobooks:** duplique a pasta `src/app/audiobooks`.

---

## 5. Como funciona o player

`src/components/AudioPlayer.tsx` usa a Web Audio API:
- `AnalyserNode` lê o espectro em tempo real → desenhado num `<canvas>` (as barras de frequência).
- Velocidade de 0.25x a 3x via `playbackRate`.
- Botões: play/pause, ±10s, volume com mute, barra de progresso com tempos.

O toggle público/privado e o link de compartilhamento ficam em
`src/app/audiobooks/[id]/AudioDetailClient.tsx`. Links públicos abrem em
`/share/[id]` sem exigir login (mas só tocam se o áudio estiver marcado como público).
