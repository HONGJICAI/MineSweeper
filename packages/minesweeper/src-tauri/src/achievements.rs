#[cfg(feature = "steam")]
use steamworks::Client;
#[cfg(feature = "steam")]
use std::sync::Arc;

/// Sets multiple achievements by their names.
#[cfg(feature = "steam")]
#[tauri::command]
pub fn set_achievements(steam: tauri::State<'_, Option<Arc<Client>>>, achievements: Vec<String>) -> Result<(), String> {
    // 取出并 clone 一份 Arc 引用以便在函数内使用
    let client = steam.as_ref().as_ref().ok_or("Steam client not initialized")?.clone();
    let user_stats = client.user_stats();

    for achievement_name in achievements {
        user_stats.achievement(&achievement_name)
            .set()
            .map_err(|e| format!("Failed to set achievement '{}': {:?}", achievement_name, e))?;
    }

    user_stats.store_stats()
        .map_err(|e| format!("Failed to store stats: {:?}", e))?;

    Ok(())
}