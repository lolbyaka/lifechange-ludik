export interface Signal {
  id: string;
  strategy: string;
  symbol: string;
  slROI: string;
  tpROI: string;
  positionSize: string;
  leverage: string | null;
  longMALine: string | null;
  crossMASignalDown: string | null;
  momentumLine: string | null;
  MALine: string | null;
  createdAt: string;
  updatedAt: string;
}
