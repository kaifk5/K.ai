# Constrói o site (React) e o backend (FastAPI) numa única imagem.
FROM node:20-alpine AS web
WORKDIR /web
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install
COPY frontend/ ./
ENV REACT_APP_BACKEND_URL=""
ENV CI=false
RUN yarn build

FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY backend/ backend/
COPY --from=web /web/build frontend/build
WORKDIR /app/backend
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-8001}"]
