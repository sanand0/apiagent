export const demos = [
  {
    icon: "github",
    title: "GitHub API",
    description: "Query GitHub repositories, users, issues, and more.",
    prompt: "Use GitHub API. Only if params.github is not empty, add Authorization: Bearer ${params.github}",
    questions: [
      "What are the most starred JavaScript repositories on GitHub?",
      "What did @simonw do in the last few days?",
      "Who are the top contributors to the TensorFlow repository?",
      "What are the trending Python repositories this week?",
      "List the open issues in the React repository",
      "Show me the most recent pull requests in the Vue.js project",
    ],
    params: [
      {
        label: "GitHub API token",
        link: "https://github.com/settings/tokens",
        required: false,
        key: "github",
        type: "password",
      },
    ],
  },
  {
    icon: "stack-overflow",
    title: "StackOverflow API",
    description: "Search questions, answers, and users on StackOverflow.",
    prompt:
      "Use StackExchange API. Only if params.stackoverflow is not empty, add Authorization: Bearer ${params.stackoverflow}",
    questions: [
      "What are the most upvoted JavaScript questions on StackOverflow?",
      "What are the most recent questions about React on StackOverflow?",
      "Find the top-rated answers about Python async/await",
      "What are the most viewed TypeScript questions this month?",
      "Who are the top users for the React tag on StackOverflow?",
    ],
    params: [
      {
        label: "StackOverflow API token",
        link: "https://stackapps.com/apps/oauth/register",
        required: false,
        key: "stackoverflow",
        type: "password",
      },
    ],
  },
  {
    icon: "graph-up-arrow",
    title: "Google Analytics",
    description: "Explore your website traffic and user behavior with Google Analytics.",
    prompt: "Use Google Analytics Data API for property ${params.gaPropertyId}. Authorization: Bearer ${params.ga}",
    questions: [
      "How many daily active users has your Android app had in the last week?",
      "How many page views the top 10 pages on your site had in the last 28 days?",
      "How many sessions the top 10 pages on your site had in the last 28 days?",
    ],
    params: [
      {
        label: "Google Analytics API token",
        link: "https://developers.google.com/oauthplayground/",
        required: true,
        key: "ga",
        type: "password",
      },
      {
        label: "Google Analytics property ID",
        key: "gaPropertyId",
        type: "text",
        required: false,
      },
    ],
  },
  {
    icon: "google",
    title: "Google Workspace",
    description: "Access Gmail, Calendar and Drive using Google APIs.",
    prompt: "Use Google Workspace APIs. Send Authorization: Bearer ${params.google}. Max 5 concurrent requests.",
    questions: [
      "List my unread Gmail messages in the inbox",
      "What events do I have tomorrow?",
      "Search Drive for files shared with me this month",
      "What are the largest emails that I can delete?",
      "Create a lunch meeting tomorrow at 12 noon for 30 minutes",
    ],
    params: [
      {
        label: "Google OAuth token",
        link: "https://developers.google.com/oauthplayground/",
        required: true,
        key: "google",
        type: "password",
        oauth: {
          provider: "google",
          // root.node@gmail.com | Project: Personal mail etc. OAuth Client: Web apps
          // https://console.cloud.google.com/auth/clients/872568319651-r1jl15a1oektabjl48ch3v9dhipkpdjh.apps.googleusercontent.com?inv=1&invt=AbzTOQ&project=encoded-ensign-221
          clientId: "872568319651-r1jl15a1oektabjl48ch3v9dhipkpdjh.apps.googleusercontent.com",
          scope:
            "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/drive.readonly",
        },
      },
    ],
  },
  {
    icon: "book",
    title: "Crossref & OpenAlex API",
    description: "Search scholarly works, authors, journals, and more using Crossref and OpenAlex.",
    prompt: `Use CrossRef and/or OpenAlex API, no authentication required.

# CrossRef API

Base URL: https://api.crossref.org/

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

# OpenAlex API

Base URL: https://api.openalex.org/

Common Parameters:

- filter - Attribute:value pairs (e.g., \`publication_year:2023\`, \`authorships.institutions.ror:02mh96903\`, \`type:article\`, \`open_access.oa_status:gold\`, \`primary_location.source.publisher_lineage:P4310319865\`). Combine multiple with commas.
- select - Comma-separated fields to return (e.g., \`select=id,doi,title,publication_year,cited_by_count\`).
- search - Free-text search (e.g., \`search=climate+change\`). For specific fields: \`title.search:nanotechnology\`.
- sort - Sort key(s) + optional “:desc” (works_count, cited_by_count, display_name, publication_date, relevance_score*)
- group_by - Group results by a field and get counts (e.g., \`group_by=authorships.institutions.country_code\`).
- sample - Random sample size (e.g., \`sample=10\`). Use with \`seed=<number>\` for reproducibility.
- per-page - Page size (≤ 200; default 25)
- page - Page number for pagination (default 1).
- cursor - For deep paging, especially with \`/works\`. \`cursor=*\` first call → meta.next_cursor
- mailto - Use root.node@gmail.com

Endpoints (use OpenAlex IDs, DOIs, RORs, ORCIDs, ISSNs as appropriate):

- GET /works - List works. Filters: \`publication_year\`, \`primary_location.source.id\` (for journal/repo), \`authorships.author.id\`, \`authorships.institutions.id\`, \`concepts.id\` (legacy), \`topics.id\`, \`grants.funder.id\`, \`open_access.oa_status\`, \`type\` (e.g. \`article\`, \`book-chapter\`, \`dataset\`). Output fields: \`id\`, \`doi\`, \`title\`, \`display_name\`, \`publication_year\`, \`publication_date\`, \`type\`, \`authorships\` (incl. \`author\`, \`institutions\`), \`primary_location\` (incl. \`source\`, \`license\`, \`is_oa\`, \`version\`), \`open_access\` (\`oa_status\`, \`oa_url\`), \`cited_by_count\`, \`referenced_works\`, \`related_works\`, \`topics\` (incl. \`id\`, \`display_name\`, \`score\`), \`grants\`.
- GET /works/{id} - Get a single work by OpenAlex ID, DOI (e.g., \`doi:10.1234/example\`), PMID, or MAG ID.
- GET /authors - List authors. Filters: \`display_name.search\`, \`last_known_institution.id\`, \`orcid\`, \`x_concepts.id\`. Output fields: \`id\`, \`orcid\`, \`display_name\`, \`display_name_alternatives\`, \`works_count\`, \`cited_by_count\`, \`last_known_institutions\`, \`x_concepts\`, \`summary_stats\` (incl. \`h_index\`, \`i10_index\`).
- GET /authors/{id} - Get a single author by OpenAlex ID, ORCID, Scopus Author ID, MAG ID.
- GET /sources - List sources (journals, repositories, etc.). Filters: \`display_name.search\`, \`issn\`, \`publisher_lineage\` (using publisher ID), \`type\` (e.g. \`journal\`, \`repository\`), \`is_oa\`. Output fields: \`id\`, \`issn_l\`, \`issn\`, \`display_name\`, \`type\`, \`publisher_lineage\` (publisher IDs), \`works_count\`, \`cited_by_count\`, \`is_oa\`, \`is_in_doaj\`.
- GET /sources/{id} - Get a single source by OpenAlex ID, ISSN (e.g., \`issn:1234-5678\`), MAG ID.
- GET /institutions - List institutions. Filters: \`display_name.search\`, \`ror\`, \`country_code\`, \`type\`. Output fields: \`id\`, \`ror\`, \`display_name\`, \`country_code\`, \`type\`, \`works_count\`, \`cited_by_count\`, \`associated_institutions\` (parent/child), \`geo\` (\`city\`, \`country\`).
- GET /institutions/{id} - Get a single institution by OpenAlex ID, ROR, MAG ID.
- GET /topics - List topics. Filters: \`display_name.search\`, \`domain.id\`, \`field.id\`, \`subfield.id\`. Output fields: \`id\`, \`display_name\`, \`description\`, \`domain\`, \`field\`, \`subfield\`, \`works_count\`, \`cited_by_count\`.
- GET /topics/{id} - Get a single topic by OpenAlex ID or Wikidata ID.
- GET /publishers - List publishers. Filters: \`display_name.search\`, \`country_codes\`, \`parent_publisher\`. Output fields: \`id\`, \`display_name\`, \`alternate_titles\`, \`country_codes\`, \`hierarchy_level\`, \`parent_publisher\`, \`works_count\`, \`cited_by_count\`, \`sources_api_url\`, \`ids\` (ror, wikidata).
- GET /publishers/{id} - Get a single publisher by OpenAlex ID, ROR, Wikidata ID.
- GET /funders - List funders. Filters: \`display_name.search\`, \`country_code\`. Output fields: \`id\`, \`ror\`, \`display_name\`, \`alternate_names\`, \`country_code\`, \`works_count\`, \`cited_by_count\`.
- GET /funders/{id} - Get a single funder by OpenAlex ID, ROR, Wikidata ID.
- GET /autocomplete/{entity_type}?q={search_term} - Fast typeahead search for entities.

OpenAlex Response Structure (for lists):

\`\`\`jsonc
{
  "meta": {
    "count": 12345,
    "db_response_time_ms": 50,
    "page": 1,
    "per_page": 25,
    "next_cursor": "DwAAAXFuX2NhcmRNMV9EcFc1..."
  },
  "results": [ /* list of entity objects */ ],
  "group_by": [
    { "key": "gold", "key_display_name": "Gold", "count": 100 },
    { "key": "green", "key_display_name": "Green", "count": 50 }
  ]
}
\`\`\`
Single entity responses return the object directly.

- Use \`filter\` for precise criteria; \`search\` is for broader discovery.
- Use \`select\` to return only needed fields, saving bandwidth and processing.
- Use \`cursor\` for paginating through large result sets, especially for \`/works\`.

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
      "How many works published were published by German institutions in 2023, by institution type?",
      "What kinds of work did the Bill & Melinda Gates Foundation fund in 2024?",
      "What is the h-index distribution for authors primarily affiliated with Harvard University who published at least one paper in 2023?",
      "Identify journals that published more than 50 articles on 'artificial intelligence' in 2023 and have a 2-year mean citedness (impact factor) greater than 5.",
      "What percentage of works published by Elsevier (identify via CrossRef member ID) in 2023 are Gold Open Access according to OpenAlex?",
    ],
    params: [
      {
        label: "Crossref API token",
        link: "https://crossref.org/for-developers/",
        required: false,
        key: "crossref",
        type: "password",
      },
    ],
  },
  {
    icon: "kanban",
    title: "JIRA API",
    description: "Query JIRA issues, projects, and workflows.",
    prompt:
      "Use the Atlassian JIRA REST API. Format JQL queries correctly and use the appropriate endpoints. Send Authorization: Bearer ${params.jira}",
    questions: [
      "List all open bugs in project XYZ",
      "Show me the issues assigned to me",
      "What issues were resolved in the last sprint?",
      "Find all critical issues in the backlog",
      "Show the workflow history for issue PROJ-123",
    ],
    params: [
      {
        label: "JIRA API token",
        link: "https://id.atlassian.com/manage-profile/security/api-tokens",
        required: true,
        key: "jira",
        type: "password",
      },
    ],
  },
  {
    icon: "search",
    title: "Google Custom Search",
    description: "Search the web with a Custom Search Engine.",
    prompt:
      "Use Google Custom Search JSON API at https://www.googleapis.com/customsearch/v1. Send key=${params.cse} and your cx ID along with q, num and other params. Results come in items[] with title, link and snippet.",
    questions: [
      "Search the web for tutorials on the Fetch API",
      "Find recent news about AI policy",
      "Show images of the Eiffel Tower",
    ],
    params: [
      {
        label: "Google CSE API key",
        link: "https://developers.google.com/custom-search/v1/introduction",
        required: true,
        key: "cse",
        type: "password",
      },
    ],
  },
  {
    icon: "search-heart",
    title: "SerpApi",
    description: "Retrieve Google search results from SerpApi.",
    prompt:
      "Use https://serpapi.com/search.json with engine=google, q and api_key=${params.serpapi}. Optional params like location, num or start control the results. Parse organic_results[].",
    questions: [
      "Top Google results for best programming laptop 2024",
      "Latest news about OpenAI stock",
      "Find coffee shops in New York",
    ],
    params: [
      {
        label: "SerpApi key",
        link: "https://serpapi.com/manage-api-key",
        required: true,
        key: "serpapi",
        type: "password",
      },
    ],
  },
  {
    icon: "router",
    title: "OpenRouter",
    description: "Call models via the OpenRouter API.",
    prompt:
      "Use POST https://openrouter.ai/api/v1/chat/completions with Authorization: Bearer ${params.openrouter}. Include Referer and X-Title headers. Choose the model parameter to pick a provider.",
    questions: [
      "Summarize https://example.com",
      "Explain quantum computing in simple terms",
      "Translate Good morning to French",
    ],
    params: [
      {
        label: "OpenRouter API key",
        link: "https://openrouter.ai/settings/keys",
        required: true,
        key: "openrouter",
        type: "password",
      },
    ],
  },
  {
    icon: "globe2",
    title: "Wikipedia API",
    description: "Query Wikipedia articles and summaries.",
    prompt:
      "Use https://en.wikipedia.org/w/api.php with action=query. Common params: list=search&srsearch=<term> or prop=extracts&titles=<title>&explaintext. No auth required.",
    questions: [
      "What is the population of Canada?",
      "Give the intro for Python (programming language)",
      "List sections of the New York City page",
    ],
    params: [
      {
        label: "Wikipedia API token",
        link: "https://www.mediawiki.org/wiki/API:Main_page",
        required: false,
        key: "wikipedia",
        type: "password",
      },
    ],
  },
  {
    icon: "database",
    title: "Wikidata API",
    description: "Access structured data from Wikidata.",
    prompt:
      "Use https://www.wikidata.org/w/api.php. Search via action=wbsearchentities&search=<term>&language=en and fetch details with action=wbgetentities&ids=<id>. No auth needed.",
    questions: ["Find the Wikidata ID for Elon Musk", "Get the birth date of Q42", "List properties of Q90"],
    params: [
      {
        label: "Wikidata API token",
        link: "https://www.wikidata.org/wiki/Wikidata:Data_access",
        required: false,
        key: "wikidata",
        type: "password",
      },
    ],
  },
  {
    icon: "film",
    title: "TMDB",
    description: "Discover movies and TV shows with The Movie Database.",
    prompt:
      "Use https://api.themoviedb.org/3. Send Authorization: Bearer ${params.tmdb}. Search via /search/movie?query=<term> and get details from /movie/<id>.",
    questions: ["Popular movies this week", "Search for movies about space", "Details for the movie Inception"],
    params: [
      {
        label: "TMDB API key",
        link: "https://www.themoviedb.org/settings/api",
        required: true,
        key: "tmdb",
        type: "password",
      },
    ],
  },
  {
    icon: "h-circle",
    title: "HubSpot API",
    description: "Manage contacts and deals with HubSpot.",
    prompt:
      "Use HubSpot API. Send Authorization: Bearer ${params.hubspotToken}. hapikey=${params.hubspotClientId}",
    questions: ["List contacts created last week", "Show total deals amount by stage"],
    params: [
      {
        label: "HubSpot API token",
        link: "https://developers.hubspot.com/docs/api/overview",
        required: true,
        key: "hubspotToken",
        type: "password",
      },
      {
        label: "HubSpot client ID",
        key: "hubspotClientId",
        type: "text",
        required: false,
      },
    ],
  },
];

// now() returns the current time to the nearest 10 minutes
const now = () => new Date().toISOString().slice(0, -9) + "0:00.000Z";

export const agentPrompt = (apiInfo) => `You are an JavaScript developer following this loop:

1. A user asks a question.
2. You write browser JS code to solve it using API-DETAILS below.
3. User runs your output and passes that along with LLM feedback. If needed, rewrite the code to solve it.
4. The user may have follow-up questions. Interpret the latest question in context and go back to step 2.

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

The user will ALWAYS call \`result = await run({params})\` where \`params\` is an object with keys for each API and share the result (or error).

Do NOT forget to wrap in \`\`\`js ... \`\`\`

Current time (UTC): ${now()}`;

export const validatorPrompt = `The user asked one or more questions. An LLM generated code and ran it. The output of the last step is below.

If and ONLY IF the result answers the last question COMPLETELY, explain the answer in plain English, formatted as Markdown. Then say "🟢 DONE".
If not, say "🔴 REVISE" and explain the MOST LIKELY error and how to fix it. No code required.

Current time (UTC): ${now()}`;
