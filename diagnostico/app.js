const DATA_CONFIG = window.GG_CONFIG || {};
const CONFIG = {
  whatsapp: "5569992751172",
  storageKey: "gg_diagnostico_v1",
  supabaseUrl: DATA_CONFIG.supabaseUrl,
  supabasePublishableKey: DATA_CONFIG.supabasePublishableKey
};

let db = null;

function ensureSubmissionClient() {
  if (db) return db;
  if (!window.supabase?.createClient || !CONFIG.supabaseUrl || !CONFIG.supabasePublishableKey) {
    throw new Error("Configuração do envio indisponível.");
  }
  db = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  return db;
}

const AXES = {
  found: {
    short: "Ser encontrado",
    internal: "Presença",
    gap: "Ser encontrado",
    text: "Talvez pessoas que precisam do que você oferece ainda tenham dificuldade para te encontrar.",
    meaning: "Antes de escolher você, a pessoa precisa conseguir te encontrar e entender rapidamente onde você está e como falar com você."
  },
  perceived: {
    short: "Ser percebido",
    internal: "Autoridade",
    gap: "Ser percebido",
    text: "Quem te encontra pode ainda não perceber com clareza todo o valor e a confiança do que você oferece.",
    meaning: "A forma como você se apresenta — fotos, textos, perfil, site e visual — ajuda a pessoa a sentir segurança antes de escolher."
  },
  chosen: {
    short: "Ser escolhido",
    internal: "Conversão",
    gap: "Ser escolhido",
    text: "As pessoas podem chegar até você, mas ainda encontrar dificuldade para decidir ou dar o próximo passo.",
    meaning: "Quando não está claro o que você faz, por que confiar ou como entrar em contato, parte das pessoas vai embora antes de chamar."
  },
  evolve: {
    short: "Continuar evoluindo",
    internal: "Crescimento",
    gap: "Continuar evoluindo",
    text: "Você pode ganhar mais clareza organizando melhor os contatos e entendendo de onde seus clientes estão vindo.",
    meaning: "Quando você acompanha o que acontece, fica mais fácil repetir o que funciona e parar de gastar energia no que não funciona."
  }
};

const steps = [
  {
    id: "business",
    context: "Contexto",
    axes: [],
    title: "Primeiro, conta um pouco sobre você ou seu negócio.",
    help: "Só o básico. Isso ajuda a gente a entender sua realidade antes de qualquer análise.",
    type: "fields",
    fields: [
      { name: "businessName", label: "Como você ou seu negócio é conhecido?", placeholder: "Seu nome profissional, marca ou empresa", required: true, full: true },
      { name: "segment", label: "O que você faz?", placeholder: "Ex.: Personal, advogado, loja, clínica...", required: true },
      { name: "city", label: "Cidade", placeholder: "Ex.: Porto Velho", required: true }
    ]
  },
  {
    id: "moment",
    context: "Contexto",
    axes: ["evolve"],
    title: "Qual dessas opções mais parece com seu momento hoje?",
    help: "Não importa se você trabalha sozinho ou tem uma equipe. Escolha a que mais se aproxima da sua realidade.",
    type: "single",
    options: [
      { value: "starting", label: "Estou começando", hint: "Ainda estou organizando minha presença e divulgação." },
      { value: "need-demand", label: "Já trabalho/vendo, mas quero mais clientes", hint: "Quero aumentar a procura pelo que ofereço." },
      { value: "irregular", label: "Tenho clientes, mas quero crescer com mais constância", hint: "Tem períodos bons e outros mais parados." },
      { value: "expanding", label: "Já tenho uma boa estrutura e quero expandir", hint: "Quero crescer de forma mais organizada." }
    ]
  },
  {
    id: "discovery",
    context: "Ser encontrado",
    axes: ["found"],
    title: "Hoje, como as pessoas chegam até você?",
    help: "Pode marcar mais de uma opção.",
    type: "multi",
    min: 1,
    options: [
      { value: "google", label: "Google / Maps", hint: "Pesquisam meu nome ou o que eu faço." },
      { value: "instagram", label: "Instagram / redes sociais", hint: "Chegam pelo perfil ou pelo conteúdo." },
      { value: "ads", label: "Anúncios", hint: "Pago para alcançar novas pessoas." },
      { value: "referral", label: "Indicação", hint: "Clientes, amigos ou parceiros indicam." },
      { value: "marketplace", label: "Aplicativos / plataformas", hint: "Uso alguma plataforma do meu segmento." },
      { value: "unknown", label: "Não sei ao certo", hint: "Nunca acompanhei de onde as pessoas chegam." }
    ]
  },
  {
    id: "presence",
    context: "Ser encontrado",
    axes: ["found"],
    title: "Quando alguém procura você no Google, encontra informações atualizadas?",
    help: "Pense em telefone, horário, fotos, endereço e avaliações.",
    type: "single",
    options: [
      { value: "updated", label: "Sim, está tudo certo", hint: "Quem procura encontra informações atuais." },
      { value: "partial", label: "Mais ou menos", hint: "Aparece, mas tem coisa desatualizada ou faltando." },
      { value: "unknown", label: "Não sei", hint: "Nunca parei para conferir direito." },
      { value: "none", label: "Não apareço / não tenho", hint: "Ainda não organizei isso no Google." }
    ]
  },
  {
    id: "website",
    context: "Ser percebido",
    axes: ["perceived", "chosen"],
    title: "Você tem um site que ajuda a explicar o que faz e facilita o contato?",
    help: "Se não tiver, tudo bem. Queremos apenas entender como as pessoas conhecem melhor seu trabalho hoje.",
    type: "single",
    options: [
      { value: "good", label: "Sim, e funciona bem para mim", hint: "É atual e facilita o contato." },
      { value: "outdated", label: "Tenho, mas precisa melhorar", hint: "Está antigo, confuso ou não representa mais meu trabalho." },
      { value: "landing", label: "Tenho apenas uma página específica", hint: "Uso uma página para divulgar uma oferta ou serviço." },
      { value: "none", label: "Não tenho site", hint: "Hoje as pessoas me conhecem por outros canais." }
    ]
  },
  {
    id: "perception",
    context: "Ser percebido",
    axes: ["perceived"],
    title: "Seu perfil e sua comunicação passam a imagem profissional que você gostaria?",
    help: "Pense no Instagram, fotos, cores, textos e na impressão que alguém tem quando te encontra.",
    type: "single",
    options: [
      { value: "strong", label: "Sim, gosto de como me apresento hoje", hint: "Sinto que passa confiança e combina com meu trabalho." },
      { value: "active", label: "Mais ou menos", hint: "Tem coisas boas, mas falta um padrão." },
      { value: "weak", label: "Não, poderia parecer mais profissional", hint: "A comunicação ainda parece improvisada." },
      { value: "unknown", label: "Nunca parei para pensar nisso", hint: "Não sei qual impressão estou passando hoje." }
    ]
  },
  {
    id: "choice",
    context: "Ser escolhido",
    axes: ["perceived", "chosen"],
    title: "Quem te encontra entende rápido o que você faz e como falar com você?",
    help: "Pense como se fosse alguém conhecendo seu trabalho pela primeira vez.",
    type: "single",
    options: [
      { value: "clear", label: "Sim, é bem fácil entender", hint: "O que faço e como chamar ficam claros." },
      { value: "partial", label: "Mais ou menos", hint: "Algumas pessoas ainda ficam com dúvidas." },
      { value: "hard", label: "Não muito", hint: "Acho que falta clareza ou um contato mais fácil." },
      { value: "unknown", label: "Não sei", hint: "Nunca olhei meus canais como um cliente." }
    ]
  },
  {
    id: "conversion",
    context: "Ser escolhido",
    axes: ["chosen"],
    title: "Hoje você recebe a quantidade de contatos ou clientes que gostaria?",
    help: "Não precisa falar números. Só queremos entender como está a procura.",
    type: "single",
    options: [
      { value: "predictable", label: "Sim, está em um bom nível", hint: "A procura acontece com certa frequência." },
      { value: "irregular", label: "Varia bastante", hint: "Tem períodos bons e outros bem parados." },
      { value: "few", label: "Não, gostaria de receber mais", hint: "Hoje chegam menos pessoas do que eu gostaria." },
      { value: "unknown", label: "Não acompanho isso", hint: "Nunca parei para medir a quantidade de contatos." }
    ]
  },
  {
    id: "evolution",
    context: "Continuar evoluindo",
    axes: ["chosen", "evolve"],
    title: "Quando alguém chama, como você organiza e acompanha esses contatos?",
    help: "Duas perguntas rápidas para entender o que acontece depois que alguém demonstra interesse.",
    type: "compound",
    questions: [
      {
        name: "followup",
        title: "Como você organiza quem entra em contato?",
        options: [
          { value: "structured", label: "Tenho tudo bem organizado" },
          { value: "whatsapp", label: "Organizo principalmente pelo WhatsApp" },
          { value: "spread", label: "Anoto em lugares diferentes" },
          { value: "none", label: "Não tenho uma organização definida" }
        ]
      },
      {
        name: "measurement",
        title: "Você sabe de onde vêm seus clientes?",
        options: [
          { value: "structured", label: "Sim, acompanho isso" },
          { value: "basic", label: "Tenho uma ideia, mas não acompanho sempre" },
          { value: "none", label: "Não acompanho" },
          { value: "unknown", label: "Não sei como descobrir" }
        ]
      }
    ]
  },
  {
    id: "goal",
    context: "Direção",
    axes: [],
    title: "O que você mais gostaria de melhorar agora?",
    help: "Escolha o que faria mais diferença para você neste momento.",
    type: "compound",
    questions: [
      {
        name: "objective",
        title: "O que você mais quer?",
        options: [
          { value: "clients", label: "Conseguir mais clientes" },
          { value: "authority", label: "Passar mais confiança e ser mais reconhecido" },
          { value: "professional", label: "Ter uma presença mais profissional na internet" },
          { value: "conversion", label: "Fazer mais pessoas que me encontram entrarem em contato" },
          { value: "process", label: "Me organizar melhor para crescer" },
          { value: "direction", label: "Entender o que devo fazer primeiro" }
        ]
      },
      {
        name: "urgency",
        title: "Quando você gostaria de começar a melhorar isso?",
        options: [
          { value: "now", label: "Agora / nas próximas semanas" },
          { value: "60days", label: "Nos próximos 30–60 dias" },
          { value: "months", label: "Nos próximos 3–6 meses" },
          { value: "exploring", label: "Estou apenas entendendo o cenário" }
        ]
      }
    ]
  },
  {
    id: "lead",
    context: "Seu mapa",
    axes: [],
    title: "Pronto. Só falta saber com quem estamos falando.",
    help: "Seu WhatsApp identifica este diagnóstico. Se você já usa Instagram, site ou Perfil do Google, deixe os links também — eles ajudam a GG a conhecer melhor sua presença atual.",
    type: "lead",
    fields: [
      { name: "name", label: "Seu nome", placeholder: "Como podemos te chamar?", required: true },
      { name: "whatsapp", label: "WhatsApp", placeholder: "(69) 99999-9999", required: true, inputMode: "tel" },
      { name: "instagram", label: "Instagram (opcional)", placeholder: "@seuperfil ou link do perfil", required: false },
      { name: "websiteUrl", label: "Site (opcional)", placeholder: "seusite.com.br", required: false },
      { name: "googleProfile", label: "Perfil no Google / Maps (opcional)", placeholder: "Cole o link do seu perfil no Google", required: false, full: true },
      { name: "email", label: "E-mail (opcional)", placeholder: "voce@empresa.com", required: false, inputMode: "email", full: true }
    ]
  }
];

const state = {
  step: 0,
  answers: {},
  map: null
};

const screens = {
  intro: document.getElementById("intro"),
  diagnostic: document.getElementById("diagnostic"),
  result: document.getElementById("result")
};
const mount = document.getElementById("questionMount");
const progressLabel = document.getElementById("progressLabel");
const progressContext = document.getElementById("progressContext");
const progressBar = document.getElementById("progressBar");
const formError = document.getElementById("formError");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

function showScreen(name) {
  Object.values(screens).forEach(screen => screen.classList.remove("is-active"));
  screens[name].classList.add("is-active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderFields(fields, lead = false) {
  const inputs = fields.map(field => {
    const value = escapeHtml(state.answers[field.name] || "");
    return `
      <div class="field ${field.full ? "full" : ""}">
        <label for="${field.name}">${field.label}</label>
        <input id="${field.name}" name="${field.name}" type="${field.inputMode === "email" ? "email" : "text"}" ${field.inputMode ? `inputmode="${field.inputMode}"` : ""} value="${value}" placeholder="${field.placeholder}" ${field.required ? "required" : ""} autocomplete="${field.name === "email" ? "email" : field.name === "name" ? "name" : field.name === "whatsapp" ? "tel" : "off"}">
      </div>`;
  }).join("");

  return `
    <div class="field-grid">${inputs}</div>
    ${lead ? `
      <label class="consent">
        <input id="consent" type="checkbox" ${state.answers.consent ? "checked" : ""}>
        <span>Autorizo a GG Digital a usar estas informações para analisar meu diagnóstico e entrar em contato sobre ele.</span>
      </label>` : ""}
  `;
}

function choiceButton(option, selected, multi = false, name = "") {
  return `
    <button class="choice ${multi ? "multi" : ""} ${selected ? "is-selected" : ""}" type="button" data-choice="${escapeHtml(option.value)}" ${name ? `data-name="${escapeHtml(name)}"` : ""} aria-pressed="${selected ? "true" : "false"}">
      <span class="choice-mark" aria-hidden="true">✓</span>
      <span class="choice-copy"><b>${option.label}</b>${option.hint ? `<small>${option.hint}</small>` : ""}</span>
    </button>`;
}

function renderStep() {
  const step = steps[state.step];
  formError.textContent = "";
  progressLabel.textContent = `Etapa ${state.step + 1} de ${steps.length}`;
  progressContext.textContent = step.context;
  progressBar.style.width = `${((state.step + 1) / steps.length) * 100}%`;
  prevBtn.style.visibility = state.step === 0 ? "hidden" : "visible";
  nextBtn.innerHTML = state.step === steps.length - 1 ? `Ver meu mapa <span aria-hidden="true">→</span>` : `Continuar <span aria-hidden="true">→</span>`;

  document.querySelectorAll("[data-axis]").forEach(item => {
    const axis = item.dataset.axis;
    const axisSteps = steps.map((s, i) => s.axes.includes(axis) ? i : -1).filter(i => i >= 0);
    item.classList.toggle("is-current", step.axes.includes(axis));
    item.classList.toggle("is-complete", axisSteps.length > 0 && Math.max(...axisSteps) < state.step);
  });

  let body = "";
  if (step.type === "fields") {
    body = renderFields(step.fields);
  } else if (step.type === "lead") {
    body = renderFields(step.fields, true);
  } else if (step.type === "single") {
    body = `<div class="choice-grid">${step.options.map(option => choiceButton(option, state.answers[step.id] === option.value)).join("")}</div>`;
  } else if (step.type === "multi") {
    const selected = state.answers[step.id] || [];
    body = `<div class="choice-grid">${step.options.map(option => choiceButton(option, selected.includes(option.value), true)).join("")}</div>`;
  } else if (step.type === "compound") {
    body = step.questions.map(question => `
      <div class="subquestion">
        <p class="subquestion-title">${question.title}</p>
        <div class="choice-grid">${question.options.map(option => choiceButton(option, state.answers[question.name] === option.value, false, question.name)).join("")}</div>
      </div>`).join("");
  }

  mount.innerHTML = `
    <div class="question-number">${String(state.step + 1).padStart(2, "0")} · ${step.context}</div>
    <h1 class="question-title" id="questionTitle">${step.title}</h1>
    <p class="question-help">${step.help}</p>
    <div class="question-body">${body}</div>
  `;

  bindStepEvents(step);
  setTimeout(() => mount.querySelector("input, .choice")?.focus({ preventScroll: true }), 80);
}

function bindStepEvents(step) {
  if (["fields", "lead"].includes(step.type)) {
    step.fields.forEach(field => {
      const input = document.getElementById(field.name);
      input.addEventListener("input", () => {
        if (field.name === "whatsapp") input.value = formatPhone(input.value);
        state.answers[field.name] = input.value.trim();
        formError.textContent = "";
      });
    });
    if (step.type === "lead") {
      document.getElementById("consent").addEventListener("change", event => {
        state.answers.consent = event.target.checked;
        formError.textContent = "";
      });
    }
    return;
  }

  mount.querySelectorAll(".choice").forEach(button => {
    button.addEventListener("click", () => {
      const value = button.dataset.choice;
      const name = button.dataset.name;

      if (step.type === "multi") {
        const current = new Set(state.answers[step.id] || []);
        if (value === "unknown") {
          current.clear();
          current.add("unknown");
        } else {
          current.delete("unknown");
          current.has(value) ? current.delete(value) : current.add(value);
        }
        state.answers[step.id] = [...current];
      } else if (step.type === "compound") {
        state.answers[name] = value;
      } else {
        state.answers[step.id] = value;
      }
      formError.textContent = "";
      syncChoiceSelection(step);
    });
  });
}

function syncChoiceSelection(step) {
  mount.querySelectorAll(".choice").forEach(button => {
    const value = button.dataset.choice;
    const name = button.dataset.name;
    let selected = false;
    if (step.type === "multi") selected = (state.answers[step.id] || []).includes(value);
    else if (step.type === "compound") selected = state.answers[name] === value;
    else selected = state.answers[step.id] === value;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  });
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function validateStep() {
  const step = steps[state.step];
  if (["fields", "lead"].includes(step.type)) {
    for (const field of step.fields) {
      if (field.required && !String(state.answers[field.name] || "").trim()) {
        return `Preencha ${field.label.toLowerCase()} para continuar.`;
      }
    }
    if (step.type === "lead") {
      const phone = String(state.answers.whatsapp || "").replace(/\D/g, "");
      if (phone.length < 10) return "Informe um WhatsApp válido para identificar seu diagnóstico.";
      if (state.answers.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.answers.email)) return "Confira o e-mail informado.";
      if (!state.answers.consent) return "Precisamos da sua autorização para registrar e analisar este diagnóstico.";
    }
    return "";
  }
  if (step.type === "single" && !state.answers[step.id]) return "Escolha a opção que mais representa o momento atual.";
  if (step.type === "multi" && (state.answers[step.id] || []).length < (step.min || 1)) return "Escolha pelo menos uma opção para continuar.";
  if (step.type === "compound" && step.questions.some(question => !state.answers[question.name])) return "Responda os dois pontos desta etapa para continuar.";
  return "";
}

function addScore(scores, max, axis, points, possible = 3) {
  scores[axis] += points;
  max[axis] += possible;
}

function calculateMap() {
  const a = state.answers;
  const scores = { found: 0, perceived: 0, chosen: 0, evolve: 0 };
  const max = { found: 0, perceived: 0, chosen: 0, evolve: 0 };

  const moment = { starting: .5, "need-demand": 1.2, irregular: 1.9, expanding: 3 };
  addScore(scores, max, "evolve", moment[a.moment] ?? 0, 3);

  const channels = a.discovery || [];
  const digitalChannels = channels.filter(value => ["google", "instagram", "ads", "marketplace"].includes(value)).length;
  const discoveryPoints = channels.includes("unknown") ? .4 : Math.min(3, digitalChannels * .8 + (channels.includes("referral") ? .3 : 0));
  addScore(scores, max, "found", discoveryPoints, 3);

  const presence = { updated: 3, partial: 1.8, unknown: .9, none: 0 };
  addScore(scores, max, "found", presence[a.presence] ?? 0, 3);

  const websitePerception = { good: 3, outdated: 1.1, landing: 2.1, none: .4 };
  const websiteChoice = { good: 3, outdated: 1, landing: 2.4, none: .3 };
  addScore(scores, max, "perceived", websitePerception[a.website] ?? 0, 3);
  addScore(scores, max, "chosen", websiteChoice[a.website] ?? 0, 3);

  const perception = { strong: 3, active: 2, weak: .7, unknown: 1 };
  addScore(scores, max, "perceived", perception[a.perception] ?? 0, 3);

  const choice = { clear: 3, partial: 1.8, hard: .6, unknown: .9 };
  addScore(scores, max, "perceived", choice[a.choice] ?? 0, 3);
  addScore(scores, max, "chosen", choice[a.choice] ?? 0, 3);

  const conversion = { predictable: 3, irregular: 1.8, few: .7, unknown: .6 };
  addScore(scores, max, "chosen", conversion[a.conversion] ?? 0, 3);

  const followup = { structured: 3, whatsapp: 2, spread: .8, none: 0 };
  addScore(scores, max, "chosen", followup[a.followup] ?? 0, 3);
  addScore(scores, max, "evolve", followup[a.followup] ?? 0, 3);

  const measurement = { structured: 3, basic: 1.7, none: .3, unknown: .5 };
  addScore(scores, max, "evolve", measurement[a.measurement] ?? 0, 3);

  const normalized = Object.fromEntries(Object.keys(scores).map(axis => [axis, max[axis] ? scores[axis] / max[axis] : 0]));
  const sorted = Object.entries(normalized).sort((x, y) => x[1] - y[1]);
  return { normalized, primaryGap: sorted[0][0], strongest: sorted[sorted.length - 1][0] };
}

function levelFor(value) {
  if (value < .34) return { label: "Precisa de atenção", segments: 1 };
  if (value < .58) return { label: "Em construção", segments: 2 };
  if (value < .80) return { label: "Bom caminho", segments: 3 };
  return { label: "Bem estruturado", segments: 4 };
}

function objectiveLabel(value) {
  return ({
    clients: "conseguir mais clientes",
    authority: "passar mais confiança e ser mais reconhecido",
    professional: "ter uma presença mais profissional na internet",
    conversion: "fazer mais pessoas entrarem em contato",
    process: "se organizar melhor para crescer",
    direction: "entender o que deve fazer primeiro"
  })[value] || "evoluir no digital";
}

function createSubmission(map) {
  const timestamp = new Date().toISOString();
  return {
    version: 1,
    id: `ggd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: timestamp,
    status: "diagnostico_concluido",
    source: "site_institucional",
    lead: {
      name: state.answers.name,
      businessName: state.answers.businessName,
      segment: state.answers.segment,
      city: state.answers.city,
      whatsapp: state.answers.whatsapp,
      email: state.answers.email || "",
      instagram: state.answers.instagram || "",
      website: state.answers.websiteUrl || "",
      googleProfile: state.answers.googleProfile || ""
    },
    diagnosis: {
      map: map.normalized,
      primaryGap: map.primaryGap,
      strongest: map.strongest,
      objective: state.answers.objective,
      urgency: state.answers.urgency,
      answers: { ...state.answers, consent: true }
    }
  };
}

async function persistSubmission(submission) {
  try {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(submission));
  } catch (error) {
    console.warn("Diagnóstico GG: armazenamento local indisponível.", error);
  }
  try {
    const client = ensureSubmissionClient();
    const { data, error } = await client.rpc("submit_diagnosis", {
      p_lead: submission.lead,
      p_answers: submission.diagnosis.answers,
      p_axis_map: submission.diagnosis.map,
      p_primary_gap: submission.diagnosis.primaryGap,
      p_source: submission.source
    });
    if (error) throw error;
    return { mode: "supabase", id: data };
  } catch (error) {
    console.error("Diagnóstico GG: envio ao painel indisponível.", error);
    return { mode: "local", error: true };
  }
}

function renderResult(map) {
  const business = state.answers.businessName || "Seu negócio";
  document.getElementById("resultBusiness").textContent = business;
  document.getElementById("resultLead").textContent = `${state.answers.name}, este é um retrato inicial do seu cenário a partir do que você nos contou.`;

  document.getElementById("axisResults").innerHTML = Object.entries(AXES).map(([axis, meta]) => {
    const level = levelFor(map.normalized[axis]);
    return `
      <div class="axis-result">
        <div class="axis-result-top"><b>${meta.short}</b><span>${level.label}</span></div>
        <div class="level-track" aria-label="${meta.short}: ${level.label}">${[1,2,3,4].map(n => `<i class="${n <= level.segments ? "on" : ""}"></i>`).join("")}</div>
      </div>`;
  }).join("");

  const gap = AXES[map.primaryGap];
  document.getElementById("primaryGapTitle").textContent = gap.gap;
  document.getElementById("primaryGapText").textContent = gap.text;
  document.getElementById("meaningText").textContent = gap.meaning;

  const message = [
    `Olá! Sou ${state.answers.name}.`,
    `Acabei de concluir o Diagnóstico Digital GG para ${business}.`,
    `Meu principal ponto de atenção apareceu em: ${gap.short}.`,
    `Nosso objetivo hoje é ${objectiveLabel(state.answers.objective)}.`,
    `Gostaria de conversar sobre a análise e os próximos passos.`
  ].join("\n");
  document.getElementById("whatsappCta").href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;
  showScreen("result");
}

document.getElementById("startBtn").addEventListener("click", () => {
  showScreen("diagnostic");
  renderStep();
});

prevBtn.addEventListener("click", () => {
  if (state.step === 0) return;
  state.step -= 1;
  renderStep();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

nextBtn.addEventListener("click", async () => {
  const error = validateStep();
  if (error) {
    formError.textContent = error;
    return;
  }

  if (state.step < steps.length - 1) {
    state.step += 1;
    renderStep();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  nextBtn.disabled = true;
  nextBtn.textContent = "Gerando seu mapa...";
  const map = calculateMap();
  state.map = map;
  const submission = createSubmission(map);
  await persistSubmission(submission);
  renderResult(map);
  nextBtn.disabled = false;
  nextBtn.innerHTML = `Ver meu mapa <span aria-hidden="true">→</span>`;
});

document.getElementById("restartBtn").addEventListener("click", () => {
  state.step = 0;
  state.answers = {};
  state.map = null;
  showScreen("diagnostic");
  renderStep();
});
