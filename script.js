/* globals bootstrap */
import { render, html } from "https://cdn.jsdelivr.net/npm/lit-html@3/+esm";
import { unsafeHTML } from "https://cdn.jsdelivr.net/npm/lit-html@3/directives/unsafe-html.js";
import { asyncLLM } from "https://cdn.jsdelivr.net/npm/asyncllm@2";
import { Marked } from "https://cdn.jsdelivr.net/npm/marked@13/+esm";
import saveform from "https://cdn.jsdelivr.net/npm/saveform@1";
import hljs from "https://cdn.jsdelivr.net/npm/highlight.js@11/+esm";
import { demos, agentPrompt, validatorPrompt } from "./config.js";

const marked = new Marked();
marked.use({
  renderer: {
    table(header, body) {
      return `<table class="table table-sm">${header}${body}</table>`;
    },
    code(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return /* html */ `<pre class="hljs language-${language}"><code>${hljs
        .highlight(code, { language })
        .value.trim()}</code></pre>`;
    },
  },
});

const $taskForm = document.querySelector("#task-form");
const $results = document.querySelector("#results");
const $status = document.querySelector("#status");
const $apiCards = document.querySelector("#api-cards");
const $exampleQuestions = document.querySelector("#example-questions");
const $tokenInputs = document.querySelector("#token-inputs");
const $systemPrompt = document.querySelector("#system-prompt");

const formState = saveform("#task-form", { exclude: '[type="file"]' });
const messages = [];
const selectedApis = new Set([0]);

// Render API cards based on config
function renderApiCards() {
  render(
    demos.map(
      (demo, index) => html`
        <div class="col">
          <div class="card h-100 api-card" data-index="${index}">
            <div class="card-body text-center">
              <i class="bi bi-${demo.icon} fs-1 mb-3"></i>
              <h5 class="card-title">${demo.title}</h5>
              <p class="card-text">${demo.description}</p>
              <button
                class="btn btn-outline-primary select-api"
                data-index="${index}"
              >
                Select
              </button>
            </div>
          </div>
        </div>
      `,
    ),
    $apiCards,
  );

  // Add event listeners to API cards
  document.querySelectorAll(".select-api").forEach((button) => {
    button.addEventListener("click", (e) => {
      const index = parseInt(e.target.dataset.index);
      toggleApi(index);
    });
  });
}

// Toggle API selection and update the UI
function toggleApi(index) {
  if (selectedApis.has(index)) selectedApis.delete(index);
  else selectedApis.add(index);
  updateSelection();
}

function updateSelection() {
  const apis = [...selectedApis].map((i) => demos[i]);

  document.querySelectorAll(".api-card").forEach((card, i) => {
    if (selectedApis.has(i)) card.classList.add("border-primary", "shadow");
    else card.classList.remove("border-primary", "shadow");
  });

  render(
    apis
      .flatMap((api) => api.questions)
      .map(
        (q) =>
          html`<button
            type="button"
            class="list-group-item list-group-item-action example-question"
          >
            ${q}
          </button>`,
      ),
    $exampleQuestions,
  );

  render(
    apis.flatMap((api) =>
      api.params.map(
        (p) => html`<div class="mb-2">
          <label for="param-${p.key}" class="form-label d-flex justify-content-between">
            <span>${p.label}${p.required ? html`<span class="text-danger">*</span>` : ""}</span>
            ${p.oauth
              ? html`<button type="button" class="btn btn-sm btn-outline-primary" id="oauth-button-${p.key}">Sign in</button>`
              : p.link
                ? html`<a href="${p.link}" target="_blank" rel="noopener">Get token <i class="bi bi-box-arrow-up-right"></i></a>`
                : ""}
          </label>
          <input
            type="${p.type || "text"}"
            class="form-control"
            id="param-${p.key}"
            placeholder="Enter ${p.label}"
            ${p.required ? "required" : ""}
          />
        </div>`,
      ),
    ),
    $tokenInputs,
  );

  formState.restore();

  apis.forEach((api) => api.params.filter((p) => p.oauth).forEach(initOAuth));

  $systemPrompt.value = apis.map((api) => api.prompt).join("\n\n");
  $systemPrompt.dispatchEvent(new Event("change", { bubbles: true }));

  messages.splice(0, messages.length);
  renderSteps(messages);
}
async function initOAuth(param) {
  if (param.oauth.provider === "google") {
    if (!window.google || !google.accounts)
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    const button = document.getElementById(`oauth-button-${param.key}`);
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: param.oauth.clientId,
      scope: param.oauth.scope,
      callback: (resp) => {
        const input = document.getElementById(`param-${param.key}`);
        input.value = resp.access_token;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      },
    });
    button.addEventListener("click", () => tokenClient.requestAccessToken());
  }
}

// Add event listeners to example questions
$exampleQuestions.addEventListener("click", (e) => {
  const $exampleQuestion = e.target.closest(".example-question");
  if ($exampleQuestion) {
    const $question = document.querySelector("#question");
    $question.value = $exampleQuestion.textContent;
    $question.dispatchEvent(new Event("change", { bubbles: true }));
    $taskForm.dispatchEvent(new Event("submit", { bubbles: true }));
  }
});

globalThis.customFetch = function (url, ...args) {
  render(
    html`Fetching <a href="${url}" target="_blank" rel="noopener">${url}</a>`,
    $status,
  );
  $status.classList.remove("d-none");
  return fetch(url, ...args);
};

$taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const question = e.target.question.value;
  messages.push({ role: "user", name: "user", content: question });
  renderSteps(messages);

  const baseUrl = document.getElementById("baseUrlInput").value;
  const apiKey = document.getElementById("apiKeyInput").value;
  const model = document.getElementById("model").value;
  const attempts = document.getElementById("attempts").value;
  const request = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  };
  if (apiKey) request.headers["Authorization"] = `Bearer ${apiKey}`;
  else request.credentials = "include";

  for (let attempt = 0; attempt < attempts; attempt++) {
    const llmMessages = [...messages];
    let message = { role: "assistant", name: "developer", content: "" };
    messages.push(message);

    try {
      for await (const event of asyncLLM(`${baseUrl}/chat/completions`, {
        ...request,
        body: JSON.stringify({
          model,
          stream: true,
          messages: [
            { role: "system", content: agentPrompt($systemPrompt.value) },
            ...llmMessages,
          ],
        }),
      })) {
        message.content = event.content ?? "";
        if (event.error)
          messages.push({
            role: "user",
            name: "error",
            content: JSON.stringify(event),
          });
        renderSteps(messages);
        if (event.error) return;
      }
    } catch (error) {
      messages.push({ role: "user", name: "error", content: error.stack });
      renderSteps(messages);
      return;
    }

    if (message.content.includes("🟢")) {
      renderSteps(messages);
      return;
    }

    // Extract the code inside ```js in the last step
    const code = ((content) => {
      try {
        return [...content.matchAll(/```js(.*?)```/gs)][0].at(-1);
      } catch (error) {
        messages.push({
          role: "user",
          name: "error",
          content: "No JS code block to run",
        });
        renderSteps(messages);
        return;
      }
    })(message.content);
    let module;
    try {
      const blob = new Blob(
        [`const fetch = globalThis.customFetch;\n${code}`],
        { type: "text/javascript" },
      );
      module = await import(URL.createObjectURL(blob));
    } catch (error) {
      messages.push({ role: "user", name: "error", content: error.stack });
      renderSteps(messages);
      return;
    }
    messages.push({ role: "user", name: "result", content: "Running code..." });
    renderSteps(messages);
    const params = {};
    selectedApis.forEach((i) => {
      demos[i].params.forEach((p) => {
        params[p.key] = document.getElementById(`param-${p.key}`)?.value || "";
      });
    });
    try {
      const result = await module.run({ params });
      messages.at(-1).content = JSON.stringify(result, null, 2);
    } catch (error) {
      messages.at(-1).name = "error";
      messages.at(-1).content = error.stack;
    }
    $status.classList.add("d-none");
    renderSteps(messages);

    const validationMessages = [
      ...messages.filter((m) => m.name === "user"),
      messages.at(-2),
      messages.at(-1),
    ];
    let validationMessage = {
      role: "assistant",
      name: "validator",
      content: "",
    };
    messages.push(validationMessage);
    for await (const event of asyncLLM(`${baseUrl}/chat/completions`, {
      ...request,
      body: JSON.stringify({
        model,
        stream: true,
        messages: [
          { role: "system", content: validatorPrompt },
          ...validationMessages,
        ],
      }),
    })) {
      validationMessage.content = event.content ?? "";
      if (event.error)
        messages.push({
          role: "user",
          name: "error",
          content: JSON.stringify(event),
        });
      renderSteps(messages);
      if (event.error) return;
    }
    if (validationMessage.content.includes("🟢")) return;
  }
});

// Define icon and color based on name
const iconMap = {
  user: "bi-person-fill",
  developer: "bi-code-square",
  result: "bi-clipboard-data",
  error: "bi-exclamation-triangle",
  validator: "bi-check-circle",
};

const colorMap = {
  user: "bg-primary",
  developer: "bg-success",
  result: "bg-info",
  error: "bg-danger",
  validator: "bg-warning",
};

function renderSteps(steps) {
  render(
    steps.map(({ name, content }, i) => {
      const stepNum = i + 1;
      let markdown =
        name == "result"
          ? "```json\n" + content + "\n```"
          : name == "error"
            ? "```\n" + content + "\n```"
            : content;
      return html`
        <div class="card mb-3">
          <div
            class="card-header ${colorMap[name] ||
            "bg-secondary"} text-white d-flex align-items-center"
            data-bs-toggle="collapse"
            data-bs-target="#step-${stepNum}"
            role="button"
            aria-expanded="true"
          >
            <i class="bi ${iconMap[name] || "bi-chat-dots"} me-2"></i>
            <span class="badge bg-light text-dark me-2">${stepNum}</span>
            <strong>${name}</strong>
            <i class="bi bi-chevron-down ms-auto"></i>
          </div>
          <div class="collapse show" id="step-${stepNum}">
            <div class="card-body">
              ${unsafeHTML(marked.parse(markdown ?? ""))}
            </div>
          </div>
        </div>
      `;
    }),
    $results,
  );
}

// Initialize the application
renderApiCards();
updateSelection();
