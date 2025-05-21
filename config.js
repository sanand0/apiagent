export const demos = [
  {
    icon: "github",
    title: "GitHub API",
    description: "Query GitHub repositories, users, issues, and more.",
    prompt: "Use GitHub API. Only if token is not empty, add Authorization: Bearer ${token}",
    questions: [
      "What are the most starred JavaScript repositories on GitHub?",
      "Who are the top contributors to the TensorFlow repository?",
      "What are the trending Python repositories this week?",
      "List the open issues in the React repository",
      "Show me the most recent pull requests in the Vue.js project",
    ],
    token: {
      label: "GitHub API token",
      link: "https://github.com/settings/tokens",
      required: false,
    },
  },
  {
    icon: "stack-overflow",
    title: "StackOverflow API",
    description: "Search questions, answers, and users on StackOverflow.",
    prompt: "Use StackExchange API. Only if token is not empty, add Authorization: Bearer ${token}",
    questions: [
      "What are the most upvoted JavaScript questions on StackOverflow?",
      "What are the most recent questions about React on StackOverflow?",
      "Find the top-rated answers about Python async/await",
      "What are the most viewed TypeScript questions this month?",
      "Who are the top users for the React tag on StackOverflow?",
    ],
    token: {
      label: "StackOverflow API token",
      link: "https://stackapps.com/apps/oauth/register",
      required: false,
    },
  },
  {
    icon: "book",
    title: "Crossref API",
    description: "Search works, members, journals, and more on Crossref.",
    prompt: `Use CrossRef API base URL: https://api.crossref.org/ - no authentication required.

Common Query Parameters:

- query - Free-text search across titles, authors, etc.
- filter - Facet filters (\`from-pub-date:YYYY-MM-DD\`, \`member:<id>\`, \`has-references:true\`, etc).
- rows - Page size — default 20, max 2000.
- offset - Zero-based index of first record (avoid for large paging; use \`cursor\`).
- cursor - Opaque token for deep paging (\`cursor=*\` for first call).
- sort / order - Sort key (\`created\`, \`relevance\`, etc) & direction (\`asc\`/\`desc\`).
- facet - Return facet counts (e.g. \`facet=license:*\`).
- select - Comma-separated list of fields to return.
- sample - Random sample size (\`sample=20\`).

- GET v1/works - List of all works (articles, books, datasets, etc.). Input: Common + \`query.title\`, \`query.author\`. Output: \`work-list\` - \`DOI\`, \`type\`, \`title\`, \`author[]\`, \`issued\`, \`publisher\`, \`reference-count\`, \`is-referenced-by-count\`, \`license[]\`, \`subject[]\`, \`link[]\`.
- GET v1/works/{doi} - One work by DOI. Input: DOI path param. Output: \`work\` - Same as above, full record.
- GET v1/members - Crossref member accounts. Input: Common | Output: \`member-list\` - \`id\`, \`primary-name\`, \`prefixes[]\`, \`counts\` (works, backfile, etc.).
- GET v1/members/{id} - Single member. Input: Member ID. Output: \`member\` - Same as list item.
- GET v1/members/{id}/works - Works deposited by a member. Input: Common. Output: \`work-list\` - Same as \`/works\`.
- GET v1/journals - Journals registered with Crossref. Input: \`query.title\`, ISSN filters. Output: \`journal-list\` - \`ISSN[]\`, \`title\`, \`publisher\`, \`counts\`.
- GET v1/journals/{issn} - One journal. Input: ISSN. Output: \`journal\` - \`ISSN[]\`, \`title-history\`, \`counts\`, \`license[]\`.
- GET v1/journals/{issn}/works - Works within a journal. Input: Common. Output: \`work-list\` - Same as \`/works\`.
- GET v1/prefixes - DOI namespace prefixes. Input: Common | Output: \`prefix-list\` - \`prefix\`, \`member\`, \`date-time\`.
- GET v1/prefixes/{prefix} - Details for one prefix. Input: Prefix (e.g. \`10.1002\`). Output: \`prefix\` - \`member\`, \`name\`, \`created\`.
- GET v1/prefixes/{prefix}/works - Works under a prefix. Input: Common. Output: \`work-list\` - Same as \`/works\`.
- GET v1/funders - Funder registry entries. Input: \`query\` searches funder names. Output: \`funder-list\` - \`id\`, \`name\`, \`alt-names[]\`, \`location\`, \`counts\`.
- GET v1/funders/{id} - One funder. Input: Funder DOI suffix or ID. Output: \`funder\` - As above plus child funders.
- GET v1/funders/{id}/works - Works acknowledging a funder. Input: Common. Output: \`work-list\` - Same as \`/works\`.
- GET v1/types - Registered resource types. Input: Common | Output: \`type-list\` - \`id\`, \`label\`, \`parent\`, \`counts\`.
- GET v1/types/{id} - One type. Input: Type name (\`journal-article\`, …). Output: \`type\` - \`label\`, \`description\`, \`parent\`, \`counts\`.
- GET v1/licenses - Licenses applied to works. Input: Common | Output: \`license-list\` - \`URL\`, \`work-count\`, \`ISSN[]\`, \`start-date\`, \`end-date\`.
- GET v1/works/{doi}/transform/{format} - Content-negotiation helper (BibTeX, Citeproc JSON, etc.). Input: \`format\` = \`text/x-bibliography\`, \`application/x-bibtex\`, … | Output: N/A (returns plain text).

Every JSON response is wrapped like:

\`\`\`jsonc
{
  "status": "ok",
  "message-type": "<resource-or-resource-list>",
  "message-version": "1.0.0",
  "message": {
    // list: pagination + items
    "total-results": 1234,
    "items-per-page": 20,
    "query": {...},
    "items": [ /* resource objects */ ]
    // singleton: full resource object directly
  }
}
\`\`\`

- Prefer \`cursor\` over \`offset\` to avoid expensive scans.
- Use \`select=field1,field2\` to cut token cost when embedding records.
`,
    questions: [
      "How many journal articles did Elsevier register in 2024?",
      "Which ten funders are cited most often in Wiley papers published since 1 Jan 2023?",
      "What proportion of Springer Nature’s 2025 articles carry a Creative Commons licence?",
      "Does DOI 10.5555/12345678 exist, and if so, who is the publisher?",
      "List the most recent 20 articles for ISSN 1234-5678, newest first.",
      "Which authors published five or more Elsevier papers but none with Wiley in 2024?",
      "How many 2024 retractions were recorded for Elsevier, Springer Nature, Wiley, Taylor & Francis and Sage?",
      "What share of outgoing references failed to resolve in Wiley vs Elsevier 2023 articles?",
    ],
    token: {
      label: "Crossref API token",
      link: "https://crossref.org/for-developers/",
      required: false,
    },
  },
  {
    icon: "kanban",
    title: "JIRA API",
    description: "Query JIRA issues, projects, and workflows.",
    prompt: "Use the Atlassian JIRA REST API. Format JQL queries correctly and use the appropriate endpoints.",
    questions: [
      "List all open bugs in project XYZ",
      "Show me the issues assigned to me",
      "What issues were resolved in the last sprint?",
      "Find all critical issues in the backlog",
      "Show the workflow history for issue PROJ-123",
    ],
    token: {
      label: "JIRA API token",
      link: "https://id.atlassian.com/manage-profile/security/api-tokens",
      required: true,
    },
  },
];

export const agentPrompt = (apiInfo) => `You are an JavaScript developer.

1. A user asked you a question (first message)
2. Write browser JS code to solve it using API-DETAILS below.
3. There may be additional messages that contain output and feedback. If so, rewrite the code to solve it.

# API Details

${apiInfo}

# How to write code

- List relevant API endpoint(s)
- List all relevant input and output parameters of the endpoints
- Pick output parameters required to complete the task AND validate the result
- Then write a SINGLE, COMPLETE browser JS code block for a \`run()\` function:

\`\`\`js
export async function run(params) {
  // ... code to fetch() from the API ...
  // ... code to calculate the result ...
  // ... on error, throw new Error. Include error, latest response headers AND text.
  return result;
}
\`\`\`

The user will ALWAYS call \`result = await run({token})\` and share the result (or error).
`;

export const validatorPrompt = `The user asked a question. An LLM generated code and ran it. The output is below.

If the result answers the question COMPLETELY, write the answer in plain English, formatted as Markdown.
If not, tell the LLM the MOST LIKELY error and how to fix it. No code required.

If and ONLY IF the LLM's result COMPLETELY answered the user's question, "🟢 DONE". Else say "🔴 REVISE".`;
