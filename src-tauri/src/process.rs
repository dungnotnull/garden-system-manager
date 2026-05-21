use serde::{Deserialize, Serialize};
use sysinfo::{Pid, ProcessesToUpdate, System};

const MAX_PROCESSES: usize = 20;

/// System-critical process names that should not be terminated.
const SYSTEM_PROCESS_NAMES: &[&str] = &[
    "System Idle Process",
    "System",
    "Registry",
    "smss.exe",
    "csrss.exe",
    "wininit.exe",
    "services.exe",
    "lsass.exe",
    "winlogon.exe",
    "dwm.exe",
];

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessData {
    pub pid: u32,
    pub name: String,
    pub cpu_usage: f32,
    pub memory_usage: u64,
    pub is_responding: bool,
    pub is_killable: bool,
    pub started_at: u64,
}

pub fn is_system_process(name: &str, pid: u32) -> bool {
    if pid <= 4 {
        return true;
    }
    let name_lower = name.to_lowercase();
    SYSTEM_PROCESS_NAMES
        .iter()
        .any(|sp| sp.to_lowercase() == name_lower)
}

fn to_process_data(process: &sysinfo::Process) -> ProcessData {
    let pid = process.pid().as_u32();
    let name = process.name().to_string_lossy().into_owned();

    ProcessData {
        pid,
        name: name.clone(),
        cpu_usage: process.cpu_usage(),
        memory_usage: process.memory(),
        is_responding: true,
        is_killable: !is_system_process(&name, pid),
        started_at: process.start_time(),
    }
}

/// Refresh system processes and return the top N by memory usage.
pub fn collect_top_processes(system: &mut System) -> Vec<ProcessData> {
    system.refresh_processes(ProcessesToUpdate::All, true);

    let mut processes: Vec<ProcessData> =
        system.processes().values().map(to_process_data).collect();

    processes.sort_by(|a, b| b.memory_usage.cmp(&a.memory_usage));
    processes.truncate(MAX_PROCESSES);
    processes
}

/// Attempt to kill a process by PID. Returns Ok(true) on success.
pub fn kill_process_by_pid(pid: u32) -> Result<bool, String> {
    let mut system = System::new();
    system.refresh_processes(ProcessesToUpdate::All, false);

    let pid_obj = Pid::from_u32(pid);
    let process = system
        .process(pid_obj)
        .ok_or_else(|| format!("Process not found: PID {}", pid))?;

    let name = process.name().to_string_lossy().into_owned();

    if is_system_process(&name, pid) {
        return Err(format!("Cannot kill system process: {}", name));
    }

    if process.kill() {
        Ok(true)
    } else {
        Err(format!("Failed to kill: {} (PID {})", name, pid))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_system_process_low_pid() {
        assert!(is_system_process("anything", 0));
        assert!(is_system_process("anything", 4));
        assert!(!is_system_process("anything", 100));
    }

    #[test]
    fn test_is_system_process_by_name() {
        assert!(is_system_process("csrss.exe", 999));
        assert!(is_system_process("CSRSS.EXE", 999));
        assert!(is_system_process("lsass.exe", 999));
        assert!(!is_system_process("chrome.exe", 999));
        assert!(!is_system_process("code.exe", 999));
    }

    #[test]
    fn test_collect_top_processes_returns_sorted() {
        let mut system = System::new_all();
        system.refresh_processes(ProcessesToUpdate::All, true);

        let processes = collect_top_processes(&mut system);

        assert!(processes.len() <= MAX_PROCESSES);
        for window in processes.windows(2) {
            assert!(window[0].memory_usage >= window[1].memory_usage);
        }
    }

    #[test]
    fn test_process_data_serialization() {
        let data = ProcessData {
            pid: 1234,
            name: "test.exe".to_string(),
            cpu_usage: 45.5,
            memory_usage: 1024 * 1024 * 100,
            is_responding: true,
            is_killable: true,
            started_at: 1234567890,
        };

        let json = serde_json::to_string(&data).unwrap();
        let parsed: ProcessData = serde_json::from_str(&json).unwrap();

        assert_eq!(parsed.pid, data.pid);
        assert_eq!(parsed.name, data.name);
        assert!((parsed.cpu_usage - data.cpu_usage).abs() < f32::EPSILON);
        assert_eq!(parsed.memory_usage, data.memory_usage);
        assert_eq!(parsed.is_responding, data.is_responding);
        assert_eq!(parsed.is_killable, data.is_killable);
        assert_eq!(parsed.started_at, data.started_at);
    }
}
