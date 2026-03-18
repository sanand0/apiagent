# Prompts

## Add FRED API, 18 Mar 2026

<!--

FRED API research via another Copilot instance that live-tested the API.
Questions via: https://gemini.google.com/app/cb939e416e331490

-->

Add the FRED API as the first API. Request a FRED API key.

FRED API details are below. Incorporate only what's relevant into the prompt in config.js:

- Federal Reserve Economic Data API for time-series economics data.
- Useful endpoint families include:
  - `/fred/series/search` for discovery
  - `/fred/series` for series metadata
  - `/fred/series/observations` for values over time
- Docs show support for metadata such as title, units, frequency, seasonal adjustment, and observation windows.
- Docs also show transformation/filter parameters such as `units`, `frequency`, `aggregation_method`, `observation_start`, and `observation_end`.
- Response formats are endpoint-dependent:
  - many endpoints support `xml` and `json`
  - `series/observations` docs also list `xlsx` and zipped `csv`

Usage:

- Base host: `https://api.stlouisfed.org/fred/`
- A registered 32-character lowercase alphanumeric `api_key` is required for live data access.
- Default format is XML; request JSON explicitly with `file_type=json`.
- Missing or unregistered keys return HTTP 400 JSON errors.
- Example pattern: `https://api.stlouisfed.org/fred/series/observations?series_id=GDP&api_key=YOUR_KEY&file_type=json`

| Request                                                                                                                                           | Result                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /fred/series?series_id=GDP&api_key=YOUR_KEY&file_type=json`                                                                                  | Returned HTTP 200 metadata for GDP: title `Gross Domestic Product`, frequency `Quarterly`, units `Billions of Dollars`, observation range `1947-01-01` to `2025-10-01`. |
| `GET /fred/series/observations?series_id=GDP&observation_start=2024-01-01&sort_order=desc&limit=3&api_key=YOUR_KEY&file_type=json`                | Returned HTTP 200 with recent GDP observations: `2025-10-01 = 31442.483`, `2025-07-01 = 31098.027`, `2025-04-01 = 30485.729`.                                           |
| `GET /fred/series/search?search_text=unemployment&limit=2&api_key=YOUR_KEY&file_type=json`                                                        | Returned HTTP 200 with `count = 53486`; top results were `UNRATE` and `UNRATENSA`, both monthly unemployment-rate series in percent.                                    |
| `GET /fred/series/observations?series_id=CPIAUCSL&units=pc1&observation_start=2025-01-01&sort_order=desc&limit=3&api_key=YOUR_KEY&file_type=json` | Returned HTTP 200 transformed observations with `units = pc1` and recent values `2.43400`, `2.39120`, `2.65330`, confirming server-side unit/transform support.         |

Caveats

- Some series return leading `"."` values when you request very early observations; using `observation_start` and/or `sort_order=desc` is helpful for recent numeric data.
- Successful payloads were now verified live; format/parameter breadth beyond the tested requests is still based on official FRED docs.

For the questions, use these:

1. Yield curve inversion: calculate daily 10Y-2Y treasure constant maturity rate spread for 2 years. Month-by-month, summarize the spread.
2. Real corporate borrowing costs: Calculate the monthly real BBB corporate yield by subtracting YoY CPI inflation from the monthly-averaged BBB yield for the last 5 years. Display the results for the last 12 months.
3. Misery index tracker: Calculate a monthly Misery Index (unemployment rate plus YoY CPI inflation) from 2018 to present. Rank and display the top 10 months with the highest index values.
4. High yield credit spread: Calculate the daily credit spread (US High Yield Index minus 10-Year Treasury) for the last 3 years. Summarize the minimum, maximum, and average spread annually.
5. Mortgage rates vs. housing starts: Calculate the month-over-month percentage change for 30-year mortgage rates (resampled to monthly) and housing starts over the last 10 years. Display the combined results for the last 6 months.

---

We want to show the agent recovering from an error in the code. Include a subtle toggle to the right of the submit button labelled [Cheap model | Good model]. When "Cheap model" is selected, ensure that it ALWAYS includes a bug in the code that causes the API to fail the FIRST time, but should recover the second time onwards. When "Good model" is selected, the code should be correct on the first try. This should be achieved by prompt suffix(es) with MINIMAL code change.

<!-- copilot --resume=f6239b8b-41ef-4ffe-9296-700382ad6963 -->
