"""Generate realistic Australian legal test documents for Orderly platform demo."""

from fpdf import FPDF
import os

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))


class LegalPDF(FPDF):
    def __init__(self, title, parties):
        super().__init__()
        self.doc_title = title
        self.parties = parties

    def header(self):
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(120, 120, 120)
        self.cell(0, 8, self.doc_title.upper(), align="R")
        self.ln(4)
        self.set_draw_color(200, 200, 200)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(6)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    def add_title_page(self, date, ref):
        self.add_page()
        self.ln(50)
        self.set_font("Helvetica", "B", 22)
        self.set_text_color(20, 20, 20)
        self.multi_cell(0, 12, self.doc_title, align="C")
        self.ln(10)
        self.set_font("Helvetica", "", 12)
        self.set_text_color(80, 80, 80)
        self.cell(0, 8, f"Date: {date}", align="C")
        self.ln(8)
        self.cell(0, 8, f"Reference: {ref}", align="C")
        self.ln(16)
        self.set_font("Helvetica", "", 11)
        self.cell(0, 8, "between", align="C")
        self.ln(10)
        for i, (name, role) in enumerate(self.parties):
            self.set_font("Helvetica", "B", 12)
            self.cell(0, 8, name, align="C")
            self.ln(6)
            self.set_font("Helvetica", "I", 10)
            self.cell(0, 8, f"({role})", align="C")
            self.ln(10)
            if i < len(self.parties) - 1:
                self.set_font("Helvetica", "", 11)
                self.cell(0, 6, "and", align="C")
                self.ln(8)

    def heading(self, num, text):
        self.ln(6)
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(20, 20, 20)
        self.multi_cell(0, 8, f"{num}. {text}")
        self.ln(2)

    def subheading(self, num, text):
        self.ln(2)
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(40, 40, 40)
        self.multi_cell(0, 7, f"{num} {text}")
        self.ln(1)

    def body(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 6, text)
        self.ln(2)

    def clause(self, num, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(30, 30, 30)
        x = self.get_x()
        self.cell(12, 6, num)
        self.multi_cell(0, 6, text)
        self.ln(2)


def doc1_commercial_lease():
    pdf = LegalPDF(
        "Commercial Lease Agreement",
        [("Harbour City Properties Pty Ltd (ACN 612 345 678)", "Landlord"),
         ("TechFlow Solutions Pty Ltd (ACN 645 789 012)", "Tenant")]
    )
    pdf.alias_nb_pages()
    pdf.add_title_page("15 January 2025", "HCP-LEASE-2025-0042")

    pdf.add_page()
    pdf.heading("1", "DEFINITIONS AND INTERPRETATION")
    pdf.body('"Building" means the commercial office building located at Level 12, 200 George Street, Sydney NSW 2000, being the whole of the land contained in Folio Identifier 1/SP12345.')
    pdf.body('"Commencement Date" means 1 March 2025.')
    pdf.body('"Lease Term" means the period of five (5) years commencing on the Commencement Date and expiring on 28 February 2030, unless terminated earlier in accordance with this Lease.')
    pdf.body('"Permitted Use" means use as a technology company office for software development, administration, and ancillary purposes.')
    pdf.body('"Premises" means Suite 1205, Level 12, 200 George Street, Sydney NSW 2000, having an area of approximately 450 square metres as shown outlined in red on the plan annexed as Schedule 1.')
    pdf.body('"Rent" means the amount of $247,500.00 per annum (exclusive of GST), payable monthly in advance, being $20,625.00 per calendar month.')
    pdf.body('"Security Deposit" means the sum of $61,875.00, being equivalent to three (3) months\' Rent.')
    pdf.body('"Outgoings" means all rates, taxes, levies, charges, costs, and expenses payable by the Landlord in respect of the Building, including but not limited to council rates, water rates, land tax, insurance premiums, management fees, and common area maintenance costs.')

    pdf.heading("2", "GRANT OF LEASE")
    pdf.body("2.1 The Landlord leases the Premises to the Tenant, and the Tenant takes the Premises on lease from the Landlord, for the Lease Term, subject to the terms and conditions of this Lease.")
    pdf.body("2.2 The Tenant must not use the Premises for any purpose other than the Permitted Use without the prior written consent of the Landlord, which consent must not be unreasonably withheld.")
    pdf.body("2.3 The Tenant acknowledges that it has inspected the Premises and accepts the Premises in their current condition as at the Commencement Date.")

    pdf.heading("3", "RENT AND PAYMENT")
    pdf.body("3.1 The Tenant must pay the Rent to the Landlord monthly in advance on the first Business Day of each calendar month, without deduction or set-off, by direct deposit to the Landlord's nominated bank account.")
    pdf.body("3.2 If any Rent or other amount payable under this Lease remains unpaid for more than fourteen (14) days after the due date for payment, the Tenant must pay interest on the outstanding amount at the rate of 4% per annum above the Reserve Bank of Australia cash rate, calculated daily from the due date until payment in full.")
    pdf.body("3.3 The Rent shall be reviewed on each anniversary of the Commencement Date. The Rent payable for each year following a review date shall be the greater of: (a) the Rent payable immediately before the review date increased by 3.5% per annum; or (b) the Rent payable immediately before the review date adjusted in accordance with the percentage increase in the Consumer Price Index (All Groups, Sydney) for the twelve-month period ending on the quarter immediately preceding the review date.")

    pdf.heading("4", "OUTGOINGS AND GST")
    pdf.body("4.1 The Tenant must pay to the Landlord the Tenant's Proportion of Outgoings within thirty (30) days of receipt of a tax invoice from the Landlord. The Tenant's Proportion means 8.2% of the total Outgoings for the Building, being the proportion that the lettable area of the Premises bears to the total lettable area of the Building.")
    pdf.body("4.2 All amounts payable under this Lease are exclusive of GST. If GST is payable on any supply made under this Lease, the recipient must pay to the supplier an additional amount equal to the GST payable on that supply.")

    pdf.heading("5", "SECURITY DEPOSIT")
    pdf.body("5.1 The Tenant must pay the Security Deposit to the Landlord on or before the Commencement Date. The Security Deposit shall be held by the Landlord as security for the performance by the Tenant of its obligations under this Lease.")
    pdf.body("5.2 The Landlord may apply the whole or any part of the Security Deposit towards the satisfaction of any breach by the Tenant of its obligations under this Lease, without prejudice to any other rights or remedies available to the Landlord.")
    pdf.body("5.3 Upon lawful termination or expiry of this Lease and provided the Tenant has complied with all of its obligations, the Landlord must refund the Security Deposit (or the balance remaining) to the Tenant within twenty-eight (28) days.")

    pdf.heading("6", "REPAIRS AND MAINTENANCE")
    pdf.body("6.1 The Tenant must, at its own cost, keep and maintain the interior of the Premises (including all fixtures, fittings, and equipment installed by the Tenant) in good repair, order, and condition, fair wear and tear excepted.")
    pdf.body("6.2 The Landlord must maintain in good repair and condition the structure of the Building, the roof, external walls, common areas, lifts, and all base building services including fire safety systems, air conditioning plant, and electrical infrastructure.")
    pdf.body("6.3 The Tenant must not make any alterations, additions, or improvements to the Premises without the prior written consent of the Landlord. Any consent granted may be subject to conditions, including a requirement that the Tenant restore the Premises to their original condition at the expiry or termination of the Lease.")

    pdf.heading("7", "INSURANCE")
    pdf.body("7.1 The Tenant must maintain and keep current throughout the Lease Term: (a) public liability insurance for an amount of not less than $20,000,000 per occurrence; (b) plate glass insurance for all glass in the Premises; (c) insurance in respect of the Tenant's fixtures, fittings, equipment, and stock for their full replacement value; and (d) workers' compensation insurance as required by law.")
    pdf.body("7.2 The Landlord must maintain building insurance for the full replacement value of the Building, including cover for fire, storm, tempest, flood, earthquake, and other usual perils.")

    pdf.heading("8", "INDEMNITY AND RELEASE")
    pdf.body("8.1 The Tenant indemnifies and holds harmless the Landlord and its officers, employees, agents, and contractors from and against all claims, demands, losses, damages, costs, and expenses (including legal costs on a solicitor-client basis) arising out of or in connection with: (a) any breach by the Tenant of this Lease; (b) any negligent or wilful act or omission of the Tenant or its employees, agents, contractors, or invitees; (c) any injury to or death of any person, or damage to or loss of any property, occurring in or about the Premises, except to the extent caused by the negligence or wilful misconduct of the Landlord.")
    pdf.body("8.2 The Tenant releases the Landlord from all claims and demands in respect of any damage to the Tenant's property or injury to any person in or about the Premises, except to the extent caused by the Landlord's negligence or breach of this Lease.")

    pdf.heading("9", "TERMINATION")
    pdf.body("9.1 The Landlord may terminate this Lease by giving not less than fourteen (14) days' written notice to the Tenant if: (a) the Rent or any part thereof is in arrears for a period of fourteen (14) days or more, whether formally demanded or not; (b) the Tenant commits a breach of any covenant, condition, or agreement contained in this Lease and fails to remedy such breach within thirty (30) days after receiving written notice from the Landlord specifying the breach and requiring it to be remedied; (c) the Tenant becomes insolvent, enters into voluntary administration, has a receiver or liquidator appointed, or is wound up.")
    pdf.body("9.2 The Tenant may terminate this Lease by giving not less than six (6) months' written notice to the Landlord, provided that the Tenant pays to the Landlord a termination fee equal to the aggregate of: (a) three (3) months' Rent at the rate then payable; (b) unamortised fit-out contribution (if any); and (c) the Landlord's reasonable costs of re-letting the Premises.")
    pdf.body("9.3 Either party may terminate this Lease immediately upon written notice if the Premises are destroyed or rendered substantially unfit for the Permitted Use by fire, flood, storm, or other insured risk, and the Landlord's insurer does not agree to reinstate the Premises within ninety (90) days.")

    pdf.heading("10", "ASSIGNMENT AND SUBLETTING")
    pdf.body("10.1 The Tenant must not assign, transfer, sublet, or otherwise part with possession of the Premises or any part thereof without the prior written consent of the Landlord, which consent must not be unreasonably withheld or delayed.")
    pdf.body("10.2 Any request for consent must be accompanied by: (a) the name and business details of the proposed assignee or subtenant; (b) financial statements for the two most recent financial years; (c) details of the proposed use; and (d) payment of the Landlord's reasonable legal and administration costs.")

    pdf.heading("11", "DISPUTE RESOLUTION")
    pdf.body("11.1 If a dispute arises in connection with this Lease, the parties must first attempt to resolve the dispute by negotiation in good faith.")
    pdf.body("11.2 If the dispute is not resolved within twenty-one (21) days, either party may refer the dispute to mediation administered by the Australian Disputes Centre (ADC) in Sydney, in accordance with the ADC Mediation Guidelines.")
    pdf.body("11.3 If the dispute is not resolved by mediation within sixty (60) days, either party may commence proceedings in the Supreme Court of New South Wales.")

    pdf.heading("12", "GOVERNING LAW")
    pdf.body("12.1 This Lease is governed by and must be construed in accordance with the laws of New South Wales, Australia.")
    pdf.body("12.2 Each party irrevocably submits to the non-exclusive jurisdiction of the courts of New South Wales and the Federal Court of Australia.")

    pdf.heading("13", "NOTICES")
    pdf.body("13.1 Any notice required to be given under this Lease must be in writing and may be given by: (a) hand delivery; (b) prepaid post to the party's address specified in this Lease; or (c) email to the party's email address specified in this Lease. A notice is deemed to have been received: if delivered by hand, on the date of delivery; if sent by post, on the third Business Day after posting; if sent by email, at the time shown in the delivery confirmation report.")

    pdf.heading("14", "OPTION TO RENEW")
    pdf.body("14.1 The Landlord grants to the Tenant one (1) option to renew this Lease for a further term of three (3) years on the same terms and conditions (except this clause and the Rent, which shall be determined by market review). The Tenant must exercise the option by giving not less than six (6) months' written notice to the Landlord before the expiry of the Lease Term.")

    path = os.path.join(OUTPUT_DIR, "01_Commercial_Lease_Agreement_200_George_St.pdf")
    pdf.output(path)
    print(f"Generated: {path}")


def doc2_employment_contract():
    pdf = LegalPDF(
        "Employment Agreement",
        [("Meridian Legal Partners Pty Ltd (ACN 623 456 789)", "Employer"),
         ("Sarah Chen", "Employee")]
    )
    pdf.alias_nb_pages()
    pdf.add_title_page("3 February 2025", "MLP-EMP-2025-0019")

    pdf.add_page()
    pdf.heading("1", "POSITION AND DUTIES")
    pdf.body("1.1 The Employer engages the Employee as Senior Associate, Legal Technology & Innovation, reporting to the Chief Operating Officer. The Employee's principal place of work shall be Level 28, 1 Macquarie Place, Sydney NSW 2000, with the flexibility to work remotely up to two (2) days per week in accordance with the Employer's Flexible Working Policy.")
    pdf.body("1.2 The Employee must devote the whole of the Employee's time, attention, and skill during ordinary working hours to the diligent and faithful performance of the duties of the position, and such additional hours as are reasonably necessary for the proper performance of those duties.")
    pdf.body("1.3 The Employee must comply with all lawful and reasonable directions of the Employer, and all policies and procedures of the Employer as amended from time to time.")

    pdf.heading("2", "COMMENCEMENT AND PROBATION")
    pdf.body("2.1 The Employee's employment commences on 3 March 2025 (Commencement Date).")
    pdf.body("2.2 The first six (6) months of employment constitute a probationary period. During the probationary period, either party may terminate this Agreement by giving two (2) weeks' written notice or payment in lieu of notice.")
    pdf.body("2.3 At the end of the probationary period, the Employer will conduct a performance review. If the Employee's performance is satisfactory, the Employee's employment will be confirmed.")

    pdf.heading("3", "REMUNERATION")
    pdf.body("3.1 The Employee's total remuneration package (TRP) is $185,000.00 per annum (inclusive of superannuation), comprising: (a) Base Salary: $168,181.82 per annum (gross); (b) Superannuation: $16,818.18 per annum (being 10% of Base Salary, or such higher rate as required by the Superannuation Guarantee (Administration) Act 1992 (Cth)).")
    pdf.body("3.2 The Employee's salary will be paid fortnightly in arrears by direct deposit to the Employee's nominated bank account.")
    pdf.body("3.3 The Employee's salary will be reviewed annually on or about 1 July each year. Any increase is at the sole discretion of the Employer, having regard to the Employee's performance, market conditions, and the financial position of the Employer.")
    pdf.body("3.4 The Employee will be eligible for an annual performance bonus of up to 15% of the Base Salary, subject to the achievement of key performance indicators agreed between the Employee and the Employer. Payment of any bonus is discretionary and does not form part of the Employee's ordinary rate of pay.")

    pdf.heading("4", "LEAVE ENTITLEMENTS")
    pdf.body("4.1 Annual Leave: The Employee is entitled to four (4) weeks' paid annual leave per year of service, accrued progressively in accordance with the Fair Work Act 2009 (Cth) and the National Employment Standards.")
    pdf.body("4.2 Personal/Carer's Leave: The Employee is entitled to ten (10) days' paid personal/carer's leave per year, accrued progressively.")
    pdf.body("4.3 Parental Leave: The Employee is entitled to parental leave in accordance with the Fair Work Act 2009 (Cth). In addition, the Employer provides twelve (12) weeks' paid parental leave for primary carers and four (4) weeks' paid parental leave for secondary carers.")
    pdf.body("4.4 Long Service Leave: The Employee is entitled to long service leave in accordance with the Long Service Leave Act 1955 (NSW).")

    pdf.heading("5", "CONFIDENTIALITY")
    pdf.body("5.1 The Employee must not, during the term of employment or at any time after the termination of employment, directly or indirectly use or disclose to any person any Confidential Information except: (a) in the proper performance of the Employee's duties; (b) as required by law; or (c) with the prior written consent of the Employer.")
    pdf.body('5.2 "Confidential Information" means all information relating to the business, affairs, clients, suppliers, technology, intellectual property, or finances of the Employer or any of its related entities that is not publicly available, including but not limited to: client lists and contact details; fee structures and pricing models; legal strategies and advice; proprietary software and algorithms; business plans and financial projections; employee information; and any information designated as confidential by the Employer.')
    pdf.body("5.3 Upon termination of employment, the Employee must immediately return to the Employer all documents, records, files, equipment, and other property of the Employer in the Employee's possession or control, including all copies of Confidential Information in any form.")

    pdf.heading("6", "INTELLECTUAL PROPERTY")
    pdf.body("6.1 All intellectual property created by the Employee in the course of employment or using the Employer's resources belongs to the Employer. The Employee hereby assigns to the Employer all right, title, and interest in any such intellectual property, including copyright, patents, designs, and trade marks.")
    pdf.body("6.2 The Employee must promptly disclose to the Employer all inventions, discoveries, improvements, and works of authorship made during the course of employment.")

    pdf.heading("7", "RESTRAINT OF TRADE")
    pdf.body("7.1 The Employee agrees that for a period of twelve (12) months after the termination of employment (or six (6) months if a court determines twelve months is unreasonable), the Employee will not, within New South Wales (or the Sydney metropolitan area if a court determines the whole of New South Wales is unreasonable): (a) solicit, canvass, or approach any client of the Employer with whom the Employee had material dealings during the last twelve (12) months of employment, for the purpose of providing services that are competitive with the Employer's services; (b) entice or attempt to entice away from the Employer any employee or contractor of the Employer; (c) engage in or be concerned with any business that is in competition with the Employer's legal technology consulting practice.")
    pdf.body("7.2 The Employee acknowledges that: (a) the restraints are reasonable and necessary to protect the Employer's legitimate business interests; (b) the Employee has received adequate consideration for the restraints; and (c) each restraint operates separately and independently.")

    pdf.heading("8", "TERMINATION")
    pdf.body("8.1 After the probationary period, either party may terminate this Agreement by giving four (4) weeks' written notice (or five (5) weeks if the Employee is over 45 years of age and has at least two years of continuous service).")
    pdf.body("8.2 The Employer may terminate this Agreement immediately without notice if the Employee: (a) engages in serious misconduct (including fraud, dishonesty, assault, being intoxicated at work, or wilful disobedience); (b) commits a serious breach of this Agreement; (c) is convicted of a criminal offence that brings the Employer into disrepute; or (d) is unable to perform the inherent requirements of the position after reasonable adjustments.")
    pdf.body("8.3 Upon termination, the Employee must be paid all accrued but untaken annual leave and long service leave entitlements in accordance with applicable legislation.")
    pdf.body("8.4 The Employer may, in its absolute discretion, elect to pay the Employee in lieu of all or part of the notice period, and may direct the Employee to serve all or part of the notice period on garden leave.")

    pdf.heading("9", "DISPUTE RESOLUTION")
    pdf.body("9.1 Any dispute arising under this Agreement must first be addressed through the Employer's internal grievance procedure. If the dispute is not resolved within fourteen (14) days, either party may refer the matter to the Fair Work Commission for conciliation.")

    pdf.heading("10", "GOVERNING LAW")
    pdf.body("10.1 This Agreement is governed by the laws of New South Wales, Australia, and the Fair Work Act 2009 (Cth). The parties submit to the jurisdiction of the courts of New South Wales and the Fair Work Commission.")

    pdf.heading("11", "ENTIRE AGREEMENT")
    pdf.body("11.1 This Agreement constitutes the entire agreement between the parties with respect to its subject matter and supersedes all prior agreements, understandings, negotiations, and discussions, whether oral or written.")

    path = os.path.join(OUTPUT_DIR, "02_Employment_Agreement_Sarah_Chen.pdf")
    pdf.output(path)
    print(f"Generated: {path}")


def doc3_share_purchase():
    pdf = LegalPDF(
        "Share Purchase Agreement",
        [("BluePeak Ventures Pty Ltd (ACN 634 567 890)", "Buyer"),
         ("Coastal Innovation Holdings Pty Ltd (ACN 601 234 567)", "Seller"),
         ("DataHarbour Pty Ltd (ACN 656 890 123)", "Company")]
    )
    pdf.alias_nb_pages()
    pdf.add_title_page("22 January 2025", "BPV-SPA-2025-0003")

    pdf.add_page()
    pdf.heading("1", "DEFINITIONS AND INTERPRETATION")
    pdf.body('"Accounts" means the audited financial statements of the Company for the financial year ended 30 June 2024, including the balance sheet, profit and loss statement, cash flow statement, and the notes to those statements.')
    pdf.body('"Business Day" means a day (other than a Saturday, Sunday, or public holiday) on which banks are open for general banking business in Sydney, New South Wales.')
    pdf.body('"Completion" means completion of the sale and purchase of the Sale Shares in accordance with clause 6.')
    pdf.body('"Completion Date" means the date that is ten (10) Business Days after the date on which the last of the Conditions Precedent is satisfied or waived, or such other date as the parties agree in writing.')
    pdf.body('"Encumbrance" means any mortgage, charge, lien, pledge, security interest, assignment by way of security, retention of title arrangement, or any other arrangement having the effect of security.')
    pdf.body('"Material Adverse Change" means any event, circumstance, or change that has or is reasonably likely to have a material adverse effect on the assets, liabilities, financial condition, or results of operations of the Company, where "material" means having a financial impact of $500,000 or more in aggregate.')
    pdf.body('"Purchase Price" means $4,250,000.00 (Four Million Two Hundred and Fifty Thousand Australian Dollars), subject to adjustment in accordance with clause 4.')
    pdf.body('"Sale Shares" means 100% of the issued share capital of the Company, being 1,000 ordinary shares.')

    pdf.heading("2", "SALE AND PURCHASE")
    pdf.body("2.1 Subject to the terms of this Agreement, the Seller agrees to sell and the Buyer agrees to purchase the Sale Shares free from all Encumbrances and with all rights attaching to them as at the Completion Date.")
    pdf.body("2.2 The Sale Shares represent the entire issued share capital of the Company. The Seller warrants that it is the registered and beneficial owner of the Sale Shares.")

    pdf.heading("3", "CONDITIONS PRECEDENT")
    pdf.body("3.1 Completion is conditional upon the satisfaction or waiver of the following conditions on or before 28 February 2025 (Sunset Date): (a) the Buyer completing due diligence on the Company to its reasonable satisfaction; (b) the Buyer obtaining all necessary regulatory approvals, including approval under the Foreign Acquisitions and Takeovers Act 1975 (Cth) if required; (c) no Material Adverse Change having occurred in respect of the Company; (d) all consents and approvals required under the Company's material contracts for the change of control contemplated by this Agreement having been obtained; (e) key employees of the Company executing new employment agreements with the Company on terms satisfactory to the Buyer.")
    pdf.body("3.2 If the Conditions Precedent are not satisfied or waived by the Sunset Date, either party may terminate this Agreement by written notice, and neither party shall have any claim against the other except in respect of antecedent breaches.")

    pdf.heading("4", "PURCHASE PRICE AND ADJUSTMENT")
    pdf.body("4.1 The Purchase Price shall be paid as follows: (a) $425,000.00 (Deposit) payable within five (5) Business Days of execution of this Agreement, to be held in escrow by Clayton Utz Lawyers in their trust account; (b) $3,400,000.00 payable on the Completion Date by electronic funds transfer to the Seller's nominated bank account; (c) $425,000.00 (Retention Amount) payable on the date that is twelve (12) months after the Completion Date, subject to any claims under the Warranties.")
    pdf.body("4.2 The Purchase Price shall be adjusted dollar-for-dollar based on the difference between the Net Asset Value of the Company as at the Completion Date and the Net Asset Value as shown in the Accounts. An independent auditor appointed by the parties shall determine the Completion Date Net Asset Value within sixty (60) days of Completion.")

    pdf.heading("5", "WARRANTIES AND REPRESENTATIONS")
    pdf.body("5.1 The Seller warrants and represents to the Buyer that as at the date of this Agreement and at Completion: (a) the Seller has full power and authority to enter into and perform its obligations under this Agreement; (b) the Sale Shares constitute 100% of the issued share capital of the Company and are fully paid; (c) the Accounts give a true and fair view of the financial position and performance of the Company; (d) the Company has no liabilities (actual or contingent) other than those disclosed in the Accounts or the Disclosure Letter; (e) all material contracts of the Company are in full force and effect and no party to any such contract is in default.")
    pdf.body("5.2 The Seller further warrants that: (a) the Company owns or has valid licenses for all intellectual property used in its business; (b) the Company is not a party to any litigation, arbitration, or regulatory investigation, and no such proceedings are threatened; (c) the Company has complied with all applicable laws, including the Australian Consumer Law, Privacy Act 1988 (Cth), and all applicable taxation laws; (d) the Company has lodged all required tax returns and paid all taxes due and payable; (e) all employees are employed on terms consistent with the Fair Work Act 2009 (Cth) and no claims have been made or threatened by any employee.")

    pdf.heading("6", "COMPLETION")
    pdf.body("6.1 Completion shall take place at the offices of Clayton Utz Lawyers, Level 15, 1 Bligh Street, Sydney NSW 2000, at 10:00 am on the Completion Date.")
    pdf.body("6.2 At Completion: (a) the Seller must deliver to the Buyer: executed share transfer forms in respect of the Sale Shares; share certificates for the Sale Shares; resignations of any directors nominated by the Seller; the Company's statutory books, records, and common seal; all other documents necessary to give effect to the transactions contemplated by this Agreement; (b) the Buyer must pay the balance of the Purchase Price (less the Deposit and the Retention Amount) to the Seller.")

    pdf.heading("7", "INDEMNIFICATION")
    pdf.body("7.1 The Seller indemnifies the Buyer against all losses, damages, costs, expenses, and liabilities suffered or incurred by the Buyer or the Company arising out of or in connection with any breach of the Warranties or any other provision of this Agreement.")
    pdf.body("7.2 The maximum aggregate liability of the Seller under this clause shall not exceed the Purchase Price. No claim may be made under the Warranties unless: (a) written notice of the claim is given to the Seller within eighteen (18) months of the Completion Date (or six (6) years in respect of tax warranties); (b) the amount of the individual claim exceeds $25,000; and (c) the aggregate amount of all claims exceeds $100,000, in which case the Seller shall be liable for the whole amount and not merely the excess.")

    pdf.heading("8", "RESTRICTIVE COVENANTS")
    pdf.body("8.1 The Seller covenants that for a period of three (3) years from the Completion Date, it will not, and will procure that its related entities do not: (a) carry on or be engaged or interested in any business that competes with the Business as conducted at the Completion Date, within Australia; (b) solicit, canvass, or approach any customer, client, or supplier of the Company; (c) employ or engage, or solicit the employment or engagement of, any person who is or was an employee or contractor of the Company at the Completion Date.")

    pdf.heading("9", "CONFIDENTIALITY")
    pdf.body("9.1 Each party must keep confidential and not disclose to any person the terms of this Agreement and all information provided by the other party in connection with the transactions contemplated by this Agreement, except: (a) to the party's professional advisers, financiers, and officers who need to know for the purposes of this Agreement; (b) as required by law or the listing rules of any stock exchange; or (c) with the prior written consent of the other party.")

    pdf.heading("10", "GOVERNING LAW AND JURISDICTION")
    pdf.body("10.1 This Agreement is governed by and must be construed in accordance with the laws of New South Wales, Australia.")
    pdf.body("10.2 Any dispute arising out of or in connection with this Agreement shall be referred to and finally resolved by arbitration administered by the Australian Centre for International Commercial Arbitration (ACICA) in accordance with the ACICA Arbitration Rules. The seat of arbitration shall be Sydney. The tribunal shall consist of one arbitrator.")

    path = os.path.join(OUTPUT_DIR, "03_Share_Purchase_Agreement_DataHarbour.pdf")
    pdf.output(path)
    print(f"Generated: {path}")


def doc4_nda():
    pdf = LegalPDF(
        "Mutual Confidentiality and Non-Disclosure Agreement",
        [("Orderly AI Pty Ltd (ACN 678 901 234)", "First Party"),
         ("Whitfield & Associates Legal (ABN 45 678 901 234)", "Second Party")]
    )
    pdf.alias_nb_pages()
    pdf.add_title_page("10 February 2025", "OAI-NDA-2025-0008")

    pdf.add_page()
    pdf.heading("1", "BACKGROUND")
    pdf.body("A. The parties wish to explore a potential business relationship involving the integration of artificial intelligence technology into legal practice management systems (Purpose).")
    pdf.body("B. In connection with the Purpose, each party may disclose to the other certain Confidential Information.")
    pdf.body("C. The parties wish to protect the confidentiality of such information on the terms set out in this Agreement.")

    pdf.heading("2", "DEFINITIONS")
    pdf.body('"Confidential Information" means all information disclosed by a Disclosing Party to a Receiving Party, whether before or after the date of this Agreement, that: (a) is designated as confidential; (b) the Receiving Party knows or ought reasonably to know is confidential; or (c) is by its nature confidential, including but not limited to: trade secrets, know-how, inventions, algorithms, source code, business strategies, client information, pricing, financial data, technical specifications, and any analyses, compilations, or derivative works prepared by the Receiving Party that contain or reflect Confidential Information.')
    pdf.body('"Confidential Information" does not include information that: (a) is or becomes publicly available other than through a breach of this Agreement; (b) was in the Receiving Party\'s possession before disclosure and was not subject to a confidentiality obligation; (c) is independently developed by the Receiving Party without use of or reference to the Confidential Information; or (d) is received from a third party who is not under an obligation of confidentiality.')
    pdf.body('"Disclosing Party" means the party disclosing Confidential Information.')
    pdf.body('"Receiving Party" means the party receiving Confidential Information.')
    pdf.body('"Representatives" means a party\'s directors, officers, employees, agents, advisers, and contractors who have a need to know the Confidential Information for the Purpose.')

    pdf.heading("3", "OBLIGATIONS OF CONFIDENTIALITY")
    pdf.body("3.1 The Receiving Party must: (a) keep the Confidential Information strictly confidential; (b) not disclose the Confidential Information to any person other than its Representatives; (c) use the Confidential Information solely for the Purpose; (d) take all reasonable steps to protect the Confidential Information from unauthorised access, use, or disclosure, using the same degree of care as it uses to protect its own confidential information (and in any event, no less than a reasonable degree of care); (e) ensure that its Representatives are aware of and comply with the obligations of confidentiality set out in this Agreement.")
    pdf.body("3.2 The Receiving Party may disclose Confidential Information to the extent required by: (a) applicable law, regulation, or rules of any stock exchange; (b) any court of competent jurisdiction or governmental or regulatory authority, provided that the Receiving Party: (i) gives the Disclosing Party prompt written notice (to the extent legally permitted); (ii) discloses only the minimum information required; and (iii) cooperates with the Disclosing Party in seeking a protective order or equivalent.")

    pdf.heading("4", "INTELLECTUAL PROPERTY")
    pdf.body("4.1 Nothing in this Agreement grants the Receiving Party any right, title, or interest in the Confidential Information or any intellectual property rights of the Disclosing Party.")
    pdf.body("4.2 All Confidential Information remains the property of the Disclosing Party. The Receiving Party acknowledges that the Confidential Information may include valuable trade secrets and proprietary information.")

    pdf.heading("5", "TERM AND TERMINATION")
    pdf.body("5.1 This Agreement commences on the date of execution and continues for a period of two (2) years, unless terminated earlier by either party giving thirty (30) days' written notice.")
    pdf.body("5.2 The obligations of confidentiality set out in this Agreement survive termination and continue for a period of five (5) years from the date of termination (or indefinitely in respect of trade secrets).")
    pdf.body("5.3 Upon termination or upon request by the Disclosing Party, the Receiving Party must promptly: (a) return all documents and materials containing Confidential Information; (b) destroy all copies, extracts, and summaries of Confidential Information in its possession or control; and (c) certify in writing that it has complied with this clause.")

    pdf.heading("6", "REMEDIES")
    pdf.body("6.1 The parties acknowledge that a breach of this Agreement may cause irreparable harm for which damages would not be an adequate remedy. Accordingly, in addition to any other remedy available at law or in equity, the Disclosing Party is entitled to seek injunctive or other equitable relief to restrain any actual or threatened breach of this Agreement, without the need to prove actual damage or post any bond or security.")
    pdf.body("6.2 The Receiving Party indemnifies the Disclosing Party against all losses, damages, costs, and expenses (including legal costs on a solicitor-client basis) arising from any breach of this Agreement by the Receiving Party or its Representatives.")

    pdf.heading("7", "GENERAL")
    pdf.body("7.1 This Agreement is governed by the laws of New South Wales, Australia, and each party submits to the non-exclusive jurisdiction of the courts of New South Wales.")
    pdf.body("7.2 This Agreement constitutes the entire agreement between the parties with respect to its subject matter.")
    pdf.body("7.3 No amendment or variation of this Agreement is effective unless in writing and signed by both parties.")
    pdf.body("7.4 Neither party may assign its rights or obligations under this Agreement without the prior written consent of the other party.")
    pdf.body("7.5 If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions continue in full force and effect. The invalid or unenforceable provision shall be modified to the minimum extent necessary to make it valid and enforceable.")
    pdf.body("7.6 No waiver of any right under this Agreement is effective unless in writing. A failure to exercise or delay in exercising any right does not constitute a waiver of that right.")

    path = os.path.join(OUTPUT_DIR, "04_Mutual_NDA_Orderly_AI_Whitfield.pdf")
    pdf.output(path)
    print(f"Generated: {path}")


def doc5_saas_agreement():
    pdf = LegalPDF(
        "Software as a Service Agreement",
        [("LegalCloud Technologies Pty Ltd (ACN 689 012 345)", "Provider"),
         ("Henderson McCrae Lawyers (ABN 12 345 678 901)", "Customer")]
    )
    pdf.alias_nb_pages()
    pdf.add_title_page("28 January 2025", "LCT-SAAS-2025-0015")

    pdf.add_page()
    pdf.heading("1", "DEFINITIONS")
    pdf.body('"Authorised Users" means the Customer\'s employees, agents, and contractors who are authorised by the Customer to access and use the Platform, up to the maximum number specified in the Order Form.')
    pdf.body('"Customer Data" means all data, information, documents, and materials uploaded to, stored on, or processed through the Platform by or on behalf of the Customer, including personal information, client files, and legal documents.')
    pdf.body('"Force Majeure Event" means any event beyond a party\'s reasonable control, including acts of God, fire, flood, earthquake, pandemic, war, terrorism, strikes, government action, power failure, internet or telecommunications failure, or cyberattack.')
    pdf.body('"Intellectual Property Rights" means all patents, copyright, trade marks, designs, trade secrets, know-how, database rights, and all other intellectual property rights, whether registered or unregistered.')
    pdf.body('"Order Form" means the order form executed by the parties specifying the subscription tier, number of Authorised Users, fees, and term.')
    pdf.body('"Platform" means the LegalCloud practice management and AI-assisted legal research software application provided by the Provider as a service via the internet.')
    pdf.body('"Service Level Agreement" or "SLA" means the service level commitments set out in Schedule 2.')
    pdf.body('"Subscription Fee" means $2,400.00 per Authorised User per annum (exclusive of GST), being $200.00 per Authorised User per month, for a total of fifteen (15) Authorised Users, amounting to $36,000.00 per annum.')

    pdf.heading("2", "LICENCE AND ACCESS")
    pdf.body("2.1 Subject to the Customer's compliance with this Agreement and payment of the Subscription Fee, the Provider grants the Customer a non-exclusive, non-transferable, revocable licence to access and use the Platform during the Term for the Customer's internal business purposes.")
    pdf.body("2.2 The Customer must ensure that each Authorised User has a unique login credential and must not permit any person other than Authorised Users to access the Platform.")
    pdf.body("2.3 The Customer must not: (a) sublicense, sell, or distribute access to the Platform; (b) copy, modify, adapt, or create derivative works of the Platform; (c) reverse engineer, decompile, or disassemble the Platform; (d) use the Platform for any unlawful purpose or in breach of any applicable law; (e) introduce any virus, malware, or harmful code to the Platform; (f) attempt to gain unauthorised access to the Platform or its infrastructure.")

    pdf.heading("3", "CUSTOMER DATA")
    pdf.body("3.1 The Customer retains all right, title, and interest in the Customer Data. The Provider does not acquire any rights in the Customer Data except the limited rights granted under this Agreement.")
    pdf.body("3.2 The Customer grants the Provider a non-exclusive licence to host, store, process, and transmit the Customer Data solely for the purpose of providing the Platform and performing the Provider's obligations under this Agreement.")
    pdf.body("3.3 The Provider must: (a) implement and maintain appropriate technical and organisational measures to protect Customer Data against unauthorised access, loss, destruction, or alteration, in accordance with the Australian Privacy Principles under the Privacy Act 1988 (Cth); (b) not access Customer Data except as necessary to provide the Platform, respond to support requests, or comply with the law; (c) not disclose Customer Data to any third party except with the Customer's prior written consent or as required by law; (d) store all Customer Data within Australia unless otherwise agreed in writing.")
    pdf.body("3.4 The Provider will back up Customer Data daily and retain backups for a minimum of ninety (90) days. In the event of data loss, the Provider will use commercially reasonable efforts to restore Customer Data from the most recent backup.")

    pdf.heading("4", "SERVICE LEVELS AND AVAILABILITY")
    pdf.body("4.1 The Provider will use commercially reasonable efforts to maintain Platform availability of 99.9% measured monthly, excluding scheduled maintenance windows.")
    pdf.body("4.2 Scheduled maintenance will be performed during the window of Saturday 11:00 PM to Sunday 5:00 AM (AEST/AEDT) wherever practicable, with at least forty-eight (48) hours' prior notice to the Customer.")
    pdf.body("4.3 If Platform availability falls below 99.9% in any calendar month (excluding scheduled maintenance and Force Majeure Events), the Customer is entitled to a service credit as follows: (a) 99.0% to 99.8%: 10% credit of the monthly Subscription Fee; (b) 95.0% to 98.9%: 25% credit; (c) below 95.0%: 50% credit. Service credits are the Customer's sole and exclusive remedy for failure to meet availability targets.")

    pdf.heading("5", "FEES AND PAYMENT")
    pdf.body("5.1 The Customer must pay the Subscription Fee annually in advance within thirty (30) days of the date of the Provider's tax invoice.")
    pdf.body("5.2 All fees are exclusive of GST. The Customer must pay GST on any taxable supply made under this Agreement.")
    pdf.body("5.3 If any amount is not paid by the due date, the Provider may: (a) charge interest at 2% per annum above the Reserve Bank of Australia cash rate; (b) suspend the Customer's access to the Platform upon fourteen (14) days' written notice; (c) terminate this Agreement upon thirty (30) days' written notice if the amount remains unpaid.")

    pdf.heading("6", "INTELLECTUAL PROPERTY")
    pdf.body("6.1 The Provider owns all Intellectual Property Rights in the Platform, including all updates, enhancements, modifications, and derivative works. Nothing in this Agreement transfers any Intellectual Property Rights to the Customer.")
    pdf.body("6.2 The Provider indemnifies the Customer against any claim that the Customer's use of the Platform in accordance with this Agreement infringes the Intellectual Property Rights of a third party in Australia. This indemnity does not apply to the extent the claim arises from: (a) Customer Data; (b) modifications to the Platform made by or on behalf of the Customer; (c) use of the Platform in combination with third-party products not approved by the Provider.")

    pdf.heading("7", "LIMITATION OF LIABILITY")
    pdf.body("7.1 To the maximum extent permitted by law, the Provider's aggregate liability under or in connection with this Agreement, whether in contract, tort (including negligence), statute, or otherwise, is limited to the total Subscription Fees paid by the Customer in the twelve (12) months immediately preceding the event giving rise to the claim.")
    pdf.body("7.2 Neither party is liable to the other for any indirect, consequential, special, or punitive damages, including loss of profit, loss of revenue, loss of data (except where caused by the Provider's breach of clause 3), loss of business opportunity, or loss of goodwill, arising under or in connection with this Agreement.")
    pdf.body("7.3 Nothing in this Agreement excludes or limits liability that cannot be excluded or limited by law, including liability under the Australian Consumer Law (Schedule 2 of the Competition and Consumer Act 2010 (Cth)).")

    pdf.heading("8", "TERM AND TERMINATION")
    pdf.body("8.1 This Agreement commences on 1 March 2025 and continues for an initial term of twelve (12) months (Initial Term). After the Initial Term, this Agreement will automatically renew for successive twelve-month periods (each a Renewal Term) unless either party gives at least sixty (60) days' written notice of non-renewal before the end of the then-current term.")
    pdf.body("8.2 Either party may terminate this Agreement immediately by written notice if the other party: (a) commits a material breach that is not remedied within thirty (30) days of receiving written notice of the breach; (b) becomes insolvent, enters voluntary administration, has a receiver appointed, or is wound up.")
    pdf.body("8.3 Upon termination or expiry: (a) the Customer's access to the Platform will cease; (b) the Provider will make Customer Data available for download for a period of sixty (60) days, after which the Provider may delete all Customer Data; (c) the Customer must pay all outstanding fees.")

    pdf.heading("9", "DATA MIGRATION AND EXIT ASSISTANCE")
    pdf.body("9.1 Upon termination or expiry, the Provider will provide reasonable assistance to the Customer to migrate Customer Data to an alternative platform, at the Provider's then-current professional services rates. The Provider will provide Customer Data in a commonly used, machine-readable format (CSV, JSON, or PDF).")

    pdf.heading("10", "GOVERNING LAW")
    pdf.body("10.1 This Agreement is governed by the laws of New South Wales, Australia. The parties submit to the non-exclusive jurisdiction of the courts of New South Wales.")

    path = os.path.join(OUTPUT_DIR, "05_SaaS_Agreement_LegalCloud_Henderson.pdf")
    pdf.output(path)
    print(f"Generated: {path}")


def doc6_loan_agreement():
    pdf = LegalPDF(
        "Secured Loan Agreement",
        [("National Commerce Bank Ltd (ACN 567 890 123)", "Lender"),
         ("GreenField Developments Pty Ltd (ACN 678 234 567)", "Borrower"),
         ("James Robert Patterson", "Guarantor")]
    )
    pdf.alias_nb_pages()
    pdf.add_title_page("5 February 2025", "NCB-LOAN-2025-0127")

    pdf.add_page()
    pdf.heading("1", "FACILITY")
    pdf.body("1.1 The Lender agrees to make available to the Borrower a secured term loan facility in the principal amount of $3,750,000.00 (Facility) on the terms and conditions of this Agreement.")
    pdf.body("1.2 The Facility is to be used solely for the purpose of financing the acquisition and development of the property located at 45-49 Pacific Highway, Hornsby NSW 2077, being Lot 3 in Deposited Plan 456789 (Property), for the construction of a mixed-use residential and commercial development comprising thirty-two (32) residential units and four (4) ground-floor commercial tenancies.")
    pdf.body("1.3 The Facility shall not be used for any purpose other than the Purpose without the prior written consent of the Lender.")

    pdf.heading("2", "DRAWDOWN")
    pdf.body("2.1 The Borrower may draw down the Facility in a single advance or in multiple advances (each a Drawdown), subject to the following conditions: (a) no Event of Default has occurred and is continuing; (b) the Borrower has provided the Lender with a drawdown notice at least five (5) Business Days prior to the proposed drawdown date; (c) the representations and warranties set out in clause 7 are true and correct as at the drawdown date; (d) for construction drawdowns, the Borrower has provided a quantity surveyor's certificate confirming completion of the relevant stage.")
    pdf.body("2.2 The first Drawdown must be for the purpose of the acquisition of the Property and must occur on or before 30 April 2025.")

    pdf.heading("3", "INTEREST")
    pdf.body("3.1 The Borrower must pay interest on the outstanding principal at the rate of 7.85% per annum (Interest Rate), calculated daily on the basis of a 365-day year and payable monthly in arrears on the first Business Day of each calendar month.")
    pdf.body("3.2 If any amount payable under this Agreement is not paid on its due date, the Borrower must pay default interest on the overdue amount at the rate of 4% per annum above the Interest Rate, calculated daily from the due date until the date of actual payment.")
    pdf.body("3.3 The Lender may, by giving the Borrower not less than thirty (30) days' written notice, vary the Interest Rate to reflect changes in the Lender's cost of funds, market conditions, or the risk profile of the Facility.")

    pdf.heading("4", "REPAYMENT")
    pdf.body("4.1 The Borrower must repay the Facility as follows: (a) Interest-only payments during the construction period (estimated to be eighteen (18) months from the first Drawdown); (b) Upon completion of construction and issuance of the occupation certificate, the Borrower must commence principal and interest repayments calculated to fully amortise the outstanding balance over a term of seven (7) years; (c) The Facility must be repaid in full on or before 28 February 2033 (Maturity Date).")
    pdf.body("4.2 The Borrower may prepay the whole or any part of the Facility at any time without penalty, provided that: (a) the Borrower gives the Lender at least fourteen (14) days' written notice; (b) the prepayment amount is not less than $50,000; (c) the Borrower pays any break costs incurred by the Lender as a result of the prepayment.")

    pdf.heading("5", "SECURITY")
    pdf.body("5.1 As security for the performance of the Borrower's obligations under this Agreement, the Borrower grants to the Lender: (a) a first registered mortgage over the Property; (b) a general security agreement (GSA) over all present and after-acquired property of the Borrower; (c) an assignment of all insurance policies relating to the Property; (d) an assignment of all development approvals, building contracts, and sale contracts relating to the Property.")
    pdf.body("5.2 The Guarantor personally and unconditionally guarantees the due and punctual performance of all of the Borrower's obligations under this Agreement, including the payment of all amounts payable. The Guarantor's liability under this guarantee is limited to $1,875,000.00 (being 50% of the Facility amount).")
    pdf.body("5.3 The Lender may enforce the guarantee without first having recourse to the Borrower or any security. The guarantee is a continuing guarantee and is not discharged by any change in the constitution of the Borrower or the Lender.")

    pdf.heading("6", "COVENANTS")
    pdf.body("6.1 The Borrower covenants that during the term of this Agreement it will: (a) maintain a loan-to-value ratio (LVR) not exceeding 70% at all times; (b) maintain an interest cover ratio of not less than 1.5:1; (c) provide the Lender with quarterly financial statements within forty-five (45) days of the end of each quarter; (d) provide audited annual financial statements within ninety (90) days of the end of each financial year; (e) maintain adequate insurance over the Property and all improvements; (f) not create or permit any Encumbrance over the Property or any of its assets ranking in priority to or equally with the Lender's security; (g) not dispose of any material asset without the Lender's prior written consent; (h) notify the Lender immediately upon becoming aware of any Event of Default.")

    pdf.heading("7", "REPRESENTATIONS AND WARRANTIES")
    pdf.body("7.1 The Borrower represents and warrants that: (a) it is duly incorporated and validly existing under the laws of Australia; (b) it has full power and authority to enter into this Agreement and to borrow the Facility; (c) the execution and performance of this Agreement does not contravene any law, its constitution, or any agreement to which it is a party; (d) all information provided to the Lender in connection with the Facility is true, complete, and accurate in all material respects; (e) no Event of Default or potential Event of Default has occurred; (f) the Property is free from contamination and complies with all applicable environmental laws.")

    pdf.heading("8", "EVENTS OF DEFAULT")
    pdf.body("8.1 An Event of Default occurs if: (a) the Borrower fails to pay any amount payable under this Agreement within five (5) Business Days of its due date; (b) the Borrower breaches any covenant, representation, warranty, or other obligation under this Agreement and (if capable of remedy) fails to remedy the breach within twenty (20) Business Days of receiving notice from the Lender; (c) the Borrower becomes insolvent, enters voluntary administration, has a receiver or liquidator appointed, or is wound up; (d) the Guarantor becomes bankrupt or enters into a personal insolvency agreement; (e) any security granted under this Agreement becomes unenforceable or ceases to have the priority contemplated by this Agreement; (f) a Material Adverse Change occurs; (g) construction of the development ceases for more than thirty (30) consecutive days without the Lender's written consent.")
    pdf.body("8.2 Upon the occurrence of an Event of Default, the Lender may by written notice to the Borrower: (a) cancel the Facility and require immediate repayment of all outstanding amounts; (b) declare all outstanding amounts immediately due and payable; (c) enforce any or all security; (d) exercise any other rights or remedies available at law or in equity. The Lender is not obliged to give prior notice before exercising its rights under this clause, except as expressly required.")

    pdf.heading("9", "INDEMNITY")
    pdf.body("9.1 The Borrower indemnifies the Lender and its officers, employees, and agents against all losses, costs, expenses, and liabilities (including legal costs on a full indemnity basis) incurred by the Lender arising out of or in connection with: (a) any Event of Default; (b) any breach by the Borrower of this Agreement; (c) the enforcement or attempted enforcement of the Lender's rights under this Agreement or any security; (d) any environmental contamination of the Property.")

    pdf.heading("10", "GOVERNING LAW AND JURISDICTION")
    pdf.body("10.1 This Agreement is governed by the laws of New South Wales, Australia.")
    pdf.body("10.2 The parties irrevocably submit to the non-exclusive jurisdiction of the courts of New South Wales and the Federal Court of Australia.")
    pdf.body("10.3 The Borrower waives any objection to proceedings being brought in those courts on the grounds of venue or inconvenient forum.")

    path = os.path.join(OUTPUT_DIR, "06_Secured_Loan_Agreement_GreenField.pdf")
    pdf.output(path)
    print(f"Generated: {path}")


def doc7_services_agreement():
    pdf = LegalPDF(
        "Professional Services Agreement",
        [("Pinnacle Consulting Group Pty Ltd (ACN 690 345 678)", "Consultant"),
         ("AusMine Resources Ltd (ACN 612 567 890)", "Client")]
    )
    pdf.alias_nb_pages()
    pdf.add_title_page("18 February 2025", "PCG-PSA-2025-0031")

    pdf.add_page()
    pdf.heading("1", "ENGAGEMENT AND SCOPE")
    pdf.body("1.1 The Client engages the Consultant to provide regulatory compliance advisory services in connection with the Client's proposed lithium mining operations at the Kimberley West Project, Western Australia (Project), as more particularly described in Schedule 1 (Services).")
    pdf.body("1.2 The Services include: (a) review and assessment of all applicable Commonwealth and State environmental and mining legislation; (b) preparation of environmental impact statements and regulatory submissions; (c) liaison with the Department of Mines, Industry Regulation and Safety (DMIRS) and the Department of Climate Change, Energy, the Environment and Water (DCCEEW); (d) Aboriginal heritage assessment and consultation in accordance with the Aboriginal Heritage Act 1972 (WA); (e) preparation of mine closure plans in accordance with DMIRS guidelines; (f) ongoing compliance monitoring and reporting.")
    pdf.body("1.3 The Consultant will provide the Services with due care, skill, and diligence, in accordance with generally accepted professional standards applicable to the consulting industry in Australia.")

    pdf.heading("2", "TERM")
    pdf.body("2.1 This Agreement commences on 1 March 2025 and continues for an initial term of twenty-four (24) months, unless terminated earlier in accordance with clause 9 (Initial Term).")
    pdf.body("2.2 The parties may extend the term by mutual written agreement for successive twelve-month periods.")

    pdf.heading("3", "FEES AND EXPENSES")
    pdf.body("3.1 The Client must pay the Consultant for the Services at the following rates (exclusive of GST): (a) Principal Consultant: $450.00 per hour; (b) Senior Associate: $320.00 per hour; (c) Associate: $240.00 per hour; (d) Analyst: $180.00 per hour. The estimated total fee for Phase 1 (Environmental Assessment) is $385,000.00 (exclusive of GST).")
    pdf.body("3.2 The Consultant will issue monthly tax invoices for Services performed during the preceding month. The Client must pay each invoice within twenty-one (21) days of the date of invoice.")
    pdf.body("3.3 The Client must reimburse the Consultant for all reasonable out-of-pocket expenses incurred in connection with the Services, including travel (economy class airfares, accommodation up to $350 per night), courier charges, government filing fees, and specialist subconsultant fees. Expenses exceeding $5,000 individually require the Client's prior written approval.")
    pdf.body("3.4 If a variation to the scope of Services is required, the Consultant will provide the Client with a written estimate of the additional fees and expenses. No variation will be performed until the Client has approved the estimate in writing.")

    pdf.heading("4", "PERSONNEL AND SUBCONTRACTING")
    pdf.body("4.1 The Consultant will assign the following key personnel to the Project: (a) Dr. Margaret Sullivan, Principal Consultant (Environmental Law); (b) Thomas Wright, Senior Associate (Mining Regulation). The Consultant must not replace key personnel without the Client's prior written consent, except in cases of illness, resignation, or other circumstances beyond the Consultant's reasonable control.")
    pdf.body("4.2 The Consultant may subcontract any part of the Services with the Client's prior written consent. The Consultant remains liable for the acts and omissions of its subcontractors as if they were its own.")

    pdf.heading("5", "CONFIDENTIALITY AND DATA PROTECTION")
    pdf.body("5.1 Each party must keep confidential all information received from the other party in connection with this Agreement that is not publicly available (Confidential Information), and must not disclose Confidential Information to any person except: (a) to its employees and contractors who need to know for the purposes of this Agreement; (b) as required by law or regulatory authority; or (c) with the other party's prior written consent.")
    pdf.body("5.2 The Consultant must comply with the Privacy Act 1988 (Cth) and all applicable privacy laws in relation to any personal information collected, used, or disclosed in connection with the Services.")

    pdf.heading("6", "INTELLECTUAL PROPERTY")
    pdf.body("6.1 All reports, analyses, documents, and other deliverables prepared by the Consultant specifically for the Client under this Agreement (Deliverables) shall be the property of the Client upon payment in full of the applicable fees.")
    pdf.body("6.2 The Consultant retains all Intellectual Property Rights in its pre-existing methodologies, tools, templates, know-how, and general expertise (Background IP). The Consultant grants the Client a non-exclusive, perpetual, royalty-free licence to use any Background IP incorporated in the Deliverables, solely for the Client's internal purposes in connection with the Project.")

    pdf.heading("7", "LIABILITY AND INDEMNITY")
    pdf.body("7.1 The Consultant's aggregate liability under or in connection with this Agreement, whether in contract, tort (including negligence), statute, or otherwise, is limited to $2,000,000.00 or two (2) times the total fees paid under this Agreement, whichever is greater.")
    pdf.body("7.2 The Consultant is not liable for any indirect, consequential, or special loss or damage, including loss of profit, loss of revenue, loss of opportunity, or loss of production.")
    pdf.body("7.3 The Consultant indemnifies the Client against all losses, damages, and costs arising from: (a) the Consultant's negligent performance of the Services; (b) any breach of the Consultant's obligations under this Agreement; (c) any claim by a third party arising from the Consultant's acts or omissions.")
    pdf.body("7.4 The Client indemnifies the Consultant against all losses, damages, and costs arising from: (a) the Client's failure to provide accurate and complete information; (b) the Client's use of the Deliverables for purposes other than those contemplated by this Agreement.")

    pdf.heading("8", "INSURANCE")
    pdf.body("8.1 The Consultant must maintain and keep current during the term and for a period of six (6) years after completion of the Services: (a) professional indemnity insurance with a limit of not less than $10,000,000 per claim and in the aggregate; (b) public liability insurance with a limit of not less than $20,000,000 per occurrence; (c) workers' compensation insurance as required by law.")

    pdf.heading("9", "TERMINATION")
    pdf.body("9.1 Either party may terminate this Agreement: (a) for convenience, by giving sixty (60) days' written notice to the other party; (b) immediately by written notice, if the other party commits a material breach that is not remedied within thirty (30) days of written notice; (c) immediately by written notice, if the other party becomes insolvent.")
    pdf.body("9.2 Upon termination: (a) the Client must pay the Consultant for all Services performed and expenses incurred up to the date of termination; (b) the Consultant must deliver to the Client all completed and partially completed Deliverables; (c) each party must return or destroy the other party's Confidential Information.")

    pdf.heading("10", "FORCE MAJEURE")
    pdf.body("10.1 Neither party is liable for any delay or failure to perform its obligations under this Agreement to the extent that the delay or failure is caused by a Force Majeure Event. The affected party must: (a) notify the other party as soon as practicable; (b) use reasonable efforts to mitigate the effect of the Force Majeure Event; and (c) resume performance as soon as practicable after the Force Majeure Event ceases. If the Force Majeure Event continues for more than ninety (90) days, either party may terminate this Agreement by written notice.")

    pdf.heading("11", "GOVERNING LAW")
    pdf.body("11.1 This Agreement is governed by the laws of Western Australia, Australia. The parties submit to the non-exclusive jurisdiction of the courts of Western Australia.")

    path = os.path.join(OUTPUT_DIR, "07_Professional_Services_Agreement_AusMine.pdf")
    pdf.output(path)
    print(f"Generated: {path}")


if __name__ == "__main__":
    print("Generating Australian legal test documents...\n")
    doc1_commercial_lease()
    doc2_employment_contract()
    doc3_share_purchase()
    doc4_nda()
    doc5_saas_agreement()
    doc6_loan_agreement()
    doc7_services_agreement()
    print(f"\nDone! {7} documents generated in {OUTPUT_DIR}")
