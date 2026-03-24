import { NextRequest, NextResponse } from "next/server";
import {
  getFinancialSummary,
  getRevenueByMonth,
  getExpensesByMonth,
  getExpensesByCategory,
  getOverdueInvoices,
  estimateQuarterlyTax,
} from "@/lib/actions/financials";

// GET /api/financials — financial summary and breakdowns
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const period = (searchParams.get("period") || "year") as "month" | "quarter" | "year";
  const date = searchParams.get("date") || undefined;
  const view = searchParams.get("view"); // "summary" | "revenue" | "expenses-by-category" | "overdue" | "tax"

  try {
    if (view === "revenue") {
      const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
      const [revenue, expensesByMonth] = await Promise.all([
        getRevenueByMonth(year),
        getExpensesByMonth(year),
      ]);
      // Merge revenue and expenses by month
      const monthly = revenue.map((r, i) => ({
        ...r,
        expenses: expensesByMonth[i]?.expenses || 0,
      }));
      return NextResponse.json({ monthly, year });
    }

    if (view === "expenses-by-category") {
      const startDate = searchParams.get("startDate") || `${new Date().getFullYear()}-01-01`;
      const endDate = searchParams.get("endDate") || `${new Date().getFullYear()}-12-31`;
      const data = await getExpensesByCategory(startDate, endDate);
      return NextResponse.json({ data });
    }

    if (view === "overdue") {
      const data = await getOverdueInvoices();
      return NextResponse.json({ data });
    }

    if (view === "tax") {
      const quarter = parseInt(searchParams.get("quarter") || String(Math.ceil((new Date().getMonth() + 1) / 3)));
      const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
      const taxRate = parseFloat(searchParams.get("taxRate") || "0.25");
      const data = await estimateQuarterlyTax(quarter, year, taxRate);
      return NextResponse.json(data);
    }

    // Default: full summary
    const summary = await getFinancialSummary(period, date);
    const year = date ? new Date(date).getFullYear() : new Date().getFullYear();
    const [monthly, categories, overdue] = await Promise.all([
      Promise.all([getRevenueByMonth(year), getExpensesByMonth(year)]).then(([rev, exp]) =>
        rev.map((r, i) => ({ ...r, expenses: exp[i]?.expenses || 0 }))
      ),
      getExpensesByCategory(summary.startDate, summary.endDate),
      getOverdueInvoices(),
    ]);

    return NextResponse.json({
      summary,
      monthly,
      categories,
      overdue,
    });
  } catch (error) {
    console.error("Error fetching financials:", error);
    return NextResponse.json({ error: "Failed to fetch financial data" }, { status: 500 });
  }
}
