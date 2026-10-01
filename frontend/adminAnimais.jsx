import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  LoaderCircle,
  PawPrint,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import "./adminAnimais.css";

/* ──────────────────────────────────────────────────────────────────────────
   Tela de admin — CRUD de animais (autor: Jonas)

   Contrato esperado da API (todas as rotas usam cookie de sessão):
     GET    /api/admin/animais          -> [{ id, nome, criado_em,
                                              caracteristicas: [{ caracteristica_id, resposta }] }]
     POST   /api/admin/animais          body { nome, caracteristicas: [...] }
     PUT    /api/admin/animais/:id      body { nome, caracteristicas: [...] }
     DELETE /api/admin/animais/:id
     GET    /api/admin/caracteristicas  -> [{ id, pergunta }]   (somente leitura aqui)

   Erros: resposta não-2xx com JSON { message } — a mensagem é exibida na tela.
   "resposta" é true (Sim) ou false (Não). Característica ausente = não definida.

   Para ver a tela sem backend, crie um .env local com VITE_USE_MOCK=true.
   ────────────────────────────────────────────────────────────────────────── */

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

// Se o backend usar outros caminhos, basta ajustar aqui.
const ENDPOINTS = {
  animais: "/api/admin/animais",
  caracteristicas: "/api/admin/caracteristicas",
};

const NOME_MAX = 100;

/* ─── Camada de dados ──────────────────────────────────────────────────── */

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    const error = new Error("Não foi possível conectar à API. Confira se o servidor está ligado.");
    error.network = true;
    throw error;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      response.status === 401
        ? "Sessão expirada. Faça login novamente."
        : data.message || "Algo deu errado. Tente novamente.",
    );
    error.status = response.status;
    throw error;
  }
  return data;
}

const realApi = {
  async listar() {
    const data = await request(ENDPOINTS.animais);
    return Array.isArray(data) ? data : (data.animais ?? []);
  },
  async caracteristicas() {
    const data = await request(ENDPOINTS.caracteristicas);
    return Array.isArray(data) ? data : (data.caracteristicas ?? []);
  },
  criar: (payload) =>
    request(ENDPOINTS.animais, { method: "POST", body: JSON.stringify(payload) }),
  atualizar: (id, payload) =>
    request(`${ENDPOINTS.animais}/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  remover: (id) => request(`${ENDPOINTS.animais}/${id}`, { method: "DELETE" }),
};

/* Dados de exemplo — só usados com VITE_USE_MOCK=true */
const MOCK_CARACTERISTICAS = [
  "O animal é mamífero?",
  "O animal vive na água?",
  "O animal tem penas?",
  "O animal tem quatro patas?",
  "O animal é carnívoro?",
  "O animal é doméstico?",
  "O animal pode voar?",
  "O animal é de grande porte (maior que um cachorro médio)?",
].map((pergunta, index) => ({ id: index + 1, pergunta }));

const mockLista = (id, nome, respostas) => ({
  id,
  nome,
  criado_em: "2026-09-01T12:00:00",
  caracteristicas: Object.entries(respostas).map(([cid, resposta]) => ({
    caracteristica_id: Number(cid),
    resposta,
  })),
});

let mockAnimais = [
  mockLista(1, "Cachorro", { 1: true, 2: false, 3: false, 4: true, 5: false, 6: true }),
  mockLista(2, "Gato", { 1: true, 2: false, 4: true, 5: true, 6: true }),
  mockLista(3, "Tubarão", { 1: false, 2: true, 5: true, 8: true }),
  mockLista(4, "Águia", { 3: true, 7: true }),
];
let mockProximoId = 5;
const mockEsperar = (valor) =>
  new Promise((resolve) => setTimeout(() => resolve(JSON.parse(JSON.stringify(valor))), 250));

const mockApi = {
  listar: () => mockEsperar(mockAnimais),
  caracteristicas: () => mockEsperar(MOCK_CARACTERISTICAS),
  async criar(payload) {
    const animal = { id: mockProximoId++, criado_em: new Date().toISOString(), ...payload };
    mockAnimais = [...mockAnimais, animal];
    return mockEsperar(animal);
  },
  async atualizar(id, payload) {
    mockAnimais = mockAnimais.map((a) => (a.id === id ? { ...a, ...payload } : a));
    return mockEsperar({ id });
  },
  async remover(id) {
    mockAnimais = mockAnimais.filter((a) => a.id !== id);
    return mockEsperar({});
  },
};

const api = USE_MOCK ? mockApi : realApi;

/* ─── Utilitários ──────────────────────────────────────────────────────── */

const normalizar = (texto) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

function formatarData(valor) {
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? "—" : data.toLocaleDateString("pt-BR");
}

const pluralizar = (n, singular, plural) => `${n} ${n === 1 ? singular : plural}`;

function respostasParaMapa(lista = []) {
  return Object.fromEntries(lista.map((c) => [c.caracteristica_id, Boolean(c.resposta)]));
}

function mapaParaRespostas(mapa) {
  return Object.entries(mapa).map(([id, resposta]) => ({
    caracteristica_id: Number(id),
    resposta,
  }));
}

/* ─── Componentes auxiliares ───────────────────────────────────────────── */

function Modal({ titulo, tituloId, onClose, children }) {
  useEffect(() => {
    function aoTeclar(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [onClose]);

  return (
    <div className="animais-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="animais-modal" role="dialog" aria-modal="true" aria-labelledby={tituloId}>
        <div className="animais-modal-head">
          <h2 id={tituloId}>{titulo}</h2>
          <button className="animais-icon-button" type="button" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SeletorResposta({ valor, onChange, rotulo }) {
  const opcoes = [
    { chave: "sim", valor: true, texto: "Sim" },
    { chave: "nao", valor: false, texto: "Não" },
    { chave: "indef", valor: undefined, texto: "—", titulo: "Não definido" },
  ];

  return (
    <div className="animais-segmented" role="group" aria-label={rotulo}>
      {opcoes.map((opcao) => (
        <button
          key={opcao.chave}
          type="button"
          title={opcao.titulo}
          aria-pressed={valor === opcao.valor}
          className={valor === opcao.valor ? `ativo ${opcao.chave}` : ""}
          onClick={() => onChange(opcao.valor)}
        >
          {opcao.texto}
        </button>
      ))}
    </div>
  );
}

function FormularioAnimal({ animal, animais, caracteristicas, caracteristicasIndisponiveis, onClose, onSaved }) {
  const editando = Boolean(animal);
  const [nome, setNome] = useState(animal?.nome ?? "");
  const [respostas, setRespostas] = useState(() => respostasParaMapa(animal?.caracteristicas));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const definidas = Object.keys(respostas).length;

  function alterarResposta(id, valor) {
    setRespostas((atual) => {
      const proximo = { ...atual };
      if (valor === undefined) delete proximo[id];
      else proximo[id] = valor;
      return proximo;
    });
  }

  async function enviar(event) {
    event.preventDefault();
    setErro("");

    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      setErro("Informe o nome do animal.");
      return;
    }
    const repetido = animais.some(
      (a) => a.id !== animal?.id && normalizar(a.nome) === normalizar(nomeLimpo),
    );
    if (repetido) {
      setErro(`Já existe um animal chamado "${nomeLimpo}".`);
      return;
    }

    setSalvando(true);
    try {
      const payload = { nome: nomeLimpo, caracteristicas: mapaParaRespostas(respostas) };
      if (editando) await api.atualizar(animal.id, payload);
      else await api.criar(payload);
      onSaved(editando ? `"${nomeLimpo}" atualizado.` : `"${nomeLimpo}" cadastrado.`);
    } catch (e) {
      setErro(e.message);
      setSalvando(false);
    }
  }

  return (
    <Modal
      titulo={editando ? "Editar animal" : "Novo animal"}
      tituloId="animais-form-titulo"
      onClose={salvando ? () => {} : onClose}
    >
      <form className="animais-form" onSubmit={enviar} noValidate>
        <label className="animais-label" htmlFor="animal-nome">Nome</label>
        <input
          id="animal-nome"
          className="animais-input"
          type="text"
          placeholder="Ex.: Onça-pintada"
          maxLength={NOME_MAX}
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          autoFocus
          required
        />

        <div className="animais-secao">
          <span className="animais-label">Características</span>
          {caracteristicas.length > 0 && (
            <span className="animais-contador">
              {definidas} de {caracteristicas.length} definidas
            </span>
          )}
        </div>

        {caracteristicasIndisponiveis ? (
          <p className="animais-nota">
            Não foi possível carregar as perguntas. O animal pode ser salvo só com o nome e as
            características podem ser definidas depois.
          </p>
        ) : caracteristicas.length === 0 ? (
          <p className="animais-nota">Nenhuma pergunta cadastrada ainda.</p>
        ) : (
          <ul className="animais-caracteristicas">
            {caracteristicas.map((c) => (
              <li key={c.id}>
                <span>{c.pergunta}</span>
                <SeletorResposta
                  rotulo={c.pergunta}
                  valor={respostas[c.id]}
                  onChange={(valor) => alterarResposta(c.id, valor)}
                />
              </li>
            ))}
          </ul>
        )}

        {erro && <p className="animais-mensagem erro" role="alert">{erro}</p>}

        <div className="animais-modal-acoes">
          <button className="animais-btn secundario" type="button" onClick={onClose} disabled={salvando}>
            Cancelar
          </button>
          <button className="animais-btn primario" type="submit" disabled={salvando}>
            {salvando ? <LoaderCircle className="girando" size={17} /> : <Check size={17} />}
            {salvando ? "Salvando…" : editando ? "Salvar alterações" : "Cadastrar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ConfirmarExclusao({ animal, onClose, onDeleted }) {
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState("");

  async function confirmar() {
    setErro("");
    setExcluindo(true);
    try {
      await api.remover(animal.id);
      onDeleted(`"${animal.nome}" excluído.`);
    } catch (e) {
      setErro(e.message);
      setExcluindo(false);
    }
  }

  return (
    <Modal
      titulo="Excluir animal"
      tituloId="animais-excluir-titulo"
      onClose={excluindo ? () => {} : onClose}
    >
      <div className="animais-confirmacao">
        <div className="animais-alerta-icone" aria-hidden="true"><TriangleAlert size={22} /></div>
        <p>
          Tem certeza que deseja excluir <strong>{animal.nome}</strong>? As características
          associadas a ele também serão removidas e essa ação não pode ser desfeita.
        </p>
      </div>
      {erro && <p className="animais-mensagem erro" role="alert">{erro}</p>}
      <div className="animais-modal-acoes">
        <button className="animais-btn secundario" type="button" onClick={onClose} disabled={excluindo}>
          Cancelar
        </button>
        <button className="animais-btn perigo" type="button" onClick={confirmar} disabled={excluindo}>
          {excluindo ? <LoaderCircle className="girando" size={17} /> : <Trash2 size={17} />}
          {excluindo ? "Excluindo…" : "Excluir"}
        </button>
      </div>
    </Modal>
  );
}

/* ─── Tela ─────────────────────────────────────────────────────────────── */

export default function AdminAnimais() {
  const [animais, setAnimais] = useState([]);
  const [caracteristicas, setCaracteristicas] = useState([]);
  const [caracteristicasIndisponiveis, setCaracteristicasIndisponiveis] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [formulario, setFormulario] = useState(null); // null | { animal: Animal | null }
  const [paraExcluir, setParaExcluir] = useState(null);
  const [aviso, setAviso] = useState("");

  const carregar = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) setCarregando(true);
    setErro("");
    try {
      const [lista, perguntas] = await Promise.all([
        api.listar(),
        api.caracteristicas().catch(() => null),
      ]);
      setAnimais(lista);
      setCaracteristicas(perguntas ?? []);
      setCaracteristicasIndisponiveis(perguntas === null);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (!aviso) return undefined;
    const timer = setTimeout(() => setAviso(""), 4000);
    return () => clearTimeout(timer);
  }, [aviso]);

  const visiveis = useMemo(() => {
    const termo = normalizar(busca);
    return [...animais]
      .filter((a) => normalizar(a.nome).includes(termo))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [animais, busca]);

  function aoSalvar(mensagem) {
    setFormulario(null);
    setAviso(mensagem);
    carregar({ silencioso: true });
  }

  function aoExcluir(mensagem) {
    setParaExcluir(null);
    setAviso(mensagem);
    carregar({ silencioso: true });
  }

  return (
    <main className="animais-page">
      <section className="animais-container" aria-labelledby="animais-titulo">
        <header className="animais-header">
          <div>
            <div className="animais-eyebrow"><ShieldCheck size={15} /> PAINEL ADMINISTRATIVO</div>
            <h1 id="animais-titulo">Animais</h1>
            <p className="animais-intro">Cadastre, edite e remova os animais que o Akinator conhece.</p>
          </div>
          <div className="animais-header-actions">
            <a className="animais-btn secundario voltar-admin" href="/?page=admin">
              ← Voltar ao painel
            </a>
            <button
              className="animais-btn primario"
              type="button"
              onClick={() => setFormulario({ animal: null })}
              disabled={carregando && animais.length === 0}
            >
              <Plus size={18} /> Novo animal
            </button>
          </div>
        </header>

        {aviso && (
          <p className="animais-mensagem sucesso" role="status">
            <Check size={16} /> {aviso}
          </p>
        )}

        <div className="animais-card">
          <div className="animais-toolbar">
            <div className="animais-busca">
              <Search size={17} aria-hidden="true" />
              <input
                className="animais-input"
                type="search"
                placeholder="Buscar animal…"
                aria-label="Buscar animal"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
              />
            </div>
            {!carregando && !erro && (
              <span className="animais-contador">{pluralizar(visiveis.length, "animal", "animais")}</span>
            )}
          </div>

          {carregando ? (
            <div className="animais-estado" role="status">
              <LoaderCircle className="girando" size={26} />
              <p>Carregando animais…</p>
            </div>
          ) : erro ? (
            <div className="animais-estado">
              <TriangleAlert size={26} />
              <p className="animais-mensagem erro" role="alert">{erro}</p>
              <button className="animais-btn secundario" type="button" onClick={() => carregar()}>
                <RefreshCw size={16} /> Tentar novamente
              </button>
            </div>
          ) : visiveis.length === 0 ? (
            <div className="animais-estado">
              <PawPrint size={26} />
              <p>
                {animais.length === 0
                  ? "Nenhum animal cadastrado ainda."
                  : `Nenhum animal encontrado para "${busca}".`}
              </p>
            </div>
          ) : (
            <ul className="animais-lista">
              <li className="animais-linha cabecalho" aria-hidden="true">
                <span>Nome</span>
                <span>Características</span>
                <span>Criado em</span>
                <span />
              </li>
              {visiveis.map((animal) => {
                const total = animal.caracteristicas?.length ?? animal.total_caracteristicas ?? 0;
                return (
                  <li className="animais-linha" key={animal.id}>
                    <span className="animais-nome">{animal.nome}</span>
                    <span className="animais-meta" data-rotulo="Características">
                      {caracteristicas.length > 0 ? `${total} de ${caracteristicas.length}` : total}
                    </span>
                    <span className="animais-meta" data-rotulo="Criado em">
                      {formatarData(animal.criado_em)}
                    </span>
                    <span className="animais-acoes">
                      <button
                        className="animais-icon-button"
                        type="button"
                        onClick={() => setFormulario({ animal })}
                        aria-label={`Editar ${animal.nome}`}
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        className="animais-icon-button perigo"
                        type="button"
                        onClick={() => setParaExcluir(animal)}
                        aria-label={`Excluir ${animal.nome}`}
                      >
                        <Trash2 size={17} />
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <p className="animais-rodape">
          AKINATOR ANIMAL <span>·</span> PAINEL ADMINISTRATIVO
        </p>
      </section>

      {formulario && (
        <FormularioAnimal
          animal={formulario.animal}
          animais={animais}
          caracteristicas={caracteristicas}
          caracteristicasIndisponiveis={caracteristicasIndisponiveis}
          onClose={() => setFormulario(null)}
          onSaved={aoSalvar}
        />
      )}

      {paraExcluir && (
        <ConfirmarExclusao
          animal={paraExcluir}
          onClose={() => setParaExcluir(null)}
          onDeleted={aoExcluir}
        />
      )}
    </main>
  );
}
