# K.ai — Chat com personagens de IA (MVP)

## Problema original
MVP web responsivo (pt-BR) de chat com personagens de IA, inspirado no Emochi.ai, com identidade visual própria. Orçamento: 100 créditos da Emergent.

## Escolhas do usuário
- Banco MongoDB incluído (autorização feita no backend, sem RLS)
- Login com e-mail e senha (JWT em cookies httpOnly + proteção contra força bruta)
- Limites: 50 mensagens/dia e 6/min por usuário
- Gemini com a chave do próprio usuário (GEMINI_API_KEY); modelo configurável em GEMINI_MODEL (atual: gemini-3-flash-preview, porque gemini-2.5-flash não está disponível para contas novas)

## Arquitetura
FastAPI (/app/backend/server.py) + React (pages/, components/, lib/api.js, lib/stream.js) + MongoDB.
Coleções: users, characters, conversations, messages, favorites, reports, login_attempts.

## Implementado (24/10/2026)
- Catálogo com busca, categorias e 5 personagens iniciais
- Perfil do personagem, favoritos e denúncia
- Criar, editar e excluir personagens (só o criador); opção público/privado; avatar por URL
- Chat com respostas reais do Gemini em streaming, até 20 mensagens de histórico enviadas à IA e histórico salvo
- Bloqueio de envio duplicado (409), limites 429, até 1000 caracteres por mensagem, erros amigáveis em pt-BR
- Layout mobile com barra de navegação inferior
- Testes: backend 30/30, fluxos principais do frontend aprovados (iteration_1)

## Iteração 2 (24/10/2026)
- Rebrand K.ai, visual preto/amarelo estilo Emochi (busca + filtro de gênero, abas Seguindo/Explorar/Hoje/Em alta/RPG, mosaico, + amarelo)
- Conteúdo adulto liberado em todos os personagens (entre adultos; menores bloqueados); filtros configuráveis do Gemini em BLOCK_NONE
- Confirmação 18+ no cadastro e modal para contas antigas; chat bloqueado (403) sem confirmação
- Campo gênero e categorias Drama/RPG/BL
- Testes iteration_2: backend 11/11, frontend ok

## Iteração 3 (24/10/2026)
- Chat estilo Emochi: fundo desfocado do personagem, blocos translúcidos, card Intro + Salvar, ações/falas formatadas, botões ouvir (voz do navegador) e salvar parágrafo como PNG
- Personas (CRUD, 18+, chip no chat, troca por conversa, prompt usa nome/características); nova conversa usa a 1ª persona
- Menu 3 pontos: Resetar chat (volta à intro)
- Perfil: avatar, UID copiável, Editar perfil, Chats/Salvos/Seguidores, abas Personagem/Persona
- Testes iteration_3: backend 10/10, frontend ok

## Iteração 4 (24/10/2026)
- Upload de fotos direto do aparelho (Emergent Object Storage) para personagem, persona e perfil; campo de URL removido
- POST /api/upload (auth, imagens até 5 MB, 30/h), GET /api/files/{path} (público, cache)

## Iteração 5 (24/10/2026)
- Fundo do chat por conversa (menu 3 pontos): foto do personagem ou galeria com recorte 9:16 (react-easy-crop)
- Toque no personagem abre direto o chat (/c/:id cria/abre conversa); tela de perfil/denúncia removida
- Comentários por personagem (topo do chat), apagar o próprio, limite 10/h
- Testes iteration_4: backend 6/6, frontend ok

## Iteração 6 (24/10/2026)
- Comentários: responder (1 nível) e curtir (toggle); apagar comentário apaga respostas
- Botão de salvar imagem removido das mensagens
- Cota diária esgotada: campo e botão de envio bloqueados com aviso no chat

## Backlog
- P1: esconder itens protegidos da navegação para visitantes; CORS com origem explícita na publicação
- P2: upload de avatar, painel de moderação das denúncias, login com Google, planos pagos
