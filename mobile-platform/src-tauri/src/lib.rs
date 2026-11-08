use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct StorageStats {
    pub total_bytes: u64,
    pub free_bytes: u64,
    pub used_bytes: u64,
    pub total_formatted: String,
    pub free_formatted: String,
    pub used_formatted: String,
    pub used_percentage: f64,
    pub path: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct MobileDeviceInfo {
    pub platform: String,
    pub arch: String,
    pub family: String,
    pub is_mobile: bool,
    pub engine: String,
}

fn format_bytes(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = 1024 * KB;
    const GB: u64 = 1024 * MB;
    const TB: u64 = 1024 * GB;

    if bytes >= TB {
        format!("{:.2} TB", bytes as f64 / TB as f64)
    } else if bytes >= GB {
        format!("{:.2} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.2} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.2} KB", bytes as f64 / KB as f64)
    } else {
        format!("{} B", bytes)
    }
}

#[cfg(unix)]
fn get_system_storage_stats(path: &str) -> Result<StorageStats, String> {
    use std::ffi::CString;
    use std::mem::MaybeUninit;

    let c_path = CString::new(path).map_err(|e| e.to_string())?;
    let mut stat = MaybeUninit::<libc::statvfs>::uninit();

    let res = unsafe { libc::statvfs(c_path.as_ptr(), stat.as_mut_ptr()) };
    if res != 0 {
        return Err(format!("statvfs failed with error code: {}", res));
    }

    let stat = unsafe { stat.assume_init() };
    let block_size = if stat.f_frsize > 0 {
        stat.f_frsize as u64
    } else {
        stat.f_bsize as u64
    };

    let total_bytes = (stat.f_blocks as u64) * block_size;
    let free_bytes = (stat.f_bavail as u64) * block_size;
    let used_bytes = total_bytes.saturating_sub(free_bytes);
    let used_percentage = if total_bytes > 0 {
        ((used_bytes as f64 / total_bytes as f64) * 100.0 * 10.0).round() / 10.0
    } else {
        0.0
    };

    Ok(StorageStats {
        total_bytes,
        free_bytes,
        used_bytes,
        total_formatted: format_bytes(total_bytes),
        free_formatted: format_bytes(free_bytes),
        used_formatted: format_bytes(used_bytes),
        used_percentage,
        path: path.to_string(),
    })
}

#[cfg(windows)]
fn get_system_storage_stats(path: &str) -> Result<StorageStats, String> {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;

    let mut path_wide: Vec<u16> = OsStr::new(path).encode_wide().collect();
    path_wide.push(0);

    let mut free_bytes_available: u64 = 0;
    let mut total_bytes: u64 = 0;
    let mut total_free_bytes: u64 = 0;

    extern "system" {
        fn GetDiskFreeSpaceExW(
            lpDirectoryName: *const u16,
            lpFreeBytesAvailableToCaller: *mut u64,
            lpTotalNumberOfBytes: *mut u64,
            lpTotalNumberOfFreeBytes: *mut u64,
        ) -> i32;
    }

    let res = unsafe {
        GetDiskFreeSpaceExW(
            path_wide.as_ptr(),
            &mut free_bytes_available,
            &mut total_bytes,
            &mut total_free_bytes,
        )
    };

    if res == 0 {
        return Err("GetDiskFreeSpaceExW failed".to_string());
    }

    let free_bytes = free_bytes_available;
    let used_bytes = total_bytes.saturating_sub(free_bytes);
    let used_percentage = if total_bytes > 0 {
        ((used_bytes as f64 / total_bytes as f64) * 100.0 * 10.0).round() / 10.0
    } else {
        0.0
    };

    Ok(StorageStats {
        total_bytes,
        free_bytes,
        used_bytes,
        total_formatted: format_bytes(total_bytes),
        free_formatted: format_bytes(free_bytes),
        used_formatted: format_bytes(used_bytes),
        used_percentage,
        path: path.to_string(),
    })
}

#[tauri::command]
fn get_storage_stats(target_path: Option<String>) -> Result<StorageStats, String> {
    let path = target_path.unwrap_or_else(|| ".".to_string());
    get_system_storage_stats(&path)
}

#[tauri::command]
fn get_mobile_device_info() -> MobileDeviceInfo {
    let is_mobile = cfg!(any(target_os = "ios", target_os = "android"));
    let os_str = std::env::consts::OS.to_string();
    let arch_str = std::env::consts::ARCH.to_string();
    let family_str = std::env::consts::FAMILY.to_string();

    MobileDeviceInfo {
        platform: os_str,
        arch: arch_str,
        family: family_str,
        is_mobile,
        engine: "Tauri v2 Mobile Core".to_string(),
    }
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Omni Mobile Rust core!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_storage_stats,
            get_mobile_device_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri mobile application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_bytes() {
        assert_eq!(format_bytes(0), "0 B");
        assert_eq!(format_bytes(1024), "1.00 KB");
        assert_eq!(format_bytes(1024 * 1024), "1.00 MB");
        assert_eq!(format_bytes(1024 * 1024 * 1024), "1.00 GB");
        assert_eq!(format_bytes(1024 * 1024 * 1024 * 1024), "1.00 TB");
    }

    #[test]
    fn test_greet() {
        let greeting = greet("OmniMobile");
        assert_eq!(
            greeting,
            "Hello, OmniMobile! You've been greeted from Omni Mobile Rust core!"
        );
    }

    #[test]
    fn test_get_storage_stats() {
        let result = get_storage_stats(Some(".".to_string()));
        assert!(result.is_ok());
        let stats = result.unwrap();
        assert!(stats.total_bytes > 0);
        assert!(stats.used_percentage >= 0.0 && stats.used_percentage <= 100.0);
    }

    #[test]
    fn test_get_mobile_device_info() {
        let info = get_mobile_device_info();
        assert!(!info.platform.is_empty());
        assert!(!info.arch.is_empty());
        assert_eq!(info.engine, "Tauri v2 Mobile Core");
    }
}

