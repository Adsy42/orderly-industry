# SECTION 32 VENDOR STATEMENT - IQL PLAYBOOK
## Victorian Property Transactions

---

# QUICK REFERENCE - RUN THESE FIRST

| Priority | Category | Query |
|----------|----------|-------|
| 🔴 | Title | `{IS clause that discloses a caveat registered on the title}` |
| 🔴 | Financial | `{IS clause that discloses outstanding or unpaid council rates}` |
| 🔴 | Financial | `{IS clause that discloses an owners corporation special levy exceeding $10,000}` |
| 🔴 | Building | `{IS clause that indicates domestic building insurance was NOT obtained for owner-builder work}` |
| 🔴 | Building | `{IS clause that discloses an outstanding building notice or order}` |
| 🔴 | Contamination | `{IS clause that discloses contamination or EPA Priority Sites Register listing}` |

---

# SECTION 1: FINANCIAL MATTERS

## 1.1 Rates & Outgoings

```iql
{IS clause that discloses outstanding or unpaid council rates}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Must be cleared at settlement. Large arrears may indicate vendor financial stress.
**Red flag text:** "outstanding", "overdue", "unpaid", "arrears"

```iql
{IS clause that discloses outstanding or unpaid water rates}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Water authority may have charge over property.

```iql
{IS clause that discloses unpaid or outstanding land tax}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** SRO may have first charge. Must clear at settlement.
**Red flag text:** "land tax outstanding", "unpaid", "assessment unpaid"

```iql
{IS clause that discloses total outgoings exceeding $10,000 per annum}
```
**Severity:** 🟢 INFO
**Why it matters:** High ongoing costs. Factor into affordability.

---

## 1.2 Owners Corporation Fees & Levies

```iql
{IS clause that discloses an owners corporation special levy exceeding $10,000}
```
**Severity:** 🔴 HIGH
**Why it matters:** Major unexpected cost. Check what it's for and payment schedule.
**Red flag text:** "special levy", "$45,000", "$20,000", "cladding", "remediation"

```iql
{IS clause that discloses an owners corporation special levy for cladding remediation}
```
**Severity:** 🔴 HIGH
**Why it matters:** Combustible cladding is expensive to fix. Levies can be $50K+.
**Red flag text:** "cladding", "combustible", "remediation", "facade"

```iql
{IS clause that discloses owners corporation fees exceeding $10,000 per annum}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** High ongoing cost. Common in CBD/Docklands apartments.

```iql
{IS clause that discloses a special levy payment due within 90 days of settlement}
```
**Severity:** 🔴 HIGH
**Why it matters:** Purchaser inherits payment obligation immediately.

---

## 1.3 Charges & Mortgages

```iql
{IS clause that discloses a charge or mortgage that will NOT be discharged at settlement}
```
**Severity:** 🔴 CRITICAL
**Why it matters:** Purchaser takes property subject to existing debt.
**Red flag text:** "will not be discharged", "subject to mortgage"

```iql
{IS clause that discloses a statutory charge imposed under any Act}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** May affect title. Check nature and amount.

---

# SECTION 2: INSURANCE & OWNER-BUILDER

## 2.1 Owner-Builder Work

```iql
{IS clause that discloses owner-builder work within the preceding 6 years}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Triggers Section 137B Building Act requirements. Check insurance.
**Red flag text:** "owner-builder", "owner builder", "domestic building work"

```iql
{IS clause that indicates domestic building insurance was NOT obtained for owner-builder work}
```
**Severity:** 🔴 CRITICAL
**Why it matters:** NO WARRANTY COVERAGE. Purchaser inherits all defect risk.
**Red flag text:** "not obtained", "no insurance", "insurance not applicable"

```iql
{IS clause that discloses owner-builder work to bathroom, kitchen, or structural elements}
```
**Severity:** 🔴 HIGH
**Why it matters:** High-risk areas for defects. Water damage, structural issues common.
**Red flag text:** "bathroom", "kitchen", "ensuite", "structural", "load-bearing"

```iql
{IS clause that discloses owner-builder work valued over $16,000}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Above threshold requiring domestic building insurance.

---

## 2.2 Building Permits & Certificates

```iql
{IS clause that discloses building work undertaken WITHOUT a building permit}
```
**Severity:** 🔴 HIGH
**Why it matters:** Illegal work. Council may require demolition or rectification.
**Red flag text:** "no permit", "permit not obtained", "without permit"

```iql
{IS clause that indicates an occupancy certificate or certificate of final inspection was NOT obtained}
```
**Severity:** 🔴 HIGH
**Why it matters:** Building work not signed off. May not comply with Building Code.
**Red flag text:** "not obtained", "no occupancy certificate", "no final inspection"

```iql
{IS clause that discloses a building permit issued in the preceding 7 years}
```
**Severity:** 🟢 INFO
**Why it matters:** Recent work. Verify completion and compliance.

```iql
{IS clause that discloses building work where final inspection has not been completed}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Work may be incomplete or non-compliant.

---

## 2.3 Building Notices & Orders

```iql
{IS clause that discloses a building notice, building order, or compliance notice}
```
**Severity:** 🔴 CRITICAL
**Why it matters:** Active enforcement action. Purchaser inherits compliance obligation.
**Red flag text:** "building notice", "building order", "compliance notice", "BN/"

```iql
{IS clause that discloses a building order where the compliance deadline has passed}
```
**Severity:** 🔴 CRITICAL
**Why it matters:** Vendor in breach. Council may prosecute or issue fines.
**Red flag text:** "deadline passed", "overdue", "not completed"

```iql
{IS clause that discloses a building notice relating to balcony, balustrade, or pool fence}
```
**Severity:** 🔴 HIGH
**Why it matters:** Safety issues. Common compliance problems.

---

# SECTION 3: LAND USE & RESTRICTIONS

## 3.1 Easements

```iql
{IS clause that discloses an easement affecting the property}
```
**Severity:** 🟢 INFO
**Why it matters:** May restrict building or use. Common and usually manageable.
**Red flag text:** "easement", "E-1", "right of way", "drainage"

```iql
{IS clause that discloses multiple easements affecting the property}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Multiple restrictions compound limitations on property use.
**Red flag text:** "E-1", "E-2", "E-3", multiple easement references

```iql
{IS clause that discloses an easement for drainage or sewerage}
```
**Severity:** 🟢 INFO
**Why it matters:** Standard. Check width and location relative to dwelling.

```iql
{IS clause that discloses an easement for electricity or power lines}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** May have powerlines overhead or underground infrastructure.

```iql
{IS clause that discloses a party wall easement}
```
**Severity:** 🟢 INFO
**Why it matters:** Shared structural elements with neighbour. Standard for townhouses/units.

---

## 3.2 Covenants & Restrictions

```iql
{IS clause that discloses a restrictive covenant affecting the property}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Permanent restriction on use. Cannot be easily removed.
**Red flag text:** "covenant", "restrictive covenant", "restriction"

```iql
{IS clause that discloses a single dwelling covenant or restriction}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Cannot subdivide or build second dwelling. Limits future options.
**Red flag text:** "single dwelling", "one dwelling", "no subdivision"

```iql
{IS clause that prohibits short-stay accommodation, Airbnb, or holiday rentals}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Cannot use for short-term rental income.
**Red flag text:** "short-stay", "Airbnb", "holiday", "serviced apartment"

```iql
{IS clause that discloses a covenant restricting commercial use}
```
**Severity:** 🟢 INFO
**Why it matters:** Residential use only. Standard for residential zones.

```iql
{IS clause that discloses a covenant restricting building height or materials}
```
**Severity:** 🟢 INFO
**Why it matters:** May affect future renovation/extension plans.

---

## 3.3 Road Access

```iql
{IS clause that indicates there is NO legal road access to the property}
```
**Severity:** 🔴 CRITICAL
**Why it matters:** Landlocked property. Major issue for access, services, value.
**Red flag text:** "no road access", box marked with X

```iql
{IS clause that discloses access via a right of carriageway or private road}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Shared access. Check maintenance obligations.

---

# SECTION 4: PLANNING & OVERLAYS

## 4.1 Planning Zone

```iql
{IS clause that discloses the property is in a zone other than residential}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** May affect permitted uses, future development.
**Red flag text:** "Industrial", "Commercial", "Mixed Use", "Rural"

```iql
{IS clause that discloses the property is in a Neighbourhood Residential Zone}
```
**Severity:** 🟢 INFO
**Why it matters:** More restrictive than General Residential. Height/density limits.

---

## 4.2 Overlays - Environmental

```iql
{IS clause that discloses a heritage overlay affecting the property}
```
**Severity:** 🔴 HIGH
**Why it matters:** Severe restrictions on alterations. Heritage permits required.
**Red flag text:** "Heritage Overlay", "HO", "heritage listed"

```iql
{IS clause that discloses a Significant Landscape Overlay affecting the property}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Permits required to remove vegetation. May affect development.
**Red flag text:** "Significant Landscape Overlay", "SLO", "vegetation"

```iql
{IS clause that discloses a Vegetation Protection Overlay}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Tree removal restricted. Check before planning works.
**Red flag text:** "Vegetation Protection Overlay", "VPO"

```iql
{IS clause that discloses an Environmental Significance Overlay}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Environmental constraints on development.
**Red flag text:** "Environmental Significance Overlay", "ESO"

---

## 4.3 Overlays - Hazards

```iql
{IS clause that discloses a Special Building Overlay or flood overlay}
```
**Severity:** 🔴 HIGH
**Why it matters:** FLOOD RISK. Insurance costs higher. Building restrictions apply.
**Red flag text:** "Special Building Overlay", "SBO", "flood", "inundation"

```iql
{IS clause that discloses a Land Subject to Inundation Overlay}
```
**Severity:** 🔴 HIGH
**Why it matters:** Flood prone area. Same concerns as SBO.
**Red flag text:** "Land Subject to Inundation", "LSIO"

```iql
{IS clause that designates the land as bushfire prone under the Building Act}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Higher insurance, building standards, evacuation planning.
**Red flag text:** "bushfire prone", "BAL", "Bushfire Management Overlay", "BMO"

```iql
{IS clause that discloses a BAL rating of BAL-29 or higher}
```
**Severity:** 🔴 HIGH
**Why it matters:** High bushfire risk. Significant building requirements.
**Red flag text:** "BAL-29", "BAL-40", "BAL-FZ"

```iql
{IS clause that discloses an Erosion Management Overlay or landslip risk}
```
**Severity:** 🔴 HIGH
**Why it matters:** Ground stability issues. May affect building.
**Red flag text:** "Erosion Management Overlay", "EMO", "landslip"

---

# SECTION 5: NOTICES & CONTAMINATION

## 5.1 Public Authority Notices

```iql
{IS clause that discloses notices, orders, or recommendations from a public authority}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** May require action or affect property use.
**Red flag text:** "notice", "order", "recommendation", "declaration"

```iql
{IS clause that discloses a notice or proposal from VicRoads affecting the property}
```
**Severity:** 🔴 HIGH
**Why it matters:** Road widening or acquisition may affect property.
**Red flag text:** "VicRoads", "road widening", "acquisition"

```iql
{IS clause that discloses a pending planning application on an adjoining property}
```
**Severity:** 🟢 INFO
**Why it matters:** Neighbour development may affect amenity, views, privacy.
**Red flag text:** "adjoining", "neighbouring", "planning application"

---

## 5.2 Contamination

```iql
{IS clause that discloses contamination or lists the property on the EPA Priority Sites Register}
```
**Severity:** 🔴 CRITICAL
**Why it matters:** Remediation costs can be enormous. Health risks.
**Red flag text:** "contamination", "EPA", "Priority Sites Register", "contaminated"

```iql
{IS clause that discloses the land was previously used for dry cleaning, petrol station, or industrial purposes}
```
**Severity:** 🔴 HIGH
**Why it matters:** High risk of soil/groundwater contamination.
**Red flag text:** "dry cleaning", "petrol station", "service station", "industrial", "factory"

```iql
{IS clause that indicates an environmental audit has NOT been conducted}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Unknown contamination status. Consider commissioning audit.
**Red flag text:** "audit not conducted", "no environmental audit"

```iql
{IS clause that discloses contamination from agricultural chemicals or livestock disease}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** May affect land use, particularly for rural properties.

---

## 5.3 Compulsory Acquisition

```iql
{IS clause that discloses a notice of intention to acquire the land}
```
**Severity:** 🔴 CRITICAL
**Why it matters:** Government taking the property. Do not proceed.
**Red flag text:** "intention to acquire", "compulsory acquisition", "Land Acquisition Act"

---

# SECTION 6: TITLE MATTERS

## 6.1 Caveats

```iql
{IS clause that discloses a caveat registered on the title}
```
**Severity:** 🔴 CRITICAL
**Why it matters:** Third party claims interest. CANNOT SETTLE until removed.
**Red flag text:** "caveat", "AQ", "caveator"

```iql
{IS clause that indicates a caveat must be removed before settlement can occur}
```
**Severity:** 🔴 CRITICAL
**Why it matters:** Settlement blocked until resolved. Major risk.

```iql
{IS clause that discloses a caveat lodged by a lender or financier}
```
**Severity:** 🔴 CRITICAL
**Why it matters:** Vendor has undisclosed debt secured against property.
**Red flag text:** "Finance", "Lending", "Capital", "lender"

---

## 6.2 Title Issues

```iql
{IS clause that indicates the title is general law land rather than Torrens title}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** More complex conveyancing. Title insurance recommended.
**Red flag text:** "general law", "not Torrens"

```iql
{IS clause that discloses an unregistered interest affecting the title}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** May not appear on title search but still affects property.

---

# SECTION 7: OWNERS CORPORATION

## 7.1 OC Status

```iql
{IS clause that indicates the property is affected by an owners corporation}
```
**Severity:** 🟢 INFO
**Why it matters:** Shared property. Check rules, fees, financial health.

```iql
{IS clause that discloses current litigation involving the owners corporation}
```
**Severity:** 🔴 HIGH
**Why it matters:** Legal costs, uncertainty, potential special levies.
**Red flag text:** "litigation", "legal proceedings", "VCAT", "court"

```iql
{IS clause that discloses the owners corporation has inadequate insurance}
```
**Severity:** 🔴 HIGH
**Why it matters:** Building may be underinsured. Risk exposure.

```iql
{IS clause that discloses owners corporation deficits or inadequate sinking fund}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Future special levies likely to cover shortfall.

---

## 7.2 Building Defects

```iql
{IS clause that discloses building defects identified in an owners corporation}
```
**Severity:** 🔴 HIGH
**Why it matters:** Rectification costs coming. Check scope and timeline.
**Red flag text:** "defects", "building defects", "rectification"

```iql
{IS clause that discloses combustible cladding on the building}
```
**Severity:** 🔴 HIGH
**Why it matters:** $50K+ special levies common. Insurance issues.
**Red flag text:** "combustible cladding", "cladding", "ACP", "aluminium composite"

```iql
{IS clause that discloses waterproofing defects or water ingress issues}
```
**Severity:** 🔴 HIGH
**Why it matters:** Expensive to fix. May cause ongoing damage.
**Red flag text:** "waterproofing", "water ingress", "leak"

---

# SECTION 8: SERVICES

```iql
{IS clause that indicates electricity is NOT connected to the property}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Connection costs. Common for vacant land.

```iql
{IS clause that indicates sewerage is NOT connected to the property}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** May have septic system. Check compliance and condition.

```iql
{IS clause that indicates the property has a septic tank system}
```
**Severity:** 🟢 INFO
**Why it matters:** Requires maintenance. Check EPA compliance.

```iql
{IS clause that indicates gas is NOT connected to the property}
```
**Severity:** 🟢 INFO
**Why it matters:** Electric only. May affect appliances/heating options.

---

# SECTION 9: TENANCIES & ADDITIONAL

```iql
{IS clause that discloses an existing tenancy affecting the property}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Purchaser takes subject to lease. Check terms.
**Red flag text:** "tenancy", "lease", "tenant"

```iql
{IS clause that identifies the tenant as a related party to the vendor}
```
**Severity:** 🔴 HIGH
**Why it matters:** Non-arm's length. May be below market rent, hard to remove.
**Red flag text:** "related party", same surname, same company name

```iql
{IS clause that discloses rent significantly below market rate}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Locked into unfavourable lease. Check lease expiry.
**Red flag text:** below market, low rent

```iql
{IS clause that discloses a lease term extending more than 2 years beyond settlement}
```
**Severity:** 🟡 MEDIUM
**Why it matters:** Long commitment. Cannot occupy or re-let easily.

---

# EXPECTED RESULTS - TEST DOCUMENTS

## 01_Section32_CLEAN.docx

| Query Category | Expected Result |
|----------------|-----------------|
| Outstanding rates | ❌ No match |
| Outstanding land tax | ❌ No match |
| OC special levy | ❌ No match |
| Owner-builder work | ❌ No match |
| No OB insurance | ❌ No match |
| Building order | ❌ No match |
| Missing occupancy cert | ❌ No match |
| Easements | ❌ No match |
| Restrictive covenant | ❌ No match |
| Heritage overlay | ❌ No match |
| Flood overlay | ❌ No match |
| Bushfire prone | ❌ No match |
| Contamination | ❌ No match |
| Caveat on title | ❌ No match |

**Overall:** CLEAN - No red flags expected.

---

## 02_Section32_MEDIUM.docx

| Query Category | Expected Result |
|----------------|-----------------|
| Outstanding rates | ❌ No match |
| OC special levy | ❌ No match |
| Owner-builder work | ✅ **MATCH** (carport 2022) |
| No OB insurance | ❌ No match (has insurance) |
| Building order | ❌ No match |
| Easements | ✅ **MATCH** (drainage easement) |
| Restrictive covenant | ✅ **MATCH** (single dwelling) |
| Landscape overlay | ✅ **MATCH** (SLO2) |
| Neighbour DA | ✅ **MATCH** (pending application) |
| Heritage overlay | ❌ No match |
| Flood overlay | ❌ No match |
| Contamination | ❌ No match |
| Caveat on title | ❌ No match |

**Overall:** MEDIUM - 5 flags, typical issues requiring attention.

---

## 03_Section32_HIGH_FLAGS.docx

| Query Category | Expected Result |
|----------------|-----------------|
| Outstanding rates | ✅ **MATCH** ($4,567) |
| Outstanding land tax | ✅ **MATCH** ($6,820) |
| OC special levy | ✅ **MATCH** ($45,000 cladding) |
| Owner-builder work | ✅ **MATCH** (bathroom/kitchen) |
| No OB insurance | ✅ **MATCH** (NOT OBTAINED) |
| Building order | ✅ **MATCH** (balcony - deadline passed) |
| Missing occupancy cert | ✅ **MATCH** (NOT OBTAINED) |
| Easements | ✅ **MATCH** (3 easements) |
| Restrictive covenant | ✅ **MATCH** (single dwelling + Airbnb prohibited) |
| Heritage overlay | ✅ **MATCH** (HO456) |
| Flood overlay | ✅ **MATCH** (SBO) |
| Bushfire prone | ✅ **MATCH** (BAL-12.5) |
| Contamination | ✅ **MATCH** (EPA, dry cleaner) |
| Caveat on title | ✅ **MATCH** (Dragon Finance) |
| OC litigation | ✅ **MATCH** (VCAT proceedings) |

**Overall:** HIGH RISK - 13+ flags, serious issues, recommend do not proceed.

---

# SEVERITY LEGEND

| Symbol | Level | Action |
|--------|-------|--------|
| 🔴 | CRITICAL/HIGH | Must address before signing. Consider walking away. |
| 🟡 | MEDIUM | Should negotiate or clarify. Proceed with caution. |
| 🟢 | LOW/INFO | Note for awareness. Generally acceptable. |

---

# CROSS-REFERENCE WITH CONTRACT

Always check Section 32 findings against Contract of Sale:

| Section 32 Issue | Contract Check |
|------------------|----------------|
| Outstanding rates | Who bears adjustment? |
| OC special levy | Is purchaser aware? Settlement timing? |
| Building orders | As-is clause? Warranties excluded? |
| Caveat | Can vendor clear before settlement? |
| Tenancy | Lease attached? Rent verified? |
| Heritage overlay | Any renovation special conditions? |
| Contamination | As-is clause? Indemnities? |

---

*Section 32 IQL Playbook v1.0*
*Based on Sale of Land Act 1962 (Vic) requirements*
*InfoTrack standard format*
*For use with Pathway Property Contract AI*
