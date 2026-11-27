import { useEffect, useState } from "react";
import { buscarDadosWikipedia, getAnimalInfo } from "./animalInfo.js";
import "./animalPalpite.css";

const DESCRICAO_PADRAO = "Ainda não tenho uma descrição para este animal.";

function limitarTexto(texto, maximo = 220) {
  if (!texto || texto.length <= maximo) return texto;
  const corte = texto.slice(0, maximo);
  const ultimoPonto = corte.lastIndexOf(". ");
  return ultimoPonto > 80 ? corte.slice(0, ultimoPonto + 1) : `${corte.trimEnd()}…`;
}

export default function AnimalPalpite({ nome, label = "Meu palpite" }) {
  const info = getAnimalInfo(nome);
  const [imagem, setImagem] = useState(null);
  const [extrato, setExtrato] = useState("");
  const [imagemFalhou, setImagemFalhou] = useState(false);

  useEffect(() => {
    let ativo = true;
    setImagem(null);
    setExtrato("");
    setImagemFalhou(false);

    buscarDadosWikipedia(nome).then((dados) => {
      if (!ativo) return;
      setImagem(dados.imagem);
      setExtrato(dados.extrato);
    });

    return () => {
      ativo = false;
    };
  }, [nome]);

  const descricao = info?.descricao ?? (limitarTexto(extrato) || DESCRICAO_PADRAO);
  const mostrarFoto = imagem && !imagemFalhou;

  return (
    <div className="animal-palpite">
      <div className="animal-palpite-media">
        {mostrarFoto ? (
          <img
            src={imagem}
            alt={`Foto de ${nome}`}
            loading="lazy"
            onError={() => setImagemFalhou(true)}
          />
        ) : (
          <span className="animal-palpite-icon" aria-hidden="true">🐾</span>
        )}
      </div>
      <div className="animal-palpite-info">
        <p className="animal-palpite-label">{label}</p>
        <h2>{nome}</h2>
        <p className="animal-palpite-descricao">{descricao}</p>
      </div>
    </div>
  );
}
