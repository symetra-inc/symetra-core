// Artigos do blog. Para publicar um novo, adicione um item no topo da lista.
export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] };

export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string; // AAAA-MM-DD
  minutes: number;
  body: Block[];
};

export const POSTS: Post[] = [
  {
    slug: "como-calcular-custo-trabalho-manual",
    title: "Quanto custa o trabalho manual na sua empresa (e como calcular em 10 minutos)",
    description:
      "Um jeito simples de colocar preço no tempo que a equipe gasta digitando, conferindo e copiando dados, para decidir o que vale automatizar primeiro.",
    date: "2026-10-30",
    minutes: 5,
    body: [
      { type: "p", text: "Quase todo dono de empresa sabe que a equipe perde tempo com tarefa repetitiva. Pouca gente sabe quanto. E sem esse número fica difícil decidir se vale pagar por uma automação ou se é melhor deixar como está." },
      { type: "p", text: "A boa notícia é que a conta é simples. Dá para fazer numa folha de papel, em dez minutos." },
      { type: "h2", text: "1. Liste as tarefas que se repetem" },
      { type: "p", text: "Pense no que acontece todo dia ou toda semana, sempre do mesmo jeito. Alguns exemplos comuns:" },
      { type: "ul", items: [
        "Digitar no sistema o pedido que chegou por WhatsApp ou áudio.",
        "Responder as mesmas perguntas de clientes (preço, prazo, horário).",
        "Conferir no extrato se o pagamento caiu.",
        "Copiar dados de um sistema para outro.",
        "Montar o relatório da semana juntando várias planilhas.",
      ]},
      { type: "p", text: "Não precisa ser uma lista perfeita. Cinco itens já bastam para começar." },
      { type: "h2", text: "2. Estime as horas por mês" },
      { type: "p", text: "Para cada tarefa, pergunte a quem faz: quanto tempo isso leva por dia? Multiplique por 22, que é mais ou menos o número de dias úteis do mês. Se a tarefa é semanal, multiplique por 4." },
      { type: "p", text: "Uma pessoa que passa duas horas por dia digitando pedidos gasta cerca de 44 horas por mês nisso. Duas pessoas, 88 horas." },
      { type: "h2", text: "3. Coloque preço na hora" },
      { type: "p", text: "Pegue o custo mensal de quem faz a tarefa, com salário e encargos, e divida por 176 (as horas de um mês de trabalho). Quem custa R$ 4.400 por mês custa R$ 25 por hora." },
      { type: "p", text: "Agora multiplique as horas de cada tarefa por esse valor. No exemplo acima, 88 horas a R$ 25 dão R$ 2.200 por mês, ou R$ 26.400 por ano, só para digitar pedido." },
      { type: "h2", text: "4. Some o que não aparece no extrato" },
      { type: "p", text: "Horas são só uma parte do custo. Vale anotar também o que o trabalho manual provoca:" },
      { type: "ul", items: [
        "Erros de digitação que viram devolução ou retrabalho.",
        "Clientes que desistem porque ficaram sem resposta.",
        "Orçamentos que esfriam porque ninguém fez o retorno.",
      ]},
      { type: "p", text: "Esses números são mais difíceis de medir, mas uma estimativa honesta já ajuda. Se você perde duas vendas por mês por demora na resposta, quanto isso dá?" },
      { type: "h2", text: "5. Compare com o custo de resolver" },
      { type: "p", text: "Com o custo mensal de cada tarefa na mão, a decisão fica clara. Uma automação que custa menos do que alguns meses do problema se paga rápido. Uma que custa mais do que o problema em dois anos provavelmente não vale a pena." },
      { type: "p", text: "Comece pela tarefa mais cara e mais simples de resolver. É assim que eu conduzo os pilotos: um problema por vez, com o resultado medido antes de partir para o próximo." },
      { type: "p", text: "Se quiser, a calculadora na página inicial faz essa conta para você e já manda o resultado para o meu WhatsApp." },
    ],
  },
  {
    slug: "atendimento-whatsapp-automatico-quando-vale-a-pena",
    title: "Atendimento automático no WhatsApp: quando vale a pena e quando não",
    description:
      "O que um atendimento automático resolve, onde ele atrapalha e quais perguntas fazer antes de colocar um robô para falar com os seus clientes.",
    date: "2026-10-30",
    minutes: 6,
    body: [
      { type: "p", text: "Atendimento automático no WhatsApp virou moda. Tem empresa que ganhou muito com isso e tem empresa que irritou os clientes e voltou atrás. A diferença quase nunca está na tecnologia. Está em usar no lugar certo." },
      { type: "h2", text: "Quando vale a pena" },
      { type: "ul", items: [
        "Boa parte das mensagens são as mesmas perguntas: preço, prazo, endereço, horário, formas de pagamento.",
        "Chegam mensagens fora do horário comercial e o cliente fica sem resposta até o dia seguinte.",
        "O atendimento segue um roteiro: entender o que a pessoa quer, oferecer opções, agendar ou tirar o pedido.",
        "A equipe passa o dia respondendo e não sobra tempo para quem já está quase fechando.",
      ]},
      { type: "p", text: "Nesses casos, o atendimento automático responde na hora, coleta as informações e entrega para a equipe só o que precisa de uma pessoa." },
      { type: "h2", text: "Quando não vale (ou ainda não vale)" },
      { type: "ul", items: [
        "Cada conversa é única e depende de análise caso a caso.",
        "O volume é pequeno e a equipe dá conta sem atraso.",
        "Você ainda não sabe responder com clareza as dúvidas mais comuns. O robô vai repetir essa confusão.",
      ]},
      { type: "h2", text: "O que separa um bom atendimento automático de um ruim" },
      { type: "p", text: "Pelo que vejo mantendo agentes que atendem um volume alto de conversas, quatro coisas fazem diferença:" },
      { type: "ul", items: [
        "Passar para uma pessoa na hora certa, com o histórico, sem obrigar o cliente a repetir tudo.",
        "Não inventar resposta. Quando não sabe, o atendimento deve dizer isso e chamar alguém.",
        "Falar no tom da empresa, não no tom de robô.",
        "Ser transparente: o cliente tem o direito de saber que está falando com um atendimento automático.",
      ]},
      { type: "h2", text: "Como começar sem risco" },
      { type: "p", text: "Comece pequeno. Escolha as cinco perguntas que mais aparecem e automatize só elas. Meça quanto tempo a equipe economizou e se os clientes reclamaram. Só depois aumente o que o atendimento faz." },
      { type: "p", text: "E lembre que nem todo problema de atendimento pede inteligência artificial. Às vezes uma mensagem automática fora do horário e um catálogo bem feito já resolvem a maior parte." },
    ],
  },
  {
    slug: "integrar-sistemas-sem-trocar-erp",
    title: "Como fazer seus sistemas conversarem sem trocar de ERP",
    description:
      "Por que trocar de sistema raramente é a solução, e como integrações simples acabam com o copia e cola entre ERP, loja virtual, banco e WhatsApp.",
    date: "2026-10-30",
    minutes: 5,
    body: [
      { type: "p", text: "Quando os sistemas da empresa não conversam entre si, a primeira ideia costuma ser trocar tudo por um sistema maior. Na maioria das vezes essa é a opção mais cara, mais demorada e mais arriscada." },
      { type: "p", text: "Existe um caminho mais curto: fazer os sistemas que você já usa trocarem dados sozinhos." },
      { type: "h2", text: "Sinais de que você precisa de integração" },
      { type: "ul", items: [
        "Alguém copia dados de um sistema e cola em outro todos os dias.",
        "O estoque da loja virtual não bate com o do ERP.",
        "A baixa de pagamento é feita à mão, olhando o extrato.",
        "Para saber o faturamento do dia, alguém precisa juntar números de vários lugares.",
      ]},
      { type: "h2", text: "Como funciona, sem tecniquês" },
      { type: "p", text: "A maioria dos sistemas modernos tem uma porta de entrada para outros programas, chamada API. Uma integração é um programa pequeno que usa essas portas para levar a informação de um lugar para o outro, no momento certo." },
      { type: "p", text: "Exemplo: quando uma venda é aprovada na loja virtual, a integração cria o pedido no ERP, avisa o cliente no WhatsApp e atualiza o estoque. Ninguém digita nada." },
      { type: "h2", text: "E se o meu sistema for antigo?" },
      { type: "p", text: "Mesmo sistemas sem API costumam permitir exportar e importar planilhas, ou guardam os dados num banco que pode ser lido. Dá mais trabalho, mas quase sempre tem jeito. Por isso, no diagnóstico, a primeira coisa que eu olho é o que os seus sistemas permitem." },
      { type: "h2", text: "Quando trocar de sistema faz sentido" },
      { type: "p", text: "Trocar vale a pena quando o sistema atual não atende o jeito que a empresa trabalha, quando o fornecedor não dá mais suporte ou quando o custo de manter supera o de migrar. Fora isso, integrar costuma resolver mais rápido e por bem menos." },
      { type: "p", text: "Uma boa regra: antes de trocar, liste exatamente quais dados precisam ir de onde para onde. Muitas vezes essa lista mostra que o problema é bem menor do que parecia." },
    ],
  },
];

export function getPost(slug: string) {
  return POSTS.find((p) => p.slug === slug);
}

export function formatDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

export const WA_URL =
  "https://wa.me/5511947391058?text=Oi%2C%20Guilherme!%20Li%20um%20artigo%20no%20blog%20e%20quero%20agendar%20o%20diagn%C3%B3stico%20gratuito.";
