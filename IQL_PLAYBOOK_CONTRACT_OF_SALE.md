# CONTRACT OF SALE - IQL PLAYBOOK
## Victorian Property Transactions

---

# QUICK REFERENCE - RUN THESE FIRST

| Priority | Category | Query |
|----------|----------|-------|
| 🔴 | Vendor | `{IS clause that identifies the vendor as a foreign resident or overseas entity}` |
| 🔴 | Finance | `{IS clause that states the contract is NOT subject to finance}` |
| 🔴 | Settlement | `{IS clause that specifies settlement within 21 days or less}` |
| 🔴 | Deposit | `{IS clause that specifies a deposit exceeding 10% of purchase price}` |
| 🔴 | GST | `{IS clause that states GST is payable in addition to the purchase price}` |
| 🔴 | Cooling-off | `{IS clause where the purchaser waives the cooling-off period}` |

---

# SECTION 1: PARTIES

## 1.1 Vendor Identity

```iql
{IS clause that identifies the vendor as a foreign resident or non-Australian entity}
```
**Severity:** 🔴 CRITICAL
**Why it matters:** 12.5% FIRB withholding applies. Purchaser must withhold at settlement unless clearance certificate provided.
**Red flag text:** "Singapore", "Hong Kong", "overseas", "foreign resident", "Pte Ltd" (Singapore), "Limited" (HK)

```iql
{IS clause that identifies the vendor as a company or corporation rather than an individual}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Check ABN/ACN validity, director guarantees, company capacity to sell.

```iql
{IS clause that identifies a vendor acting under power of attorney}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Verify POA validity and scope.

---

## 1.2 Purchaser Representation

```iql
{IS clause where the purchaser's legal practitioner is listed as TBA or to be advised}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Purchaser has no independent legal advice. May not understand contract risks.
**Red flag text:** "TBA", "To Be Advised", "To be confirmed"

```iql
{IS clause where the purchaser's legal practitioner details are blank or missing}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Same as above.

---

# SECTION 2: FINANCIAL TERMS

## 2.1 Purchase Price & GST

```iql
{IS clause that states GST is payable in addition to or on top of the purchase price}
```
**Severity:** 🔴 HIGH
**Why it matters:** Additional 10% cost ($185K on $1.85M property). Major budget impact.
**Red flag text:** "plus GST", "GST additional", "in addition to", "exclusive of GST"

```iql
{IS clause that indicates the sale is a taxable supply for GST purposes}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** May trigger GST obligations. Confirm margin scheme applicability.

```iql
{IS clause that references the margin scheme for GST calculation}
```
**Severity:** 🟢 INFO
**Why it matters:** Affects GST calculation method. Generally favourable for purchaser.

---

## 2.2 Deposit

```iql
{IS clause that specifies a deposit exceeding 10% of the purchase price}
```
**Severity:** 🔴 HIGH
**Why it matters:** Standard is 10%. Higher deposit = more money at risk if contract fails.
**Red flag text:** "15%", "20%", any percentage above 10

```iql
{IS clause that specifies a deposit of 15% or more of purchase price}
```
**Severity:** 🔴 HIGH
**Why it matters:** Significantly above market standard. Query why vendor requires this.

```iql
{IS clause that allows the vendor to use the deposit before settlement}
```
**Severity:** 🔴 HIGH
**Why it matters:** If vendor defaults or becomes insolvent, deposit recovery is difficult.
**Red flag text:** "release of deposit", "early release", "deposit released to vendor"

```iql
{IS clause that specifies the deposit is non-refundable}
```
**Severity:** 🔴 CRITICAL
**Why it matters:** Purchaser loses deposit regardless of circumstances.

---

## 2.3 Penalty Interest

```iql
{IS clause that specifies penalty interest exceeding 2% per month or 24% per annum}
```
**Severity:** 🔴 HIGH
**Why it matters:** Predatory rate. Standard is ~2% above RBA cash rate.
**Red flag text:** "4% per month", "48% per annum", any rate above 15% p.a.

```iql
{IS clause that specifies default interest calculated daily}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Compounds quickly. Check rate is reasonable.

---

# SECTION 3: SETTLEMENT

## 3.1 Settlement Period

```iql
{IS clause that specifies a settlement period of less than 30 days}
```
**Severity:** 🔴 CRITICAL
**Why it matters:** Insufficient time for finance approval, searches, inspections.
**Red flag text:** "14 days", "21 days", "7 days"

```iql
{IS clause that specifies settlement within 14 days of contract date}
```
**Severity:** 🔴 CRITICAL
**Why it matters:** Virtually impossible to complete due diligence. Major red flag.

```iql
{IS clause that specifies settlement within 45 days or less}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Tighter than standard 60 days. May be acceptable but check finance timeline.

```iql
{IS clause that specifies an indefinite or open-ended settlement date}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Creates uncertainty. May favour one party.

---

## 3.2 Sunset Clause

```iql
{IS clause that allows only the vendor to terminate under a sunset clause}
```
**Severity:** 🔴 HIGH
**Why it matters:** One-sided. Vendor can walk away; purchaser cannot.
**Red flag text:** "vendor may terminate", "vendor's option to rescind"

```iql
{IS clause that allows the vendor to retain the deposit upon sunset termination}
```
**Severity:** 🔴 CRITICAL
**Why it matters:** Purchaser loses deposit through no fault of their own.

```iql
{IS clause that contains a sunset clause with termination date less than 12 months}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Short sunset may indicate development risk or vendor pressure.

---

# SECTION 4: CONDITIONS

## 4.1 Finance Clause

```iql
{IS clause that states the contract is NOT subject to finance or loan approval}
```
**Severity:** 🔴 CRITICAL
**Why it matters:** If loan rejected, purchaser loses entire deposit.
**Red flag text:** "not subject to finance", "unconditional", "cash purchase"

```iql
{IS clause that specifies a finance approval period of less than 14 days}
```
**Severity:** 🔴 HIGH
**Why it matters:** Banks typically need 2-3 weeks minimum for approval.

```iql
{IS clause that limits the finance condition to a specific lender only}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Restricts purchaser's options if preferred lender declines.

```iql
{IS clause that requires the purchaser to accept any loan terms offered}
```
**Severity:** 🔴 HIGH
**Why it matters:** Purchaser may be forced to accept unfavourable loan terms.

---

## 4.2 Cooling-Off Period

```iql
{IS clause where the purchaser waives the cooling-off period}
```
**Severity:** 🔴 HIGH
**Why it matters:** No 3-day escape. Purchaser locked in immediately.
**Red flag text:** "waives", "cooling-off waived", "no cooling-off"

```iql
{IS clause that acknowledges the property was purchased at auction}
```
**Severity:** 🟢 INFO
**Why it matters:** Cooling-off doesn't apply to auctions (legitimate exclusion).

```iql
{IS clause that provides a Section 32 certificate from purchaser's solicitor}
```
**Severity:** 🟢 INFO
**Why it matters:** Legitimate waiver if purchaser had legal advice.

---

## 4.3 Building & Pest Inspection

```iql
{IS clause that states the contract is NOT subject to building or pest inspection}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Purchaser accepts property condition without independent assessment.

```iql
{IS clause that specifies a building inspection period of less than 7 days}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** May be difficult to arrange inspection in time.

---

# SECTION 5: PROPERTY CONDITION

## 5.1 As-Is Clauses

```iql
{IS clause that sells the property "as is" or "as is where is" without warranties}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Vendor accepts no responsibility for defects.
**Red flag text:** "as is", "as is where is", "no warranty", "sold in current condition"

```iql
{IS clause that excludes all vendor warranties regarding property condition}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** May conflict with statutory warranties. Check scope.

```iql
{IS clause that states the vendor makes no representations about compliance with laws}
```
**Severity:** 🔴 HIGH
**Why it matters:** Property may have compliance issues (permits, zoning, etc.).

---

## 5.2 Inspections

```iql
{IS clause that limits purchaser inspections to one inspection or less than 2 inspections}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Standard is 2-3 inspections plus pre-settlement.
**Red flag text:** "one inspection", "single inspection"

```iql
{IS clause that limits inspection duration to 30 minutes or less}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Insufficient time for thorough inspection.

```iql
{IS clause that requires 48 hours or more notice for inspections}
```
**Severity:** 🟢 LOW
**Why it matters:** Reasonable but may delay access.

```iql
{IS clause that restricts inspections to business hours only}
```
**Severity:** 🟢 LOW
**Why it matters:** May be inconvenient but generally standard.

---

# SECTION 6: INCLUSIONS & EXCLUSIONS

## 6.1 Fixtures & Chattels

```iql
{IS clause that excludes fixtures or chattels valued over $10,000 from the sale}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** High-value items being removed. Verify what's included.
**Red flag text:** Dollar amounts, "excluded", "will be removed"

```iql
{IS clause that excludes integrated appliances such as refrigerator, dishwasher, or wine cellar}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** These are typically included. Replacement cost significant.

```iql
{IS clause where inclusions are described as "as inspected" without specific list}
```
**Severity:** 🟢 LOW
**Why it matters:** Vague. Could lead to disputes.

```iql
{IS clause that allows vendor to remove items at their discretion}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Creates uncertainty about what purchaser will receive.

---

# SECTION 7: TENANCIES & POSSESSION

## 7.1 Vacant Possession

```iql
{IS clause that discloses an existing tenancy or lease affecting the property}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Purchaser cannot occupy immediately. Check lease terms.
**Red flag text:** "subject to tenancy", "existing lease", "tenant"

```iql
{IS clause that discloses a tenancy extending more than 12 months beyond settlement}
```
**Severity:** 🔴 HIGH
**Why it matters:** Long-term commitment purchaser inherits. Check rent vs market.

```iql
{IS clause that identifies the tenant as a related party to the vendor}
```
**Severity:** 🔴 HIGH
**Why it matters:** May be non-arm's length arrangement. Check rent, lease terms.
**Red flag text:** "related party", same company name, director names

```iql
{IS clause that discloses rent significantly below market rate}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Below-market rent may indicate related party or problematic tenant.

```iql
{IS clause that does NOT provide for vacant possession at settlement}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Confirm purchaser understands they cannot move in.

---

# SECTION 8: DISPUTE RESOLUTION

```iql
{IS clause that requires disputes to be resolved in a foreign jurisdiction}
```
**Severity:** 🔴 HIGH
**Why it matters:** Expensive and impractical to pursue claims overseas.
**Red flag text:** "Singapore", "Hong Kong", "foreign court", "overseas arbitration"

```iql
{IS clause that requires arbitration rather than court proceedings}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** May limit remedies. Check arbitration rules.

```iql
{IS clause that specifies the contract is governed by foreign law}
```
**Severity:** 🔴 HIGH
**Why it matters:** Victorian consumer protections may not apply.

---

# SECTION 9: SPECIAL CONDITIONS - RED FLAGS

```iql
{IS clause that contains unusual or non-standard special conditions}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** May contain hidden risks. Review carefully.

```iql
{IS clause that waives or limits the purchaser's statutory rights}
```
**Severity:** 🔴 HIGH
**Why it matters:** May be unenforceable but creates risk.

```iql
{IS clause that indemnifies the vendor against all claims}
```
**Severity:** 🔴 HIGH
**Why it matters:** Shifts all risk to purchaser.

```iql
{IS clause that allows the vendor to substitute the property}
```
**Severity:** 🔴 CRITICAL
**Why it matters:** Purchaser may receive different property than contracted.

---

# EXPECTED RESULTS - TEST DOCUMENTS

## 01_Contract_CAV_CLEAN.docx

| Query Category | Expected Result |
|----------------|-----------------|
| Foreign vendor | ❌ No match |
| Deposit > 10% | ❌ No match |
| Settlement < 30 days | ❌ No match |
| No finance clause | ❌ No match |
| Cooling-off waived | ❌ No match |
| Limited inspections | ❌ No match |
| As-is condition | ❌ No match |
| Existing tenancy | ❌ No match |
| High penalty interest | ❌ No match |

**Overall:** CLEAN - No red flags expected.

---

## 02_Contract_CAV_MEDIUM.docx

| Query Category | Expected Result |
|----------------|-----------------|
| Foreign vendor | ❌ No match |
| Purchaser lawyer TBA | ✅ **MATCH** |
| Deposit > 10% | ❌ No match |
| Settlement < 30 days | ❌ No match |
| Settlement < 60 days | ✅ **MATCH** (45 days) |
| No finance clause | ❌ No match |
| Cooling-off waived | ❌ No match |
| Limited inspections | ✅ **MATCH** (ONE inspection) |
| Vague inclusions | ✅ **MATCH** ("at vendor discretion") |

**Overall:** MEDIUM - 4 flags, negotiable issues.

---

## 03_Contract_CAV_HIGH_FLAGS.docx

| Query Category | Expected Result |
|----------------|-----------------|
| Foreign vendor | ✅ **MATCH** (Singapore) |
| Purchaser lawyer TBA | ✅ **MATCH** |
| Deposit > 10% | ✅ **MATCH** (15%) |
| Settlement < 30 days | ✅ **MATCH** (14 days) |
| GST additional | ✅ **MATCH** ($185K) |
| No finance clause | ✅ **MATCH** |
| Cooling-off waived | ✅ **MATCH** |
| Vendor-only sunset | ✅ **MATCH** |
| As-is condition | ✅ **MATCH** |
| Limited inspections | ✅ **MATCH** (30 mins) |
| Existing tenancy | ✅ **MATCH** (Nov 2027) |
| Fixtures excluded | ✅ **MATCH** ($46K) |
| High penalty interest | ✅ **MATCH** (48% p.a.) |

**Overall:** HIGH RISK - 13 flags, recommend do not proceed.

---

# SEVERITY LEGEND

| Symbol | Level | Action |
|--------|-------|--------|
| 🔴 | CRITICAL/HIGH | Must address before signing. Consider walking away. |
| 🟡 | MEDIUM | Should negotiate or clarify. Proceed with caution. |
| 🟢 | LOW/INFO | Note for awareness. Generally acceptable. |

---

*Contract of Sale IQL Playbook v1.0*
*Based on Victorian REIV/LIV Standard Contract*
*For use with Pathway Property Contract AI*
