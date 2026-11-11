// Prevents an extra console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    if std::env::args().any(|a| a == "--background") {
        std::process::exit(emu_vault_lib::background());
    }
    emu_vault_lib::run()
}
