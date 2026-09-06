import type { City, UtilityType } from '../types'

export interface ProviderConfig {
  name: string
  slaDays: number
  docs: Array<{ name: string; hint: string }>
}

export const PROVIDERS: Record<City, Partial<Record<UtilityType, ProviderConfig>>> = {
  Mumbai: {
    electricity: { name: 'Adani Electricity / BEST', slaDays: 7, docs: [
      { name: 'Aadhaar Card copy', hint: 'Clear copy of both sides. Name must match rental agreement.' },
      { name: 'Rent Agreement (registered)', hint: 'Must be registered at Sub-Registrar office.' },
      { name: 'Previous electricity bill', hint: 'Last 3-month bill from current owner showing property address.' },
      { name: 'Passport-size photograph', hint: 'Recent colour photo, white background. JPG or PNG.' },
    ]},
    gas: { name: 'Mahanagar Gas (MGL)', slaDays: 12, docs: [
      { name: 'Aadhaar Card copy', hint: 'Both sides, legible.' },
      { name: 'Rent Agreement (registered)', hint: 'Registered copy required.' },
      { name: 'Passport-size photograph', hint: 'Recent colour photo.' },
      { name: 'Gas connection application form', hint: 'Download from MGL website, fill and sign.' },
      { name: 'Security deposit cheque', hint: 'In favour of Mahanagar Gas Ltd.' },
    ]},
    water: { name: 'MCGM (BMC)', slaDays: 10, docs: [
      { name: 'Aadhaar Card copy', hint: 'Both sides.' },
      { name: 'Rent Agreement (registered)', hint: 'Registered copy.' },
      { name: 'NOC from property owner', hint: 'Signed and notarised no-objection letter.' },
      { name: 'Property tax receipt', hint: 'Latest receipt from MCGM.' },
    ]},
    internet: { name: 'Jio Fiber / Airtel Xstream', slaDays: 5, docs: [
      { name: 'Aadhaar Card copy', hint: 'Clear copy for KYC.' },
      { name: 'Address proof (Rent Agreement)', hint: 'Any govt-accepted address proof.' },
    ]},
  },
  Delhi: {
    electricity: { name: 'BSES Rajdhani / Tata Power Delhi', slaDays: 7, docs: [
      { name: 'Aadhaar Card copy', hint: 'Both sides. Name must match agreement.' },
      { name: 'Rent Agreement (notarised)', hint: 'Notarised copy required for Delhi connections.' },
      { name: 'Previous electricity bill', hint: 'Owner\'s bill for this property.' },
      { name: 'Passport-size photograph', hint: 'Recent, white background.' },
      { name: 'Security deposit (refundable)', hint: 'Demand draft or cheque in favour of BSES.' },
    ]},
    gas: { name: 'Indraprastha Gas (IGL)', slaDays: 10, docs: [
      { name: 'Aadhaar Card copy', hint: 'Both sides.' },
      { name: 'Rent Agreement (notarised)', hint: 'Notarised copy.' },
      { name: 'Passport-size photograph', hint: 'Recent colour photo.' },
      { name: 'IGL connection application form', hint: 'Available at IGL offices or website.' },
    ]},
    water: { name: 'Delhi Jal Board (DJB)', slaDays: 14, docs: [
      { name: 'Aadhaar Card copy', hint: 'Both sides.' },
      { name: 'Rent Agreement', hint: 'Copy of rental agreement.' },
      { name: 'NOC from landlord', hint: 'Written no-objection from property owner.' },
      { name: 'Property ID / Ownership proof', hint: 'Registry or ownership document.' },
    ]},
    internet: { name: 'Jio Fiber / Airtel / ACT Fibernet', slaDays: 4, docs: [
      { name: 'Aadhaar Card copy', hint: 'KYC document.' },
      { name: 'Address proof (Rent Agreement)', hint: 'Any address proof.' },
    ]},
  },
  Bangalore: {
    electricity: { name: 'BESCOM', slaDays: 7, docs: [
      { name: 'Aadhaar Card copy', hint: 'Both sides, legible.' },
      { name: 'Rent Agreement (registered)', hint: 'Must have Sub-Registrar stamp.' },
      { name: 'Previous electricity bill', hint: 'Owner\'s BESCOM bill for this address.' },
      { name: 'Passport-size photograph', hint: 'Colour photo, white background.' },
      { name: 'BESCOM application form', hint: 'Download from bescom.org, fill and sign.' },
    ]},
    gas: { name: 'GAIL Gas / Indane / HP Gas', slaDays: 10, docs: [
      { name: 'Aadhaar Card copy', hint: 'Both sides.' },
      { name: 'Rent Agreement', hint: 'Registered copy preferred.' },
      { name: 'Passport-size photograph', hint: 'Recent photo.' },
      { name: 'Gas agency application form', hint: 'Available at local gas agency.' },
    ]},
    water: { name: 'BWSSB', slaDays: 10, docs: [
      { name: 'Aadhaar Card copy', hint: 'Both sides.' },
      { name: 'Rent Agreement (registered)', hint: 'Registered copy.' },
      { name: 'NOC from landlord / owner', hint: 'Signed NOC on letterhead.' },
      { name: 'Khata / property tax receipt', hint: 'Latest Khata document.' },
    ]},
    internet: { name: 'ACT Fibernet / Jio Fiber / Airtel', slaDays: 4, docs: [
      { name: 'Aadhaar Card copy', hint: 'KYC.' },
      { name: 'Address proof (Rent Agreement)', hint: 'Any address proof.' },
    ]},
  },
  Hyderabad: {
    electricity: { name: 'TSSPDCL', slaDays: 7, docs: [
      { name: 'Aadhaar Card copy', hint: 'Both sides.' },
      { name: 'Rent Agreement (registered)', hint: 'Registered copy.' },
      { name: 'Previous electricity bill', hint: 'Owner\'s last bill.' },
      { name: 'Passport-size photograph', hint: 'Recent colour photo.' },
    ]},
    gas: { name: 'HPCL / Bharat Gas / Indane', slaDays: 10, docs: [
      { name: 'Aadhaar Card copy', hint: 'Both sides.' },
      { name: 'Rent Agreement', hint: 'Copy of agreement.' },
      { name: 'Passport-size photograph', hint: 'Recent photo.' },
      { name: 'Gas agency application form', hint: 'From local agency.' },
    ]},
    water: { name: 'HMWSSB', slaDays: 10, docs: [
      { name: 'Aadhaar Card copy', hint: 'Both sides.' },
      { name: 'Rent Agreement', hint: 'Copy.' },
      { name: 'NOC from property owner', hint: 'Written NOC.' },
      { name: 'Patta / property tax receipt', hint: 'Latest receipt.' },
    ]},
    internet: { name: 'Jio Fiber / Airtel / ACT Fibernet', slaDays: 4, docs: [
      { name: 'Aadhaar Card copy', hint: 'KYC.' },
      { name: 'Address proof', hint: 'Rent agreement or any address proof.' },
    ]},
  },
  Chennai: {
    electricity: { name: 'TANGEDCO', slaDays: 7, docs: [
      { name: 'Aadhaar Card copy', hint: 'Both sides.' },
      { name: 'Rent Agreement (registered)', hint: 'Registered copy.' },
      { name: 'Previous EB bill of property', hint: 'Owner\'s electricity board bill.' },
      { name: 'Passport-size photograph', hint: 'Recent colour photo.' },
      { name: 'TANGEDCO application form', hint: 'Download from tangedco.gov.in.' },
    ]},
    gas: { name: 'GAIL Gas / Bharat Gas / HP Gas', slaDays: 12, docs: [
      { name: 'Aadhaar Card copy', hint: 'Both sides.' },
      { name: 'Rent Agreement', hint: 'Copy.' },
      { name: 'Passport-size photograph', hint: 'Recent photo.' },
      { name: 'Gas agency application form', hint: 'From local agency.' },
    ]},
    water: { name: 'CMWSSB (Metrowater)', slaDays: 10, docs: [
      { name: 'Aadhaar Card copy', hint: 'Both sides.' },
      { name: 'Rent Agreement', hint: 'Copy.' },
      { name: 'NOC from property owner', hint: 'Written NOC.' },
      { name: 'Patta / property document', hint: 'Property ownership document.' },
    ]},
    internet: { name: 'ACT Fibernet / Jio Fiber / BSNL', slaDays: 5, docs: [
      { name: 'Aadhaar Card copy', hint: 'KYC.' },
      { name: 'Address proof', hint: 'Rent agreement or any address proof.' },
    ]},
  },
  Pune: {
    electricity: { name: 'MSEDCL', slaDays: 7, docs: [
      { name: 'Aadhaar Card copy', hint: 'Both sides.' },
      { name: 'Rent Agreement (registered)', hint: 'Registered copy.' },
      { name: 'Previous electricity bill', hint: 'Owner\'s last bill.' },
      { name: 'Passport-size photograph', hint: 'Recent colour photo.' },
      { name: 'MSEDCL application form', hint: 'From MSEDCL office or website.' },
    ]},
    gas: { name: 'Maharashtra Natural Gas / HP Gas / Indane', slaDays: 10, docs: [
      { name: 'Aadhaar Card copy', hint: 'Both sides.' },
      { name: 'Rent Agreement', hint: 'Copy.' },
      { name: 'Passport-size photograph', hint: 'Recent photo.' },
      { name: 'Gas agency application form', hint: 'From local agency.' },
    ]},
    water: { name: 'PMC Water Supply', slaDays: 10, docs: [
      { name: 'Aadhaar Card copy', hint: 'Both sides.' },
      { name: 'Rent Agreement (registered)', hint: 'Registered copy.' },
      { name: 'NOC from landlord', hint: 'Written NOC.' },
      { name: 'Property tax receipt', hint: 'Latest PMC receipt.' },
    ]},
    internet: { name: 'Jio Fiber / Airtel Xstream / ACT Fibernet', slaDays: 4, docs: [
      { name: 'Aadhaar Card copy', hint: 'KYC.' },
      { name: 'Address proof', hint: 'Rent agreement or any address proof.' },
    ]},
  },
}
