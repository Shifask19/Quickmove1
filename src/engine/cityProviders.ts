import type { City, UtilityType } from '../types'

export interface ProviderInfo {
  name: string
  slaDays: number // days before move-in to complete
  requiredDocs: string[]
}

export const CITY_PROVIDERS: Record<City, Partial<Record<UtilityType, ProviderInfo>>> = {
  Mumbai: {
    electricity: {
      name: 'Adani Electricity / BEST',
      slaDays: 7,
      requiredDocs: [
        'Aadhaar Card copy',
        'Rent Agreement (registered)',
        'Previous electricity bill of property',
        'Passport-size photograph',
      ],
    },
    water: {
      name: 'MCGM (BMC)',
      slaDays: 10,
      requiredDocs: [
        'Aadhaar Card copy',
        'Rent Agreement (registered)',
        'NOC from property owner',
        'Property tax receipt',
      ],
    },
    gas: {
      name: 'Mahanagar Gas (MGL)',
      slaDays: 12,
      requiredDocs: [
        'Aadhaar Card copy',
        'Rent Agreement (registered)',
        'Passport-size photograph',
        'Gas connection application form',
        'Safety deposit cheque',
      ],
    },
    internet: {
      name: 'Jio Fiber / Airtel Xstream',
      slaDays: 5,
      requiredDocs: [
        'Aadhaar Card copy',
        'Address proof (Rent Agreement)',
      ],
    },
    waste: {
      name: 'MCGM Solid Waste Management',
      slaDays: 3,
      requiredDocs: ['Rent Agreement', 'Society NOC'],
    },
  },

  Delhi: {
    electricity: {
      name: 'BSES Rajdhani / BSES Yamuna / Tata Power Delhi',
      slaDays: 7,
      requiredDocs: [
        'Aadhaar Card copy',
        'Rent Agreement (notarised)',
        'Previous electricity bill of property',
        'Passport-size photograph',
        'Security deposit (refundable)',
      ],
    },
    water: {
      name: 'Delhi Jal Board (DJB)',
      slaDays: 14,
      requiredDocs: [
        'Aadhaar Card copy',
        'Rent Agreement',
        'NOC from landlord',
        'Property ID / Ownership proof',
      ],
    },
    gas: {
      name: 'Indraprastha Gas (IGL)',
      slaDays: 10,
      requiredDocs: [
        'Aadhaar Card copy',
        'Rent Agreement (notarised)',
        'Passport-size photograph',
        'IGL connection application form',
        'Security deposit cheque',
      ],
    },
    internet: {
      name: 'Jio Fiber / Airtel Xstream / ACT Fibernet',
      slaDays: 4,
      requiredDocs: [
        'Aadhaar Card copy',
        'Address proof (Rent Agreement)',
      ],
    },
    waste: {
      name: 'MCD / NDMC Sanitation',
      slaDays: 3,
      requiredDocs: ['Rent Agreement', 'RWA NOC'],
    },
  },

  Bangalore: {
    electricity: {
      name: 'BESCOM',
      slaDays: 7,
      requiredDocs: [
        'Aadhaar Card copy',
        'Rent Agreement (registered)',
        'Previous electricity bill of property',
        'Passport-size photograph',
        'BESCOM application form',
      ],
    },
    water: {
      name: 'BWSSB',
      slaDays: 10,
      requiredDocs: [
        'Aadhaar Card copy',
        'Rent Agreement (registered)',
        'NOC from landlord / owner',
        'Khata / property tax receipt',
      ],
    },
    gas: {
      name: 'GAIL Gas / Indane / HP Gas',
      slaDays: 10,
      requiredDocs: [
        'Aadhaar Card copy',
        'Rent Agreement',
        'Passport-size photograph',
        'Gas agency application form',
        'Security deposit',
      ],
    },
    internet: {
      name: 'ACT Fibernet / Jio Fiber / Airtel',
      slaDays: 4,
      requiredDocs: [
        'Aadhaar Card copy',
        'Address proof (Rent Agreement)',
      ],
    },
    waste: {
      name: 'BBMP Solid Waste',
      slaDays: 3,
      requiredDocs: ['Rent Agreement', 'Apartment association NOC'],
    },
  },

  Hyderabad: {
    electricity: {
      name: 'TSSPDCL / TSNPDCL',
      slaDays: 7,
      requiredDocs: [
        'Aadhaar Card copy',
        'Rent Agreement (registered)',
        'Previous electricity bill of property',
        'Passport-size photograph',
      ],
    },
    water: {
      name: 'HMWSSB',
      slaDays: 10,
      requiredDocs: [
        'Aadhaar Card copy',
        'Rent Agreement',
        'NOC from property owner',
        'Patta / property tax receipt',
      ],
    },
    gas: {
      name: 'HPCL / Bharat Gas / Indane',
      slaDays: 10,
      requiredDocs: [
        'Aadhaar Card copy',
        'Rent Agreement',
        'Passport-size photograph',
        'Gas agency application form',
        'Security deposit',
      ],
    },
    internet: {
      name: 'Jio Fiber / Airtel / ACT Fibernet',
      slaDays: 4,
      requiredDocs: [
        'Aadhaar Card copy',
        'Address proof (Rent Agreement)',
      ],
    },
    waste: {
      name: 'GHMC Solid Waste',
      slaDays: 3,
      requiredDocs: ['Rent Agreement', 'Society NOC'],
    },
  },

  Chennai: {
    electricity: {
      name: 'TANGEDCO',
      slaDays: 7,
      requiredDocs: [
        'Aadhaar Card copy',
        'Rent Agreement (registered)',
        'Previous EB bill of property',
        'Passport-size photograph',
        'TANGEDCO application form',
      ],
    },
    water: {
      name: 'CMWSSB (Metrowater)',
      slaDays: 10,
      requiredDocs: [
        'Aadhaar Card copy',
        'Rent Agreement',
        'NOC from property owner',
        'Patta / property document',
      ],
    },
    gas: {
      name: 'GAIL Gas / Bharat Gas / HP Gas',
      slaDays: 12,
      requiredDocs: [
        'Aadhaar Card copy',
        'Rent Agreement',
        'Passport-size photograph',
        'Gas agency application form',
        'Security deposit',
      ],
    },
    internet: {
      name: 'ACT Fibernet / Jio Fiber / BSNL Bharat Fiber',
      slaDays: 5,
      requiredDocs: [
        'Aadhaar Card copy',
        'Address proof (Rent Agreement)',
      ],
    },
    waste: {
      name: 'GCC Solid Waste Management',
      slaDays: 3,
      requiredDocs: ['Rent Agreement', 'Apartment association NOC'],
    },
  },

  Pune: {
    electricity: {
      name: 'MSEDCL',
      slaDays: 7,
      requiredDocs: [
        'Aadhaar Card copy',
        'Rent Agreement (registered)',
        'Previous electricity bill of property',
        'Passport-size photograph',
        'MSEDCL application form',
      ],
    },
    water: {
      name: 'PMC Water Supply',
      slaDays: 10,
      requiredDocs: [
        'Aadhaar Card copy',
        'Rent Agreement (registered)',
        'NOC from landlord',
        'Property tax receipt',
      ],
    },
    gas: {
      name: 'Maharashtra Natural Gas (MGL) / HP Gas / Indane',
      slaDays: 10,
      requiredDocs: [
        'Aadhaar Card copy',
        'Rent Agreement',
        'Passport-size photograph',
        'Gas agency application form',
        'Security deposit',
      ],
    },
    internet: {
      name: 'Jio Fiber / Airtel Xstream / ACT Fibernet',
      slaDays: 4,
      requiredDocs: [
        'Aadhaar Card copy',
        'Address proof (Rent Agreement)',
      ],
    },
    waste: {
      name: 'PMC Solid Waste Management',
      slaDays: 3,
      requiredDocs: ['Rent Agreement', 'Society NOC'],
    },
  },
}
