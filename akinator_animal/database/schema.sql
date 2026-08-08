-- ============================================================
-- Akinator Animal - Schema do Banco de Dados
-- ============================================================

CREATE DATABASE IF NOT EXISTS akinator_animal
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE akinator_animal;

-- Tabela de animais conhecidos
CREATE TABLE IF NOT EXISTS animais (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nome        VARCHAR(100) NOT NULL UNIQUE,
    criado_em   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de características/perguntas disponíveis
CREATE TABLE IF NOT EXISTS caracteristicas (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    pergunta    VARCHAR(255) NOT NULL UNIQUE,
    criado_em   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de relacionamento: animal <-> característica (resposta true/false)
CREATE TABLE IF NOT EXISTS animal_caracteristica (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    animal_id         INT NOT NULL,
    caracteristica_id INT NOT NULL,
    resposta          TINYINT(1) NOT NULL,  -- 1 = Sim, 0 = Não
    FOREIGN KEY (animal_id)         REFERENCES animais(id) ON DELETE CASCADE,
    FOREIGN KEY (caracteristica_id) REFERENCES caracteristicas(id) ON DELETE CASCADE,
    UNIQUE KEY uq_animal_carac (animal_id, caracteristica_id)
);

-- ============================================================
-- Dados iniciais - Características / Perguntas
-- ============================================================
INSERT IGNORE INTO caracteristicas (pergunta) VALUES
    ('O animal é mamífero?'),
    ('O animal vive na água?'),
    ('O animal tem penas?'),
    ('O animal tem quatro patas?'),
    ('O animal é carnívoro?'),
    ('O animal é doméstico?'),
    ('O animal pode voar?'),
    ('O animal é de grande porte (maior que um cachorro médio)?'),
    ('O animal vive em grupo/manada?'),
    ('O animal tem cauda?'),
    ('O animal é venenoso?'),
    ('O animal é encontrado na África?'),
    ('O animal hiberna?'),
    ('O animal tem escamas?'),
    ('O animal é réptil?');

-- ============================================================
-- Dados iniciais - Animais
-- ============================================================
INSERT IGNORE INTO animais (nome) VALUES
    ('Cachorro'),
    ('Gato'),
    ('Leão'),
    ('Tubarão'),
    ('Águia'),
    ('Cobra'),
    ('Cavalo'),
    ('Golfinho'),
    ('Elefante'),
    ('Pinguim');

-- ============================================================
-- Mapeamento Animal <-> Características
-- (animal_id, caracteristica_id, resposta)
-- IDs de características:
--  1=mamífero, 2=vive na água, 3=tem penas, 4=quatro patas,
--  5=carnívoro, 6=doméstico, 7=voa, 8=grande porte,
--  9=vive em grupo, 10=tem cauda, 11=venenoso,
--  12=encontrado na África, 13=hiberna, 14=escamas, 15=réptil
-- ============================================================

-- Cachorro (id=1)
INSERT IGNORE INTO animal_caracteristica (animal_id, caracteristica_id, resposta)
SELECT a.id, c.id, v.resposta
FROM animais a
JOIN (VALUES
    ROW(1,1), ROW(2,0), ROW(3,0), ROW(4,1),
    ROW(5,0), ROW(6,1), ROW(7,0), ROW(8,0),
    ROW(9,0), ROW(10,1), ROW(11,0), ROW(12,0),
    ROW(13,0), ROW(14,0), ROW(15,0)
) AS v(carac_id, resposta) ON TRUE
JOIN caracteristicas c ON c.id = v.carac_id
WHERE a.nome = 'Cachorro';

-- Gato (id=2)
INSERT IGNORE INTO animal_caracteristica (animal_id, caracteristica_id, resposta)
SELECT a.id, c.id, v.resposta
FROM animais a
JOIN (VALUES
    ROW(1,1), ROW(2,0), ROW(3,0), ROW(4,1),
    ROW(5,1), ROW(6,1), ROW(7,0), ROW(8,0),
    ROW(9,0), ROW(10,1), ROW(11,0), ROW(12,0),
    ROW(13,0), ROW(14,0), ROW(15,0)
) AS v(carac_id, resposta) ON TRUE
JOIN caracteristicas c ON c.id = v.carac_id
WHERE a.nome = 'Gato';

-- Leão (id=3)
INSERT IGNORE INTO animal_caracteristica (animal_id, caracteristica_id, resposta)
SELECT a.id, c.id, v.resposta
FROM animais a
JOIN (VALUES
    ROW(1,1), ROW(2,0), ROW(3,0), ROW(4,1),
    ROW(5,1), ROW(6,0), ROW(7,0), ROW(8,1),
    ROW(9,1), ROW(10,1), ROW(11,0), ROW(12,1),
    ROW(13,0), ROW(14,0), ROW(15,0)
) AS v(carac_id, resposta) ON TRUE
JOIN caracteristicas c ON c.id = v.carac_id
WHERE a.nome = 'Leão';

-- Tubarão (id=4)
INSERT IGNORE INTO animal_caracteristica (animal_id, caracteristica_id, resposta)
SELECT a.id, c.id, v.resposta
FROM animais a
JOIN (VALUES
    ROW(1,0), ROW(2,1), ROW(3,0), ROW(4,0),
    ROW(5,1), ROW(6,0), ROW(7,0), ROW(8,1),
    ROW(9,0), ROW(10,1), ROW(11,0), ROW(12,0),
    ROW(13,0), ROW(14,1), ROW(15,0)
) AS v(carac_id, resposta) ON TRUE
JOIN caracteristicas c ON c.id = v.carac_id
WHERE a.nome = 'Tubarão';

-- Águia (id=5)
INSERT IGNORE INTO animal_caracteristica (animal_id, caracteristica_id, resposta)
SELECT a.id, c.id, v.resposta
FROM animais a
JOIN (VALUES
    ROW(1,0), ROW(2,0), ROW(3,1), ROW(4,0),
    ROW(5,1), ROW(6,0), ROW(7,1), ROW(8,0),
    ROW(9,0), ROW(10,1), ROW(11,0), ROW(12,1),
    ROW(13,0), ROW(14,0), ROW(15,0)
) AS v(carac_id, resposta) ON TRUE
JOIN caracteristicas c ON c.id = v.carac_id
WHERE a.nome = 'Águia';

-- Cobra (id=6)
INSERT IGNORE INTO animal_caracteristica (animal_id, caracteristica_id, resposta)
SELECT a.id, c.id, v.resposta
FROM animais a
JOIN (VALUES
    ROW(1,0), ROW(2,0), ROW(3,0), ROW(4,0),
    ROW(5,1), ROW(6,0), ROW(7,0), ROW(8,0),
    ROW(9,0), ROW(10,1), ROW(11,1), ROW(12,1),
    ROW(13,0), ROW(14,1), ROW(15,1)
) AS v(carac_id, resposta) ON TRUE
JOIN caracteristicas c ON c.id = v.carac_id
WHERE a.nome = 'Cobra';

-- Cavalo (id=7)
INSERT IGNORE INTO animal_caracteristica (animal_id, caracteristica_id, resposta)
SELECT a.id, c.id, v.resposta
FROM animais a
JOIN (VALUES
    ROW(1,1), ROW(2,0), ROW(3,0), ROW(4,1),
    ROW(5,0), ROW(6,1), ROW(7,0), ROW(8,1),
    ROW(9,1), ROW(10,1), ROW(11,0), ROW(12,0),
    ROW(13,0), ROW(14,0), ROW(15,0)
) AS v(carac_id, resposta) ON TRUE
JOIN caracteristicas c ON c.id = v.carac_id
WHERE a.nome = 'Cavalo';

-- Golfinho (id=8)
INSERT IGNORE INTO animal_caracteristica (animal_id, caracteristica_id, resposta)
SELECT a.id, c.id, v.resposta
FROM animais a
JOIN (VALUES
    ROW(1,1), ROW(2,1), ROW(3,0), ROW(4,0),
    ROW(5,1), ROW(6,0), ROW(7,0), ROW(8,1),
    ROW(9,1), ROW(10,1), ROW(11,0), ROW(12,0),
    ROW(13,0), ROW(14,0), ROW(15,0)
) AS v(carac_id, resposta) ON TRUE
JOIN caracteristicas c ON c.id = v.carac_id
WHERE a.nome = 'Golfinho';

-- Elefante (id=9)
INSERT IGNORE INTO animal_caracteristica (animal_id, caracteristica_id, resposta)
SELECT a.id, c.id, v.resposta
FROM animais a
JOIN (VALUES
    ROW(1,1), ROW(2,0), ROW(3,0), ROW(4,1),
    ROW(5,0), ROW(6,0), ROW(7,0), ROW(8,1),
    ROW(9,1), ROW(10,1), ROW(11,0), ROW(12,1),
    ROW(13,0), ROW(14,0), ROW(15,0)
) AS v(carac_id, resposta) ON TRUE
JOIN caracteristicas c ON c.id = v.carac_id
WHERE a.nome = 'Elefante';

-- Pinguim (id=10)
INSERT IGNORE INTO animal_caracteristica (animal_id, caracteristica_id, resposta)
SELECT a.id, c.id, v.resposta
FROM animais a
JOIN (VALUES
    ROW(1,0), ROW(2,1), ROW(3,1), ROW(4,0),
    ROW(5,1), ROW(6,0), ROW(7,0), ROW(8,0),
    ROW(9,1), ROW(10,0), ROW(11,0), ROW(12,0),
    ROW(13,0), ROW(14,0), ROW(15,0)
) AS v(carac_id, resposta) ON TRUE
JOIN caracteristicas c ON c.id = v.carac_id
WHERE a.nome = 'Pinguim';
