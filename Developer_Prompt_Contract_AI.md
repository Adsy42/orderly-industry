# Developer Prompt: Contract AI Red Flag Detection Module

## Context

You're building a contract review feature for Pathway Property's Due Diligence platform. The tool helps buyer's agents identify red flags in Victorian property contracts before their clients sign.

We're using **Isaacus** (https://docs.isaacus.com) for legal AI classification. Their API accepts IQL (Isaacus Query Language) statements that return a 0-100% confidence score. Scores >50% indicate a positive match.

---

## What You're Building

A dashboard module that:
1. Accepts uploaded Contract of Sale and Section 32 Vendor Statement documents (PDF/DOCX)
2. Runs predefined IQL queries against each document
3. Displays detected red flags with severity levels, locations, and recommended actions
4. Calculates an overall risk score
5. Generates a summary report for the buyer's agent

---

## Tech Stack

- **AI Backend**: Isaacus API (https://platform.isaacus.com)
- **Model**: `kanon-universal-classifier`
- **Query Language**: IQL (Isaacus Query Language)
- **Docs**: https://docs.isaacus.com/iql/introduction

---

## Isaacus API Integration

### Installation
```bash
pip install isaacus
```

### Basic Usage
```python
from isaacus import Isaacus

client = Isaacus(api_key="your-api-key")

result = client.classifications.universal.create(
    model="kanon-universal-classifier",
    query='{IS clause that "requires a deposit exceeding 10%"}',
    text=document_text,
)

# result.score = 0.0 to 1.0 (multiply by 100 for percentage)
# result.start_char, result.end_char = location in document
```

---

## Red Flag Queries to Implement

### CONTRACT OF SALE QUERIES

```python
CONTRACT_QUERIES = [
    {
        "id": "foreign_vendor",
        "name": "Foreign Resident Vendor",
        "query": '{IS clause that "identifies the vendor as a foreign resident or foreign entity"}',
        "severity": "HIGH",
        "category": "Tax/FIRB",
        "description": "Vendor is not an Australian resident for tax purposes",
        "action": "12.5% FIRB withholding applies. Confirm vendor will provide clearance certificate or adjust settlement figures accordingly.",
        "financial_impact": "12.5% of purchase price withheld at settlement"
    },
    {
        "id": "high_deposit",
        "name": "Deposit Exceeds 10%",
        "query": '{IS clause that "requires a deposit exceeding 10% of the purchase price"}',
        "severity": "HIGH",
        "category": "Financial",
        "description": "Deposit percentage is above the standard 10% maximum",
        "action": "Negotiate deposit down to standard 10% to reduce purchaser exposure if contract fails.",
        "financial_impact": "Increased capital at risk"
    },
    {
        "id": "short_settlement",
        "name": "Short Settlement Period",
        "query": '{IS clause that "specifies a settlement period of less than 30 days"}',
        "severity": "HIGH",
        "category": "Timeline",
        "description": "Settlement period is unusually short (standard is 30-90 days)",
        "action": "Request extension to minimum 30-60 days to allow proper due diligence, finance approval, and searches.",
        "financial_impact": "Risk of default if unable to settle in time"
    },
    {
        "id": "gst_additional",
        "name": "GST Payable on Top of Price",
        "query": '{IS clause that "requires GST to be paid in addition to the purchase price"}',
        "severity": "HIGH",
        "category": "Financial",
        "description": "GST is not included in the contract price",
        "action": "Calculate potential GST liability (up to 10% of price) and factor into budget. Confirm if margin scheme applies.",
        "financial_impact": "Up to 10% additional cost"
    },
    {
        "id": "no_finance",
        "name": "No Finance Clause",
        "query": 'NOT {IS clause that "makes the contract subject to finance or loan approval"}',
        "severity": "HIGH",
        "category": "Finance",
        "description": "Contract is not conditional on loan approval",
        "action": "Insert finance clause with appropriate approval date, or confirm purchaser has unconditional funds available.",
        "financial_impact": "Deposit at risk if loan not approved"
    },
    {
        "id": "cooling_off_waived",
        "name": "Cooling-Off Period Waived",
        "query": '{IS clause that "waives the purchaser statutory cooling-off rights"}',
        "severity": "MEDIUM",
        "category": "Rights",
        "description": "Purchaser has waived the 3-day cooling-off period",
        "action": "Ensure purchaser has obtained independent legal advice before signing Section 31 waiver.",
        "financial_impact": "No right to rescind within 3 business days"
    },
    {
        "id": "sunset_clause",
        "name": "One-Sided Sunset Clause",
        "query": '{IS clause called "sunset"} AND {IS unilateral clause}',
        "severity": "HIGH",
        "category": "Termination",
        "description": "Sunset clause allows vendor to terminate and retain deposit",
        "action": "Negotiate mutual termination rights or remove clause. Current wording heavily favors vendor.",
        "financial_impact": "Vendor can terminate and keep deposit"
    },
    {
        "id": "existing_tenancy",
        "name": "Property Subject to Tenancy",
        "query": '{IS clause that "sells the property subject to an existing tenancy"}',
        "severity": "MEDIUM",
        "category": "Possession",
        "description": "Purchaser will not receive vacant possession at settlement",
        "action": "Review lease terms, rental income, and tenant history. Confirm if purchaser intends to occupy or invest.",
        "financial_impact": "Cannot occupy until lease ends"
    },
    {
        "id": "as_is_condition",
        "name": "As-Is Condition",
        "query": '{IS clause that "excludes all vendor warranties about property condition"}',
        "severity": "MEDIUM",
        "category": "Warranties",
        "description": "Vendor makes no warranties about property condition",
        "action": "Conduct thorough building and pest inspection before signing. No recourse for defects.",
        "financial_impact": "No warranty claims available"
    },
    {
        "id": "restricted_inspection",
        "name": "Inspection Rights Restricted",
        "query": '{IS clause that "restricts the purchaser right to inspect the property"}',
        "severity": "MEDIUM",
        "category": "Rights",
        "description": "Purchaser's inspection rights are limited beyond standard terms",
        "action": "Negotiate standard inspection rights under General Condition 29.",
        "financial_impact": "Limited ability to verify condition"
    },
    {
        "id": "fixtures_excluded",
        "name": "Fixtures/Chattels Excluded",
        "query": '{IS clause that "excludes built-in appliances or integrated fixtures from the sale"}',
        "severity": "MEDIUM",
        "category": "Inclusions",
        "description": "Items that may be fixtures are being retained by vendor",
        "action": "Value excluded items and adjust offer accordingly. Clarify what is included.",
        "financial_impact": "Estimated value of excluded items"
    },
    {
        "id": "high_penalty_interest",
        "name": "Higher Penalty Interest Rate",
        "query": '{IS clause that "imposes penalty interest above the standard 2% rate"}',
        "severity": "LOW",
        "category": "Default",
        "description": "Penalty interest rate exceeds standard 2% above statutory rate",
        "action": "Request amendment to standard penalty interest rate per General Condition 33.",
        "financial_impact": "Higher cost if settlement delayed"
    },
    {
        "id": "firb_withholding",
        "name": "FIRB Withholding Required",
        "query": '{IS clause that "requires the purchaser to withhold tax from settlement funds"}',
        "severity": "HIGH",
        "category": "Tax/FIRB",
        "description": "Purchaser must withhold 12.5% for foreign vendor",
        "action": "Ensure conveyancer is aware and settlement figures are adjusted.",
        "financial_impact": "12.5% withheld from vendor proceeds"
    }
]
```

### SECTION 32 VENDOR STATEMENT QUERIES

```python
SECTION32_QUERIES = [
    {
        "id": "outstanding_rates",
        "name": "Outstanding Council Rates",
        "query": '{IS clause that "discloses outstanding or overdue council rates"}',
        "severity": "MEDIUM",
        "category": "Financial",
        "description": "Council rates are overdue or outstanding",
        "action": "Confirm vendor will clear all outstanding rates at settlement. Obtain rate certificate.",
        "financial_impact": "Amount outstanding plus interest"
    },
    {
        "id": "outstanding_land_tax",
        "name": "Outstanding Land Tax",
        "query": '{IS clause that "discloses unpaid land tax liability"}',
        "severity": "MEDIUM",
        "category": "Financial",
        "description": "Land tax has not been paid",
        "action": "Confirm vendor will clear land tax at settlement. May indicate financial distress.",
        "financial_impact": "Amount outstanding"
    },
    {
        "id": "owner_builder",
        "name": "Owner-Builder Work",
        "query": '{IS clause that "discloses owner-builder work within the past 6 years"}',
        "severity": "HIGH",
        "category": "Building",
        "description": "Building work was done by owner-builder without standard warranties",
        "action": "Obtain detailed building inspection focusing on owner-builder work. No domestic building insurance coverage.",
        "financial_impact": "No warranty recourse for defects"
    },
    {
        "id": "easements",
        "name": "Easements on Title",
        "query": '{IS clause that "discloses easements registered on the title"}',
        "severity": "MEDIUM",
        "category": "Title",
        "description": "Easements are registered affecting use of land",
        "action": "Review easement plans and assess impact on intended use. May restrict building envelope.",
        "financial_impact": "May limit development potential"
    },
    {
        "id": "restrictive_covenant",
        "name": "Restrictive Covenant",
        "query": '{IS clause that "prevents subdivision of the property"}',
        "severity": "MEDIUM",
        "category": "Development",
        "description": "Covenant restricts subdivision or development",
        "action": "Assess impact on future development plans. May need to apply for covenant removal.",
        "financial_impact": "Limits future options"
    },
    {
        "id": "bushfire_prone",
        "name": "Bushfire Prone Area",
        "query": '{IS clause that "designates the land as bushfire prone"}',
        "severity": "MEDIUM",
        "category": "Risk",
        "description": "Property is in a designated bushfire prone area",
        "action": "Obtain BAL (Bushfire Attack Level) rating. Check insurance availability and premiums.",
        "financial_impact": "Higher insurance costs, building requirements"
    },
    {
        "id": "heritage_overlay",
        "name": "Heritage Overlay",
        "query": '{IS clause that "discloses a heritage overlay affecting the property"}',
        "severity": "HIGH",
        "category": "Planning",
        "description": "Property is subject to heritage controls",
        "action": "Review heritage permit requirements. Modifications may be restricted or require approval.",
        "financial_impact": "Renovation costs may increase significantly"
    },
    {
        "id": "flood_risk",
        "name": "Flood Risk (Special Building Overlay)",
        "query": '{IS clause that "discloses a Special Building Overlay or flood prone designation"}',
        "severity": "HIGH",
        "category": "Risk",
        "description": "Property is in a flood-prone area",
        "action": "Obtain flood study and historical flood data. Check insurance availability - may be uninsurable.",
        "financial_impact": "Insurance may be unavailable or very expensive"
    },
    {
        "id": "building_order",
        "name": "Outstanding Building Order",
        "query": '{IS clause that "discloses an outstanding building order from council"}',
        "severity": "HIGH",
        "category": "Compliance",
        "description": "Council has issued a building order requiring rectification",
        "action": "Require vendor to complete rectification before settlement. Obtain quote for works if not.",
        "financial_impact": "Cost of rectification works"
    },
    {
        "id": "contamination",
        "name": "Land Contamination",
        "query": '{IS clause that "discloses potential contamination of the land"}',
        "severity": "HIGH",
        "category": "Environmental",
        "description": "Property may be contaminated from previous use",
        "action": "Obtain environmental site assessment. Remediation may be required and very costly.",
        "financial_impact": "Remediation costs can be $50K-$500K+"
    },
    {
        "id": "missing_occupancy",
        "name": "Missing Occupancy Permit",
        "query": '{IS clause that "identifies building work without a final occupancy permit"}',
        "severity": "HIGH",
        "category": "Building",
        "description": "Building work has not received occupancy certificate",
        "action": "Require vendor to obtain occupancy permit before settlement. Work may not be compliant.",
        "financial_impact": "Cost to achieve compliance"
    },
    {
        "id": "unpermitted_work",
        "name": "Unpermitted Building Work",
        "query": '{IS clause that "discloses building work performed without a building permit"}',
        "severity": "HIGH",
        "category": "Building",
        "description": "Building work was done without required permits",
        "action": "Assess rectification costs. May need to demolish and rebuild, or obtain retrospective approval.",
        "financial_impact": "Rectification or demolition costs"
    },
    {
        "id": "special_levy",
        "name": "Owners Corporation Special Levy",
        "query": '{IS clause that "discloses a special levy for cladding remediation"}',
        "severity": "HIGH",
        "category": "Owners Corp",
        "description": "Special levy has been or will be raised",
        "action": "Confirm total levy amount and payment schedule. Negotiate vendor to pay or reduce price.",
        "financial_impact": "Amount of special levy"
    },
    {
        "id": "caveat_on_title",
        "name": "Caveat on Title",
        "query": '{IS clause that "discloses a caveat registered on the certificate of title"}',
        "severity": "CRITICAL",
        "category": "Title",
        "description": "Third party has lodged a caveat claiming interest in property",
        "action": "CRITICAL: Title cannot transfer until caveat is removed. Require vendor to remove before settlement.",
        "financial_impact": "Settlement cannot proceed"
    }
]
```

---

## UI Requirements

### 1. Document Upload Section
- Accept PDF and DOCX files
- Auto-detect document type (Contract of Sale vs Section 32)
- Show upload progress and processing status

### 2. Red Flags Panel
Display detected flags in a card/list format:
```
┌─────────────────────────────────────────────────────────┐
│ 🔴 HIGH | Foreign Resident Vendor                       │
│ ─────────────────────────────────────────────────────── │
│ Category: Tax/FIRB                                      │
│ Confidence: 94%                                         │
│ Location: Vendor Details (chars 245-412)                │
│                                                         │
│ Issue: Vendor is not an Australian resident for tax     │
│ purposes.                                               │
│                                                         │
│ Action Required: 12.5% FIRB withholding applies.        │
│ Confirm vendor will provide clearance certificate.      │
│                                                         │
│ [View in Document] [Dismiss] [Add Note]                 │
└─────────────────────────────────────────────────────────┘
```

### 3. Risk Score Summary
```
Overall Risk Score: 78/100 (HIGH)

Contract of Sale:     ████████░░ 8/12 flags detected
Section 32:           ██████████ 10/13 flags detected

Critical Issues: 2
High Severity: 9
Medium Severity: 5
Low Severity: 2
```

### 4. Severity Color Coding
- **CRITICAL**: Red background, pulse animation
- **HIGH**: Red text/border
- **MEDIUM**: Orange/amber
- **LOW**: Yellow

### 5. Document Viewer
- Highlight flagged sections in the document
- Click flag card to scroll to location
- Side-by-side view: flags list | document

---

## Risk Score Calculation

```python
def calculate_risk_score(detected_flags):
    weights = {
        "CRITICAL": 25,
        "HIGH": 15,
        "MEDIUM": 8,
        "LOW": 3
    }
    
    max_possible = sum(weights[q["severity"]] for q in ALL_QUERIES)
    actual_score = sum(weights[f["severity"]] for f in detected_flags if f["confidence"] > 0.5)
    
    return (actual_score / max_possible) * 100
```

---

## API Integration Example

```python
from isaacus import Isaacus
import asyncio

client = Isaacus(api_key="your-api-key")

async def analyze_contract(document_text: str, queries: list) -> list:
    """Run all queries against document and return detected flags."""
    
    detected_flags = []
    
    for query_config in queries:
        result = client.classifications.universal.create(
            model="kanon-universal-classifier",
            query=query_config["query"],
            text=document_text,
        )
        
        if result.score > 0.5:  # Threshold for positive detection
            detected_flags.append({
                "id": query_config["id"],
                "name": query_config["name"],
                "severity": query_config["severity"],
                "category": query_config["category"],
                "description": query_config["description"],
                "action": query_config["action"],
                "confidence": result.score,
                "start_char": result.start_char,
                "end_char": result.end_char,
                "matched_text": document_text[result.start_char:result.end_char]
            })
    
    return detected_flags

# Usage
contract_flags = await analyze_contract(contract_text, CONTRACT_QUERIES)
section32_flags = await analyze_contract(section32_text, SECTION32_QUERIES)
```

---

## Report Generation

Generate a PDF/DOCX report with:

1. **Executive Summary**
   - Property address
   - Overall risk score
   - Number of flags by severity
   - Recommendation (Proceed / Proceed with Caution / Do Not Proceed)

2. **Detailed Findings**
   - Each flag with full details
   - Relevant clause text
   - Recommended action

3. **Financial Impact Summary**
   - Estimated additional costs
   - Witholding amounts
   - Special levies
   - Rectification estimates

4. **Checklist**
   - Items requiring action before signing
   - Items to negotiate
   - Items for conveyancer

---

## Test Documents

Use these files to test the implementation:
- `Contract_of_Sale_CLEAN.docx` - Contains 12 embedded red flags
- `Section_32_CLEAN.docx` - Contains 13 embedded red flags

Expected detection rate: >80% of flags should be detected with >50% confidence.

---

## Error Handling

```python
try:
    result = client.classifications.universal.create(...)
except isaacus.RateLimitError:
    # Implement exponential backoff
    await asyncio.sleep(2 ** retry_count)
except isaacus.APIError as e:
    # Log error, show user-friendly message
    logger.error(f"Isaacus API error: {e}")
    return {"error": "Unable to analyze document. Please try again."}
```

---

## Performance Optimization

1. **Chunk large documents** - Use Isaacus semantic chunking for documents >10k tokens
2. **Parallel queries** - Run multiple IQL queries concurrently
3. **Cache results** - Cache analysis results by document hash
4. **Progressive loading** - Show flags as they're detected, don't wait for all

---

## Questions?

- Isaacus API docs: https://docs.isaacus.com
- IQL reference: https://docs.isaacus.com/iql/introduction
- Contact: [your contact info]
