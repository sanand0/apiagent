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
let selectedApis = []; // Array to store indices of selected APIs

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
  const apiIndexInSelected = selectedApis.indexOf(index);
  const card = document.querySelector(`.api-card[data-index="${index}"]`);

  if (apiIndexInSelected > -1) {
    // API is already selected, so deselect it
    selectedApis.splice(apiIndexInSelected, 1);
    card.classList.remove("border-primary", "shadow");
  } else {
    // API is not selected, so select it
    selectedApis.push(index);
    card.classList.add("border-primary", "shadow");
  }

  // Update system prompt by concatenating prompts of all selected APIs
  let combinedPrompt = "";
  if (selectedApis.length > 0) {
    combinedPrompt = selectedApis.map(i => demos[i].prompt).join("\n\n---\n\n"); // Join with a separator
  }
  $systemPrompt.value = combinedPrompt;
  $systemPrompt.dispatchEvent(new Event("change", { bubbles: true }));

  // Update example questions
  if (selectedApis.length === 1) {
    const singleSelectedApi = demos[selectedApis[0]];
    render(
      singleSelectedApi.questions.map(
        (question) =>
          html`<button type="button" class="list-group-item list-group-item-action example-question">${question}</button>`
      ),
      $exampleQuestions
    );
  } else {
    // Clear example questions if multiple or no APIs are selected
    render(html``, $exampleQuestions);
  }

  // Update token inputs for ALL selected APIs
  if (selectedApis.length > 0) {
    render(selectedApis.map(selectedIndex => {
      const apiConfig = demos[selectedIndex];
      const inputId = `token-${apiConfig.title.replace(/\s+/g, '-')}`; // Unique ID
      const oauthButtonId = `oauth-button-${selectedIndex}`; // Unique ID for OAuth button

      return html`
        <div class="mb-3 border rounded p-3"> <!-- Added a border for visual separation -->
          <h5>${apiConfig.title} Token</h5> <!-- Title for the API's token section -->
          <label for="${inputId}" class="form-label d-flex justify-content-between">
            <span>
              ${apiConfig.token.label} ${apiConfig.token.required ? html`<span class="text-danger">*</span>` : ""}
            </span>
            ${apiConfig.token.oauth
              ? html`<button type="button" class="btn btn-sm btn-outline-primary" id="${oauthButtonId}">Sign in with ${apiConfig.title}</button>`
              : html`<a href="${apiConfig.token.link}" target="_blank" rel="noopener"
                  >Get token <i class="bi bi-box-arrow-up-right"></i
                ></a>`}
          </label>
          <input
            type="password"
            class="form-control"
            id="${inputId}"
            name="token-${apiConfig.title.replace(/\s+/g, '-')}" // Unique name for saveform
            placeholder="Enter ${apiConfig.token.label}"
            ${apiConfig.token.required ? "required" : ""}
          />
          ${apiConfig.token.oauth ? html`<div class="form-text">OAuth tokens are typically short-lived.</div>` : ''}
        </div>
      `;
    }), $tokenInputs);

    formState.restore(); // Restore form state for all rendered inputs

    // Initialize OAuth for each selected API that uses it
    selectedApis.forEach(selectedIndex => {
      const apiConfig = demos[selectedIndex];
      if (apiConfig.token.oauth) {
        const buttonId = `oauth-button-${selectedIndex}`;
        const inputId = `token-${apiConfig.title.replace(/\s+/g, '-')}`;
        const button = document.getElementById(buttonId);
        const input = document.getElementById(inputId);
        if (button && input) {
          initOAuth(apiConfig.token.oauth, button, input); // Call refactored initOAuth
        }
      }
    });
  } else {
    // No APIs selected, clear token inputs
    render(html``, $tokenInputs);
  }

  // messages.splice(0, messages.length); // Keep or remove based on desired behavior for messages
  // renderSteps(messages); // Keep or remove
}

// Refactored initOAuth
async function initOAuth(config, buttonElement, inputElement) {
  if (!buttonElement || !inputElement) {
    console.error("OAuth button or input element not provided to initOAuth");
    return;
  }
  if (config.provider === "google") {
    if (!window.google || !google.accounts) {
      // Consider awaiting this promise if called for the first time for any button
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: config.clientId,
      scope: config.scope,
      callback: (resp) => {
        if (resp.error) {
          console.error('Google OAuth Error:', resp.error);
          // Optionally display this error to the user
          inputElement.value = ''; // Clear token on error
          inputElement.placeholder = `OAuth failed: ${resp.error}`;
        } else {
          inputElement.value = resp.access_token;
        }
        inputElement.dispatchEvent(new Event("change", { bubbles: true }));
      },
      error_callback: (err) => { // Handle errors during the token client flow
        console.error('Google OAuth Token Client Error:', err);
        inputElement.value = '';
        inputElement.placeholder = 'OAuth error. Check console.';
        inputElement.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    buttonElement.addEventListener("click", () => tokenClient.requestAccessToken());
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
  render(html`Fetching <a href="${url}" target="_blank" rel="noopener">${url}</a>`, $status);
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
  const request = { method: "POST", headers: { "Content-Type": "application/json" } };
  if (apiKey) request.headers["Authorization"] = `Bearer ${apiKey}`;
  else request.credentials = "include";

  for (let attempt = 0; attempt < attempts; attempt++) {
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
      // Collect all tokens from their respective input fields
      const apiTokens = {};
      selectedApis.forEach(index => {
        const apiConfig = demos[index];
        const inputId = `token-${apiConfig.title.replace(/\s+/g, '-')}`;
        const tokenInput = document.getElementById(inputId);
        if (tokenInput) {
          apiTokens[apiConfig.title] = tokenInput.value;
        }
      });
      const result = await module.run({ tokens: apiTokens }); // Pass the object of all tokens
      messages.at(-1).content = JSON.stringify(result, null, 2);
    } catch (error) {
      messages.at(-1).name = "error";
      messages.at(-1).content = error.stack;
    }
    $status.classList.add("d-none");
    renderSteps(messages);

    const validationMessages = [...messages.filter((m) => m.name === "user"), messages.at(-2), messages.at(-1)];
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
