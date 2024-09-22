import { utils } from "./utils";
import { DataItem, GhostData } from "./types";
import { verifyPassword, extractToken } from "../temp/token_manager";

var githubToken: string;
const etagCache = {};
var adminMode: boolean = false;
var currentContent: DataItem[];

async function fetchGhostConfig(data: DataItem[]): Promise<GhostData> {
    let headers = { Authorization: `token ${githubToken}`, Accept: "application/vnd.github.raw+json" }
    const ghostFile = data.filter(file => file.name == ".ghost")[0]
    const url = ghostFile.git_url;
    let ghostData: GhostData;
    if (etagCache[url]) headers["If-None-Match"] = etagCache[url];
    const response = await fetch(url, { method: "GET", headers: headers })
    if (response.status == 200) {
        etagCache[url] = response.headers.get("ETag");
        ghostData = JSON.parse(await response.text());
        etagCache[`${url}_data`] = ghostData;
    } else if (response.status == 304) ghostData = etagCache[`${url}_data`];
    return ghostData;
}

async function uploadFileToRepo(file: { name: string } | File, content: string, fileInfo?: { fileNo: number, filesCount: number }, sha?: string) {
    const folderPath = document.getElementById("path").dataset.path

    return new Promise<void>((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open("PUT", `https://api.github.com/repos/Kushagra-16/storage/contents/${(folderPath != "") ? folderPath + "/" : ""}${file.name}`, true);
        xhr.setRequestHeader("Authorization", `token ${githubToken}`);
        xhr.setRequestHeader("Accept", "application/json");

        xhr.onload = () => {
            let response = JSON.parse(xhr.responseText);
            if (xhr.status == 201 || xhr.status == 200) {
                loadFolderContents(folderPath);
                resolve();
            } else { console.error(`Error Uploading file ${file.name}`, response); reject() }
        }
        xhr.onerror = () => { console.error(`Error Uploading file ${file.name}`, JSON.parse(xhr.responseText)); reject(); }

        if (fileInfo) {
            let progress_bar = document.getElementById("updown_progress");
            let progress_percent = document.getElementById("updown_progress_percent");

            xhr.upload.onloadstart = () => {
                document.getElementById("updown_filename").innerText = file.name;
                document.getElementById("updown_file_count").innerText = `(${fileInfo.fileNo}/${fileInfo.filesCount})`;
                document.getElementById("file_updown").style.visibility = "initial";
            }

            xhr.upload.onprogress = event => {
                if (event.lengthComputable) {
                    let progress = (event.loaded / event.total) * 100;
                    progress_percent.innerText = `${Math.round(progress)}%`;
                    progress_bar.style.width = `${progress}%`;
                }
            }

            xhr.upload.onloadend = () => {
                document.getElementById("file_updown").style.visibility = "hidden";
                document.getElementById("updown_filename").innerText = "";
                document.getElementById("updown_file_count").innerText = "";
                progress_bar.style.width = "0%";
                progress_percent.innerText = "0%";
            }
        }
        xhr.send(JSON.stringify({ message: `${utils.getDateTime()} --> Upload ${file.name}`, content: content, branch: "main" }))
    })
}

async function downloadFileFromRepo(fileName: string, url: string) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader("Authorization", `token ${githubToken}`);
    xhr.setRequestHeader("Accept", "application/vnd.github.raw+json");
    xhr.responseType = "blob";

    xhr.onload = () => {
        if (xhr.status === 200) {
            let blob: Blob;
            let contentType = xhr.getResponseHeader("Content-Type");
            if (contentType == "application/json") {
                const response = JSON.parse(xhr.responseText);
                const fileBuffer = atob(response.content);
                const bytes = new Array(fileBuffer.length);
                for (let i = 0; i < fileBuffer.length; i++) bytes[i] = fileBuffer.charCodeAt(i);
                const byteArray = new Uint8Array(bytes);
                blob = new Blob([byteArray], { type: "application/octet-stream" });
            } else if (contentType == "text/plain") {
                const response = xhr.responseText;
                blob = new Blob([response], { type: "text/plain" });
            } else { blob = xhr.response; }
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
        }
    }

    let progressBar = document.getElementById("updown_progress");
    let progressPercent = document.getElementById("updown_progress_percent");

    xhr.onloadstart = () => {
        document.getElementById("updown_filename")!.innerHTML = fileName;
        document.getElementById("updown_file_count")!.innerHTML = ``;
        document.getElementById("file_updown")!.style.visibility = "initial";
    }

    xhr.onprogress = (event) => {
        if (event.lengthComputable) {
            let progress = (event.loaded / event.total) * 100;
            progressPercent!.innerHTML = `${Math.round(progress)}%`;
            progressBar!.style.width = `${progress}%`;
        }
    }

    xhr.onloadend = () => {
        document.getElementById("file_updown")!.style.visibility = "hidden";
        document.getElementById("updown_filename")!.innerHTML = "";
        document.getElementById("updown_file_count")!.innerHTML = "";
        progressBar!.style.width = "0%";
        progressPercent!.innerHTML = "0%";
    }

    xhr.send()
}

async function popupPreview(items: DataItem[], itemIndex: number) {
    const item = items[itemIndex];
    document.getElementById("image_preview").style.display = "none";
    fetch(item.url, {
        method: "GET",
        headers: { Authorization: `token ${githubToken}`, Accept: "application/vnd.github.raw+json" }
    }).then(async response => {
        var previewTouchStartX: number;
        var previewTouchEndX: number;
        const byteArray = new Uint8Array(await response.arrayBuffer());
        const binaryString = byteArray.reduce((data, byte) => data + String.fromCharCode(byte), '');
        const data = btoa(binaryString);
        document.getElementById("preview_popup").replaceChild(document.getElementById("preview_container").cloneNode(true), document.getElementById("preview_container"));
        (document.getElementById("image_preview") as HTMLImageElement).src = `data:image/${item.name.split(".").pop()};base64,${data}`
        document.getElementById("loading_icon").style.display = "none"
        document.getElementById("image_preview").style.display = "initial";
        document.getElementById("preview_container").addEventListener("touchstart", event => {
            console.log(event.changedTouches[0].clientX)
            console.log(event.changedTouches[0].screenX)
            previewTouchStartX = event.changedTouches[0].clientX;
        }, { passive: true })
        document.getElementById("preview_container").addEventListener("touchend", event => {
            console.log(event.changedTouches[0].clientX)
            console.log(event.changedTouches[0].screenX)
            previewTouchEndX = event.changedTouches[0].clientX;
            if (Math.abs(previewTouchEndX - previewTouchStartX) > 100) {
                const swipe = previewTouchEndX - previewTouchStartX;
                if (swipe > 0) {
                    if (itemIndex-1 >= 0)
                        popupPreview(items, --itemIndex);
                } else if (swipe < 0) {
                    if (itemIndex+1 < items.length)
                        popupPreview(items, ++itemIndex);
                }
            }
        }, { passive: true })
    });
    document.getElementById("loading_icon").style.display = "flex"
    document.getElementById("preview_name").innerText = item.name;
    document.getElementById("preview_popup").style.visibility = "initial";
}

async function displayFolderContents(data: DataItem[], home: boolean) {
    const container = document.getElementById("main");
    currentContent = data;
    data = data.sort((a, b) => {
        if (a.name === ".ghost") return -1;
        if (b.name === ".ghost") return 1;
        if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
        return a.name.localeCompare(b.name);
    });
    const ghostData: GhostData = await fetchGhostConfig(data)
    const previewItems: DataItem[] = data.filter(file => utils.isOpenable(file.name) && utils.getPreviewType(file.name))
    console.log(previewItems)
    container.innerHTML = document.getElementById("main-template").innerHTML
    if (home) {
        (document.getElementsByClassName("item-new-folder")[0] as HTMLElement).style.display = "none";
        (document.getElementById("new_folder_name") as HTMLInputElement).setAttribute("disabled", "");
        document.getElementById("back_btn").style.display = "none";
        document.getElementById("add_btn").style.display = "none";
    } else {
        document.getElementById("back_btn").style.display = "block";
        document.getElementById("add_btn").style.display = "block";
    }
    document.getElementById("new_folder_name").addEventListener("keydown", event => {
        if (event.key == "Enter")
            uploadFileToRepo(
                { name: `${(event.target as HTMLInputElement).value}/.ghost` },
                btoa("{}")
            )
    })
    if (data.length == 1 && !adminMode) {
        document.getElementById("loading_icon").style.display = "none";
        document.getElementById("empty_folder").style.display = "flex";
        return;
    }
    else { document.getElementById("empty_folder").style.display = "none" }
    for (const item of data) {
        const element = document.createElement("div");
        const iconElem = document.createElement("i");
        const nameElem = document.createElement("span");
        const sizeElem = document.createElement("span");
        element.className = "item";
        iconElem.className = "item_icon";
        if (ghostData.hidden?.indexOf(item.name) > -1 || item.name == ".ghost") {
            if (adminMode) element.classList.add("hidden_item");
            else continue;
        }
        nameElem.className = "item_name";
        sizeElem.className = "item_size";
        element.dataset.id = item.name.split(".")[0]
        element.id = item.name
        element.dataset.sha = item.sha;
        const itemIcon = utils.getIcon(item);
        if (itemIcon.subparts) {
            for (let index = 1; index <= itemIcon.subparts; index++) {
                let pathElem = document.createElement("span");
                pathElem.className = `path${index}`;
                iconElem.appendChild(pathElem);
            }
        }
        iconElem.classList.add(`icon-${itemIcon.iconName}`);
        nameElem.innerText = item.name;
        element.setAttribute("title", item.name)
        if (item.type == "file") {
            sizeElem.innerText = utils.formatSize(item.size);
            element.addEventListener("click", () => {
                if (utils.isOpenable(item.name)) {
                    popupPreview(previewItems, previewItems.indexOf(item));
                }
                else downloadFileFromRepo(item.name, item.url)
            })
        } else if (item.type == "dir")
            element.addEventListener("click", () => { loadFolderContents(item.path) })
        if (adminMode && item.name !== ".ghost") {
            element.addEventListener("contextmenu", event => {
                let contextDownloadElement = document.getElementById("context-download");
                let contextHideElement = document.getElementById("context-hide");
                let contextUnhideElement = document.getElementById("context-unhide");
                const contextMenu = document.getElementById("item-context-menu")
                contextMenu.removeAttribute("style")
                if (item.type == "file") {
                    contextDownloadElement.style.display = "list-item";
                } else contextDownloadElement.style.display = "none";
                if (ghostData.hidden?.indexOf(item.name) > -1) {
                    contextHideElement.style.display = "none";
                    contextUnhideElement.style.display = "list-item";
                } else {
                    contextHideElement.style.display = "list-item";
                    contextUnhideElement.style.display = "none";
                }
                contextMenu.dataset.url = item.url
                contextMenu.dataset.path = item.path
                contextMenu.dataset.type = item.type
                contextMenu.dataset.sha = item.sha
                contextMenu.dataset.elementId = element.id
                contextMenu.style.display = "initial";
                if (event.clientY < window.innerHeight - parseInt(window.getComputedStyle(contextMenu).height.replace(/px/g, '')) - 20) { contextMenu.style.top = `${event.clientY}px`; }
                else { contextMenu.style.bottom = `${window.innerHeight - event.clientY}px`; }
                if (event.clientX < window.innerWidth - 160) { contextMenu.style.left = `${event.clientX}px`; }
                else { contextMenu.style.right = `${window.innerWidth - event.clientX}px`; }
            })
        }
        element.appendChild(iconElem);
        element.appendChild(nameElem);
        element.appendChild(sizeElem);
        container.appendChild(element);
        document.getElementById("loading_icon").style.display = "none"
    }
}

async function loadFolderContents(folderPath: string) {
    document.getElementById("main").innerHTML = document.getElementById("main-template").innerHTML
    document.getElementById("loading_icon").style.display = "flex";
    const pathElem = document.getElementById("path")
    pathElem.innerText = (folderPath != "") ? `/ ${folderPath.replace(/\//g, " / ")}` : ""
    pathElem.dataset.path = folderPath
    const url = `https://api.github.com/repos/Kushagra-16/storage/contents/${folderPath}`;
    let headers = { "Authorization": `token ${githubToken}`, "Accept": "application/json" }
    if (etagCache[url]) headers["If-None-Match"] = etagCache[url]
    const response = await fetch(url, { method: "GET", headers: headers });
    let data: DataItem[];
    if (response.status === 200) { etagCache[url] = response.headers.get("ETag"); data = await response.json(); etagCache[`${url}_data`] = data; }
    else if (response.status === 304) { data = etagCache[`${url}_data`]; }
    displayFolderContents(data, folderPath == "");
}

async function addContextListeners() {

    document.getElementById("context-download").addEventListener("click", () => {
        const contextMenu = document.getElementById("item-context-menu");
        downloadFileFromRepo(contextMenu.dataset.path.slice(contextMenu.dataset.path.lastIndexOf("/")), contextMenu.dataset.url)
    })

    document.getElementById("context-hide").addEventListener("click", async () => {
        const contextMenu = document.getElementById("item-context-menu");
        const ghostFile = currentContent.filter(file => file.name == ".ghost")[0]
        const ghostData: GhostData = await fetchGhostConfig(currentContent)
        const itemName = contextMenu.dataset.elementId
        console.log(itemName);
        if (ghostData.hidden) ghostData.hidden.push(itemName)
        else ghostData.hidden = [itemName]
        fetch(ghostFile.url, {
            method: "PUT",
            headers: { Authorization: `token ${githubToken}`, Accept: "application/json" },
            body: JSON.stringify({
                message: `${utils.getDateTime()} --> Hidden ${itemName}`,
                content: btoa(JSON.stringify(ghostData)),
                sha: ghostFile.sha
            })
        }).then(response => { document.getElementById(contextMenu.dataset.elementId).classList.add("hidden_item") })
    })

    document.getElementById("context-unhide").addEventListener("click", async () => {
        const contextMenu = document.getElementById("item-context-menu");
        const ghostFile = currentContent.filter(file => file.name == ".ghost")[0]
        const ghostData: GhostData = await fetchGhostConfig(currentContent)
        const itemName = contextMenu.dataset.elementId
        console.log(itemName);
        ghostData.hidden.splice(ghostData.hidden.indexOf(itemName), 1)
        fetch(ghostFile.url, {
            method: "PUT",
            headers: { Authorization: `token ${githubToken}`, Accept: "application/json" },
            body: JSON.stringify({
                message: `${utils.getDateTime()} --> Unhid ${itemName}`,
                content: btoa(JSON.stringify(ghostData)),
                sha: ghostFile.sha
            })
        }).then(response => { document.getElementById(contextMenu.dataset.elementId).classList.remove("hidden_item") })
    })

    document.getElementById("context-delete").addEventListener("click", () => {
        const contextMenu = document.getElementById("item-context-menu")
        if (contextMenu.dataset.type == "dir")
            fetch(contextMenu.dataset.url, { method: "GET", headers: { Authorization: `token ${githubToken}`, Accept: "application/json" } }).then(async (response) => {
                const data: DataItem[] = await response.json();
                for (const item of data)
                    fetch(item.url, {
                        method: "DELETE",
                        headers: { Authorization: `token ${githubToken}`, Accept: "application/json" },
                        body: JSON.stringify({ message: `${utils.getDateTime()} --> Delete ${item.path}`, sha: item.sha })
                    }).then((response) => { loadFolderContents(document.getElementById("path").dataset.path) })
            })
        else if (contextMenu.dataset.type == "file")
            fetch(contextMenu.dataset.url, {
                method: "DELETE",
                headers: { Authorization: `token ${githubToken}`, Accept: "application/json" },
                body: JSON.stringify({ message: `${utils.getDateTime()} --> Delete ${contextMenu.dataset.path}`, sha: contextMenu.dataset.sha })
            }).then((response) => { loadFolderContents(document.getElementById("path").dataset.path) })

    });

}

async function addListeners() {

    document.getElementById("search_bar").addEventListener("keyup", event => {
        const searchInput = (document.getElementById("search_bar") as HTMLInputElement).value;
        const items = document.getElementsByClassName("item") as unknown as Array<HTMLElement>;
        console.log(event.key)
        if (event.key == "Escape") {
            (document.getElementById("search_bar") as HTMLInputElement).value = "";
            document.getElementById("search_bar").blur();
            for (const item of items) if (item.dataset.id) item.style.display = "flex"
        } else {
            for (const item of items) {
                if (item.dataset.id) {
                    if (!item.dataset.id.toLowerCase().includes(searchInput.toLowerCase())) item.style.display = "none"
                    else item.style.display = "flex"
                }
            }
        }
    })

    document.getElementById("files_input").addEventListener("input", async () => {
        const files = Array.from((document.getElementById("files_input") as HTMLInputElement).files!);
        for (let index = 1; index <= files.length; index++) {
            const file = files[index - 1];
            const reader = new FileReader();
            await new Promise<void>((resolve, reject) => {
                reader.onload = async () => {
                    const arrayBuffer = reader.result as ArrayBuffer;
                    const binaryString = new Uint8Array(arrayBuffer)
                        .reduce((data, byte) => data + String.fromCharCode(byte), '');
                    const base64Content = btoa(binaryString);
                    await uploadFileToRepo(file, base64Content, { fileNo: index, filesCount: files.length });
                    resolve();
                }
                reader.readAsArrayBuffer(file);
            });
        }
    });

    document.getElementById("back_btn").addEventListener("click", () => {
        const currentPath = document.getElementById("path").dataset.path;
        loadFolderContents((currentPath.indexOf("/") > -1) ? currentPath.slice(0, currentPath.lastIndexOf("/")) : "");
    });

    document.getElementById("sync_btn").addEventListener("click", () => {
        loadFolderContents(document.getElementById("path").dataset.path)
    })

    document.getElementById("add_btn").addEventListener("click", () => {
        const contentMenu = document.getElementById("screen-context-menu")!;
        contentMenu.style.top = "30px"; contentMenu.style.right = "30px";
        contentMenu.style.display = "initial";
    });

    document.getElementById("preview_download_file").addEventListener("click", () => {
        const fileDataUrl = (document.getElementById("image_preview") as HTMLImageElement).src
        const element = document.createElement("a")
        element.href = fileDataUrl;
        element.download = document.getElementById("preview_name").innerText
        element.click()

    })

    document.getElementById("close_preview").addEventListener("click", () => {
        document.getElementById("preview_popup").style.visibility = "hidden";
        document.getElementById("preview_name").innerText = "";
        (document.getElementById("image_preview") as HTMLImageElement).src = ""
        document.getElementById("image_preview").style.display = "none"
        document.getElementById("preview_container").replaceChild(
            document.getElementById("image_preview").cloneNode(),
            document.getElementById("image_preview")
        );
    })

    document.body.addEventListener("click", event => {
        if (!document.getElementById("add_btn").contains(event.target as HTMLElement))
            document.getElementById("screen-context-menu").style.display = "none";
        document.getElementById("item-context-menu").style.display = "none";
        document.getElementById("item-context-menu").dataset.path = "";
        if (event.clientX > window.innerWidth - 30 && event.clientY > window.innerHeight - 30) { adminMode = adminMode ? false : true; loadFolderContents(document.getElementById("path").dataset.path) }
        if (event.clientX < 30 && event.clientY > window.innerHeight - 30) {
            const themeElement = document.getElementById("theme") as HTMLLinkElement;
            themeElement.href = (themeElement.href.includes("default.css")) ? "assets/css/themes/oceano.css" : "assets/css/themes/default.css"
        }
    });

    document.body.addEventListener("contextmenu", event => {
        event.preventDefault();
        if (event.target == document.body || (event.target as HTMLElement).id == "main") {
            const contextMenu = document.getElementById("screen-context-menu");
            contextMenu.removeAttribute("style")
            if (event.clientY < window.innerHeight - 70 - 20) { contextMenu.style.top = `${event.clientY}px`; }
            else { contextMenu.style.bottom = `${window.innerHeight - event.clientY}px`; }
            if (event.clientX < window.innerWidth - 160) { contextMenu.style.left = `${event.clientX}px`; }
            else { contextMenu.style.right = `${window.innerWidth - event.clientX}px`; }
            contextMenu.style.display = "initial"
        }
    });

    document.body.addEventListener("keydown", event => {

        if (event.key == "Backspace" && (event.target as HTMLElement).tagName.toLowerCase() !== "input") {
            event.preventDefault();
            document.getElementById("back_btn").click();
        }

        if (event.key === "Escape") {
            document.getElementById("screen-context-menu")!.style.display = "none";
            document.getElementById("item-context-menu")!.style.display = "none";
            document.getElementById("item-context-menu")!.dataset.path = "";
            (document.getElementById("new_folder_name") as HTMLInputElement).value = "";
            document.getElementById("new_folder_name").blur();
            document.getElementById("close_preview").click()
        }

        if (event.key.toUpperCase() === "F" && event.ctrlKey) {
            event.preventDefault();
            document.getElementById("new_folder_name").focus();
        }

        if (event.key.toUpperCase() === "S" && event.ctrlKey) {
            event.preventDefault();
            document.getElementById("sync_btn").click();
        }

        if ((event.key === "/" || event.key === "?") && event.ctrlKey) {
            event.preventDefault();
            document.getElementById("search_bar").focus();
        }

        if (event.key.toUpperCase() === "U" && event.ctrlKey) {
            event.preventDefault();
            document.getElementById("files_input").click();
        }

        if (event.key.toUpperCase() === "K" && event.ctrlKey) {
            event.preventDefault();
            document.getElementById("keyboard-shortcuts")!.style.display = "initial";
        }

        if (event.key.toUpperCase() === "H" && event.ctrlKey) {
            event.preventDefault();
            loadFolderContents("")
        }

    });

    document.body.addEventListener("keypress", event => {

        if (event.key == "\u03a9") {
            adminMode = adminMode ? false : true;
            loadFolderContents(document.getElementById("path").dataset.path)
        }

    })

    addContextListeners()
}

async function main() {
    let failed_password_tries = 0;
    document.getElementById("password_input").addEventListener("keydown", async event => {
        if (event.key == "Enter") {
            const user_input_pass = (document.getElementById("password_input") as HTMLInputElement).value;
            if (await verifyPassword(user_input_pass)) {
                fetch("assets/resources/icons.json", { method: "GET" }).then((resp) => { resp.json().then(utils.setup) })
                addListeners()
                githubToken = await extractToken();
                (document.getElementById("password_input") as HTMLInputElement).value = "";
                document.body.removeChild(document.getElementById("login_page"));
                document.head.removeChild(document.getElementById("login_style"))
                loadFolderContents("");
            } else {
                if (failed_password_tries >= 3) {
                    document.getElementById("auth_fail").style.display = "flex"
                    document.getElementById("login_page").style.display = "none";
                }
                document.getElementById("password_input").classList.add("wrong")
                setTimeout(() => { document.getElementById("password_input").classList.remove("wrong") }, 500);
                failed_password_tries++;
            }
        }
    })
}

main()