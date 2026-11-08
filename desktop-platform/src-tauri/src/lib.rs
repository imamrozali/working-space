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
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, get_storage_stats])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_bytes() {
        assert_eq!(format_bytes(0), "0 B");
        assert_eq!(format_bytes(512), "512 B");
        assert_eq!(format_bytes(1024), "1.00 KB");
        assert_eq!(format_bytes(1024 * 1024), "1.00 MB");
        assert_eq!(format_bytes(1024 * 1024 * 1024), "1.00 GB");
        assert_eq!(format_bytes(1024 * 1024 * 1024 * 1024), "1.00 TB");
        assert_eq!(format_bytes(1536), "1.50 KB");
    }

    #[test]
    fn test_greet() {
        let greeting = greet("OmniUser");
        assert_eq!(greeting, "Hello, OmniUser! You've been greeted from Rust!");
    }

    #[test]
    fn test_get_storage_stats_current_dir() {
        let result = get_storage_stats(Some(".".to_string()));
        assert!(result.is_ok(), "Storage stats for current dir should succeed");
        let stats = result.unwrap();
        assert!(stats.total_bytes > 0, "Total bytes should be greater than 0");
        assert!(stats.free_bytes <= stats.total_bytes, "Free bytes should not exceed total");
        assert_eq!(stats.used_bytes, stats.total_bytes - stats.free_bytes);
        assert!(!stats.total_formatted.is_empty());
        assert!(!stats.free_formatted.is_empty());
        assert!(!stats.used_formatted.is_empty());
        assert!(stats.used_percentage >= 0.0 && stats.used_percentage <= 100.0);
    }
}
