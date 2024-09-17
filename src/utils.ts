import { DataItem, IconsData } from "./types";
import { TokenManager } from "../temp/token_manager";

let iconsData: IconsData;
const openable: string[] = [
    "image", /* "video" , "audio", "pdf", "html", "python", "css",
    "js", "javascript","json", "xml", "yml", "yaml", "conf",
    "config", "c", "cpp", "h", "hpp", "java", "sh", "bat", "php",
    "sql", "txt", "text", "ino", "arduino", "gcode" */
]
const previewTypes: { [key: string]: string[] } = {
    "image": ["png", "jpg", "jpeg", "gif", "svg", "webm"],
    "video": ["mp4", "ogg", "ogv", "avi", "mov", "wmv", "flv", "mkv", "m2ts"],
    "audio": ["mp3", "wav", "ogg", "oga", "m4a", "flac", "aac", "wma", "mid", "midi"],
    "pdf": ["pdf"],
    "text": ["log", "txt", "md"],
    "cod": [
        "html", "py", "pyw", "htm", "css", "js", "json", "xml", "yml", "yaml",
        "ini", "conf", "c", "cpp", "h", "hpp", "java", "sh", "bat", "php",
        "sql", "txt", "text", "ino"
    ]
}

export namespace utils {

    export function setup(iconsDataObj: IconsData) { iconsData = iconsDataObj; }

    export function getIcon(item: DataItem): { iconName: string, subparts?: number } {
        let iconInfo: { iconName: string, subparts?: number };
        if (item.type === "file") {
            let icon = iconsData.defined.file;
            for (const name in iconsData.fileNames)
                if (Object.prototype.hasOwnProperty.call(iconsData.fileNames, name))
                    if (name.toLowerCase() == item.name.toLowerCase())
                        icon = iconsData.fileNames[name]
            for (const ext in iconsData.fileExtensions)
                if (Object.prototype.hasOwnProperty.call(iconsData.fileExtensions, ext)) {
                    const itemComps = item.name.split(".");
                    const itemExt = itemComps[itemComps.length - 1];
                    if (itemExt.toLowerCase() == ext.toLowerCase())
                        icon = iconsData.fileExtensions[ext];
                }
            iconInfo = {
                iconName: icon,
                subparts: (iconsData.iconSubparts[icon] > 1) ? iconsData.iconSubparts[icon] : undefined
            }
        } else if (item.type === "dir") {
            let icon = iconsData.defined.folder;
            for (const name in iconsData.folderNames)
                if (Object.prototype.hasOwnProperty.call(iconsData.folderNames, name))
                    if (name.toLowerCase() == item.name.toLowerCase())
                        icon = iconsData.folderNames[name]
            iconInfo = {
                iconName: icon,
                subparts: (iconsData.iconSubparts[icon] > 1) ? iconsData.iconSubparts[icon] : undefined
            }
        }
        return iconInfo;
    }

    export function getDateTime() {
        let date = new Date();
        let IST_OFFSET = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
        let istDate = new Date(date.getTime() + IST_OFFSET);
        let pad = (num) => (num < 10 ? '0' + num : num);
        let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        let day = pad(istDate.getDate());
        let month = months[istDate.getMonth()];
        let year = istDate.getFullYear();
        let hours = istDate.getHours();
        let minutes = pad(istDate.getMinutes());
        let seconds = pad(istDate.getSeconds());
        let ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        let formattedHours = pad(hours);
        return `${day}/${month}/${year} ${formattedHours}:${minutes}:${seconds} ${ampm}`;
    }

    export function formatSize(size: number): string {
        if (size < 1024) return `${size} B`
        else if (size < 1024 ** 2) return `${(size / 1024).toFixed(2)} KB`
        else if (size < 1024 ** 3) return `${(size / (1024 ** 2)).toFixed(2)} MB`
        else return `${(size / (1024 ** 3)).toFixed(2)} GB`
    }

    export function isOpenable(fileName: string) {
        const fileExtension = fileName.split('.').pop()
        for (const ext in iconsData.fileExtensions) {
            if (Object.prototype.hasOwnProperty.call(iconsData.fileExtensions, ext)) {
                if (ext.toLowerCase() == fileExtension) {
                    const fileType = iconsData.fileExtensions[ext];
                    return openable.indexOf(ext) > -1 || openable.indexOf(fileType) > -1
                }
            }
        }
    }

    export function getPreviewType(filename: string): string {
        const fileExtension = filename.split(".").pop()
        for (const type in previewTypes)
            for (const ext of previewTypes[type])
                if (fileExtension.toLowerCase() == ext) return type
    }
}