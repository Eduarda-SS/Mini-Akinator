"""
main.py — Backend Akinator de Animais (FastAPI + POO + UCI Zoo Dataset em memória)
Execução: uvicorn main:app --reload

Dependências:
    pip install fastapi uvicorn pandas
"""

import uuid
import random
from datetime import datetime, timezone
from typing import Dict, List, Optional

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ----------------------------------------------------------------------------
# App e CORS
# ----------------------------------------------------------------------------
app = FastAPI(title="Akinator de Animais API — POO")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_TENTATIVAS = 3
PERGUNTAS_POR_RODADA = 5

# ----------------------------------------------------------------------------
# Entidades de domínio
# ----------------------------------------------------------------------------

class Caracteristica:
    """Representa uma pergunta/atributo booleano do jogo."""

    def __init__(self, id: int, atributo: str, pergunta: str, criado_em: Optional[str] = None):
        self.id = id
        self.atributo = atributo   # chave usada em Animal.caracteristicas (ex.: "hair")
        self.pergunta = pergunta   # texto exibido ao usuário
        self.criado_em = criado_em

    def to_question_dict(self) -> Dict:
        return {"id": self.id, "text": self.pergunta}


class Animal:
    """Representa um animal e seu dicionário de atributos booleanos."""

    def __init__(self, id: int, nome: str, caracteristicas: Dict[str, bool], criado_em: Optional[str] = None):
        self.id = id
        self.nome = nome
        self.caracteristicas = caracteristicas or {}
        self.criado_em = criado_em

    def compativel_com(self, atributo: str, valor_esperado: bool) -> bool:
        """Verifica se o animal possui (ou não) determinado atributo."""
        return self.caracteristicas.get(atributo) == valor_esperado

    def score_compatibilidade(self, respostas_conhecidas: Dict[str, bool]) -> float:
        """
        Calcula a fração de atributos conhecidos (histórico de respostas
        yes/no da partida) que o animal satisfaz. Usado para desempate e
        para escolher o "melhor palpite histórico" quando não há mais
        candidatos exatos.
        """
        if not respostas_conhecidas:
            return 0.0
        acertos = sum(
            1 for atributo, esperado in respostas_conhecidas.items()
            if self.caracteristicas.get(atributo) == esperado
        )
        return acertos / len(respostas_conhecidas)

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "nome": self.nome,
            "caracteristicas": self.caracteristicas,
            "criado_em": self.criado_em,
        }


class Caminho:
    """
    Histórico de perguntas/respostas de uma partida. Também guarda o nome
    do animal aprendido ao final (quando aplicável), para uso em /api/learn.
    """

    def __init__(self):
        self.animal_nome: Optional[str] = None
        self.historico: List[Dict] = []  # [{caracteristica_id, atributo, resposta}]

    def registrar(self, caracteristica: Caracteristica, resposta: str) -> None:
        registro = {
            "caracteristica_id": caracteristica.id,
            "atributo": caracteristica.atributo,
            "resposta": resposta,  # "yes" | "no" | "dont_know"
        }
        existente = next(
            (item for item in self.historico if item["caracteristica_id"] == caracteristica.id),
            None,
        )
        if existente is None:
            self.historico.append(registro)
        else:
            existente.update(registro)

    def perguntas_feitas_ids(self) -> List[int]:
        return [h["caracteristica_id"] for h in self.historico]

    def respostas_conhecidas(self) -> Dict[str, bool]:
        """Converte o histórico em {atributo: bool}, ignorando dont_know."""
        return {
            h["atributo"]: (h["resposta"] == "yes")
            for h in self.historico
            if h["resposta"] in ("yes", "no")
        }


# ----------------------------------------------------------------------------
# AnimalRepository — carregamento e filtro em memória (dataset UCI Zoo)
# ----------------------------------------------------------------------------

class AnimalRepository:
    """
    Responsável por carregar o dataset UCI Zoo uma única vez e disponibilizar
    os Animal/Caracteristica em memória. Também permite o cadastro (em
    memória) de novos animais aprendidos via /api/learn.
    """

    ZOO_DATA_URL = "https://archive.ics.uci.edu/ml/machine-learning-databases/zoo/zoo.data"

    ZOO_COLUMNS = [
        "animal_name", "hair", "feathers", "eggs", "milk", "airborne", "aquatic",
        "predator", "toothed", "backbone", "breathes", "venomous", "fins", "legs",
        "tail", "domestic", "catsize", "class_type",
    ]


    PERGUNTAS: List[Dict[str, str]] = [
        {"atributo": "hair", "pergunta": "O seu animal tem pelos?"},
        {"atributo": "feathers", "pergunta": "O seu animal tem penas?"},
        {"atributo": "eggs", "pergunta": "O seu animal bota ovos?"},
        {"atributo": "milk", "pergunta": "O seu animal produz leite ou amamenta?"},
        {"atributo": "airborne", "pergunta": "O seu animal consegue voar?"},
        {"atributo": "aquatic", "pergunta": "O seu animal é aquático ou vive na água?"},
        {"atributo": "predator", "pergunta": "O seu animal é um predador ou caçador?"},
        {"atributo": "toothed", "pergunta": "O seu animal tem dentes?"},
        {"atributo": "backbone", "pergunta": "O seu animal tem coluna vertebral?"},
        {"atributo": "breathes", "pergunta": "O seu animal respira ar fora da água?"},
        {"atributo": "venomous", "pergunta": "O seu animal é peçonhento ou venenoso?"},
        {"atributo": "fins", "pergunta": "O seu animal possui barbatanas?"},
        {"atributo": "tail", "pergunta": "O seu animal tem rabo ou cauda?"},
        {"atributo": "domestic", "pergunta": "O seu animal é doméstico?"},
        {"atributo": "catsize", "pergunta": "O seu animal é do tamanho de um gato ou maior?"},
    ]

    TRADUCOES = {
        "aardvark": "Porco-formigueiro", "antelope": "Antílope", "bass": "Robalo",
        "bear": "Urso", "boar": "Javali", "buffalo": "Búfalo", "calf": "Bezerro",
        "carp": "Carpa", "catfish": "Bagre", "cavy": "Porquinho-da-índia",
        "cheetah": "Guepardo", "chicken": "Galinha", "chub": "Peixe-chub",
        "clam": "Amêijoa", "crab": "Caranguejo", "crayfish": "Lagostim",
        "crow": "Corvo", "deer": "Veado", "dolphin": "Golfinho", "dove": "Pomba",
        "duck": "Pato", "elephant": "Elefante", "flamingo": "Flamingo",
        "flea": "Pulga", "frog": "Sapo", "fruitbat": "Morcego-frutívoro",
        "giraffe": "Girafa", "girl": "Humano", "gnat": "Mosquito", "goat": "Cabra",
        "gorilla": "Gorila", "gull": "Gaivota", "haddock": "Hadoque",
        "hamster": "Hamster", "hare": "Lebre", "hawk": "Falcão",
        "herring": "Arenque", "honeybee": "Abelha", "housefly": "Mosca-doméstica",
        "kiwi": "Kiwi", "ladybird": "Joaninha", "lark": "Cotovia",
        "leopard": "Leopardo", "lion": "Leão", "lobster": "Lagosta",
        "lynx": "Lince", "mink": "Vison", "mole": "Toupeira",
        "mongoose": "Mangusto", "moth": "Mariposa", "newt": "Tritão",
        "octopus": "Polvo", "opossum": "Gambá", "oryx": "Órix",
        "ostrich": "Avestruz", "parakeet": "Periquito", "penguin": "Pinguim",
        "pheasant": "Faisão", "pike": "Lúcio", "piranha": "Piranha",
        "pitviper": "Jararaca", "platypus": "Ornitorrinco", "polecat": "Furão",
        "pony": "Pônei", "porpoise": "Boto", "puma": "Puma", "pussycat": "Gato",
        "raccoon": "Guaxinim", "reindeer": "Rena", "rhea": "Ema",
        "scorpion": "Escorpião", "seahorse": "Cavalo-marinho", "seal": "Foca",
        "sealion": "Leão-marinho", "seasnake": "Cobra-do-mar", "seawasp": "Água-viva",
        "skimmer": "Talha-mar", "skua": "Skua", "slowworm": "Cobra-de-vidro",
        "slug": "Lesma", "sole": "Linguado", "sparrow": "Pardal",
        "squirrel": "Esquilo", "starfish": "Estrela-do-mar", "stingray": "Arraia",
        "swan": "Cisne", "termite": "Cupim", "toad": "Sapo-cururu",
        "tortoise": "Tartaruga", "tuatara": "Tuatara", "tuna": "Atum",
        "vampire": "Morcego-vampiro", "vole": "Rato-do-campo", "vulture": "Abutre",
        "wallaby": "Canguru-pequeno", "wasp": "Vespa", "wolf": "Lobo",
        "worm": "Minhoca", "wren": "Carriça",
    }

    def __init__(self):
        self._caracteristicas: List[Caracteristica] = [
            Caracteristica(id=i + 1, atributo=p["atributo"], pergunta=p["pergunta"])
            for i, p in enumerate(self.PERGUNTAS)
        ]
        self._atributos_validos = {c.atributo for c in self._caracteristicas}
        self._animais: List[Animal] = self._carregar_animais()
        self._next_animal_id = max((a.id for a in self._animais), default=0) + 1
        self._next_caracteristica_id = max((c.id for c in self._caracteristicas), default=0) + 1

    def _carregar_animais(self) -> List[Animal]:
        try:
            df = pd.read_csv(self.ZOO_DATA_URL, names=self.ZOO_COLUMNS)
        except Exception as exc:
            raise RuntimeError(
                f"Não foi possível carregar o dataset UCI Zoo em '{self.ZOO_DATA_URL}'. "
                f"Verifique a conexão com a internet. Detalhe: {exc}"
            )

        animais: List[Animal] = []
        for index, row in df.iterrows():
            caracteristicas = {attr: bool(row[attr]) for attr in self._atributos_validos}
            nome_original = str(row["animal_name"]).strip().lower()
            nome_traduzido = self.TRADUCOES.get(nome_original, nome_original.capitalize())
            animais.append(Animal(
                id=index + 1,
                nome=nome_traduzido,
                caracteristicas=caracteristicas,
            ))
        return animais

    # --- Leitura -------------------------------------------------------------

    def listar_animais(self) -> List[Animal]:
        """Retorna uma cópia rasa da lista (cada Jogo filtra sua própria cópia)."""
        return self._animais.copy()

    def listar_caracteristicas(self) -> List[Caracteristica]:
        return self._caracteristicas.copy()

    # --- Escrita (usado por /api/learn) --------------------------------------

    def criar_caracteristica(self, atributo: str, pergunta: str) -> Caracteristica:
        nova = Caracteristica(
            id=self._next_caracteristica_id,
            atributo=atributo,
            pergunta=pergunta,
            criado_em=datetime.now(timezone.utc).isoformat(),
        )
        self._next_caracteristica_id += 1
        self._caracteristicas.append(nova)
        self._atributos_validos.add(atributo)
        return nova

    def criar_caracteristica_administrativa(self, pergunta: str) -> Caracteristica:
        atributo = f"admin_feature_{self._next_caracteristica_id}"
        while atributo in self._atributos_validos:
            atributo = f"{atributo}_extra"
        return self.criar_caracteristica(atributo, pergunta)

    def atualizar_caracteristica(self, caracteristica_id: int, pergunta: str) -> Optional[Caracteristica]:
        caracteristica = next((c for c in self._caracteristicas if c.id == caracteristica_id), None)
        if caracteristica is None:
            return None
        caracteristica.pergunta = pergunta
        return caracteristica

    def remover_caracteristica(self, caracteristica_id: int) -> Optional[Caracteristica]:
        caracteristica = next((c for c in self._caracteristicas if c.id == caracteristica_id), None)
        if caracteristica is None:
            return None
        self._caracteristicas.remove(caracteristica)
        self._atributos_validos.discard(caracteristica.atributo)
        for animal in self._animais:
            animal.caracteristicas.pop(caracteristica.atributo, None)
        return caracteristica

    def buscar_caracteristica_por_atributo(self, atributo: str) -> Optional[Caracteristica]:
        return next((c for c in self._caracteristicas if c.atributo == atributo), None)

    def criar_animal(self, nome: str, caracteristicas: Dict[str, bool]) -> Animal:
        novo = Animal(
            id=self._next_animal_id,
            nome=nome,
            caracteristicas=caracteristicas,
            criado_em=datetime.now(timezone.utc).isoformat(),
        )
        self._next_animal_id += 1
        self._animais.append(novo)
        return novo

    def atualizar_animal(self, animal_id: int, nome: str, caracteristicas: Dict[str, bool]) -> Optional[Animal]:
        animal = next((a for a in self._animais if a.id == animal_id), None)
        if animal is None:
            return None
        animal.nome = nome
        animal.caracteristicas = caracteristicas
        return animal

    def remover_animal(self, animal_id: int) -> Optional[Animal]:
        animal = next((a for a in self._animais if a.id == animal_id), None)
        if animal is None:
            return None
        self._animais.remove(animal)
        return animal


# Instância única do repositório (carrega o dataset uma vez, na subida da API)
repository = AnimalRepository()

# ----------------------------------------------------------------------------
# Jogo — motor principal
# ----------------------------------------------------------------------------

class Jogo:
    """Motor de uma partida: candidatos, perguntas feitas, tentativas e palpites."""

    def __init__(self, game_id: str, repository: AnimalRepository):
        self.game_id = game_id
        self.repository = repository
        self.candidatos: List[Animal] = []
        self.candidatos_anteriores: List[Animal] = []
        self.caminho = Caminho()
        self.tentativas = 0
        self.ultimo_palpite: Optional[Animal] = None
        self.melhor_palpite_historico: Optional[Animal] = None
        self.perguntas_ordenadas: List[Caracteristica] = []
        self.palpites_rejeitados_ids = set()

    def iniciar(self) -> Caracteristica:
        """Carrega todos os animais como candidatos e retorna a 1ª pergunta."""
        self.candidatos = self.repository.listar_animais()
        self.candidatos_anteriores = self.candidatos.copy()
        self.perguntas_ordenadas = self.repository.listar_caracteristicas()
        random.shuffle(self.perguntas_ordenadas)
        primeira = self.proxima_pergunta()
        if primeira is None:
            raise RuntimeError("Nenhuma característica cadastrada no repositório.")
        return primeira

    def proxima_pergunta(self) -> Optional[Caracteristica]:
        """Retorna a próxima característica ainda não perguntada nesta partida."""
        feitas = set(self.caminho.perguntas_feitas_ids())
        for c in self.perguntas_ordenadas:
            if c.id not in feitas:
                return c
        return None

    def proxima_pergunta_apos(self, caracteristica_id: int) -> Optional[Caracteristica]:
        for index, caracteristica in enumerate(self.perguntas_ordenadas):
            if caracteristica.id == caracteristica_id:
                if index + 1 < len(self.perguntas_ordenadas):
                    return self.perguntas_ordenadas[index + 1]
                return None
        return None

    def recalcular_candidatos(self) -> None:
        respostas = self.caminho.respostas_conhecidas()
        candidatos = [
            animal
            for animal in self.repository.listar_animais()
            if animal.id not in self.palpites_rejeitados_ids
            and all(animal.caracteristicas.get(atributo) == valor for atributo, valor in respostas.items())
        ]
        self.candidatos_anteriores = self.candidatos
        self.candidatos = candidatos

    def registrar_resposta(self, caracteristica: Caracteristica, resposta: str) -> None:
        """
        Grava a resposta no Caminho e aplica o filtro de candidatos:
        - "yes"/"no": mantém apenas animais compatíveis (compativel_com).
        - "dont_know": NÃO filtra — apenas avança, sem eliminar candidatos.
        """
        self.caminho.registrar(caracteristica, resposta)
        self.recalcular_candidatos()

    def tentar_adivinhar(self) -> Optional[Animal]:
        """
        Gera o palpite atual, incrementa o contador de tentativas e atualiza
        o melhor palpite histórico (usado em limit_reached/aprendizado).
        - 0 candidatos: recua para candidatos_anteriores; se também vazio,
          usa score_compatibilidade sobre todos os animais como fallback.
        - N candidatos: primeiro da lista.
        """
        if len(self.candidatos) > 0:
            palpite = self.candidatos[0]
        else:
            conhecidos = self.caminho.respostas_conhecidas()
            todos = [
                animal for animal in self.repository.listar_animais()
                if animal.id not in self.palpites_rejeitados_ids
            ]
            palpite = max(todos, key=lambda a: a.score_compatibilidade(conhecidos), default=None)

        if palpite is not None:
            self.ultimo_palpite = palpite
            if self.melhor_palpite_historico is None:
                self.melhor_palpite_historico = palpite
            self.tentativas += 1

        return palpite

    def descartar_palpite_atual(self) -> None:
        """Remove o último palpite rejeitado dos candidatos (atual e anterior)."""
        if self.ultimo_palpite is None:
            return
        descartado_id = self.ultimo_palpite.id
        self.palpites_rejeitados_ids.add(descartado_id)
        self.recalcular_candidatos()

    @property
    def tentativas_esgotadas(self) -> bool:
        return self.tentativas >= MAX_TENTATIVAS


# Partidas ativas: game_id -> Jogo
jogos: Dict[str, Jogo] = {}


def get_jogo(game_id: str) -> Jogo:
    jogo = jogos.get(game_id)
    if jogo is None:
        raise HTTPException(status_code=404, detail="Sessão de jogo não encontrada.")
    return jogo


def get_caracteristica(jogo: Jogo, caracteristica_id: int) -> Caracteristica:
    caracteristica = next(
        (c for c in jogo.repository.listar_caracteristicas() if c.id == caracteristica_id),
        None,
    )
    if caracteristica is None:
        raise HTTPException(status_code=404, detail="Pergunta não encontrada.")
    return caracteristica


def animal_admin_dict(animal: Animal) -> Dict:
    caracteristicas_por_atributo = {
        caracteristica.atributo: caracteristica.id
        for caracteristica in repository.listar_caracteristicas()
    }
    return {
        "id": animal.id,
        "nome": animal.nome,
        "criado_em": animal.criado_em,
        "caracteristicas": [
            {"caracteristica_id": caracteristicas_por_atributo[atributo], "resposta": resposta}
            for atributo, resposta in animal.caracteristicas.items()
            if atributo in caracteristicas_por_atributo
        ],
    }


def pergunta_admin_dict(caracteristica: Caracteristica) -> Dict:
    animais = repository.listar_animais()
    return {
        "id": caracteristica.id,
        "pergunta": caracteristica.pergunta,
        "criado_em": caracteristica.criado_em,
        "total_animais": sum(
            caracteristica.atributo in animal.caracteristicas
            for animal in animais
        ),
    }


def atributos_admin_para_animal(respostas: List["AdminAnimalCharacteristicIn"]) -> Dict[str, bool]:
    caracteristicas_por_id = {
        caracteristica.id: caracteristica
        for caracteristica in repository.listar_caracteristicas()
    }
    atributos: Dict[str, bool] = {}

    for resposta in respostas:
        caracteristica = caracteristicas_por_id.get(resposta.caracteristica_id)
        if caracteristica is None:
            raise HTTPException(status_code=404, detail=f"Pergunta {resposta.caracteristica_id} não encontrada.")
        if caracteristica.atributo in atributos:
            raise HTTPException(status_code=422, detail="Uma pergunta foi enviada mais de uma vez.")
        atributos[caracteristica.atributo] = resposta.resposta

    return atributos


def nome_animal_em_uso(nome: str, ignorar_id: Optional[int] = None) -> bool:
    nome_normalizado = " ".join(nome.casefold().split())
    return any(
        animal.id != ignorar_id
        and " ".join(animal.nome.casefold().split()) == nome_normalizado
        for animal in repository.listar_animais()
    )


def pergunta_em_uso(pergunta: str, ignorar_id: Optional[int] = None) -> bool:
    pergunta_normalizada = " ".join(pergunta.casefold().split())
    return any(
        caracteristica.id != ignorar_id
        and " ".join(caracteristica.pergunta.casefold().split()) == pergunta_normalizada
        for caracteristica in repository.listar_caracteristicas()
    )


# ----------------------------------------------------------------------------
# Schemas (Pydantic)
# ----------------------------------------------------------------------------

class AnswerRequest(BaseModel):
    gameId: str
    questionId: int
    answer: str  # "yes" | "no" | "dont_know"


class GuessFeedbackRequest(BaseModel):
    gameId: str
    accepted: bool


class LearnRequest(BaseModel):
    gameId: str
    animalName: str
    differentiatingQuestionText: str
    differentiatingQuestionAnswerForNewAnimal: str  # "yes" ou "no"


class AdminAnimalCharacteristicIn(BaseModel):
    caracteristica_id: int
    resposta: bool


class AdminAnimalIn(BaseModel):
    nome: str = Field(min_length=1, max_length=100)
    caracteristicas: List[AdminAnimalCharacteristicIn] = Field(default_factory=list)


class AdminQuestionIn(BaseModel):
    pergunta: str = Field(min_length=1, max_length=255)


class QuestionOut(BaseModel):
    id: int
    text: str


class StartResponse(BaseModel):
    gameId: str
    question: QuestionOut


class GuessOut(BaseModel):
    name: Optional[str] = None


class GameStepResponse(BaseModel):
    status: str  # "playing" | "guessing" | "finished" | "limit_reached"
    question: Optional[QuestionOut] = None
    guess: Optional[GuessOut] = None
    message: Optional[str] = None
    attempt: Optional[int] = None


# ----------------------------------------------------------------------------
# Fluxo compartilhado entre /api/answer e /api/guess-feedback
# ----------------------------------------------------------------------------

def avancar_jogo(jogo: Jogo) -> GameStepResponse:
    """Faz cinco perguntas únicas por rodada e só então tenta adivinhar."""
    perguntas_respondidas = len(jogo.caminho.perguntas_feitas_ids())
    perguntas_na_rodada = perguntas_respondidas % PERGUNTAS_POR_RODADA
    proxima = jogo.proxima_pergunta()

    if perguntas_respondidas == 0 and proxima is not None:
        return GameStepResponse(status="playing", question=proxima.to_question_dict())

    if perguntas_na_rodada and proxima is not None:
        return GameStepResponse(status="playing", question=proxima.to_question_dict())

    palpite = jogo.tentar_adivinhar()
    if palpite is None:
        return GameStepResponse(status="finished", message="Não há animais disponíveis para tentar adivinhar.")
    return GameStepResponse(
        status="guessing",
        guess=GuessOut(name=palpite.nome),
        attempt=jogo.tentativas,
    )


# ----------------------------------------------------------------------------
# Endpoints
# ----------------------------------------------------------------------------

@app.post("/api/start", response_model=StartResponse)
def start_game():
    """Inicia uma nova partida usando o AnimalRepository já carregado."""
    game_id = str(uuid.uuid4())
    jogo = Jogo(game_id=game_id, repository=repository)
    primeira = jogo.iniciar()
    jogos[game_id] = jogo

    return StartResponse(gameId=game_id, question=primeira.to_question_dict())


@app.post("/api/answer", response_model=GameStepResponse)
def answer_question(payload: AnswerRequest):
    """Processa yes/no/dont_know e decide o próximo passo do jogo."""
    jogo = get_jogo(payload.gameId)
    caracteristica = get_caracteristica(jogo, payload.questionId)

    resposta = payload.answer.strip().lower()
    if resposta not in ("yes", "no", "dont_know"):
        raise HTTPException(status_code=422, detail="answer deve ser 'yes', 'no' ou 'dont_know'.")

    revisando = payload.questionId in jogo.caminho.perguntas_feitas_ids()
    jogo.registrar_resposta(caracteristica, resposta)

    if revisando:
        proxima = jogo.proxima_pergunta_apos(caracteristica.id)
        if proxima is not None:
            return GameStepResponse(status="playing", question=proxima.to_question_dict())

    return avancar_jogo(jogo)


@app.post("/api/guess-feedback", response_model=GameStepResponse)
def guess_feedback(payload: GuessFeedbackRequest):
    """
    Confirmação do palpite dado em /api/answer.
    - accepted=True  -> vitória, encerra a partida.
    - accepted=False e tentativas < 3 -> descarta o palpite e continua o jogo.
    - accepted=False e tentativas == 3 -> limit_reached, com o melhor palpite histórico.
    """
    jogo = get_jogo(payload.gameId)

    if payload.accepted:
        del jogos[payload.gameId]
        return GameStepResponse(status="finished", message="Oba! Adivinhei o seu animal!")

    if jogo.tentativas_esgotadas:
        melhor = jogo.melhor_palpite_historico
        # NÃO apaga a sessão aqui: /api/learn ainda pode precisar do Caminho
        return GameStepResponse(
            status="limit_reached",
            guess=GuessOut(name=melhor.nome if melhor else None),
            message="Esgotei minhas tentativas! Qual era o animal em que você pensou?",
            attempt=jogo.tentativas,
        )

    jogo.descartar_palpite_atual()
    proxima = jogo.proxima_pergunta()
    if proxima is not None:
        return GameStepResponse(
            status="playing",
            question=proxima.to_question_dict(),
            message="Vamos continuar com uma nova rodada de perguntas.",
        )
    return avancar_jogo(jogo)


@app.post("/api/learn")
def learn_new_animal(payload: LearnRequest):
    """
    Cadastra em memória (via AnimalRepository) o animal que o usuário tinha
    em mente, junto com a pergunta diferencial, aproveitando o histórico
    (Caminho) da partida atual como base de atributos conhecidos.
    """
    jogo = get_jogo(payload.gameId)

    resposta_nova = payload.differentiatingQuestionAnswerForNewAnimal.strip().lower()
    if resposta_nova not in ("yes", "no"):
        raise HTTPException(
            status_code=422,
            detail="differentiatingQuestionAnswerForNewAnimal deve ser 'yes' ou 'no'.",
        )

    atributo = payload.differentiatingQuestionText.strip().lower().replace(" ", "_")[:60]
    caracteristica = jogo.repository.buscar_caracteristica_por_atributo(atributo)
    if caracteristica is None:
        caracteristica = jogo.repository.criar_caracteristica(
            atributo=atributo,
            pergunta=payload.differentiatingQuestionText,
        )

    # Atributos do novo animal = respostas já conhecidas na partida + a diferencial
    caracteristicas_novo_animal = jogo.caminho.respostas_conhecidas()
    caracteristicas_novo_animal[caracteristica.atributo] = (resposta_nova == "yes")

    jogo.caminho.animal_nome = payload.animalName
    novo_animal = jogo.repository.criar_animal(
        nome=payload.animalName,
        caracteristicas=caracteristicas_novo_animal,
    )

    del jogos[payload.gameId]

    return {
        "message": f"Animal '{novo_animal.nome}' aprendido com sucesso!",
        "animal": novo_animal.to_dict(),
        "caracteristica": {
            "id": caracteristica.id,
            "atributo": caracteristica.atributo,
            "pergunta": caracteristica.pergunta,
        },
    }


@app.get("/api/admin/animais")
def admin_listar_animais():
    return [animal_admin_dict(animal) for animal in repository.listar_animais()]


@app.post("/api/admin/animais")
def admin_criar_animal(payload: AdminAnimalIn):
    nome = payload.nome.strip()
    if not nome:
        raise HTTPException(status_code=422, detail="Informe o nome do animal.")
    if nome_animal_em_uso(nome):
        raise HTTPException(status_code=409, detail="Já existe um animal com esse nome.")

    caracteristicas = atributos_admin_para_animal(payload.caracteristicas)
    animal = repository.criar_animal(nome, caracteristicas)
    return animal_admin_dict(animal)


@app.put("/api/admin/animais/{animal_id}")
def admin_atualizar_animal(animal_id: int, payload: AdminAnimalIn):
    nome = payload.nome.strip()
    if not nome:
        raise HTTPException(status_code=422, detail="Informe o nome do animal.")
    if nome_animal_em_uso(nome, ignorar_id=animal_id):
        raise HTTPException(status_code=409, detail="Já existe um animal com esse nome.")

    caracteristicas = atributos_admin_para_animal(payload.caracteristicas)
    animal = repository.atualizar_animal(animal_id, nome, caracteristicas)
    if animal is None:
        raise HTTPException(status_code=404, detail="Animal não encontrado.")
    return animal_admin_dict(animal)


@app.delete("/api/admin/animais/{animal_id}")
def admin_remover_animal(animal_id: int):
    animal = repository.remover_animal(animal_id)
    if animal is None:
        raise HTTPException(status_code=404, detail="Animal não encontrado.")
    return {"message": f"Animal '{animal.nome}' excluído."}


@app.get("/api/admin/caracteristicas")
def admin_listar_caracteristicas():
    return [pergunta_admin_dict(item) for item in repository.listar_caracteristicas()]


@app.post("/api/admin/caracteristicas")
def admin_criar_caracteristica(payload: AdminQuestionIn):
    pergunta = payload.pergunta.strip()
    if not pergunta:
        raise HTTPException(status_code=422, detail="Escreva a pergunta.")
    if pergunta_em_uso(pergunta):
        raise HTTPException(status_code=409, detail="Já existe uma pergunta com esse texto.")

    caracteristica = repository.criar_caracteristica_administrativa(pergunta)
    return pergunta_admin_dict(caracteristica)


@app.put("/api/admin/caracteristicas/{caracteristica_id}")
def admin_atualizar_caracteristica(caracteristica_id: int, payload: AdminQuestionIn):
    pergunta = payload.pergunta.strip()
    if not pergunta:
        raise HTTPException(status_code=422, detail="Escreva a pergunta.")
    if pergunta_em_uso(pergunta, ignorar_id=caracteristica_id):
        raise HTTPException(status_code=409, detail="Já existe uma pergunta com esse texto.")

    caracteristica = repository.atualizar_caracteristica(caracteristica_id, pergunta)
    if caracteristica is None:
        raise HTTPException(status_code=404, detail="Pergunta não encontrada.")
    return pergunta_admin_dict(caracteristica)


@app.delete("/api/admin/caracteristicas/{caracteristica_id}")
def admin_remover_caracteristica(caracteristica_id: int):
    caracteristica = repository.remover_caracteristica(caracteristica_id)
    if caracteristica is None:
        raise HTTPException(status_code=404, detail="Pergunta não encontrada.")
    return {"message": "Pergunta excluída; suas respostas foram removidas dos animais."}


@app.get("/")
def root():
    return {
        "message": "Akinator de Animais API (POO) está rodando.",
        "total_animais": len(repository.listar_animais()),
        "total_caracteristicas": len(repository.listar_caracteristicas()),
        "docs": "/docs",
    }