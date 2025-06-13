// app/page.tsx
'use client';

import { useState } from 'react';
import { gerarQuestionarioGemini } from './action'; // Importa a Server Action

interface PerguntaQuestionario {
  pergunta: string;
  alternativas: string[];
  respostaCorreta: string;
}

interface QuestionarioGerado {
  assunto: string;
  perguntas: PerguntaQuestionario[];
}

export default function PaginaInicial() {
  const [assuntoInput, setAssuntoInput] = useState('');
  const [questionarioAtual, setQuestionarioAtual] = useState<QuestionarioGerado | null>(null);
  const [mensagemErro, setMensagemErro] = useState('');
  const [respostasUsuario, setRespostasUsuario] = useState<string[]>([]);
  const [questionarioEnviado, setQuestionarioEnviado] = useState(false);
  const [pontuacao, setPontuacao] = useState(0);
  const [carregando, setCarregando] = useState(false); // Novo estado para controle de carregamento

  // Função para lidar com o envio do assunto
  const lidarComEnvioAssunto = async (event: React.FormEvent) => {
    event.preventDefault(); // Previne o recarregamento da página

    setCarregando(true); // Inicia o estado de carregamento
    setMensagemErro(''); // Limpa mensagens de erro anteriores
    setQuestionarioAtual(null); // Limpa questionário anterior

    const resultado = await gerarQuestionarioGemini(assuntoInput);

    if (resultado.success && resultado.data) {
      setQuestionarioAtual(resultado.data);
      // Inicializa respostas com strings vazias para cada pergunta do questionário gerado
      setRespostasUsuario(Array(resultado.data.perguntas.length).fill(''));
      setQuestionarioEnviado(false); // Reseta o estado de envio
      setPontuacao(0); // Reseta a pontuação
    } else {
      setMensagemErro(resultado.message || 'Ocorreu um erro desconhecido ao gerar o questionário.');
    }
    setCarregando(false); // Finaliza o estado de carregamento
  };

  // Função para lidar com a seleção de alternativa pelo usuário
  const lidarComSelecaoAlternativa = (indicePergunta: number, alternativaSelecionada: string) => {
    const novasRespostas = [...respostasUsuario];
    novasRespostas[indicePergunta] = alternativaSelecionada;
    setRespostasUsuario(novasRespostas);
  };

  // Função para lidar com o envio do questionário
  const lidarComEnvioQuestionario = () => {
    let novaPontuacao = 0;
    questionarioAtual?.perguntas.forEach((questao, index) => {
      if (respostasUsuario[index] === questao.respostaCorreta) {
        novaPontuacao += 1;
      }
    });
    setPontuacao(novaPontuacao);
    setQuestionarioEnviado(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8 text-blue-400 text-center">Gerador de Questionário Interativo de Games com IA</h1>

      {!questionarioAtual && (
        <form onSubmit={lidarComEnvioAssunto} className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
          <label htmlFor="assunto" className="block text-lg font-medium mb-4">
            Digite um assunto de games para gerar o questionário:
          </label>
          <input
            type="text"
            id="assunto"
            className="w-full p-3 mb-4 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={assuntoInput}
            onChange={(e) => setAssuntoInput(e.target.value)}
            placeholder="Ex: Fortnite, Minecraft, Valorant, etc..."
            disabled={carregando} // Desabilita input enquanto carrega
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out flex items-center justify-center"
            disabled={carregando} // Desabilita botão enquanto carrega
          >
            {carregando ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Gerando Questionário...
              </>
            ) : (
              'Gerar Questionário'
            )}
          </button>
          {mensagemErro && (
            <p className="mt-4 text-red-400 text-center">{mensagemErro}</p>
          )}
        </form>
      )}

      {questionarioAtual && (
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-3xl">
          <h2 className="text-3xl font-semibold mb-6 text-green-400">Questionário sobre {questionarioAtual.assunto}</h2>
          {questionarioAtual.perguntas.map((questao, index) => (
            <div key={index} className="mb-6 p-4 border border-gray-700 rounded-md bg-gray-750">
              <p className="text-xl font-medium mb-3">
                {index + 1}. {questao.pergunta}
              </p>
              <div className="space-y-2">
                {questao.alternativas.map((alternativa: string, altIndex: number) => (
                  <button
                    key={altIndex}
                    onClick={() => lidarComSelecaoAlternativa(index, alternativa)}
                    className={`block w-full text-left p-3 rounded-md transition duration-200 ease-in-out
                      ${questionarioEnviado ?
                        (alternativa === questao.respostaCorreta ? 'bg-green-600 text-white' :
                         (alternativa === respostasUsuario[index] ? 'bg-red-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-200'))
                        : (respostasUsuario[index] === alternativa ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-200')
                      }
                      ${questionarioEnviado ? 'cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    disabled={questionarioEnviado}
                  >
                    {alternativa}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {!questionarioEnviado ? (
            <button
              onClick={lidarComEnvioQuestionario}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md mt-6 transition duration-300 ease-in-out"
            >
              Enviar Respostas
            </button>
          ) : (
            <div className="mt-6 p-6 bg-blue-900 rounded-lg text-center">
              <h3 className="text-3xl font-bold mb-4 text-white">Resultados:</h3>
              <p className="text-2xl font-semibold text-white">
                Sua pontuação: <span className="text-yellow-300">{pontuacao}</span> de {questionarioAtual.perguntas.length}
              </p>
              <p className="text-xl text-white mt-2">
                Acertos: <span className="text-green-300">{pontuacao}</span>
              </p>
              <p className="text-xl text-white">
                Erros: <span className="text-red-300">{questionarioAtual.perguntas.length - pontuacao}</span>
              </p>
              <button
                onClick={() => {
                  setQuestionarioAtual(null);
                  setAssuntoInput('');
                  setMensagemErro('');
                  setQuestionarioEnviado(false);
                  setPontuacao(0);
                  setRespostasUsuario([]);
                }}
                className="mt-6 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out"
              >
                Voltar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}