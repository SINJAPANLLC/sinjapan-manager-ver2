import { db } from "../db";
import { 
  journalEntries, 
  journalEntryLines, 
  accounts,
  businesses,
} from "@shared/schema";
import { eq, and, gte, lte, sql, desc, SQL } from "drizzle-orm";

export interface PLLineItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  amount: string;
  category: string | null;
}

export interface PLSection {
  title: string;
  items: PLLineItem[];
  total: string;
}

export interface BusinessPL {
  businessId: string | null;
  businessName: string;
  period: {
    start: Date;
    end: Date;
  };
  
  // P/L セクション
  revenue: PLSection; // 売上高
  costOfSales: PLSection; // 売上原価
  grossProfit: string; // 売上総利益
  operatingExpenses: PLSection; // 販売費及び一般管理費
  operatingIncome: string; // 営業利益
  nonOperatingRevenue: PLSection; // 営業外収益
  nonOperatingExpenses: PLSection; // 営業外費用
  ordinaryIncome: string; // 経常利益
  netIncome: string; // 当期純利益
}

/**
 * 事業部門別P/Lを取得
 */
export async function getBusinessPL(
  businessId: string | null,
  startDate: Date,
  endDate: Date
): Promise<BusinessPL> {
  // ビジネス名取得
  let businessName = "全社";
  if (businessId) {
    const business = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
    if (business[0]) {
      businessName = business[0].nameJa || business[0].name;
    }
  }

  // 仕訳明細を集計
  const conditions: SQL[] = [
    gte(journalEntries.entryDate, startDate),
    lte(journalEntries.entryDate, endDate),
  ];
  
  if (businessId) {
    conditions.push(eq(journalEntries.businessId, businessId));
  }

  const lines = await db
    .select({
      accountId: journalEntryLines.accountId,
      accountCode: accounts.code,
      accountName: accounts.name,
      accountType: accounts.type,
      accountCategory: accounts.category,
      debit: journalEntryLines.debit,
      credit: journalEntryLines.credit,
    })
    .from(journalEntryLines)
    .innerJoin(journalEntries, eq(journalEntryLines.journalEntryId, journalEntries.id))
    .innerJoin(accounts, eq(journalEntryLines.accountId, accounts.id))
    .where(and(...conditions));

  // 勘定科目別に集計（収益は credit、費用は debit）
  const accountTotals = new Map<string, {
    accountId: string;
    accountCode: string;
    accountName: string;
    accountType: string | null;
    accountCategory: string | null;
    amount: number;
  }>();

  for (const line of lines) {
    const key = line.accountId;
    if (!accountTotals.has(key)) {
      accountTotals.set(key, {
        accountId: line.accountId,
        accountCode: line.accountCode,
        accountName: line.accountName,
        accountType: line.accountType,
        accountCategory: line.accountCategory,
        amount: 0,
      });
    }
    
    const account = accountTotals.get(key)!;
    const debit = parseFloat(line.debit || "0");
    const credit = parseFloat(line.credit || "0");
    
    // 収益科目: credit - debit
    // 費用科目: debit - credit
    if (line.accountType === "revenue") {
      account.amount += credit - debit;
    } else if (line.accountType === "expense") {
      account.amount += debit - credit;
    }
  }

  // セクション別に振り分け
  const revenue: PLLineItem[] = [];
  const costOfSales: PLLineItem[] = [];
  const operatingExpenses: PLLineItem[] = [];
  const nonOperatingRevenue: PLLineItem[] = [];
  const nonOperatingExpenses: PLLineItem[] = [];

  for (const [_, account] of Array.from(accountTotals)) {
    const item: PLLineItem = {
      accountId: account.accountId,
      accountCode: account.accountCode,
      accountName: account.accountName,
      amount: account.amount.toFixed(2),
      category: account.accountCategory,
    };

    if (account.accountType === "revenue") {
      if (account.accountCategory === "sales") {
        revenue.push(item);
      } else if (account.accountCategory === "non_operating") {
        nonOperatingRevenue.push(item);
      } else {
        revenue.push(item);
      }
    } else if (account.accountType === "expense") {
      if (account.accountCategory === "cost_of_sales") {
        costOfSales.push(item);
      } else if (account.accountCategory === "operating_expense") {
        operatingExpenses.push(item);
      } else if (account.accountCategory === "non_operating") {
        nonOperatingExpenses.push(item);
      } else {
        operatingExpenses.push(item);
      }
    }
  }

  // 各セクションの合計計算
  const sumSection = (items: PLLineItem[]): string => {
    return items.reduce((sum, item) => sum + parseFloat(item.amount), 0).toFixed(2);
  };

  const revenueTotal = parseFloat(sumSection(revenue));
  const costOfSalesTotal = parseFloat(sumSection(costOfSales));
  const operatingExpensesTotal = parseFloat(sumSection(operatingExpenses));
  const nonOperatingRevenueTotal = parseFloat(sumSection(nonOperatingRevenue));
  const nonOperatingExpensesTotal = parseFloat(sumSection(nonOperatingExpenses));

  const grossProfit = revenueTotal - costOfSalesTotal;
  const operatingIncome = grossProfit - operatingExpensesTotal;
  const ordinaryIncome = operatingIncome + nonOperatingRevenueTotal - nonOperatingExpensesTotal;
  const netIncome = ordinaryIncome; // 簡略化: 特別損益・税金は省略

  return {
    businessId,
    businessName,
    period: {
      start: startDate,
      end: endDate,
    },
    revenue: {
      title: "売上高",
      items: revenue,
      total: revenueTotal.toFixed(2),
    },
    costOfSales: {
      title: "売上原価",
      items: costOfSales,
      total: costOfSalesTotal.toFixed(2),
    },
    grossProfit: grossProfit.toFixed(2),
    operatingExpenses: {
      title: "販売費及び一般管理費",
      items: operatingExpenses,
      total: operatingExpensesTotal.toFixed(2),
    },
    operatingIncome: operatingIncome.toFixed(2),
    nonOperatingRevenue: {
      title: "営業外収益",
      items: nonOperatingRevenue,
      total: nonOperatingRevenueTotal.toFixed(2),
    },
    nonOperatingExpenses: {
      title: "営業外費用",
      items: nonOperatingExpenses,
      total: nonOperatingExpensesTotal.toFixed(2),
    },
    ordinaryIncome: ordinaryIncome.toFixed(2),
    netIncome: netIncome.toFixed(2),
  };
}

/**
 * P/Lを月次・四半期・年次で取得
 */
export function getPeriodDates(year: number, period: "month" | "quarter" | "year", value: number): { start: Date; end: Date } {
  let start: Date;
  let end: Date;

  if (period === "year") {
    start = new Date(year, 0, 1);
    end = new Date(year, 11, 31, 23, 59, 59);
  } else if (period === "quarter") {
    const quarterMonth = (value - 1) * 3;
    start = new Date(year, quarterMonth, 1);
    end = new Date(year, quarterMonth + 3, 0, 23, 59, 59);
  } else {
    // month
    start = new Date(year, value - 1, 1);
    end = new Date(year, value, 0, 23, 59, 59);
  }

  return { start, end };
}
