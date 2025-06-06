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
const $continueButton = document.querySelector("#continueButton");

let messages = [];
let requestConfig = {};
// let attemptNumber = 0; // For logging current attempt - REMOVED

const formState = saveform("#task-form", { exclude: '[type="file"]' });

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
          <span>
            ${selectedApi.token.label} ${selectedApi.token.required ? html`<span class="text-danger">*</span>` : ""}
          </span>
          ${selectedApi.token.oauth
            ? html`<button type="button" class="btn btn-sm btn-outline-primary" id="oauth-button">Sign in</button>`
            : html`<a href="${selectedApi.token.link}" target="_blank" rel="noopener"
                >Get token <i class="bi bi-box-arrow-up-right"></i
              ></a>`}
        </label>
        <input
          type="password"
          class="form-control"
          id="token"
          name="token-${selectedApi.title}"
          placeholder="Enter ${selectedApi.token.label}"
          ${selectedApi.token.required ? "required" : ""}
        />
      </div>
    `,
    $tokenInputs
  );

  formState.restore();

  if (selectedApi.token.oauth) initOAuth(selectedApi.token.oauth);

  // Update system prompt
  $systemPrompt.value = selectedApi.prompt;
  $systemPrompt.dispatchEvent(new Event("change", { bubbles: true }));
}

async function initOAuth(config) {
  if (config.provider === "google") {
    if (!window.google || !google.accounts) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    const button = document.getElementById("oauth-button");
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: config.clientId,
      scope: config.scope,
      callback: (resp) => {
        const input = document.getElementById("token");
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
    // $taskForm.dispatchEvent(new Event("submit", { bubbles: true })); // Auto-submit removed for clarity
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
  messages = [{ role: "user", name: "user", content: question }]; // Initialize/reset messages
  renderSteps(messages);
  $continueButton.classList.add("d-none"); // Hide continue button on new submission

  // attemptNumber = 0; // Reset attempt counter for new submission - REMOVED

  requestConfig = { // Initialize/reset requestConfig
    baseUrl: document.getElementById("baseUrlInput").value,
    apiKey: document.getElementById("apiKeyInput").value,
    model: document.getElementById("model").value,
    maxAttempts: document.getElementById("maxAttemptsInput").valueAsNumber,
    baseRequest: { method: "POST", headers: { "Content-Type": "application/json" } },
  };
  // console.log('Max attempts from settings:', requestConfig.maxAttempts); // Log n value - REMOVED
  if (requestConfig.apiKey) requestConfig.baseRequest.headers["Authorization"] = `Bearer ${requestConfig.apiKey}`;
  else requestConfig.baseRequest.credentials = "include";

  for (let i = 0; i < requestConfig.maxAttempts; i++) {
    // attemptNumber++; // REMOVED
    const isDone = await performAttempt();
    if (isDone) return;
  }

  // If loop finishes and not done, show continue button
  if (!messages.some(msg => msg.content?.includes("🟢"))) {
    // console.log('Showing Continue button.'); // Log before showing button - REMOVED
    $continueButton.classList.remove("d-none");
  }
});

$continueButton.addEventListener("click", async () => {
  // console.log('Continue button clicked. Performing one more attempt.'); // Log continue click - REMOVED
  $continueButton.classList.add("d-none"); // Hide button during attempt
  // attemptNumber++; // REMOVED
  const isDone = await performAttempt();
  if (!isDone && !messages.some(msg => msg.content?.includes("🟢"))) {
    $continueButton.classList.remove("d-none"); // Show again if not done
  }
});

async function performAttempt() {
  // console.log('Performing attempt number:', currentAttemptForLog); // Log current attempt number - REMOVED

  // ---- MOCKING FOR TESTING ----
  // To simulate task always not complete (for testing continue button appearance):
  // return false;
  // To simulate task completion after N initial attempts + 1 continue click:
  // if (currentAttemptForLog > requestConfig.maxAttempts) { // currentAttemptForLog is no longer available
  //   console.log(`Simulating task completion`);
  //   messages.push({ role: "assistant", name: "validator", content: "🟢 DONE (Simulated)" });
  //   renderSteps(messages);
  //   return true;
  // }
  // ---- END MOCKING ----

  const { baseUrl, model, baseRequest } = requestConfig;
  const llmMessages = [...messages]; // Use a copy for this attempt's LLM call
  let message = { role: "assistant", name: "developer", content: "" };
  messages.push(message);

  try {
    for await (const { content } of asyncLLM(`${baseUrl}/chat/completions`, {
      ...baseRequest,
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
    return true; // Stop further attempts on error
  }

  if (message.content.includes("🟢")) {
    renderSteps(messages);
    return true; // Task is done
  }

  // Extract the code inside ```js in the last step
  const code = ((content) => {
    try {
      return [...content.matchAll(/```js(.*?)```/gs)][0].at(-1);
    } catch (error) {
      // No code block found, not necessarily an error for the whole process
      // But we can't proceed with this attempt if no code is generated.
      // Depending on desired behavior, could push an error message or let validator handle it.
      // For now, let's assume validator will catch this if it's an issue.
      return null;
    }
  })(message.content);

  if (code === null) {
    // If no code, let validator decide if it's an issue or if the text response is enough.
    // We will still proceed to validation.
    messages.push({ role: "user", name: "result", content: "No code block found to execute. Proceeding to validation." });
    renderSteps(messages);
  } else {
    let module;
    try {
      const blob = new Blob([`const fetch = globalThis.customFetch;\n${code}`], { type: "text/javascript" });
      module = await import(URL.createObjectURL(blob));
    } catch (error) {
      messages.push({ role: "user", name: "error", content: error.stack });
      renderSteps(messages);
      return true; // Stop further attempts on error
    }
    messages.push({ role: "user", name: "result", content: "Running code..." });
    renderSteps(messages);
    try {
      const result = await module.run({ token: document.getElementById("token")?.value || "" });
      messages.at(-1).content = JSON.stringify(result, null, 2);
    } catch (error) {
      messages.at(-1).name = "error";
      messages.at(-1).content = error.stack;
      // Do not return true here, let validator assess the error.
    }
  }
  $status.classList.add("d-none");
  renderSteps(messages);

  // Determine messages for validation: original user query, last assistant (developer) message, and result/error from code execution.
  const validationMessages = [messages[0]]; // User's initial question
  const lastDevMessage = messages.slice().reverse().find(m => m.name === 'developer');
  if (lastDevMessage) validationMessages.push(lastDevMessage);
  const lastResultMessage = messages.slice().reverse().find(m => m.name === 'result' || m.name === 'error');
  if (lastResultMessage) validationMessages.push(lastResultMessage);

  let validationMessage = { role: "assistant", name: "validator", content: "" };
  messages.push(validationMessage);
  try {
    for await (const { content } of asyncLLM(`${baseUrl}/chat/completions`, {
      ...baseRequest,
      body: JSON.stringify({
        model,
        stream: true,
        messages: [{ role: "system", content: validatorPrompt }, ...validationMessages],
      }),
    })) {
      validationMessage.content = content;
      if (content) renderSteps(messages);
    }
  } catch (error) {
    messages.push({ role: "user", name: "error", content: `Validator LLM Error: ${error.stack}` });
    renderSteps(messages);
    return true; // Stop further attempts on validator error
  }

  if (validationMessage.content.includes("🟢")) {
    return true; // Task is done
  }

  return false; // Task is not done
}

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
