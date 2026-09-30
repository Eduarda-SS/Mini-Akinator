# Tela de login do admin

## Ver a tela no navegador

1. Instale Node.js (versão LTS).
2. Abra um terminal nesta pasta `frontend`.
3. Execute `npm install`.
4. Execute `npm run dev`.
5. Abra no navegador o endereço local que o Vite mostrar (normalmente `http://localhost:5173`).

A página e seus estados visuais funcionam sem a API. Para testar uma autenticação real, o backend precisa oferecer `POST /api/admin/login`, aceitar JSON `{ "email": "...", "senha": "..." }` e responder com HTTP 2xx ao autenticar. A origem da API pode ser definida em `.env` usando `VITE_API_URL`; veja `.env.example`.

Se a API não estiver rodando, enviar o formulário mostra uma mensagem de falha de conexão. Credenciais válidas e criação de sessão dependem do backend; não há login simulado nem senha fixa no React.
