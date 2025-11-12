// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet_from_rust(name: &str) -> String {
    format!("Hello, {}! Welcome from Rust backend 🦀", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet_from_rust])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
