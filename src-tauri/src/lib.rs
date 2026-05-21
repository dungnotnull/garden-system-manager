mod process;

use std::time::Duration;
use tauri::Emitter;

#[tauri::command]
fn send_creature_home(pid: u32) -> Result<bool, String> {
    process::kill_process_by_pid(pid)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle().clone();

            std::thread::spawn(move || {
                let mut system = sysinfo::System::new_all();
                system.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

                // Initial delay so CPU usage readings are accurate after the first refresh.
                std::thread::sleep(Duration::from_secs(2));

                loop {
                    let processes = process::collect_top_processes(&mut system);
                    let _ = handle.emit("process-update", &processes);
                    std::thread::sleep(Duration::from_secs(2));
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![send_creature_home])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
