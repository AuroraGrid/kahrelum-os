# Evidence ledger — November 17, 2026

Classification: FACT = directly supported source claim; CALCULATION = declared arithmetic; UNVERIFIED = not established. No source verifies the anonymous $42 transaction.

| ID | Claim and safe test | Primary URL | Observed result and limitation |
|---|---|---|---|
| S1 | Original dates, mass and composition; read issuer history | https://www.usmint.gov/news/inside-the-mint/one-hundred-years-of-silver-dollar-coinage-1878-1978 | FACT: April 15, 2021 article states 1878–1904, resumed 1921; 26.73 g, .900 silver, .100 copper. Read through web tool November 17; later direct HTTP request 12:02:42.835202Z returned 403. Web extraction was readable; no raw-body hash falsely assigned to it. |
| S2 | Conventional actual silver weight; inspect Morgan table row | https://www.ngccoin.com/price-guide/coin-melt-values.aspx | FACT: Morgan 1878–1921, 90% silver, 26.73 g, ASW 0.7734 oz. HTTP 200 at timestamp in source-retrievals.json, body hash retained. Page distinguishes collector and melt values. Dynamic displayed prices excluded from historical adjudication. |
| S3 | Whether guide equals dealer bid; read methodology | https://www.pcgs.com/prices | FACT: live browser review November 17 (exact browser observation time not captured) confirmed average dealer asks for PCGS-graded coins and guide limitations. Displayed update label was 11-16 06:58 PM EST. Direct HTTP at 12:02:42.836696Z returned 403; browser access succeeded. Exact browser observation second was not captured and is not invented. |
| C1 | Weight conversion | S1 + standard troy-ounce unit conversion | CALCULATION: 26.73 × .9 / 31.1034768 = .7734505102014834 oz. This does not exactly equal the table convention .7734. Rounded metric specification, conventional content, actual worn mass and assay are distinct. |
| C2 | Synthetic melt and gross premium | Explicit assumption S=$40/oz, not sourced market price | CALCULATION: .7734 × 40 = 30.936; 42 − 30.936 = 11.064; 11.064 / 30.936 × 100 ≈ 35.76%. $42 − $2 fees − $1 shipping = $39. No real offer inferred. |
| U1 | Anonymous offer executable? | User assignment only; no original URL | UNVERIFIED: offeror, date, coin, quantity, currency, condition, acceptance requirements and expiry absent. HOLD. |
| U2 | Original AI interpretation and correction | User assignment only; transcript absent | UNVERIFIED: reconstructed category error clearly labeled. Exact original words/model/timestamp cannot be reported. |
| U3 | Packaged 18 files / 15 passing tests | Requested ZIP and prototype not found | UNVERIFIED. No extraction or original test reproduction claimed. |

## Hypotheses and actual results

H1: $42 is a retail ask. Safe test: inspect original offer direction. Original absent; assignment calls it a dealer buyback. Use reported bid with UNVERIFIED provenance, never assert authenticated execution.
H2: a higher PCGS guide proves a bad sale. Safe test: inspect PCGS methodology. Rejected as a categorical inference: guide reflects dealer asks, not that user's realizable bid.
H3: known silver composition establishes coin value. Safe test: separate physical specification, collector value and executable quote. Rejected: authenticity, wear, grade, mintmark and costs are unresolved.
H4: tests establish superiority. Safe test: identify comparator raw responses and frozen protocol. None exists. No external model comparison run or superiority claim.

## Source custody and licensing

Sources are independent issuer, grading-service methodology and grading-service composition references, not independent confirmations of the $42 claim. Full downloaded third-party pages stay in local evidence; the repository contains source URLs, hashes and paraphrases. No coin imagery was copied. Social artwork is original SVG typography and geometry, rendered to PNG with CairoSVG; there is no third-party coin-photo licensing dependency.

The attempted NIST URL returned 404 and is not cited as verified authority. The standard unit conversion is a calculation constant; NGC's independently retrieved ASW is the article's declared melt basis. Exact HTTP retrieval timestamps are in source-retrievals.json; browser observations without captured seconds are labeled accordingly. No retrospective cutoff is manufactured.

## Unit-reference follow-up

The initial NIST 404 remains in the retrieval record. A later NIST PDF was unavailable to the web extractor because of its size. LBMA directly confirms the exact 31.1034768 g troy-ounce conversion at https://www.lbma.org.uk/wonders-of-gold/items/the-troy-ounce. Primary-source text was retrieved through web search on November 17, 2026; direct HTTP retrieval returned 403. See unit-retrieval.json. This supports the conversion constant without importing a market price.
