# K.ai — chat com personagens de IA

FastAPI + MongoDB (backend) e React (frontend). Já não depende do Emergent.
Em produção, o backend entrega o site e a API no mesmo endereço (sem problemas de CORS ou cookies).

## Configuração
O arquivo `backend/.env` já vem preenchido com a sua chave do Gemini e os limites (50 mensagens/dia, 6/min).
**Não compartilhe nem publique esse arquivo.** O único ajuste que pode faltar é o `MONGO_URL`
(endereço do banco MongoDB): por padrão aponta para um MongoDB na própria máquina (`mongodb://localhost:27017`).
Se o lugar onde você rodar não tiver MongoDB, crie um grátis no MongoDB Atlas e cole a string de conexão em `MONGO_URL`.

## Jeito mais fácil (precisa do Docker)
`docker compose up --build` e abra http://localhost:8001 — sobe o banco, a API e o site juntos.

## Rodar no computador
```
# backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # preencha
uvicorn server:app --reload --port 8001

# frontend (outro terminal)
cd frontend
cp .env.example .env
yarn install && yarn start
```

## Colocar no ar (Railway, Render, Fly etc.)
1. Crie um banco grátis no MongoDB Atlas e copie a string de conexão (`MONGO_URL`).
2. Suba esta pasta para um repositório no GitHub (o `.gitignore` já protege o `.env`).
3. No Railway: New Project → Deploy from GitHub → escolha o repositório. Ele usa o `Dockerfile` da raiz.
4. Em Variables, cadastre as variáveis do `backend/.env.example`. Em `CORS_ORIGINS` coloque o endereço público do site.
5. Em Settings → Networking, gere o domínio. Depois ligue o seu domínio próprio.

## O que mudou em relação à versão do Emergent
- `backend/gemini.py`: chamada direta ao Gemini com streaming (substitui `emergentintegrations`).
- Fotos enviadas pelos usuários agora ficam no próprio MongoDB (coleção `file_blobs`, até 5 MB cada).
  O plano grátis do Atlas tem 512 MB; se crescer muito, migre para Cloudflare R2 ou Cloudinary.
- Removidos scripts e pacotes do Emergent do frontend.
- Se o site e a API ficarem em domínios diferentes, defina `COOKIE_SAMESITE="none"` no backend.

## Ainda não existe (próximos passos)
Planos pagos, pagamento por Pix, anúncios e painel administrativo.
