# ClimateCommit judge demo

ClimateCommit helps a fleet or policy analyst check what an official update says about Hong Kong's electric bus programme and inspect the assumptions behind its potential operating emissions.

## Set up locally

1. Open `ClimateCommit-Demo.html` for the offline demo. To check a new official URL, run `npm start` with Node.js 20 or later and open [the local demo](http://127.0.0.1:4173).
2. Let the emissions comparison play through. Open the assumptions and confirm that the three scenarios use the same vehicle count and annual service distance.
3. Under **Implementation evidence**, click **Analyze official update**. Check the displayed analysis mode and open the cited paragraph. If using the live Codex mode on stage, rehearse with the same signed-in account and network.
4. Keep the October reply open in a second tab. For a different live source, open **Try another document**, paste the May 2026 reply URL, and click **Analyze official link**. The official-link path uses rules and depends on network access. The bundled update has its input locally available. [May 2026 Legislative Council reply](https://www.info.gov.hk/gia/general/202605/20/P2026052000267.htm)

## English script · about two minutes

**0:00–0:35 · Open on the three scenarios**

> Hong Kong's electric bus subsidy scheme covers around 600 franchised buses. To explore the climate implications, we model 600 buses providing the same annual service distance as their diesel counterparts. With the factors shown here, the CLP electricity scenario lowers annual operating emissions by about 5,500 tonnes. The HK Electric factor scenario raises them by about 19,000 tonnes. These are estimates under stated assumptions. The takeaway for an analyst is to check the depot's electricity source and measured energy use before claiming a carbon benefit.

**0:35–1:20 · Run the document review and open the evidence**

> An analyst also needs to know how far the programme has progressed. Start with the government’s October Legislative Council reply. The tool reads the selected text, proposes evidence for each stage, and checks the quotation against the input. It can confirm that preparations for tendering began. The dates for orders and vehicle registration are targets. Those two milestones stay unconfirmed in this document review. You can click through to the official reply and inspect the exact paragraph.

**1:20–1:50 · Explain the result and its limits**

> The policy update leaves the emissions estimates intact because the reply does not supply a measured fleet mix, service distance, or electricity demand for this batch. The prototype keeps the status and the scenario assumptions separately inspectable. For the next trial, we would ask a fleet or policy analyst to review a new document and compare their findings with the tool’s output.

**State the mode you actually see.** The offline path revalidates two candidates from a saved Codex subagent run. New official links are fetched and checked using rules. In live `codex` mode, Codex proposes candidate quotes and the same checks accept or reject each one. The paste tool treats source attribution as unverified.

**Optional judge interaction.** Open **Try another document** and paste the following synthetic test. Orders and delivery should stay unchanged. This demonstrates the acceptance rules using made-up input.

```text
The Electric Bus Subsidy Scheme targets about 600 e-buses. Taxi operators placed purchase orders for 500 electric taxis.

Franchised bus operators expect to complete delivery and registration of about 600 e-buses by the end of 2029.
```

## Acceptance checklist

| Check | Expected result |
| --- | --- |
| Baseline and comparison | The three annual totals are reproducible with the displayed model assumptions. Scenario labels describe hypothetical operations. |
| Bundled document | The evidence panel identifies the government document and links to the dated source. Tender preparations become confirmed. Purchase orders and delivery/registration stay unchanged. |
| Official URL | Pasting the supported gov.hk English release URL fetches the published HTML and checks the same milestones. Other hosts are rejected. |
| Pasted input | A pasted statement about an unrelated electric taxi order or an expected bus delivery cannot confirm the scheme's order or delivery stages. A review of pasted text is attributable to the input and its paragraph, with independent provenance still open. |
| Isolation | Running the review does not change the original baseline record or the assumptions used by the emissions chart. |
| Mode and fallback | The tool shows which analysis path actually ran. Rehearse with Codex signed in and run the local fallback separately. Record live Codex as verified only when a real run returns `codex`. |
| Sources and connection | The bundled material is available to the local server. Open cited pages separately while online to check the source and location. |

The demo covers one subsidy programme and a small set of documents. It measures no realized emissions savings and makes no claim about review time saved, extraction accuracy across other policies, public hosting, or a fleet operator's adoption. Record those checks separately if they are completed before submission.

The local HTTP tests cover bundled and pasted inputs, candidate validation with a stub agent, fallback, and request validation. Separate HTTP runs fetched two official Legislative Council URLs and confirmed tender preparations in rules mode. The saved subagent run contributed two candidates and both passed validation. The six curated regression documents agreed with their manual labels. This sample supports regression checks on the case.

A full authenticated Codex CLI run processed the bundled source in about 117 seconds and both of its two candidates passed verification. For the presentation, use the default recorded run, which validates the saved quotes immediately. Desktop Chrome and a mobile-width Chrome session verified the local and network-disabled single-file workflows.

## Primary policy sources

- The official reply covers the tender preparations and target deadlines in the paragraph on franchised buses under parts (2) and (4). Its earlier registration table describes all registered vehicles in the cited categories. [Legislative Council reply, 7 October 2026](https://www.info.gov.hk/gia/general/202610/07/P2026100600231.htm)
- Paragraph 180 describes HK$470 million earmarked for the plan. [2025 Budget Speech](https://www.info.gov.hk/gia/general/202502/26/P2025022600142.htm)
- The scheme section describes the launched programme, intended scale and purchase subsidy limits. The local evidence corpus retains selected passages and links to the public source. [New Energy Transport Fund](https://www.eeb.gov.hk/en/new-energy-transport-fund/AU.html)
- The operating model and reference values are documented in [the parameter basis](data/model-basis.md).
