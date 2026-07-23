import { FunctionDeclaration, Type } from "@google/genai";

export const stateUnclaimedSearchTool: FunctionDeclaration = {
  name: "state_unclaimed_search",
  description: "Search State Unclaimed Property databases (NAUPA) for abandoned assets.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: "The full name of the individual or company to search for.",
      },
      state: {
        type: Type.STRING,
        description: "The 2-letter state abbreviation to search within (e.g., 'CA', 'NY').",
      },
      city: {
        type: Type.STRING,
        description: "Optional city name to narrow the search.",
      },
    },
    required: ["name", "state"],
  },
};

export const pbgcBenefitLookupTool: FunctionDeclaration = {
  name: "pbgc_benefit_lookup",
  description: "Search the Pension Benefit Guaranty Corporation (PBGC) database for abandoned pensions.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: "The full name of the pensioner.",
      },
      companyName: {
        type: Type.STRING,
        description: "The name of the company where the pension was earned.",
      },
      state: {
        type: Type.STRING,
        description: "Optional 2-letter state abbreviation.",
      },
    },
    required: ["name"],
  },
};

export const savingsBondQueryTool: FunctionDeclaration = {
  name: "savings_bond_query",
  description: "Query TreasuryHunt / U.S. Savings Bonds database for matured or unredeemed bonds.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      ssn_last4: {
        type: Type.STRING,
        description: "The last 4 digits of the owner's SSN, if known.",
      },
      name: {
        type: Type.STRING,
        description: "The full name of the bond owner.",
      },
      state: {
        type: Type.STRING,
        description: "Optional 2-letter state abbreviation.",
      },
    },
    required: ["name"],
  },
};

export const lifeInsuranceValookupTool: FunctionDeclaration = {
  name: "life_insurance_va_lookup",
  description: "Search Life Insurance Benefits & VA Policy Funds.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: "The full name of the insured or beneficiary.",
      },
      decedentName: {
        type: Type.STRING,
        description: "The full name of the deceased insured person.",
      },
      insuranceCompany: {
        type: Type.STRING,
        description: "The specific insurance company name, if known.",
      },
    },
    required: ["name"],
  },
};

export const securitiesDividendsSearchTool: FunctionDeclaration = {
  name: "securities_dividends_search",
  description: "Search for Securities, Dividends & Brokerage Residuals.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: "The full name of the shareholder or investor.",
      },
      brokerageOrTicker: {
        type: Type.STRING,
        description: "The brokerage name or stock ticker symbol.",
      },
    },
    required: ["name"],
  },
};

export const safeDepositBoxSearchTool: FunctionDeclaration = {
  name: "safe_deposit_box_search",
  description: "Search for Safe Deposit Box Contents (Tangible Property).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: "The full name of the box renter.",
      },
      state: {
        type: Type.STRING,
        description: "The 2-letter state abbreviation.",
      },
      bankName: {
        type: Type.STRING,
        description: "The name of the bank or institution holding the box.",
      },
    },
    required: ["name", "state"],
  },
};

export const taxHudRefundSearchTool: FunctionDeclaration = {
  name: "tax_hud_refund_search",
  description: "Search for Tax Refunds & FHA/HUD Mortgage Refunds.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: "The full name of the taxpayer or homeowner.",
      },
      caseNumber: {
        type: Type.STRING,
        description: "The FHA case number if known.",
      },
      propertyState: {
        type: Type.STRING,
        description: "The 2-letter state abbreviation where the property was located.",
      },
    },
    required: ["name"],
  },
};

export const classActionBankruptcySearchTool: FunctionDeclaration = {
  name: "class_action_bankruptcy_search",
  description: "Search for Class Action & Court / Bankruptcy Unclaimed funds.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: "The full name of the claimant or creditor.",
      },
      caseName: {
        type: Type.STRING,
        description: "The name of the class action lawsuit or bankruptcy case.",
      },
    },
    required: ["name"],
  },
};

export const mineralRoyaltiesSearchTool: FunctionDeclaration = {
  name: "mineral_royalties_search",
  description: "Search for Mineral Rights, Oil & Gas Royalties.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: "The full name of the royalty owner.",
      },
      state: {
        type: Type.STRING,
        description: "The 2-letter state abbreviation (e.g., TX, OK, ND).",
      },
      county: {
        type: Type.STRING,
        description: "The specific county where the rights are located.",
      },
    },
    required: ["name", "state"],
  },
};

export const vaVeteransFundsSearchTool: FunctionDeclaration = {
  name: "va_veterans_funds_search",
  description: "Search for VA Benefits & Veterans' Funds (Non-Insurance).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: "The full name of the veteran.",
      },
      branchOfService: {
        type: Type.STRING,
        description: "The military branch the veteran served in.",
      },
    },
    required: ["name"],
  },
};

export const utilityOverpaymentsSearchTool: FunctionDeclaration = {
  name: "utility_overpayments_search",
  description: "Search for Utility Deposits & Corporate Overpayments.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: "The full name of the account holder.",
      },
      utilityCompany: {
        type: Type.STRING,
        description: "The name of the utility or corporate entity.",
      },
      state: {
        type: Type.STRING,
        description: "The 2-letter state abbreviation.",
      },
    },
    required: ["name", "state"],
  },
};

export const probateHeirsSearchTool: FunctionDeclaration = {
  name: "probate_heirs_search",
  description: "Search for Probate Residuals, Missing Heirs & Estates.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      decedentName: {
        type: Type.STRING,
        description: "The full name of the deceased person.",
      },
      heirName: {
        type: Type.STRING,
        description: "The full name of the potential heir.",
      },
      state: {
        type: Type.STRING,
        description: "The 2-letter state abbreviation of the probate court.",
      },
    },
    required: ["decedentName"],
  },
};

export const allHermesTools = [
  stateUnclaimedSearchTool,
  pbgcBenefitLookupTool,
  savingsBondQueryTool,
  lifeInsuranceValookupTool,
  securitiesDividendsSearchTool,
  safeDepositBoxSearchTool,
  taxHudRefundSearchTool,
  classActionBankruptcySearchTool,
  mineralRoyaltiesSearchTool,
  vaVeteransFundsSearchTool,
  utilityOverpaymentsSearchTool,
  probateHeirsSearchTool,
];
