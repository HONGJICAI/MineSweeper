#[cfg(feature = "steam")]
use std::env;
#[cfg(feature = "steam")]
use std::fs;
#[cfg(feature = "steam")]
use std::path::{Path, PathBuf};

fn main() {
    #[cfg(feature = "steam")]
    {
        find_and_copy_steam_dll();
    }
    
    tauri_build::build()
}

#[cfg(feature = "steam")]
fn find_and_copy_steam_dll() {
    let target_dll = "steam_api64.dll";
    let current_dir = env::current_dir().unwrap();
    let target_path = current_dir.join(target_dll);
    
    // 如果当前目录已经有了，就跳过
    if target_path.exists() {
        println!("cargo:warning={} already exists in current directory", target_dll);
        return;
    }
    
    // 尝试从 Cargo 注册表缓存查找
    if let Some(dll_path) = find_steam_dll_in_cargo_home() {
        if let Err(e) = fs::copy(&dll_path, &target_path) {
            panic!("Failed to copy {} to current directory: {}", dll_path.display(), e);
        }
        println!("cargo:warning=Copied {} from cargo registry: {}", target_dll, dll_path.display());
        return;
    }
    
    println!("cargo:warning={} not found, build may fail", target_dll);
}

#[cfg(feature = "steam")]
fn find_steam_dll_in_cargo_home() -> Option<PathBuf> {
    let target_dll = "steam_api64.dll";
    
    // 获取 CARGO_HOME 环境变量，或使用默认路径
    let cargo_home = env::var("CARGO_HOME")
        .or_else(|_| {
            dirs::home_dir()
                .map(|home| home.join(".cargo").to_string_lossy().to_string())
                .ok_or_else(|| env::VarError::NotPresent)
        })
        .ok()?;
    
    // 使用已知的Steam DLL相对路径
    let dll_path = PathBuf::from(cargo_home)
        .join("registry")
        .join("src")
        .join("index.crates.io-6f17d22bba15001f")
        .join("steamworks-sys-0.12.2")
        .join("lib")
        .join("steam")
        .join("redistributable_bin")
        .join("win64")
        .join(target_dll);

    println!("cargo:warning=Looking for {} at {}", target_dll, dll_path.display());
    
    if dll_path.exists() {
        Some(dll_path)
    } else {
        None
    }
}
