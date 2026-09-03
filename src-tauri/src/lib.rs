use std::{fs, path::PathBuf};
use tauri::Manager;

fn save_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("save.json"))
}

fn meta_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("meta.json"))
}

#[tauri::command]
fn load_save(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let path = save_path(&app)?;
    if !path.exists() {
        return Ok(None);
    }
    fs::read_to_string(path).map(Some).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_save(app: tauri::AppHandle, contents: String) -> Result<(), String> {
    let path = save_path(&app)?;
    let temp = path.with_extension("json.tmp");
    fs::write(&temp, contents).map_err(|e| e.to_string())?;
    if path.exists() {
        fs::remove_file(&path).map_err(|e| e.to_string())?;
    }
    fs::rename(temp, path).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_save(app: tauri::AppHandle) -> Result<(), String> {
    let path = save_path(&app)?;
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn load_meta(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let path = meta_path(&app)?;
    if !path.exists() {
        return Ok(None);
    }
    fs::read_to_string(path).map(Some).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_meta(app: tauri::AppHandle, contents: String) -> Result<(), String> {
    let path = meta_path(&app)?;
    let temp = path.with_extension("json.tmp");
    fs::write(&temp, contents).map_err(|e| e.to_string())?;
    if path.exists() {
        fs::remove_file(&path).map_err(|e| e.to_string())?;
    }
    fs::rename(temp, path).map_err(|e| e.to_string())
}

#[tauri::command]
fn quit_game(app: tauri::AppHandle) {
    app.exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            load_save,
            write_save,
            delete_save,
            load_meta,
            write_meta,
            quit_game
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
