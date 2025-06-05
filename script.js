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

saveform("#task-form");

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
              <button class="btn btn-outline-primary select-api" data-index="${index}">Select</button>
            </div>
          </div>
        </div>
      `
    ),
    $apiCards
  );

  // Add event listeners to API cards
  document.querySelectorAll(".select-api").forEach((button) => {
    button.addEventListener("click", (e) => {
      const index = parseInt(e.target.dataset.index);
      selectApi(index);
    });
  });
}

// Select an API and update the UI
function selectApi(index) {
  const selectedApi = demos[index];

  // Highlight the selected card
  document.querySelectorAll(".api-card").forEach((card, i) => {
    if (i === index) card.classList.add("border-primary", "shadow");
    else card.classList.remove("border-primary", "shadow");
  });

  // Update example questions
  render(
    selectedApi.questions.map(
      (question) =>
        html`<button type="button" class="list-group-item list-group-item-action example-question">${question}</button>`
    ),
    $exampleQuestions
  );

  // Update token inputs
  render(
    html`
      <div class="mb-2">
        <label for="token" class="form-label d-flex justify-content-between">
          ${selectedApi.token.label}
          ${selectedApi.token.required ? html`<span class="text-danger">*</span>` : ""}
          ${selectedApi.token.oauth
            ? html`<button type="button" class="btn btn-sm btn-outline-primary" id="oauth-button">Sign in</button>`
            : html`<a href="${selectedApi.token.link}" target="_blank" rel="noopener">Get token <i class="bi bi-box-arrow-up-right"></i></a>`}
        </label>
        <input
          type="password"
          class="form-control"
          id="token"
          placeholder="Enter ${selectedApi.token.label}"
          ${selectedApi.token.required ? "required" : ""}
        />
      </div>
    `,
    $tokenInputs
  );

  if (selectedApi.token.oauth) initOAuth(selectedApi.token.oauth);

  // Update system prompt
  $systemPrompt.value = selectedApi.prompt;
}

function initOAuth(config) {
  if (config.provider === "google") {
    const button = document.getElementById("oauth-button");
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: config.clientId,
      scope: config.scope,
      callback: (resp) => {
        document.getElementById("token").value = resp.access_token;
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
    $question.dispatchEvent(new Event("input", { bubbles: true }));
    $taskForm.dispatchEvent(new Event("submit", { bubbles: true }));
  }
});

globalThis.customFetch = function (url, ...args) {
  render(html`Fetching <a href="${url}" target="_blank" rel="noopener">${url}</a>`, $status);
  $status.classList.remove("d-none");
  return fetch(url, ...args);
};

$taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const question = e.target.question.value;
  const messages = [{ role: "user", name: "user", content: question }];
  renderSteps(messages);

  const baseUrl = document.getElementById("baseUrlInput").value;
  const apiKey = document.getElementById("apiKeyInput").value;
  const model = document.getElementById("model").value;
  const request = { method: "POST", headers: { "Content-Type": "application/json" } };
  if (apiKey) request.headers["Authorization"] = `Bearer ${apiKey}`;
  else request.credentials = "include";

  for (let attempt = 0; attempt < 5; attempt++) {
    const llmMessages = [...messages];
    let message = { role: "assistant", name: "developer", content: "" };
    messages.push(message);

    try {
      for await (const { content } of asyncLLM(`${baseUrl}/chat/completions`, {
        ...request,
        body: JSON.stringify({
          model,
          stream: true,
          messages: [{ role: "system", content: agentPrompt($systemPrompt.value) }, ...llmMessages],
        }),
      })) {
        message.content = content;
        if (content) renderSteps(messages);
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
        messages.push({ role: "user", name: "error", content: "No JS code block to run" });
        renderSteps(messages);
        return;
      }
    })(message.content);
    let module;
    try {
      const blob = new Blob([`const fetch = globalThis.customFetch;\n${code}`], { type: "text/javascript" });
      module = await import(URL.createObjectURL(blob));
    } catch (error) {
      messages.push({ role: "user", name: "error", content: error.stack });
      renderSteps(messages);
      return;
    }
    messages.push({ role: "user", name: "result", content: "Running code..." });
    renderSteps(messages);
    try {
      const result = await module.run({ token: document.getElementById("token")?.value || "" });
      messages.at(-1).content = JSON.stringify(result, null, 2);
    } catch (error) {
      messages.at(-1).name = "error";
      messages.at(-1).content = error.stack;
    }
    $status.classList.add("d-none");
    renderSteps(messages);

    const validationMessages = [messages.at(0), messages.at(-2), messages.at(-1)];
    let validationMessage = { role: "assistant", name: "validator", content: "" };
    messages.push(validationMessage);
    for await (const { content } of asyncLLM(`${baseUrl}/chat/completions`, {
      ...request,
      body: JSON.stringify({
        model,
        stream: true,
        messages: [{ role: "system", content: validatorPrompt }, ...validationMessages],
      }),
    })) {
      validationMessage.content = content;
      if (content) renderSteps(messages);
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
        name == "result" ? "```json\n" + content + "\n```" : name == "error" ? "```\n" + content + "\n```" : content;
      return html`
        <div class="card mb-3">
          <div
            class="card-header ${colorMap[name] || "bg-secondary"} text-white d-flex align-items-center"
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
            <div class="card-body">${unsafeHTML(marked.parse(markdown))}</div>
          </div>
        </div>
      `;
    }),
    $results
  );
}

// Initialize the application
renderApiCards();
selectApi(0);
