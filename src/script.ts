import { utils } from "./utils";
import { DataItem, GhostData } from "./types"

let icons_data: { defined: { [key: string]: string }, folderNames: { [key: string]: string }, fileNames: { [key: string]: string }, fileExtensions: { [key: string]: string }, iconSubparts: { [key: string]: number } };
var github_token;
const etagCache = {};

async function upload_file_to_repo(file: { name: string } | File, content: string, fileInfo?: { fileNo: number, filesCount: number }) {
    var folder_path = document.getElementById("path").dataset.path
    if (folder_path != "") folder_path += "/"

    let xhr = new XMLHttpRequest();
    xhr.open("PUT", `https://api.github.com/repos/Kushagra-16/storage/contents/${folder_path}${file.name}`, true)
    xhr.setRequestHeader("Authorization", `token ${github_token}`)
    xhr.setRequestHeader("Content-Type", "application/json")
    xhr.onload = () => {
        if (xhr.status == 201 || xhr.status == 200) load_folder_contents(folder_path.substring(0, folder_path.lastIndexOf("/")))
        else console.error(`Error uploading file ${file.name}`, JSON.parse(xhr.responseText));
    }
    xhr.onerror = () => { console.error("Error Uploading") }
    if (fileInfo) {
        let progress_bar = document.getElementById("updown_progress")
        let progress_percent = document.getElementById("updown_progress_percent")

        xhr.upload.onloadstart = () => {
            document.getElementById("updown_filename").innerHTML = file.name
            document.getElementById("updown_file_count").innerHTML = `(${fileInfo.fileNo}/${fileInfo.filesCount})`
            document.getElementById("file_updown").style.visibility = "initial"
        }
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                let progress = (event.loaded / event.total) * 100;
                progress_percent.innerHTML = `${Math.round(progress)}%`
                progress_bar.style.width = `${progress}%`
            }
        }
        xhr.upload.onloadend = () => {
            document.getElementById("file_updown").style.visibility = "hidden"
            document.getElementById("updown_filename").innerHTML = ""
            document.getElementById("updown_file_count").innerHTML = ""
            progress_bar.style.width = "0%"
            progress_percent.innerHTML = "0%"
        }
    }

    xhr.send(JSON.stringify({ message: `File Upload - ${utils.getDateTime()}`, content: content, branch: "main" }))
}

function add_listeners() {
    document.getElementById("files_input").addEventListener("input", () => {
        const files = Array.from((document.getElementById("files_input") as HTMLInputElement).files);
        for (let index = 1; index <= files.length; index++) {
            const file = files[index - 1];
            const reader = new FileReader();
            reader.onload = async () => {
                const arrayBuffer = reader.result as ArrayBuffer;
                const binaryString = new Uint8Array(arrayBuffer)
                    .reduce((data, byte) => data + String.fromCharCode(byte), '');
                const base64Content = btoa(binaryString);
                await upload_file_to_repo(file, base64Content, { fileNo: index, filesCount: files.length });
            }
            reader.readAsArrayBuffer(file);
        }
    });

    document.getElementById("back_btn").addEventListener("click", () => {
        const btn = document.getElementById("back_btn")
        load_folder_contents(btn.dataset.path)
    });

    document.getElementById("add_btn").addEventListener("click", () => {
        const add_context_menu = document.getElementById("screen-context-menu")
        add_context_menu.style.top = "30px"
        add_context_menu.style.right = "30px"
        add_context_menu.style.display = "initial"
    });

    document.body.addEventListener("click", (event) => {
        if (!document.getElementById("add_btn").contains(event.target as HTMLElement)) {
            document.getElementById("screen-context-menu").style.display = "none";
        }
        document.getElementById("item-context-menu").style.display = "none";
    });
}

async function download_file_from_repo(fileName: string, blob_url: string) {
    var folder_path = document.getElementById("path").dataset.path
    if (folder_path != "") folder_path += "/"

    let xhr = new XMLHttpRequest();
    // xhr.open("GET", `https://api.github.com/repos/Kushagra-16/storage/blobs/${blob_id}`, true)
    xhr.open("GET", blob_url, true)
    xhr.setRequestHeader("Authorization", `token ${github_token}`);
    xhr.setRequestHeader("Content-Type", "application/json")
    xhr.onload = () => {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            const fileBuffer = atob(response.content);
            const bytes = new Array(fileBuffer.length);
            for (let i = 0; i < fileBuffer.length; i++) bytes[i] = fileBuffer.charCodeAt(i)
            const byteArray = new Uint8Array(bytes);
            const blob = new Blob([byteArray], { type: "application/octet-stream" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
        }
    }

    let progress_bar = document.getElementById("updown_progress")
    let progress_percent = document.getElementById("updown_progress_percent")

    xhr.onloadstart = () => {
        document.getElementById("updown_filename").innerHTML = fileName
        document.getElementById("updown_file_count").innerHTML = ``
        document.getElementById("file_updown").style.visibility = "initial"
    }
    xhr.onprogress = (event) => {
        if (event.lengthComputable) {
            let progress = (event.loaded / event.total) * 100;
            progress_percent.innerHTML = `${Math.round(progress)}%`
            progress_bar.style.width = `${progress}%`
        }
    }
    xhr.onloadend = () => {
        document.getElementById("file_updown").style.visibility = "hidden"
        document.getElementById("updown_filename").innerHTML = ""
        document.getElementById("updown_file_count").innerHTML = ""
        progress_bar.style.width = "0%"
        progress_percent.innerHTML = "0%"
    }
    xhr.send()
}

async function add_folder(event: KeyboardEvent) {
    if (event.key == "Enter") {
        let folder_name = (event.target as HTMLInputElement).value
        await upload_file_to_repo({ name: `${folder_name}/.ghost` }, btoa("{}"))
    }
}

async function display_folder_contents(data: DataItem[]) {
    const container = document.getElementById("main");
    const ghost_file: GhostData = JSON.parse(atob((await (await fetch(data.filter(file => file.name == ".ghost")[0].git_url, { method: "GET", headers: { "Authorization": `token ${github_token}`, "Content-Type": "application/json" } })).json()).content))
    container.innerHTML = `<div class="item item-new-folder"><svg class="item_icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-folder-plus" viewBox="0 0 16 16"><path d="m.5 3 .04.87a2 2 0 0 0-.342 1.311l.637 7A2 2 0 0 0 2.826 14H9v-1H2.826a1 1 0 0 1-.995-.91l-.637-7A1 1 0 0 1 2.19 4h11.62a1 1 0 0 1 .996 1.09L14.54 8h1.005l.256-2.819A2 2 0 0 0 13.81 3H9.828a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 6.172 1H2.5a2 2 0 0 0-2 2m5.672-1a1 1 0 0 1 .707.293L7.586 3H2.19q-.362.002-.683.12L1.5 2.98a1 1 0 0 1 1-.98z"/><path d="M13.5 9a.5.5 0 0 1 .5.5V11h1.5a.5.5 0 1 1 0 1H14v1.5a.5.5 0 1 1-1 0V12h-1.5a.5.5 0 0 1 0-1H13V9.5a.5.5 0 0 1 .5-.5"/></svg><input type="text" class="item_name" placeholder="Folder Name" id="new_folder_name"></div>`
    document.getElementById("new_folder_name").addEventListener("keydown", add_folder)
    for (const item of data) {
        const element = document.createElement("div");
        const icon_elem = document.createElement("i");
        const name_elem = document.createElement("span");
        const size_elem = document.createElement("span");
        element.className = "item"; icon_elem.className = "item_icon";
        if (ghost_file.hidden?.indexOf(item.name) > -1 || item.name == ".ghost") element.classList.add("hidden_item");
        name_elem.className = "item_name"; size_elem.className = "item_size";
        element.dataset.id = item.name.split(".")[0]
        // icon_elem.src = `/assets/resources/lang/${utils.getIcon(item)}`
        let item_icon = utils.getIcon(item)
        if (item_icon.subparts) {
            for (let index = 1; index <= item_icon.subparts; index++) {
                let path_elem = document.createElement("span")
                path_elem.className = `path${index}`
                icon_elem.appendChild(path_elem)
            }
        }
        icon_elem.classList.add(`icon-${item_icon.iconName}`)
        name_elem.innerText = item.name
        if (item.type === "file") {
            size_elem.innerText = utils.formatSize(item.size)
            element.setAttribute("title", item.name)
            element.addEventListener("click", async () => {await download_file_from_repo(item.name, item.git_url)})
        } else if (item.type === "dir") {
            element.addEventListener("click", () => {
                container.innerHTML = ""
                if (item.path.indexOf("/") > -1) document.getElementById("back_btn").dataset.path = item.path.substring(0, item.path.lastIndexOf("/"))
                else document.getElementById("back_btn").dataset.path = ""
                load_folder_contents(item.path);
            });
        }
        element.appendChild(icon_elem);
        element.appendChild(name_elem);
        element.appendChild(size_elem);
        container.appendChild(element);
    }
}

async function load_folder_contents(folderPath: string) {
    utils.apply_page(folderPath);
    const url = `https://api.github.com/repos/Kushagra-16/storage/contents/${folderPath}`;
    let headers = { "Authorization": `token ${github_token}`, "Content-Type": "appliction/json" }
    if (etagCache[url]) headers["If-None-Match"] = etagCache[url]
    const response = await fetch(url, { method: "GET", headers: headers });
    let data: DataItem[];
    if (response.status === 200) { etagCache[url] = response.headers.get("ETag"); data = await response.json(); etagCache[`${url}_data`] = data; }
    else if (response.status === 304) { data = etagCache[`${url}_data`]; }
    display_folder_contents(data);
}

async function main() {
    let user_input_pass = prompt("Password: ")
    if (await utils.verify_password(user_input_pass)) {
        add_listeners()
        github_token = await utils.extract_token()
        icons_data = await (await fetch("assets/resources/icons.json", { method: "GET" })).json();
        utils.setup(icons_data)
        load_folder_contents("")
    } else alert("Wrong Password.\nContent will not be loaded")
}

main()