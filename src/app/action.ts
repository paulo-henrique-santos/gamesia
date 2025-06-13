// app/actions.ts
'use server'; // Indica que este arquivo contém Server Actions

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

// Verifica se a chave de API está configurada
if (!process.env.GOOGLE_API_KEY) {
  throw new Error('Variável de ambiente GOOGLE_API_KEY não configurada.');
}

// Inicializa o cliente Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Define o modelo que será usado
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }); // Usando gemini-2.0-flash para um bom equilíbrio entre custo e desempenho

interface PerguntaQuestionario {
  pergunta: string;
  alternativas: string[];
  respostaCorreta: string;
}

interface QuestionarioGerado {
  assunto: string;
  perguntas: PerguntaQuestionario[];
}

export async function gerarQuestionarioGemini(assunto: string): Promise<{ success: boolean; data?: QuestionarioGerado; message?: string }> {
  const prompt = `
    Crie um questionário de 10 perguntas e 4 alternativas (sendo apenas uma correta) sobre o assunto de videogames: "${assunto}".
    As perguntas devem ser focadas em fatos, lore ou mecânicas do jogo.
    AS PERGUNTAS E RESPOSTAS TÊM QUE ESTAR **CORRETAS**.
    **CORRETAS CARA, PERGUNTAS POR FAVOR CORRETAS.**
    PERGUNTAS E RESPOSTAS EM PORTUGUÊS-BRASILEIRO.
    **POR FAVOR EM PORTUGUÊS-BRASILEIRO**.
    Cada pergunta deve ter 4 alternativas, onde apenas uma é a resposta correta.
    AS PERGUNTAS E RESPOSTAS DEVEM ESTAR EM PORTUGUÊS-BRASILEIRO.
    Se o assunto não for claramente um videogame, retorne uma mensagem de erro indicando que o assunto não é apropriado.
    O retorno deve ser **APENAS** um objeto JSON no seguinte formato. Não adicione nenhum texto adicional antes ou depois do JSON.

    Exemplo de formato para um assunto válido:
    {
      "assunto": "Five Nights at Freddy's",
      "perguntas": [
        {
          "pergunta": "Quem é o principal antagonista da série Five Nights at Freddy's?",
          "alternativas": ["Freddy Fazbear", "Bonnie", "Chica", "Springtrap"],
          "respostaCorreta": "Springtrap"
        },
        // ... mais 9 perguntas
      ]
    }

    Exemplo de formato para um assunto NÃO válido:
    {
      "erro": "O assunto 'Futebol' não é apropriado para um questionário de videogames."
    }

    Garanta que a resposta correta esteja **sempre** presente nas alternativas.
    Garanta que as perguntas sejam variadas e cubram diferentes aspectos do jogo, como personagens, mecânicas, história e curiosidades.
    Garanta que as respostas estejam em português e sejam claras.
    Use linguagem simples e direta, adequada para jogadores de diferentes níveis de conhecimento.
    Evite perguntas excessivamente técnicas ou que exijam conhecimento avançado.
    Use nomes de personagens, locais e itens que sejam amplamente reconhecidos pelos fãs do jogo.
    Evite que as respostas corretas estejam **realmente** corretas.
    Evite perguntas que possam ser consideradas ofensivas ou inapropriadas.
    Evite perguntas que sejam muito subjetivas ou que possam ter múltiplas respostas corretas.
    Garanta que as perguntas sejam de múltipla escolha clara e direta.
    `;

  try {
    const result = await model.generateContent(prompt);

    // A resposta do Gemini pode vir em pedaços (chunks), então pegamos o texto completo.
    const response = await result.response;
    const text = response.text();

    console.log("Resposta bruta do Gemini:", text); // Para depuração

    // Tentar parsear o JSON. O Gemini pode adicionar blocos de código Markdown.
    let jsonString = text.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.substring(7, jsonString.lastIndexOf('```')).trim();
    } else if (jsonString.startsWith('```')) { // Caso venha apenas com ```
        jsonString = jsonString.substring(3, jsonString.lastIndexOf('```')).trim();
    }


    const parsedData = JSON.parse(jsonString);

    if (parsedData.erro) {
      return { success: false, message: parsedData.erro };
    }

    if (!parsedData.assunto || !parsedData.perguntas || parsedData.perguntas.length !== 10) {
      // Caso o Gemini não siga o formato, consideramos um erro
      return { success: false, message: 'O Gemini não conseguiu gerar um questionário válido para este assunto. Tente um termo mais específico de videogame.' };
    }

    return { success: true, data: parsedData as QuestionarioGerado };

  } catch (error: any) {
    console.error("Erro ao chamar a API do Gemini:", error);
    // Verificar se o erro é devido ao assunto não ser de games (se o Gemini indicar)
    if (error.message.includes('O assunto') && error.message.includes('não é apropriado')) {
        return { success: false, message: error.message };
    }
    return { success: false, message: `Erro ao gerar questionário: ${error.message || 'Verifique sua chave de API e conexão.'}` };
  }
}