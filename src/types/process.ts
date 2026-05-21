export interface ProcessData {
  pid: number;
  name: string;
  cpu_usage: number;
  memory_usage: number;
  is_responding: boolean;
  is_killable: boolean;
  started_at: number;
}

export interface CreatureData {
  name: string;
  totalMemory: number;
  maxCpu: number;
  isResponding: boolean;
  isAnyKillable: boolean;
  count: number;
}
