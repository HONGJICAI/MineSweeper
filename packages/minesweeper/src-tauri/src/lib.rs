use tauri::Manager;

mod achievements;

#[cfg(feature = "steam")]
use steamworks::{Client, AppId};
#[cfg(feature = "steam")]
use std::sync::Arc;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      #[cfg(feature = "steam")]
      {
          let steam_client: Option<Arc<Client>> = match Client::init_app(AppId(3967050)) {
              Ok(c) => Some(Arc::new(c)),
              Err(e) => {
                  eprintln!("Failed to init Steam: {:?}", e);
                  None
              }
          };
          // 把 Option<Arc<Client>> 注入到 tauri state
          app.manage(steam_client);
      }
      Ok(())
    })
    .invoke_handler(
      tauri::generate_handler![
        #[cfg(feature = "steam")]
        achievements::set_achievements,
        // Add MS Store handler here if needed
      ]
    )
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
