import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  CircleHelp,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import "./adminPerguntas.css";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

// Se o backend usar outros caminhos, basta ajustar aqui.
const ENDPOINTS = {
  perguntas: "/api/admin/caracteristicas",
};

const PERGUNTA_MAX = 255; // VARCHAR(255) no schema.sql

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
    const data = await request(ENDPOINTS.perguntas);
    return Array.isArray(data) ? data : (data.caracteristicas ?? data.perguntas ?? []);
  },
  criar: (payload) =>
    request(ENDPOINTS.perguntas, { method: "POST", body: JSON.stringify(payload) }),
  atualizar: (id, payload) =>
    request(`${ENDPOINTS.perguntas}/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  remover: (id) => request(`${ENDPOINTS.perguntas}/${id}`, { method: "DELETE" }),
};

/* Dados de exemplo — só usados com VITE_USE_MOCK=true */
let mockPerguntas = [
  ["O animal é mamífero?", 3],
  ["O animal vive na água?", 1],
  ["O animal tem penas?", 1],
  ["O animal tem quatro patas?", 2],
  ["O animal é carnívoro?", 3],
  ["O animal é doméstico?", 2],
  ["O animal pode voar?", 1],
  ["O animal é de grande porte (maior que um cachorro médio)?", 1],
].map(([pergunta, total_animais], index) => ({
  id: index + 1,
  pergunta,
  total_animais,
  criado_em: "2026-09-01T12:00:00",
}));
let mockProximoId = mockPerguntas.length + 1;
const mockEsperar = (valor) =>
  new Promise((resolve) => setTimeout(() => resolve(JSON.parse(JSON.stringify(valor))), 250));

const mockApi = {
  listar: () => mockEsperar(mockPerguntas),
  async criar(payload) {
    const item = {
      id: mockProximoId++,
      criado_em: new Date().toISOString(),
      total_animais: 0,
      ...payload,
    };
    mockPerguntas = [...mockPerguntas, item];
    return mockEsperar(item);
  },
  async atualizar(id, payload) {
    mockPerguntas = mockPerguntas.map((p) => (p.id === id ? { ...p, ...payload } : p));
    return mockEsperar({ id });
  },
  async remover(id) {
    mockPerguntas = mockPerguntas.filter((p) => p.id !== id);
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
  if (!valor) return "—";
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? "—" : data.toLocaleDateString("pt-BR");
}

const pluralizar = (n, singular, plural) => `${n} ${n === 1 ? singular : plural}`;

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
    <div className="perguntas-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="perguntas-modal" role="dialog" aria-modal="true" aria-labelledby={tituloId}>
        <div className="perguntas-modal-head">
          <h2 id={tituloId}>{titulo}</h2>
          <button className="perguntas-icon-button" type="button" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormularioPergunta({ pergunta, perguntas, onClose, onSaved }) {
  const editando = Boolean(pergunta);
  const [texto, setTexto] = useState(pergunta?.pergunta ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function enviar(event) {
    event.preventDefault();
    setErro("");

    const textoLimpo = texto.trim();
    if (!textoLimpo) {
      setErro("Escreva a pergunta.");
      return;
    }
    const repetida = perguntas.some(
      (p) => p.id !== pergunta?.id && normalizar(p.pergunta) === normalizar(textoLimpo),
    );
    if (repetida) {
      setErro("Já existe uma pergunta com esse texto.");
      return;
    }

    setSalvando(true);
    try {
      const payload = { pergunta: textoLimpo };
      if (editando) await api.atualizar(pergunta.id, payload);
      else await api.criar(payload);
      onSaved(editando ? "Pergunta atualizada." : "Pergunta cadastrada.");
    } catch (e) {
      setErro(e.message);
      setSalvando(false);
    }
  }

  return (
    <Modal
      titulo={editando ? "Editar pergunta" : "Nova pergunta"}
      tituloId="perguntas-form-titulo"
      onClose={salvando ? () => {} : onClose}
    >
      <form className="perguntas-form" onSubmit={enviar} noValidate>
        <label className="perguntas-label" htmlFor="pergunta-texto">Pergunta</label>
        <textarea
          id="pergunta-texto"
          className="perguntas-input"
          placeholder="Ex.: O animal é noturno?"
          maxLength={PERGUNTA_MAX}
          value={texto}
          onChange={(event) => setTexto(event.target.value)}
          autoFocus
          required
        />
        <div className="perguntas-campo-rodape">
          <span className="perguntas-nota">Escreva de forma que a resposta seja Sim ou Não.</span>
          <span className="perguntas-contador">{texto.length}/{PERGUNTA_MAX}</span>
        </div>

        {editando && pergunta.total_animais > 0 && (
          <p className="perguntas-nota">
            Esta pergunta já tem resposta em {pluralizar(pergunta.total_animais, "animal", "animais")}.
            Mudar o sentido dela pode deixar essas respostas incorretas.
          </p>
        )}

        {erro && <p className="perguntas-mensagem erro" role="alert">{erro}</p>}

        <div className="perguntas-modal-acoes">
          <button className="perguntas-btn secundario" type="button" onClick={onClose} disabled={salvando}>
            Cancelar
          </button>
          <button className="perguntas-btn primario" type="submit" disabled={salvando}>
            {salvando ? <LoaderCircle className="girando" size={17} /> : <Check size={17} />}
            {salvando ? "Salvando…" : editando ? "Salvar alterações" : "Cadastrar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ConfirmarExclusao({ pergunta, onClose, onDeleted }) {
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState("");

  async function confirmar() {
    setErro("");
    setExcluindo(true);
    try {
      await api.remover(pergunta.id);
      onDeleted("Pergunta excluída.");
    } catch (e) {
      setErro(e.message);
      setExcluindo(false);
    }
  }

  return (
    <Modal
      titulo="Excluir pergunta"
      tituloId="perguntas-excluir-titulo"
      onClose={excluindo ? () => {} : onClose}
    >
      <div className="perguntas-confirmacao">
        <div className="perguntas-alerta-icone" aria-hidden="true"><TriangleAlert size={22} /></div>
        <p>
          Tem certeza que deseja excluir <strong>“{pergunta.pergunta}”</strong>? As respostas dos
          animais para essa pergunta também serão removidas e essa ação não pode ser desfeita.
        </p>
      </div>
      {erro && <p className="perguntas-mensagem erro" role="alert">{erro}</p>}
      <div className="perguntas-modal-acoes">
        <button className="perguntas-btn secundario" type="button" onClick={onClose} disabled={excluindo}>
          Cancelar
        </button>
        <button className="perguntas-btn perigo" type="button" onClick={confirmar} disabled={excluindo}>
          {excluindo ? <LoaderCircle className="girando" size={17} /> : <Trash2 size={17} />}
          {excluindo ? "Excluindo…" : "Excluir"}
        </button>
      </div>
    </Modal>
  );
}

/* ─── Tela ─────────────────────────────────────────────────────────────── */

export default function AdminPerguntas() {
  const [perguntas, setPerguntas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [formulario, setFormulario] = useState(null); // null | { pergunta: Pergunta | null }
  const [paraExcluir, setParaExcluir] = useState(null);
  const [aviso, setAviso] = useState("");

  const carregar = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) setCarregando(true);
    setErro("");
    try {
      setPerguntas(await api.listar());
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
    return perguntas
      .filter((p) => normalizar(p.pergunta).includes(termo))
      .sort((a, b) => a.id - b.id);
  }, [perguntas, busca]);

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
    <main className="perguntas-page">
      <section className="perguntas-container" aria-labelledby="perguntas-titulo">
        <header className="perguntas-header">
          <div>
            <div className="perguntas-eyebrow"><ShieldCheck size={15} /> PAINEL ADMINISTRATIVO</div>
            <h1 id="perguntas-titulo">Perguntas</h1>
            <p className="perguntas-intro">Cadastre, edite e remova as perguntas que o Akinator Animal faz.</p>
          </div>
          <div className="perguntas-header-actions">
            <a className="perguntas-btn secundario voltar-admin" href="/?page=admin">
              ← Voltar ao painel
            </a>
            <button
              className="perguntas-btn primario"
              type="button"
              onClick={() => setFormulario({ pergunta: null })}
              disabled={carregando && perguntas.length === 0}
            >
              <Plus size={18} /> Nova pergunta
            </button>
          </div>
        </header>

        {aviso && (
          <p className="perguntas-mensagem sucesso" role="status">
            <Check size={16} /> {aviso}
          </p>
        )}

        <div className="perguntas-card">
          <div className="perguntas-toolbar">
            <div className="perguntas-busca">
              <Search size={17} aria-hidden="true" />
              <input
                className="perguntas-input"
                type="search"
                placeholder="Buscar pergunta…"
                aria-label="Buscar pergunta"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
              />
            </div>
            {!carregando && !erro && (
              <span className="perguntas-contador">{pluralizar(visiveis.length, "pergunta", "perguntas")}</span>
            )}
          </div>

          {carregando ? (
            <div className="perguntas-estado" role="status">
              <LoaderCircle className="girando" size={26} />
              <p>Carregando perguntas…</p>
            </div>
          ) : erro ? (
            <div className="perguntas-estado">
              <TriangleAlert size={26} />
              <p className="perguntas-mensagem erro" role="alert">{erro}</p>
              <button className="perguntas-btn secundario" type="button" onClick={() => carregar()}>
                <RefreshCw size={16} /> Tentar novamente
              </button>
            </div>
          ) : visiveis.length === 0 ? (
            <div className="perguntas-estado">
              <CircleHelp size={26} />
              <p>
                {perguntas.length === 0
                  ? "Nenhuma pergunta cadastrada ainda."
                  : `Nenhuma pergunta encontrada para "${busca}".`}
              </p>
            </div>
          ) : (
            <ul className="perguntas-lista">
              <li className="perguntas-linha cabecalho" aria-hidden="true">
                <span>Pergunta</span>
                <span>Animais</span>
                <span>Criada em</span>
                <span />
              </li>
              {visiveis.map((item) => (
                <li className="perguntas-linha" key={item.id}>
                  <span className="perguntas-texto">{item.pergunta}</span>
                  <span className="perguntas-meta" data-rotulo="Animais">
                    {item.total_animais ?? "—"}
                  </span>
                  <span className="perguntas-meta" data-rotulo="Criada em">
                    {formatarData(item.criado_em)}
                  </span>
                  <span className="perguntas-acoes">
                    <button
                      className="perguntas-icon-button"
                      type="button"
                      onClick={() => setFormulario({ pergunta: item })}
                      aria-label={`Editar pergunta: ${item.pergunta}`}
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      className="perguntas-icon-button perigo"
                      type="button"
                      onClick={() => setParaExcluir(item)}
                      aria-label={`Excluir pergunta: ${item.pergunta}`}
                    >
                      <Trash2 size={17} />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="perguntas-rodape">
          AKINATOR ANIMAL <span>·</span> PAINEL ADMINISTRATIVO
        </p>
      </section>

      {formulario && (
        <FormularioPergunta
          pergunta={formulario.pergunta}
          perguntas={perguntas}
          onClose={() => setFormulario(null)}
          onSaved={aoSalvar}
        />
      )}

      {paraExcluir && (
        <ConfirmarExclusao
          pergunta={paraExcluir}
          onClose={() => setParaExcluir(null)}
          onDeleted={aoExcluir}
        />
      )}
    </main>
  );
}
