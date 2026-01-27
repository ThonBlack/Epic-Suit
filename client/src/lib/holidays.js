// Feriados e datas comemorativas brasileiras
// Formato: { mes-dia: { nome, tipo, emoji } }
// tipo: 'feriado' = feriado nacional, 'comemorativo' = data comemorativa

export const holidays = {
    '01-01': { nome: 'Ano Novo', tipo: 'feriado', emoji: '🎉' },
    '01-06': { nome: 'Dia de Reis', tipo: 'comemorativo', emoji: '👑' },
    '01-25': { nome: 'Aniversário de São Paulo', tipo: 'comemorativo', emoji: '🏙️' },

    '02-14': { nome: 'Dia de São Valentim', tipo: 'comemorativo', emoji: '💕' },

    '03-08': { nome: 'Dia da Mulher', tipo: 'comemorativo', emoji: '👩' },
    '03-15': { nome: 'Dia do Consumidor', tipo: 'comemorativo', emoji: '🛒' },
    '03-20': { nome: 'Início do Outono', tipo: 'comemorativo', emoji: '🍂' },

    '04-07': { nome: 'Dia Mundial da Saúde', tipo: 'comemorativo', emoji: '🏥' },
    '04-19': { nome: 'Dia do Índio', tipo: 'comemorativo', emoji: '🪶' },
    '04-21': { nome: 'Tiradentes', tipo: 'feriado', emoji: '🇧🇷' },
    '04-22': { nome: 'Descobrimento do Brasil', tipo: 'comemorativo', emoji: '🚢' },
    '04-23': { nome: 'Dia de São Jorge', tipo: 'comemorativo', emoji: '⚔️' },

    '05-01': { nome: 'Dia do Trabalho', tipo: 'feriado', emoji: '💼' },
    '05-13': { nome: 'Abolição da Escravatura', tipo: 'comemorativo', emoji: '⛓️' },

    '06-05': { nome: 'Dia do Meio Ambiente', tipo: 'comemorativo', emoji: '🌿' },
    '06-12': { nome: 'Dia dos Namorados', tipo: 'comemorativo', emoji: '❤️' },
    '06-21': { nome: 'Início do Inverno', tipo: 'comemorativo', emoji: '❄️' },
    '06-24': { nome: 'São João', tipo: 'comemorativo', emoji: '🎆' },
    '06-29': { nome: 'São Pedro', tipo: 'comemorativo', emoji: '🔑' },

    '07-09': { nome: 'Revolução Constitucionalista', tipo: 'comemorativo', emoji: '⚔️' },
    '07-20': { nome: 'Dia do Amigo', tipo: 'comemorativo', emoji: '🤝' },
    '07-25': { nome: 'Dia do Escritor', tipo: 'comemorativo', emoji: '✍️' },
    '07-26': { nome: 'Dia dos Avós', tipo: 'comemorativo', emoji: '👴👵' },

    '08-11': { nome: 'Dia dos Pais', tipo: 'comemorativo', emoji: '👨' },
    '08-15': { nome: 'Dia da Informática', tipo: 'comemorativo', emoji: '💻' },
    '08-22': { nome: 'Dia do Folclore', tipo: 'comemorativo', emoji: '🎭' },
    '08-25': { nome: 'Dia do Soldado', tipo: 'comemorativo', emoji: '🪖' },

    '09-07': { nome: 'Independência do Brasil', tipo: 'feriado', emoji: '🇧🇷' },
    '09-21': { nome: 'Dia da Árvore', tipo: 'comemorativo', emoji: '🌳' },
    '09-22': { nome: 'Início da Primavera', tipo: 'comemorativo', emoji: '🌸' },

    '10-12': { nome: 'Nossa Senhora Aparecida / Dia das Crianças', tipo: 'feriado', emoji: '👶' },
    '10-15': { nome: 'Dia do Professor', tipo: 'comemorativo', emoji: '📚' },
    '10-28': { nome: 'Dia do Servidor Público', tipo: 'comemorativo', emoji: '🏛️' },
    '10-31': { nome: 'Halloween', tipo: 'comemorativo', emoji: '🎃' },

    '11-02': { nome: 'Finados', tipo: 'feriado', emoji: '🕯️' },
    '11-15': { nome: 'Proclamação da República', tipo: 'feriado', emoji: '🇧🇷' },
    '11-20': { nome: 'Dia da Consciência Negra', tipo: 'comemorativo', emoji: '✊🏿' },
    '11-25': { nome: 'Black Friday', tipo: 'comemorativo', emoji: '🏷️' },

    '12-13': { nome: 'Dia de Santa Luzia', tipo: 'comemorativo', emoji: '👀' },
    '12-21': { nome: 'Início do Verão', tipo: 'comemorativo', emoji: '☀️' },
    '12-24': { nome: 'Véspera de Natal', tipo: 'comemorativo', emoji: '🎄' },
    '12-25': { nome: 'Natal', tipo: 'feriado', emoji: '🎅' },
    '12-31': { nome: 'Véspera de Ano Novo', tipo: 'comemorativo', emoji: '🥂' },
};

// Função para calcular feriados móveis (Páscoa, Carnaval, Corpus Christi)
export function getMovingHolidays(year) {
    // Algoritmo de Meeus/Jones/Butcher para calcular a Páscoa
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    const easter = new Date(year, month - 1, day);

    // Carnaval: 47 dias antes da Páscoa
    const carnival = new Date(easter);
    carnival.setDate(easter.getDate() - 47);

    // Sexta-feira Santa: 2 dias antes da Páscoa
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);

    // Corpus Christi: 60 dias depois da Páscoa
    const corpusChristi = new Date(easter);
    corpusChristi.setDate(easter.getDate() + 60);

    const formatDate = (date) => {
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${m}-${d}`;
    };

    return {
        [formatDate(carnival)]: { nome: 'Carnaval', tipo: 'feriado', emoji: '🎭' },
        [formatDate(goodFriday)]: { nome: 'Sexta-feira Santa', tipo: 'feriado', emoji: '✝️' },
        [formatDate(easter)]: { nome: 'Páscoa', tipo: 'feriado', emoji: '🐰' },
        [formatDate(corpusChristi)]: { nome: 'Corpus Christi', tipo: 'feriado', emoji: '✨' },
    };
}

// Retorna todos os feriados de um ano (fixos + móveis)
export function getAllHolidays(year) {
    return { ...holidays, ...getMovingHolidays(year) };
}

// Verifica se uma data é feriado
export function getHoliday(date) {
    const year = date.getFullYear();
    const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const allHolidays = getAllHolidays(year);
    return allHolidays[monthDay] || null;
}
