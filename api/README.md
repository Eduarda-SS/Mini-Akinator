--- Akinator de Animais API

API RESTful desenvolvida em **Python** e **FastAPI** para um jogo interativo de adivinhação de animais no estilo *Akinator*, criada como projeto acadêmico.

O sistema utiliza dados reais do dataset **UCI Zoo Animal Classification** e implementa um algoritmo de filtro e eliminação baseado nas características físicas e biológicas de 101 animais.

---

## 🚀 Tecnologias Utilizadas

- **[Python 3.10+](https://www.python.org/)** — Linguagem principal
- **[FastAPI](https://fastapi.tiangolo.com/)** — Framework web moderno e de alta performance
- **[Uvicorn](https://www.uvicorn.org/)** — Servidor ASGI
- **[Pandas](https://pandas.pydata.org/)** — Carregamento e processamento do dataset
- **[Pydantic](https://docs.pydantic.dev/)** — Validação de schemas e dados de entrada/saída

---

## 🛠️ Como Funciona o Algoritmo

1. **Início da Partida (`/api/start`):** A API inicia uma nova sessão com uma lista contendo todos os 101 animais do dataset UCI Zoo e envia a primeira pergunta.
2. **Ciclo de Pergunta e Resposta (`/api/answer`):** A cada resposta ("yes" ou "no"), o algoritmo filtra a lista de candidatos mantendo apenas os animais compatíveis com a característica informada.
3. **Fase de Palpite (`status: "guessing"`):** Quando resta apenas 1 candidato (ou quando as perguntas se esgotam), a API envia um palpite e aguarda a validação do usuário.
4. **Confirmação (`/api/guess-response`):**
   - **Acertou (`correct: true`):** A partida é finalizada com vitória.
   - **Errou (`correct: false`):** O animal chutado é removido da lista de candidatos e o jogo continua fazendo as perguntas restantes.

---

## 📌 Endpoints da API

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/` | Retorna o status da API e o total de animais carregados |
| `POST` | `/api/start` | Cria uma nova sessão de jogo e retorna a 1ª pergunta |
| `POST` | `/api/answer` | Envia a resposta da pergunta atual ("yes"/"no") |
| `POST` | `/api/guess-response` | Confirma se o palpite da API estava correto ou não |

---

## ⚙️ Como Executar o Projeto Localmente

### Pré-requisitos
- Python instalado
- Git instalado

### Passo a Passo

```bash
# 1. Clone o repositório
git clone [https://github.com/seu-usuario/seu-repositorio.git](https://github.com/seu-usuario/seu-repositorio.git)
cd `api\akinator-api`

# 2. Crie e ative um ambiente virtual (opcional, mas recomendado)
python -m venv venv

# No Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# No Linux/Mac:
source venv/bin/activate

# 3. Instale as dependências
pip install fastapi uvicorn pandas

# 4. Inicie o servidor
uvicorn main:app --reload
