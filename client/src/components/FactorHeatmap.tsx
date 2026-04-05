import { useFactorHeatmap } from "@/lib/api";
import { Loader2, Grid3X3 } from "lucide-react";

/**
 * P2-B: 因子热力矩阵
 * 6×6 矩阵展示六大维度之间的交叉共振强度
 */

function getHeatColor(value: number): string {
  if (value >= 75) return "rgba(239,68,68,0.7)";   // 红 - 强共振
  if (value >= 50) return "rgba(245,158,11,0.6)";   // 橙 - 中等共振
  if (value >= 25) return "rgba(59,130,246,0.4)";   // 蓝 - 弱共振
  if (value > 0) return "rgba(59,130,246,0.15)";    // 淡蓝 - 微弱
  return "rgba(255,255,255,0.03)";                  // 无信号
}

function getTextColor(value: number): string {
  if (value >= 50) return "#FFFFFF";
  if (value >= 25) return "rgba(255,255,255,0.8)";
  if (value > 0) return "rgba(255,255,255,0.5)";
  return "rgba(255,255,255,0.2)";
}

// 维度简称映射
const SHORT_NAMES: Record<string, string> = {
  "宏观/政策": "宏观",
  "中观/行业": "行业",
  "微观/公司": "公司",
  "因子/量价": "量价",
  "事件/催化": "事件",
  "资金行为": "资金",
};

export default function FactorHeatmap() {
  const { heatmap, isLoading, error } = useFactorHeatmap();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-fang-cyan animate-spin" />
      </div>
    );
  }

  if (error || !heatmap || Array.isArray(heatmap)) {
    return (
      <div className="px-4 py-3 text-sm text-muted-foreground">
        暂无热力矩阵数据
      </div>
    );
  }

  const { dimensions, matrix } = heatmap as { dimensions: string[]; matrix: { row: string; col: string; value: number }[] };

  // 构建查找表
  const getValue = (row: string, col: string): number => {
    const cell = matrix.find((m: { row: string; col: string; value: number }) => m.row === row && m.col === col);
    return cell?.value ?? 0;
  };

  return (
    <div className="px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Grid3X3 className="w-4 h-4 text-fang-cyan" />
        <span className="text-sm font-semibold text-foreground uppercase tracking-wider">
          因子热力矩阵
        </span>
        <span className="text-[10px] text-muted-foreground font-data">FACTOR HEATMAP</span>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-16 p-1"></th>
              {dimensions.map((dim: string) => (
                <th key={dim} className="p-1 text-center">
                  <span className="text-[10px] text-muted-foreground font-data">
                    {SHORT_NAMES[dim] || dim}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dimensions.map((rowDim: string) => (
              <tr key={rowDim}>
                <td className="p-1 text-right pr-2">
                  <span className="text-[10px] text-muted-foreground font-data">
                    {SHORT_NAMES[rowDim] || rowDim}
                  </span>
                </td>
                {dimensions.map((colDim: string) => {
                  const value = getValue(rowDim, colDim);
                  const isDiagonal = rowDim === colDim;
                  return (
                    <td key={colDim} className="p-0.5">
                      <div
                        className="flex items-center justify-center h-10 w-full border border-border/10"
                        style={{
                          backgroundColor: getHeatColor(value),
                          borderWidth: isDiagonal ? "2px" : "1px",
                          borderColor: isDiagonal ? "rgba(0,212,170,0.3)" : undefined,
                        }}
                        title={`${SHORT_NAMES[rowDim] || rowDim} × ${SHORT_NAMES[colDim] || colDim}: ${value}%`}
                      >
                        <span
                          className="font-data text-xs font-bold"
                          style={{ color: getTextColor(value) }}
                        >
                          {value > 0 ? value : "—"}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3" style={{ backgroundColor: "rgba(59,130,246,0.15)" }} />
          <span className="text-[10px] text-muted-foreground">弱</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3" style={{ backgroundColor: "rgba(59,130,246,0.4)" }} />
          <span className="text-[10px] text-muted-foreground">中</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3" style={{ backgroundColor: "rgba(245,158,11,0.6)" }} />
          <span className="text-[10px] text-muted-foreground">强</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3" style={{ backgroundColor: "rgba(239,68,68,0.7)" }} />
          <span className="text-[10px] text-muted-foreground">极强</span>
        </div>
      </div>
    </div>
  );
}
