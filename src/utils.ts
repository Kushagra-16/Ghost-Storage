// import { TokenManager } from "../temp/enc.js"
let icons_data: {
    defined: {[key: string]: string},
    folderNames: {[key: string]: string}
    fileNames: {[key: string]: string}
    fileExtensions: {[key: string]: string},
    iconSubparts: {[key: string]: number}
};

interface DataItem {
    name: string,
    path: string,
    sha: string,
    size: number,
    url: string,
    html_url: string,
    git_url: string,
    download_url: string,
    type: string,
    content: string,
    encoding: string,
    _links: {
        self: string,
        git: string,
        html: string
    }
}

// dummy class
class TokenManager {
    constructor(salt: string) {}
    enc(text: string): string {return ""}
    dec(text: string): string {return ""}
}

export namespace utils {
    export function getIcon(item: DataItem): {iconName: string, subparts?: number} {
        if (item.type === "dir") {
            let icon = icons_data.defined.folder
            for (const name in icons_data.folderNames)
                if (Object.prototype.hasOwnProperty.call(icons_data.folderNames, name))
                    if (name == item.name.toLowerCase()) icon = icons_data.defined[icons_data.folderNames[name]]
            icon = icon.substring(0, icon.indexOf('.'))
            return {iconName: icon, subparts: (icons_data.iconSubparts[icon] > 1) ? icons_data.iconSubparts[icon] : undefined}
        } else if (item.type === "file") {
            let icon = icons_data.defined.file
            for (const name in icons_data.fileNames)
                if (Object.prototype.hasOwnProperty.call(icons_data.fileNames, name))
                    if (name == item.name.toLowerCase()) icon = icons_data.defined[icons_data.fileNames[name]]
            for (const ext in icons_data.fileExtensions)
                if (Object.prototype.hasOwnProperty.call(icons_data.fileExtensions, ext)) {
                    const item_comps = item.name.split(".");
                    const item_ext = item_comps[item_comps.length - 1]
                    if (item_ext == ext) icon = icons_data.defined[icons_data.fileExtensions[ext]]
                }
            icon = icon.substring(0, icon.indexOf('.'))
            return {iconName: icon, subparts: (icons_data.iconSubparts[icon] > 1) ? icons_data.iconSubparts[icon] : undefined}
        }
    }

    export function formatSize(size: number): string {
        if (size < 1024) return `${size} B`
        else if (size < 1024 ** 2) return `${(size / 1024).toFixed(2)} KB`
        else if (size < 1024 ** 3) return `${(size / (1024 ** 2)).toFixed(2)} MB`
        else return `${(size / (1024 ** 3)).toFixed(2)} GB`
    }

    export function getDateTime() {
        const date = new Date();
        const IST_OFFSET = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
        const istDate = new Date(date.getTime() + IST_OFFSET);
        const pad = (num) => (num < 10 ? '0' + num : num);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const day = pad(istDate.getDate());
        const month = months[istDate.getMonth()];
        const year = istDate.getFullYear();
        let hours = istDate.getHours();
        const minutes = pad(istDate.getMinutes());
        const seconds = pad(istDate.getSeconds());
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const formattedHours = pad(hours);
        return `${day}/${month}/${year} ${formattedHours}:${minutes}:${seconds} ${ampm}`;
    }

    export function apply_page(folderPath: string) {
        const temp_path_elem = document.getElementById("path")
        temp_path_elem.innerText = `/ ${folderPath.replace(/\//g, " / ")}`
        temp_path_elem.dataset.path = folderPath
        if (folderPath.indexOf("/") > -1) document.getElementById("back_btn").dataset.path = folderPath.substring(0, folderPath.lastIndexOf("/"))
        else document.getElementById("back_btn").dataset.path = ""
        if (folderPath == "") {document.getElementById("back_btn").style.visibility = "hidden"; document.getElementById("add_btn").style.visibility = "hidden" ;}
        else {document.getElementById("back_btn").style.visibility = "initial"; document.getElementById("add_btn").style.visibility = "initial" ;}
    }

    export function setup(icons_data_obj) {
        icons_data = icons_data_obj
    }

    export async function extract_token() {
        let e = new TokenManager(document.documentElement.dataset.name).enc(document.documentElement.dataset.name)
        const response = await (await fetch(
            "/Ghost-Storage/assets/resources/.github.ghost",
            { method: "GET" }
        )).text()
        return new TokenManager(e).dec(response)
    }

    export async function verify_password(user_input_pass: string) {
        let e = new TokenManager(document.documentElement.dataset.name).enc(document.documentElement.dataset.name)
        const response = await (await fetch(
            "/Ghost-Storage/assets/resources/.password.ghost",
            { method: "GET" }
        )).text()
        if (new TokenManager(e).enc(user_input_pass) == response) return true;
        else return false;
    }
}