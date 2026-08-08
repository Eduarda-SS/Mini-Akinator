# 🐾 Akinator Animal

Um jogo inspirado no Akinator que adivinha animais por meio de perguntas Sim/Não,
aprende novos animais e armazena tudo em um banco de dados MySQL.

---

## 📁 Estrutura do Projeto

```
akinator_animal/
├── main.py                        # Ponto de entrada — controlador principal
├── config.py                      # Configurações (banco de dados, limites)
├── requirements.txt
│
├── database/
│   ├── __init__.py
│   ├── conexao.py                 # Singleton de conexão MySQL
│   └── schema.sql                 # Schema + dados iniciais
│
├── models/
│   ├── __init__.py
│   └── animal.py                  # Animal, Caracteristica, Caminho (dataclasses)
│
├── repositories/
│   ├── __init__.py
│   └── animal_repository.py       # Toda SQL / acesso a dados
│
├── engine/
│   ├── __init__.py
│   └── jogo.py                    # Motor do jogo (lógica de dedução e aprendizado)
│
└── ui/
    ├── __init__.py
    └── terminal.py                # Interface de usuário no terminal
```

---

## 🚀 Configuração

### 1. Pré-requisitos
- Python 3.10+
- MySQL 8.0+ (MySQL Workbench recomendado)

### 2. Instale as dependências Python
```bash
pip install -r requirements.txt
```

### 3. Configure o banco de dados

Abra o MySQL Workbench, conecte ao seu servidor e execute o arquivo:
```
database/schema.sql
```

Isso cria o banco `akinator_animal` com tabelas e 10 animais iniciais.

### 4. Configure a conexão

Edite `config.py` com suas credenciais MySQL:
```python
DB_CONFIG = {
    "host":     "localhost",
    "port":     3306,
    "user":     "root",          # seu usuário
    "password": "sua_senha",     # sua senha
    "database": "akinator_animal",
}
```

### 5. Execute o jogo
```bash
cd akinator_animal
python main.py
```

---

## 🎮 Como jogar

1. Pense em um animal (qualquer um!)
2. Responda as perguntas com **s** (sim), **n** (não) ou **?** (não sei)
3. O sistema tenta adivinhar usando o banco de dados
4. Se errar, você ensina o animal correto → ele é salvo automaticamente no MySQL

---

## 🧠 Como o sistema aprende

Quando o Akinator **não consegue adivinhar**:
- Pede o nome do animal
- Salva o **caminho** completo (todas as respostas Sim/Não da partida) na tabela `animal_caracteristica`
- Na próxima rodada, já usa esse conhecimento

Quando o Akinator **erra** (chuta o animal errado):
- Pede uma pergunta que diferencie o animal correto do errado
- Salva essa nova característica no banco

---

## 🗃️ Modelo de Dados

```
animais              caracteristicas        animal_caracteristica
─────────────────    ──────────────────     ──────────────────────────
id   INT PK          id   INT PK            id   INT PK
nome VARCHAR         pergunta VARCHAR        animal_id         → animais.id
criado_em DATETIME   criado_em DATETIME      caracteristica_id → caracteristicas.id
                                             resposta TINYINT (0=Não, 1=Sim)
```

---

## ⚙️ Configurações avançadas (`config.py`)

| Variável            | Padrão | Descrição                                      |
|---------------------|--------|------------------------------------------------|
| `MAX_PERGUNTAS`     | 15     | Limite de perguntas por rodada                 |
| `MIN_RESPOSTAS_APRENDER` | 2 | Mínimo de respostas para salvar novo animal |

---

## 🏗️ Princípios de POO aplicados

| Princípio          | Onde                                          |
|--------------------|-----------------------------------------------|
| **Encapsulamento** | `Jogo` esconde estado interno; `Conexao` singleton |
| **Abstração**      | `AnimalRepository` abstrai toda SQL            |
| **Herança / Composição** | `Aplicacao` compõe `Jogo` + `TerminalUI` |
| **Responsabilidade única** | Cada módulo tem uma única responsabilidade |
| **Dataclasses**    | `Animal`, `Caracteristica`, `Caminho` são modelos puros |
