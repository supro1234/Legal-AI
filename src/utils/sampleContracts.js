/**
 * sampleContracts.js — Pre-loaded sample contracts for demo/testing
 * Also exports DEMO_FALLBACK_RESULT for graceful timeout recovery.
 */

export const SAMPLES = [
  {
    id: 'rental_bengaluru',
    label: '🏠 Rental Lease (Bengaluru)',
    docType: 'rent_lease',
    text: `RENTAL AGREEMENT

This Rental Agreement is executed at Bengaluru on 1st May 2025.

PARTIES:
Landlord: Ramesh Naidu, residing at 14/2 MG Road, Bengaluru - 560001
Tenant: Priya Sharma, residing at 45 Koramangala 5th Block, Bengaluru - 560095

PROPERTY: 2 BHK flat at 14/2 MG Road, Bengaluru - 560001, 3rd Floor

TERMS:
1. RENT: Monthly rent of INR 22,000/- payable on or before the 5th of each month.
2. SECURITY DEPOSIT: INR 1,10,000/- (5 months rent) to be paid at signing. Refundable only at the sole discretion of the Landlord after deductions for damages. No interest shall be paid on the deposit.
3. LOCK-IN PERIOD: Tenant shall not vacate before 11 months. In case of early exit, Tenant forfeits entire security deposit.
4. MAINTENANCE: Tenant shall pay all maintenance charges, society charges, and utility bills. Landlord not liable for any repairs.
5. TERMINATION: Landlord may terminate this agreement at any time without prior notice. Tenant must provide 60 days written notice.
6. RENT INCREASE: Rent may be increased at Landlord's sole discretion at any time during the tenancy with 7 days notice.
7. SUBLETTING: Tenant shall not sublet or share the premises under any circumstances.
8. DISPUTE RESOLUTION: All disputes shall be resolved through binding arbitration in Mumbai only, at the Tenant's expense.
9. PETS: No pets allowed under any circumstances. Violation results in immediate eviction and forfeiture of deposit.
10. VISITORS: No guest may stay overnight for more than 1 night per week.

Signed in the presence of witnesses.`,
  },
  {
    id: 'employment_nda',
    label: '📑 Employment + NDA',
    docType: 'employment',
    text: `EMPLOYMENT AGREEMENT & NON-DISCLOSURE AGREEMENT

Employer: TechCorp India Pvt Ltd (CIN: U72200KA2019PTC123456)
Employee: Arjun Mehta

DATE OF JOINING: 1st June 2025
DESIGNATION: Software Engineer
CTC: INR 8,00,000 per annum

1. PROBATION: 6 months. During probation, employment may be terminated at any time without notice or reason by either party.
2. NON-COMPETE: Employee shall not work for any competitor or start a competing business for 2 years after leaving, globally.
3. NON-SOLICITATION: Employee shall not solicit any clients or employees of the Company for 3 years.
4. INTELLECTUAL PROPERTY: All work created by Employee, including personal projects created on personal time and equipment during employment, shall be the exclusive property of TechCorp.
5. WORKING HOURS: Employee agrees to work as many hours as necessary to complete duties. No overtime compensation.
6. CONFIDENTIALITY: Employee shall not disclose any company information forever (no time limit).
7. TERMINATION BY EMPLOYER: Company may terminate immediately without notice during first year. After first year, 15 days notice.
8. TERMINATION BY EMPLOYEE: Employee must provide 90 days notice. Failure results in salary forfeiture.
9. PF & ESI: Employer will deduct PF but does not guarantee ESI enrollment.
10. DATA PROCESSING: Employee consents to processing of personal data including location tracking during work hours.
11. MOONLIGHTING: Employee shall not engage in any outside work, consulting, or freelance activity.
12. JURISDICTION: All disputes under courts of New York, USA only.`,
  },
  {
    id: 'privacy_policy',
    label: '🔒 Privacy Policy (App)',
    docType: 'privacy',
    text: `PRIVACY POLICY — QuickLoan App

Last Updated: March 2025

1. DATA COLLECTED: We collect name, phone, Aadhaar number, PAN, bank statements, salary slips, contacts list, SMS messages, photos, location (always-on), device ID, browsing history, and any other information on your device.

2. DATA SHARING: We share your data with our 500+ lending partners, marketing affiliates, credit bureaus, government agencies on request, and any third party we deem appropriate. We do not require your consent for each share.

3. LOCATION: We collect your precise location 24/7 even when you are not using the app. This data is shared with advertisers.

4. CONTACTS & SMS: We access your full contacts list and all SMS messages to assess creditworthiness. This data is retained indefinitely.

5. AADHAAR: By using the app you consent to sharing your Aadhaar details with our partners. We are not UIDAI-regulated.

6. DATA RETENTION: We retain your data for 10 years or indefinitely, whichever is longer.

7. DATA DELETION: You may request deletion but we retain data required by law or for legitimate business purposes (no definition provided).

8. CHILDREN: The app is not intended for users under 18 but we do not verify age.

9. SECURITY: We use reasonable security measures (no specifics given). We are not liable for any data breach.

10. CHANGES: We may update this policy at any time. Continued use constitutes acceptance.

11. DPDP ACT: We comply with applicable Indian law to the extent required (no specifics).

12. CONTACT: privacy@quickloan.app (responses not guaranteed).`,
  },
]

/* ── DEMO FALLBACK RESULT ──────────────────────────────────────────────── */
// Used when API call times out or fails during demo — prevents blank screen
export const DEMO_FALLBACK_RESULT = {
  riskScore: 74,
  riskLevel: 'High',
  summary:
    'This agreement contains several heavily one-sided clauses that strongly favour the stronger party. The tenant/employee has limited rights and faces significant financial exposure. We strongly recommend negotiating the key clauses before signing.',
  jurisdiction: 'India',
  applicableLaws: [
    'Indian Contract Act 1872',
    'Transfer of Property Act 1882',
    'Consumer Protection Act 2019',
    'DPDP Act 2023',
  ],
  redFlags: [
    {
      id: 'deposit_forfeit',
      severity: 9,
      clause: 'Security Deposit — "at sole discretion of Landlord"',
      issue: 'The landlord can withhold the entire deposit without justification. This is against the Model Tenancy Act 2021 which requires itemised deductions.',
      indianLawContext: 'Model Tenancy Act 2021, Section 11 — deposit must be refunded within one month of vacation minus documented deductions.',
      negotiationTip: 'Change to: "Deposit will be refunded within 30 days of vacating after deduction of documented damages with receipts."',
    },
    {
      id: 'termination_imbalance',
      severity: 8,
      clause: 'Termination — "Landlord may terminate at any time without notice"',
      issue: 'One-sided termination with no notice protects only the landlord. The tenant must give 60 days notice but the landlord has none.',
      indianLawContext: 'Transfer of Property Act 1882, Section 106 — mutual 15-day notice for month-to-month tenancies.',
      negotiationTip: 'Add: "Landlord shall provide 30 days written notice before termination unless tenant is in material breach."',
    },
    {
      id: 'rent_increase',
      severity: 7,
      clause: 'Rent Increase — "at Landlord\'s sole discretion at any time"',
      issue: 'Unrestricted rent increases with only 7 days notice makes budgeting impossible and is exploitative.',
      indianLawContext: 'State Rent Control Acts typically limit rent increase to 10% per year.',
      negotiationTip: 'Change to: "Rent shall not increase by more than 5% annually and only at the time of renewal with 30 days notice."',
    },
  ],
  pros: [
    'Rent amount and payment date are clearly defined.',
    'Agreement has a fixed term providing some security.',
  ],
  cons: [
    'Entire security deposit can be forfeited arbitrarily.',
    'Landlord can terminate without any notice period.',
    'Rent can be increased at any time with only 7 days notice.',
    'Dispute resolution in a different city is inconvenient and expensive.',
  ],
  overallVerdict: 'RISKY',
  confidenceNote: 'This is a demo result. Real analysis will be based on your actual document.',
  disclaimer:
    'This analysis is generated by AI and is not legal advice. Consult a qualified lawyer before signing.',
  // Standard fields for compatibility with existing result renderer
  negotiationTips: [
    'Negotiate a clear deposit refund clause with a 30-day timeline and itemised deductions.',
    'Add a mutual termination notice clause (minimum 30 days for both parties).',
    'Cap annual rent increases at 5% and make them effective only at renewal.',
  ],
}
