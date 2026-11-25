// Informações dos animais exibidas na tela de palpite.
// As chaves são os nomes em português enviados pela API (TRADUCOES em api/akinator-api/main.py).
// "wiki" é o título do artigo na Wikipédia em inglês usado para buscar a foto.

const ANIMAIS = {
  "Porco-formigueiro": { wiki: "Aardvark", descricao: "Mamífero africano noturno de focinho comprido que usa a língua pegajosa para comer formigas e cupins." },
  "Antílope": { wiki: "Antelope", descricao: "Herbívoro ágil e veloz das savanas, com chifres permanentes e pernas longas para fugir de predadores." },
  "Robalo": { wiki: "Common snook", descricao: "Peixe predador de águas costeiras e estuários, muito apreciado na pesca esportiva." },
  "Urso": { wiki: "Bear", descricao: "Mamífero grande e forte, de pelagem densa e dieta onívora; muitas espécies hibernam no inverno." },
  "Javali": { wiki: "Wild boar", descricao: "Porco selvagem robusto, com presas salientes e focinho usado para revirar o solo em busca de comida." },
  "Búfalo": { wiki: "African buffalo", descricao: "Bovino de grande porte e chifres curvados que vive em manadas e é conhecido pelo temperamento forte." },
  "Bezerro": { wiki: "Cattle", descricao: "Filhote do gado bovino, que se alimenta do leite materno nos primeiros meses de vida." },
  "Carpa": { wiki: "Common carp", descricao: "Peixe de água doce resistente, muito criado em lagos e tanques ornamentais." },
  "Bagre": { wiki: "Catfish", descricao: "Peixe de água doce com 'bigodes' sensoriais (barbilhões) ao redor da boca e corpo sem escamas." },
  "Porquinho-da-índia": { wiki: "Guinea pig", descricao: "Pequeno roedor sul-americano dócil, muito popular como animal de estimação." },
  "Guepardo": { wiki: "Cheetah", descricao: "Felino de manchas pretas e o animal terrestre mais rápido, podendo passar dos 100 km/h em arrancadas curtas." },
  "Galinha": { wiki: "Chicken", descricao: "Ave doméstica criada no mundo todo pela carne e pelos ovos; voa muito pouco." },
  "Peixe-chub": { wiki: "Squalius cephalus", descricao: "Peixe europeu de rios e riachos, de corpo alongado e escamas prateadas." },
  "Amêijoa": { wiki: "Ruditapes decussatus", descricao: "Molusco com concha de duas valvas que vive enterrado na areia ou no lodo e filtra a água para se alimentar." },
  "Caranguejo": { wiki: "Crab", descricao: "Crustáceo de carapaça dura, dez patas e pinças, famoso por andar de lado." },
  "Lagostim": { wiki: "Crayfish", descricao: "Crustáceo de água doce parecido com uma pequena lagosta, com pinças fortes." },
  "Corvo": { wiki: "Crow", descricao: "Ave de plumagem preta considerada uma das mais inteligentes, capaz de usar ferramentas." },
  "Veado": { wiki: "Deer", descricao: "Mamífero herbívoro elegante; os machos da maioria das espécies têm galhadas que caem e renascem todo ano." },
  "Golfinho": { wiki: "Dolphin", descricao: "Mamífero marinho muito inteligente e sociável que se comunica por assobios e usa ecolocalização." },
  "Pomba": { wiki: "Rock dove", descricao: "Ave comum nas cidades, com ótimo senso de orientação; já foi usada para levar mensagens." },
  "Pato": { wiki: "Duck", descricao: "Ave aquática de bico achatado e patas com membranas, ótima nadadora." },
  "Elefante": { wiki: "Elephant", descricao: "O maior animal terrestre, com tromba versátil, grandes orelhas e presas de marfim." },
  "Flamingo": { wiki: "Flamingo", descricao: "Ave pernalta de cor rosada, que vem dos pigmentos dos crustáceos e algas que come; costuma descansar numa perna só." },
  "Pulga": { wiki: "Flea", descricao: "Inseto minúsculo e sem asas que se alimenta de sangue e salta distâncias enormes para o seu tamanho." },
  "Sapo": { wiki: "Frog", descricao: "Anfíbio de pele úmida e pernas traseiras longas para saltar; nasce como girino na água." },
  "Morcego-frutívoro": { wiki: "Megabat", descricao: "Morcego que se alimenta de frutas e néctar, importante dispersor de sementes e polinizador." },
  "Girafa": { wiki: "Giraffe", descricao: "O animal mais alto do mundo, com pescoço longo para alcançar folhas no alto das árvores." },
  "Humano": { wiki: "Human", descricao: "Primata bípede com cérebro muito desenvolvido, capaz de linguagem complexa e de criar tecnologia." },
  "Mosquito": { wiki: "Gnat", descricao: "Pequeno inseto voador de asas delicadas que costuma formar nuvens perto da água." },
  "Cabra": { wiki: "Goat", descricao: "Mamífero ruminante ágil e curioso, ótimo escalador, criado pelo leite, carne e pelo." },
  "Gorila": { wiki: "Gorilla", descricao: "O maior dos primatas, herbívoro e forte, que vive em grupos nas florestas da África." },
  "Gaivota": { wiki: "Gull", descricao: "Ave marinha comum no litoral, de plumagem branca e cinza e dieta bem variada." },
  "Hadoque": { wiki: "Haddock", descricao: "Peixe do Atlântico Norte com uma mancha escura no flanco, muito usado na culinária." },
  "Hamster": { wiki: "Hamster", descricao: "Pequeno roedor de bochechas elásticas onde guarda comida; popular como animal de estimação." },
  "Lebre": { wiki: "Hare", descricao: "Parente do coelho, com orelhas e patas traseiras mais longas, muito rápida na corrida." },
  "Falcão": { wiki: "Hawk", descricao: "Ave de rapina de visão aguçada e garras fortes que caça pequenos animais em pleno voo." },
  "Arenque": { wiki: "Herring", descricao: "Peixe prateado que forma enormes cardumes nos mares frios e é base de muitas cadeias alimentares." },
  "Abelha": { wiki: "Western honey bee", descricao: "Inseto social que produz mel e cera e é essencial para a polinização das plantas." },
  "Mosca-doméstica": { wiki: "Housefly", descricao: "Inseto muito comum perto das pessoas, com olhos compostos e grande capacidade de reprodução." },
  "Kiwi": { wiki: "Kiwi (bird)", descricao: "Ave da Nova Zelândia que não voa, noturna, com bico longo e narinas na ponta para farejar alimento." },
  "Joaninha": { wiki: "Coccinellidae", descricao: "Besouro pequeno e colorido, geralmente vermelho com pintas pretas, que come pulgões." },
  "Cotovia": { wiki: "Lark", descricao: "Pequena ave de campos abertos, famosa pelo canto melodioso durante o voo." },
  "Leopardo": { wiki: "Leopard", descricao: "Felino de pelagem com rosetas, ótimo escalador, que costuma guardar suas presas em árvores." },
  "Leão": { wiki: "Lion", descricao: "Grande felino que vive em grupos chamados alcateias; os machos têm uma juba característica." },
  "Lagosta": { wiki: "Lobster", descricao: "Crustáceo marinho de corpo alongado e antenas longas, muito valorizado na gastronomia." },
  "Lince": { wiki: "Lynx", descricao: "Felino de porte médio com tufos de pelo nas pontas das orelhas e cauda curta." },
  "Vison": { wiki: "American mink", descricao: "Pequeno mamífero semiaquático de pelagem escura e brilhante, parente da lontra e da doninha." },
  "Toupeira": { wiki: "Mole (animal)", descricao: "Mamífero que vive em túneis subterrâneos, com patas dianteiras em forma de pá e visão muito reduzida." },
  "Mangusto": { wiki: "Mongoose", descricao: "Pequeno carnívoro ágil, famoso por enfrentar e caçar cobras venenosas." },
  "Mariposa": { wiki: "Moth", descricao: "Inseto parente da borboleta, geralmente noturno e atraído pela luz." },
  "Tritão": { wiki: "Newt", descricao: "Anfíbio de cauda longa, parecido com uma salamandra, que passa parte da vida na água." },
  "Polvo": { wiki: "Octopus", descricao: "Molusco marinho de oito braços com ventosas, muito inteligente e mestre da camuflagem." },
  "Gambá": { wiki: "Opossum", descricao: "Marsupial das Américas que carrega os filhotes e pode se fingir de morto quando ameaçado." },
  "Órix": { wiki: "Oryx", descricao: "Antílope do deserto com chifres longos e retos, adaptado a passar muito tempo sem beber água." },
  "Avestruz": { wiki: "Common ostrich", descricao: "A maior ave do mundo; não voa, mas é uma corredora muito veloz." },
  "Periquito": { wiki: "Budgerigar", descricao: "Pequena ave colorida e sociável, popular como animal de estimação e capaz de imitar sons." },
  "Pinguim": { wiki: "Penguin", descricao: "Ave marinha que não voa, mas nada muito bem; vive principalmente no Hemisfério Sul." },
  "Faisão": { wiki: "Common pheasant", descricao: "Ave terrestre de cauda longa; os machos têm plumagem muito colorida." },
  "Lúcio": { wiki: "Northern pike", descricao: "Peixe predador de água doce, de corpo alongado e boca cheia de dentes afiados." },
  "Piranha": { wiki: "Piranha", descricao: "Peixe de rios sul-americanos com dentes muito afiados, que costuma viver em cardumes." },
  "Jararaca": { wiki: "Bothrops jararaca", descricao: "Serpente venenosa brasileira com fossetas loreais que detectam o calor das presas." },
  "Ornitorrinco": { wiki: "Platypus", descricao: "Mamífero australiano que bota ovos e tem bico de pato, cauda de castor e esporão venenoso." },
  "Furão": { wiki: "European polecat", descricao: "Pequeno carnívoro de corpo alongado, ágil e curioso, parente da doninha." },
  "Pônei": { wiki: "Pony", descricao: "Cavalo de pequeno porte, robusto e resistente, muito usado por crianças em passeios." },
  "Boto": { wiki: "Porpoise", descricao: "Mamífero marinho parecido com o golfinho, porém menor e com focinho arredondado." },
  "Puma": { wiki: "Cougar", descricao: "Grande felino das Américas, também chamado onça-parda ou suçuarana, excelente saltador." },
  "Gato": { wiki: "Cat", descricao: "Felino doméstico ágil e independente, com ótima visão noturna e sentidos aguçados." },
  "Guaxinim": { wiki: "Raccoon", descricao: "Mamífero de 'máscara' preta no rosto e patas dianteiras muito habilidosas." },
  "Rena": { wiki: "Reindeer", descricao: "Cervídeo das regiões frias em que machos e fêmeas têm galhadas; faz longas migrações." },
  "Ema": { wiki: "Greater rhea", descricao: "A maior ave da América do Sul; não voa, mas corre muito rápido pelos campos." },
  "Escorpião": { wiki: "Scorpion", descricao: "Aracnídeo com pinças e uma cauda que termina em ferrão venenoso." },
  "Cavalo-marinho": { wiki: "Seahorse", descricao: "Peixe de cabeça parecida com a de um cavalo, nada na vertical; é o macho quem carrega os filhotes." },
  "Foca": { wiki: "Pinniped", descricao: "Mamífero marinho de corpo roliço e nadadeiras, ágil na água e desajeitado em terra." },
  "Leão-marinho": { wiki: "Sea lion", descricao: "Mamífero marinho com orelhas externas visíveis, capaz de 'andar' em terra usando as nadadeiras." },
  "Cobra-do-mar": { wiki: "Sea snake", descricao: "Serpente adaptada à vida no mar, com cauda achatada como um remo e veneno potente." },
  "Água-viva": { wiki: "Chironex fleckeri", descricao: "Animal marinho gelatinoso com tentáculos urticantes; algumas espécies são extremamente venenosas." },
  "Talha-mar": { wiki: "Black skimmer", descricao: "Ave costeira cujo bico tem a parte de baixo mais longa, usada para 'cortar' a água e pegar peixes." },
  "Skua": { wiki: "Skua", descricao: "Ave marinha predadora que muitas vezes rouba alimento de outras aves em pleno voo." },
  "Cobra-de-vidro": { wiki: "Slow worm", descricao: "Lagarto sem patas que parece uma cobra e pode soltar a cauda para escapar de predadores." },
  "Lesma": { wiki: "Slug", descricao: "Molusco terrestre sem concha que se move deslizando sobre uma camada de muco." },
  "Linguado": { wiki: "Common sole", descricao: "Peixe achatado que vive no fundo do mar, com os dois olhos do mesmo lado do corpo." },
  "Pardal": { wiki: "House sparrow", descricao: "Pequena ave marrom e cinza, muito comum em cidades do mundo inteiro." },
  "Esquilo": { wiki: "Squirrel", descricao: "Roedor de cauda peluda, ágil escalador de árvores, que costuma estocar sementes e nozes." },
  "Estrela-do-mar": { wiki: "Starfish", descricao: "Animal marinho geralmente com cinco braços, capaz de regenerar partes do corpo perdidas." },
  "Arraia": { wiki: "Stingray", descricao: "Peixe cartilaginoso de corpo achatado, com ferrão na cauda, que vive no fundo de mares e rios." },
  "Cisne": { wiki: "Swan", descricao: "Ave aquática grande e elegante, de pescoço longo, que costuma formar casais para a vida toda." },
  "Cupim": { wiki: "Termite", descricao: "Inseto social que vive em grandes colônias, constrói ninhos (cupinzeiros) e se alimenta de madeira." },
  "Sapo-cururu": { wiki: "Cane toad", descricao: "Grande sapo de pele rugosa com glândulas que produzem uma toxina para se defender." },
  "Tartaruga": { wiki: "Tortoise", descricao: "Réptil terrestre com casco duro e protetor; algumas espécies vivem mais de 100 anos." },
  "Tuatara": { wiki: "Tuatara", descricao: "Réptil raro da Nova Zelândia, considerado um 'fóssil vivo' por sua linhagem muito antiga." },
  "Atum": { wiki: "Tuna", descricao: "Peixe oceânico grande, veloz e migratório, muito importante na pesca comercial." },
  "Morcego-vampiro": { wiki: "Vampire bat", descricao: "Morcego das Américas que se alimenta de pequenas quantidades de sangue de outros animais." },
  "Rato-do-campo": { wiki: "Vole", descricao: "Pequeno roedor de focinho arredondado e cauda curta que vive em campos e pradarias." },
  "Abutre": { wiki: "Vulture", descricao: "Ave necrófaga que se alimenta de carcaças, ajudando a limpar o ambiente." },
  "Canguru-pequeno": { wiki: "Wallaby", descricao: "Marsupial australiano parecido com um canguru, porém menor, que se locomove aos saltos." },
  "Vespa": { wiki: "Wasp", descricao: "Inseto de cintura fina e ferrão; muitas espécies são predadoras de outros insetos." },
  "Lobo": { wiki: "Wolf", descricao: "Canídeo selvagem que vive e caça em matilhas organizadas e se comunica por uivos." },
  "Minhoca": { wiki: "Earthworm", descricao: "Anelídeo que vive no solo e o deixa mais fértil ao cavar túneis e decompor matéria orgânica." },
  "Carriça": { wiki: "Eurasian wren", descricao: "Ave muito pequena e arredondada, de cauda erguida e canto surpreendentemente alto." },
};

function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

const ANIMAIS_NORMALIZADOS = new Map(
  Object.entries(ANIMAIS).map(([nome, info]) => [normalizar(nome), info]),
);

/** Retorna { descricao, wiki } do animal ou null se não for conhecido. */
export function getAnimalInfo(nome) {
  return ANIMAIS_NORMALIZADOS.get(normalizar(nome)) ?? null;
}

const cacheImagens = new Map();

async function buscarResumoWikipedia(idioma, titulo) {
  const url = `https://${idioma}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titulo.replace(/ /g, "_"))}`;
  const resposta = await fetch(url, { headers: { Accept: "application/json" } });
  if (!resposta.ok) return null;
  const dados = await resposta.json();
  return {
    imagem: dados?.thumbnail?.source ?? dados?.originalimage?.source ?? null,
    extrato: typeof dados?.extract === "string" ? dados.extract : "",
  };
}

/**
 * Busca a foto (e, para nomes desconhecidos, uma descrição) na Wikipédia.
 * Conhecidos: Wikipédia em inglês pelo título mapeado (se não houver foto, tenta em português).
 * Desconhecidos: tenta a Wikipédia em português pelo próprio nome.
 * Nunca lança erro: em caso de falha retorna { imagem: null, extrato: "" }.
 */
export async function buscarDadosWikipedia(nome) {
  const chave = normalizar(nome);
  if (!chave) return { imagem: null, extrato: "" };
  if (cacheImagens.has(chave)) return cacheImagens.get(chave);

  const promessa = (async () => {
    try {
      const info = getAnimalInfo(nome);
      let resultado = info ? await buscarResumoWikipedia("en", info.wiki).catch(() => null) : null;
      if (!resultado?.imagem) {
        const pt = await buscarResumoWikipedia("pt", String(nome).trim()).catch(() => null);
        if (pt?.imagem || !resultado) resultado = pt;
      }
      return resultado ?? { imagem: null, extrato: "" };
    } catch {
      return { imagem: null, extrato: "" };
    }
  })();

  cacheImagens.set(chave, promessa);
  return promessa;
}
