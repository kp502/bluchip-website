const grp = (p, label, same) => [
  ...(same ? [{ id: p + 'Same', label: same, type: 'check' }] : []),
  { id: p + 'Name', label: 'Contact name', type: 'text' },
  { id: p + 'Company', label: 'Company name', type: 'text' },
  { id: p + 'Address', label: 'Address', type: 'textarea' },
  { id: p + 'Phone', label: 'Telephone', type: 'tel' },
  { id: p + 'Email', label: 'Email', type: 'email' },
].map(f => (f.id === p + 'Same' || !same) ? f : { ...f, hideIf: { id: p + 'Same', checked: true } });

const sections = [
  { title: 'Quote reference', fields: [
    { id: 'quoteRef', label: 'Our Ref (quote reference)', type: 'text', required: true, help: 'Shown at the top of your quote letter, e.g. BLUCHIPQ/2026/00117.' },
    { id: 'quoteFee', label: 'Quoted fee (excl. VAT)', type: 'text' },
  ]},
  { title: '1. Site address', fields: [
    { id: 'siteName', label: 'Building name / number', type: 'text', required: true },
    { id: 'siteStreet', label: 'Street address', type: 'text', required: true },
    { id: 'siteTown', label: 'Town / city', type: 'text', required: true },
    { id: 'sitePostcode', label: 'Postcode', type: 'text', required: true },
  ]},
  { title: '2. Description of proposed works', fields: [
    { id: 'workDescription', label: 'Clear description of the proposed works', type: 'textarea', required: true },
    { id: 'storeysExisting', label: 'Number of storeys (existing)', type: 'number', required: true },
    { id: 'storeysProposed', label: 'Number of storeys (proposed)', type: 'number', required: true },
  ]},
  { title: '3. Client details (person intending to carry out the work)', fields: [
    { id: 'clientName', label: 'Contact name', type: 'text', required: true },
    { id: 'clientCompany', label: 'Company name', type: 'text' },
    { id: 'clientAddress', label: 'Address', type: 'textarea', required: true },
    { id: 'clientPhone', label: 'Telephone', type: 'tel', required: true },
    { id: 'clientEmail', label: 'Email', type: 'email' },
  ]},
  { title: '4. Agent details', fields: grp('agent') },
  { title: '5. Principal Designer (if different from agent)', fields: grp('pd', '', 'Same as agent') },
  { title: '6. Principal Contractor (if different from agent)', fields: grp('pc', '', 'Same as agent') },
  { title: '7. Invoice recipient (if different from client)', fields: [
    ...grp('inv', '', 'Same as client'),
    { id: 'poNumber', label: 'Purchase Order No.', type: 'text' },
  ]},
  { title: '8. Higher risk building confirmation (Regulation 11B)', fields: [
    { id: 'hrbStoreys', label: 'Number of storeys / floors in the building', type: 'number', required: true },
    { id: 'hrbHeight', label: 'Height of top floor above external ground level (metres)', type: 'number', required: true },
    { id: 'hrbIsHigherRisk', label: 'Is the building a higher risk building?', type: 'yesno', required: true },
    { id: 'hrbNote', type: 'note', tone: 'warn',
      text: 'Higher risk buildings (at least 18m or 7 storeys, containing two or more homes, or a care home or hospital) fall under the Building Safety Regulator and cannot be dealt with under this appointment. Please contact us before proceeding.',
      showIf: { any: [{ id: 'hrbIsHigherRisk', is: 'Yes' }, { id: 'hrbHeight', gte: 18 }, { id: 'hrbStoreys', gte: 7 }] } },
  ]},
  { title: '9. Additional information', fields: [
    { id: 'addrAccurate', label: 'a) Are the address and description accurate?', type: 'yesno', required: true },
    { id: 'addrAmended', label: 'Please give the amended address / description', type: 'textarea', required: true, showIf: { id: 'addrAccurate', is: 'No' } },
    { id: 'signatory', label: 'b) Name of person who can sign the initial notice on behalf of the client', type: 'text', required: true },
    { id: 'signatoryConfirm', label: 'b) Confirm that person can sign the initial notice on behalf of the client', type: 'yesno', required: true },
    { id: 'dutyHolders', label: 'c) Notification of duty holders (Regulation 16D) attached / provided?', type: 'yesno', required: true },
    { id: 'startDate', label: 'd) Start on site date', type: 'date', required: true },
    { id: 'startNote', type: 'note', tone: 'info', text: 'The Initial Notice must be with the Local Authority at least 5 working days before work starts, and our terms ask for 7 days’ written notice of commencement. Please allow enough lead time.' },
    { id: 'twoDaysNotice', label: 'e) Will you provide a minimum of 2 days notice before starting work?', type: 'yesno', required: true },
    { id: 'fifteenPct', label: 'f) What would 15% of the proposed work entail?', type: 'textarea', required: true, help: 'e.g. “Completion of strip-out and first-fix partitions on ground and first floors”. This is recorded in the initial notice.' },
    { id: 'fifteenPctDate', label: 'g) Date you predict you may reach the 15% stage', type: 'date', required: true },
    { id: 'notify5Days', label: 'h) Will you notify us not more than 5 days after 15% of the work has been completed?', type: 'yesno', required: true },
    { id: 'completionDate', label: 'i) Estimated completion date', type: 'date', required: true },
  ]},
  { title: '10. Gas and electrical installation', fields: [
    { id: 'gasElec', label: 'I understand that gas work and notifiable electrical work must be done by installers registered with an appropriate competent person scheme, and that the client should receive a self-certified compliance certificate from the installer within 30 days of completion.', type: 'check', required: true },
  ]},
  { title: '11. Building over sewers', fields: [
    { id: 'sewers', label: 'Is the building constructed over or within 3m of a public sewer?', type: 'yesno', required: true },
  ]},
  { title: 'Acceptance of quotation', fields: [
    { id: 'acceptTerms', label: 'We agree to the quotation fee and terms & conditions, and instruct Blu Chip Compliance to submit the initial notice on behalf of the client.', type: 'check', required: true },
    { id: 'acceptName', label: 'Name', type: 'text', required: true },
    { id: 'acceptDate', label: 'Date', type: 'date', required: true, today: true },
  ]},
];

module.exports = {
  id: 'appointment',
  sections,
  uploads: { label: 'Supporting documents (optional)', help: 'Site and block plans (1:1250 or larger showing public services within 6m of the boundaries), drawings, duty holder notification. Up to 5 files, 10 MB each.' },
  requireOneOf: [{ ids: ['clientEmail', 'agentEmail'], message: 'An email address for the client or agent is required' }],
  submitLabel: 'SUBMIT APPOINTMENT',
  // ---- server-only (functions are dropped when this is embedded in the web page) ----
  refOf: b => b.quoteRef,
  site: b => [b.siteName, b.siteStreet, b.siteTown, b.sitePostcode].filter(Boolean).join(', '),
  replyTo: b => b.clientEmail || b.agentEmail,
  subject: (b, ref, site) => `Appointment form – ${ref} – ${site}`,
  fileStem: (b, ref) => `Appointment_${ref}`,
  summary: (b, site) => [
    ['Ref', b.quoteRef], ['Site', site],
    ['Client', `${b.clientName || ''}${b.clientCompany ? ' (' + b.clientCompany + ')' : ''}`],
    ['Phone', b.clientPhone], ['Start on site', b.startDate], ['Accepted by', `${b.acceptName} on ${b.acceptDate}`],
  ],
  alert: b => b.hrbIsHigherRisk === 'Yes' ? 'Client has indicated this is a HIGHER RISK BUILDING.' : '',
  confirmTo: b => b.clientEmail || b.agentEmail,
  confirmName: b => b.clientName || b.agentName,
  confirmSubject: (b, ref) => `We have received your appointment form – ${ref}`,
  confirmText: (site, ref) => `we have received your appointment details for <b>${site}</b> (ref ${ref}). We will prepare the Initial Notice and be in touch shortly.`,
  envTo: 'MAIL_TO_APPOINTMENTS',
};
