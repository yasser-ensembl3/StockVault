// Alpha Vantage API response types

export interface AVOverview {
  Symbol: string
  AssetType: string
  Name: string
  Description: string
  CIK: string
  Exchange: string
  Currency: string
  Country: string
  Sector: string
  Industry: string
  Address: string
  OfficialSite: string
  FiscalYearEnd: string
  LatestQuarter: string
  MarketCapitalization: string
  EBITDA: string
  PERatio: string
  PEGRatio: string
  BookValue: string
  DividendPerShare: string
  DividendYield: string
  EPS: string
  RevenuePerShareTTM: string
  ProfitMargin: string
  OperatingMarginTTM: string
  ReturnOnAssetsTTM: string
  ReturnOnEquityTTM: string
  RevenueTTM: string
  GrossProfitTTM: string
  DilutedEPSTTM: string
  QuarterlyEarningsGrowthYOY: string
  QuarterlyRevenueGrowthYOY: string
  AnalystTargetPrice: string
  AnalystRatingStrongBuy: string
  AnalystRatingBuy: string
  AnalystRatingHold: string
  AnalystRatingSell: string
  AnalystRatingStrongSell: string
  TrailingPE: string
  ForwardPE: string
  PriceToSalesRatioTTM: string
  PriceToBookRatio: string
  EVToRevenue: string
  EVToEBITDA: string
  Beta: string
  "52WeekHigh": string
  "52WeekLow": string
  "50DayMovingAverage": string
  "200DayMovingAverage": string
  SharesOutstanding: string
  SharesFloat: string
  PercentInsiders: string
  PercentInstitutions: string
  DividendDate: string
  ExDividendDate: string
}

export interface AVAnnualReport {
  fiscalDateEnding: string
  reportedCurrency: string
  [key: string]: string
}

export interface AVIncomeStatement {
  symbol: string
  annualReports: AVAnnualReport[]
  quarterlyReports: AVAnnualReport[]
}

export interface AVBalanceSheet {
  symbol: string
  annualReports: AVAnnualReport[]
  quarterlyReports: AVAnnualReport[]
}

export interface AVCashFlow {
  symbol: string
  annualReports: AVAnnualReport[]
  quarterlyReports: AVAnnualReport[]
}

export interface AVEarningsQuarterly {
  fiscalDateEnding: string
  reportedDate: string
  reportedEPS: string
  estimatedEPS: string
  surprise: string
  surprisePercentage: string
  reportTime: string
}

export interface AVEarningsAnnual {
  fiscalDateEnding: string
  reportedEPS: string
}

export interface AVEarnings {
  symbol: string
  annualEarnings: AVEarningsAnnual[]
  quarterlyEarnings: AVEarningsQuarterly[]
}

export type AVFunction =
  | "OVERVIEW"
  | "INCOME_STATEMENT"
  | "BALANCE_SHEET"
  | "CASH_FLOW"
  | "EARNINGS"
