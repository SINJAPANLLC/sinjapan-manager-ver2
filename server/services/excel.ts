import ExcelJS from "exceljs";
import { BusinessPL } from "./pl";

/**
 * P/LをExcelファイルに出力
 */
export async function exportPLToExcel(pl: BusinessPL): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("損益計算書");

  // スタイル定義
  const titleStyle = {
    font: { bold: true, size: 14 },
    alignment: { horizontal: "center" as const },
  };

  const headerStyle = {
    font: { bold: true, size: 12 },
    fill: {
      type: "pattern" as const,
      pattern: "solid" as const,
      fgColor: { argb: "FFE0E0E0" },
    },
  };

  const sectionTitleStyle = {
    font: { bold: true, size: 11 },
    fill: {
      type: "pattern" as const,
      pattern: "solid" as const,
      fgColor: { argb: "FFF0F0F0" },
    },
  };

  const totalStyle = {
    font: { bold: true },
    fill: {
      type: "pattern" as const,
      pattern: "solid" as const,
      fgColor: { argb: "FFFFEB3B" },
    },
  };

  const currencyFormat = "¥#,##0";

  // 列幅設定
  worksheet.columns = [
    { width: 15 }, // A: 勘定科目コード
    { width: 30 }, // B: 勘定科目名
    { width: 20 }, // C: 金額
  ];

  let row = 1;

  // タイトル
  worksheet.mergeCells(`A${row}:C${row}`);
  const titleCell = worksheet.getCell(`A${row}`);
  titleCell.value = "損益計算書";
  titleCell.style = titleStyle;
  row++;

  // 事業部門名
  worksheet.mergeCells(`A${row}:C${row}`);
  const businessCell = worksheet.getCell(`A${row}`);
  businessCell.value = pl.businessName;
  businessCell.style = { alignment: { horizontal: "center" } };
  row++;

  // 期間
  worksheet.mergeCells(`A${row}:C${row}`);
  const periodCell = worksheet.getCell(`A${row}`);
  const startDate = pl.period.start.toISOString().split("T")[0];
  const endDate = pl.period.end.toISOString().split("T")[0];
  periodCell.value = `期間: ${startDate} 〜 ${endDate}`;
  periodCell.style = { alignment: { horizontal: "center" } };
  row++;

  row++; // 空行

  // ヘッダー
  const headerRow = worksheet.getRow(row);
  headerRow.values = ["勘定科目コード", "勘定科目名", "金額"];
  headerRow.eachCell((cell) => {
    cell.style = headerStyle;
  });
  row++;

  // セクション追加関数
  const addSection = (section: { title: string; items: any[]; total: string }, indent: boolean = false) => {
    // セクションタイトル
    const titleRow = worksheet.getRow(row);
    titleRow.values = [
      "",
      (indent ? "  " : "") + section.title,
      "",
    ];
    titleRow.eachCell((cell) => {
      cell.style = sectionTitleStyle;
    });
    row++;

    // 明細行
    for (const item of section.items) {
      const itemRow = worksheet.getRow(row);
      itemRow.values = [
        item.accountCode,
        (indent ? "    " : "  ") + item.accountName,
        parseFloat(item.amount),
      ];
      itemRow.getCell(3).numFmt = currencyFormat;
      row++;
    }

    // 小計
    if (section.items.length > 0) {
      const subtotalRow = worksheet.getRow(row);
      subtotalRow.values = [
        "",
        (indent ? "  " : "") + section.title + " 計",
        parseFloat(section.total),
      ];
      subtotalRow.eachCell((cell) => {
        cell.style = { font: { bold: true } };
      });
      subtotalRow.getCell(3).numFmt = currencyFormat;
      row++;
    }

    row++; // 空行
  };

  // P/L構造
  // 売上高
  addSection(pl.revenue);

  // 売上原価
  addSection(pl.costOfSales);

  // 売上総利益
  const grossProfitRow = worksheet.getRow(row);
  grossProfitRow.values = ["", "売上総利益", parseFloat(pl.grossProfit)];
  grossProfitRow.eachCell((cell) => {
    cell.style = totalStyle;
  });
  grossProfitRow.getCell(3).numFmt = currencyFormat;
  row++;
  row++;

  // 販売費及び一般管理費
  addSection(pl.operatingExpenses);

  // 営業利益
  const operatingIncomeRow = worksheet.getRow(row);
  operatingIncomeRow.values = ["", "営業利益", parseFloat(pl.operatingIncome)];
  operatingIncomeRow.eachCell((cell) => {
    cell.style = totalStyle;
  });
  operatingIncomeRow.getCell(3).numFmt = currencyFormat;
  row++;
  row++;

  // 営業外収益
  if (pl.nonOperatingRevenue.items.length > 0) {
    addSection(pl.nonOperatingRevenue, true);
  }

  // 営業外費用
  if (pl.nonOperatingExpenses.items.length > 0) {
    addSection(pl.nonOperatingExpenses, true);
  }

  // 経常利益
  const ordinaryIncomeRow = worksheet.getRow(row);
  ordinaryIncomeRow.values = ["", "経常利益", parseFloat(pl.ordinaryIncome)];
  ordinaryIncomeRow.eachCell((cell) => {
    cell.style = totalStyle;
  });
  ordinaryIncomeRow.getCell(3).numFmt = currencyFormat;
  row++;
  row++;

  // 当期純利益
  const netIncomeRow = worksheet.getRow(row);
  netIncomeRow.values = ["", "当期純利益", parseFloat(pl.netIncome)];
  netIncomeRow.eachCell((cell) => {
    cell.style = {
      font: { bold: true, size: 12 },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4CAF50" },
      },
    };
  });
  netIncomeRow.getCell(3).numFmt = currencyFormat;

  // Excelバッファを返す
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
