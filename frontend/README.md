# Frontend do Akinator

Em `npm run dev`, a tela aceita uma conta de demonstração local:

- E-mail: `admin@akinator.com`
- Senha: `Admin123!`

Após entrar, o painel oferece links para as páginas de animais e perguntas. Essa conta serve apenas para demonstração no servidor local de desenvolvimento; a autenticação de produção continua dependendo da API.

## Executar o frontend

1. Instale Node.js (versão LTS).
2. Abra um terminal nesta pasta `frontend`.
3. Execute `npm install`.
4. Execute `npm run dev` nesta pasta (`frontend`).
5. Abra no navegador o endereço local que o Vite mostrar (normalmente `http://localhost:5173`).

## Executar a API do jogo

Em outro terminal, entre em `api/akinator-api` e execute:

```powershell
python -m pip install fastapi uvicorn pandas
python -m uvicorn main:app --reload --port 8000
```

A API carrega o dataset UCI Zoo ao iniciar, então precisa de acesso à internet. O jogo usa `VITE_GAME_API_URL` e as telas CRUD usam `VITE_ADMIN_API_URL`; ambos usam `http://localhost:8000` por padrão. `VITE_API_URL` permanece separado para o login e serviços administrativos legados. Para alterar as origens, defina essas variáveis no arquivo `frontend/.env` e reinicie o Vite.

O fluxo de jogo integra `POST /api/start`, `POST /api/answer`, `POST /api/guess-feedback` e `POST /api/learn`. As telas CRUD usam `/api/admin/animais` e `/api/admin/caracteristicas`. Os dados ficam em memória e são perdidos quando a API reinicia.

As rotas CRUD administrativas ainda não exigem autenticação no backend. Mantenha a API acessível apenas localmente; antes de expô-la em rede ou produção, implemente autenticação e autorização para essas rotas.

O comando `npm run dev` falha se executado na raiz do repositório, porque o `package.json` está dentro de `frontend`. Execute-o a partir dessa pasta.

Para testar uma autenticação real, o backend precisa oferecer `POST /api/admin/login`, aceitar JSON `{ "email": "...", "senha": "..." }` e responder com HTTP 2xx ao autenticar. A origem da API também é configurada por `VITE_API_URL`.

Se a API não estiver rodando, enviar o formulário mostra uma mensagem de falha de conexão. Credenciais válidas e criação de sessão dependem do backend; não há login simulado nem senha fixa no React.
