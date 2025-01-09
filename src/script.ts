import { utils } from "./utils";
import { DataItem, DroppedItem, GhostData, TreeData, TreeItem } from "./types";
import { verifyPassword, extractToken } from "../temp/token_manager";
import Prism from "./highlight.js"

let githubToken: string;
const etagCache = {};
let adminMode: boolean = false;
let selectionMode: boolean = false;
var currentContent: DataItem[];
const fileSizeLimit = 39 * 1024 * 1024;
const username = "Kushagra-16"
const repo = "storage"

function openParentFolder() {
    const currentPath = document.getElementById("path").dataset.path;
    loadFolderContents((currentPath.indexOf("/") > -1) ? currentPath.slice(0, currentPath.lastIndexOf("/")) : "");
}

function reloadFolderContents() {
    loadFolderContents(document.getElementById("path").dataset.path)
}

function* makeFileChunks(fileContent: string | File): Generator<{chunkNumber: number, content: string | Blob}> {
    let index = 0; let chunkNumber = 0;
    while (index < ((typeof fileContent === "string") ? fileContent.length : fileContent.size)) {
        yield {
            chunkNumber: chunkNumber,
            content: fileContent.slice(index, index + fileSizeLimit)
        };
        chunkNumber += 1;
        index += fileSizeLimit;
    }
}

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

async function uploadFileToRepo(file: { name: string, size?: number } | File, content: string, fileInfo?: { fileNo: number, filesCount: number }, sha?: string, chunkData?: {chunked: boolean, chunkNumber: number}, ghostConfig?: GhostData) {
    const folderPath = document.getElementById("path").dataset.path
    if (chunkData?.chunked) {
        return new Promise<void>((resolve, reject) => {
            let totalSize = file.size;
            let tempUploadSize = 0;
            let uploadSize = (fileSizeLimit * chunkData.chunkNumber > file.size) ? file.size : fileSizeLimit * chunkData.chunkNumber;
            let xhr = new XMLHttpRequest();
            xhr.open("PUT", `https://api.github.com/repos/${username}/${repo}/contents/${(folderPath != "") ? folderPath + "/" : ""}${file.name}/${chunkData.chunkNumber}`, true);
            xhr.setRequestHeader("Authorization", `token ${githubToken}`);
            xhr.setRequestHeader("Accept", "application/json");
            xhr.setRequestHeader("Content-Type", "application/json");

            xhr.onload = () => {
                let response = JSON.parse(xhr.responseText);
                if (xhr.status == 201 || xhr.status == 200) {
                    tempUploadSize = 0; resolve();
                } else { console.error("error uploading", file.name, response); reject() }
            }
            xhr.onerror = () => { console.log("error uploading", file.name, JSON.parse(xhr.responseText)); reject() }

            if (fileInfo) {
                let progressBar = document.getElementById("updown_progress");
                let progressPercent = document.getElementById("updown_progress_percent");

                xhr.upload.onloadstart = () => {
                    if (chunkData.chunkNumber == 0) {
                        progressBar.style.transition = "none";
                        progressBar.style.width = "0%";
                        progressPercent.innerText = "0%";
                        progressBar.style.transition = "0.1s linear";
                        document.getElementById("updown_filename").innerText = file.name;
                        document.getElementById("updown_file_count").innerText = `(${fileInfo.fileNo}/${fileInfo.filesCount})`;
                        document.getElementById("file_updown").style.visibility = "initial";
                    }
                }

                xhr.upload.onprogress = event => {
                    if (event.lengthComputable) {
                        tempUploadSize = event.loaded;
                        let progress = ((uploadSize + tempUploadSize) / totalSize) * 100;
                        if (progress > parseFloat(progressBar.style.width.slice(0, -1))) {
                            progressPercent.innerText = `${Math.round(progress)}%`
                            progressBar.style.width = `${progress}%`
                        }
                    }
                }

                xhr.upload.onloadend = () => {
                    if (chunkData.chunked && !(uploadSize >= totalSize)) {}
                    else {
                        if (fileInfo.fileNo == fileInfo.filesCount || chunkData.chunked) {
                            ghostConfig
                            document.getElementById("file_updown").style.visibility = "hidden";
                            document.getElementById("updown_filename").innerText = "";
                            document.getElementById("updown_file_count").innerText = "";
                        }
                    }
                }
            }
            xhr.send(JSON.stringify({ message: `${utils.getDateTime()} --> Upload ${file.name}/${chunkData.chunkNumber}`, content: content, branch: "main" }))
        })
    } else {
        return new Promise<void>((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.open("PUT", `https://api.github.com/repos/${username}/${repo}/contents/${(folderPath != "") ? folderPath + "/" : ""}${file.name}`, true);
            xhr.setRequestHeader("Authorization", `token ${githubToken}`);
            xhr.setRequestHeader("Accept", "application/json");

            xhr.onload = () => {
                let response = JSON.parse(xhr.responseText);
                if (xhr.status == 201 || xhr.status == 200) {
                    loadFolderContents(folderPath, false);
                    resolve();
                } else { console.error(`Error Uploading file ${file.name}`, response); reject() }
            }
            xhr.onerror = () => { console.error(`Error Uploading file ${file.name}`, JSON.parse(xhr.responseText)); reject(); }

            if (fileInfo) {
                let progressBar = document.getElementById("updown_progress");
                let progressPercent = document.getElementById("updown_progress_percent");

                xhr.upload.onloadstart = () => {
                    progressBar.style.transition = "none";
                    progressBar.style.width = "0%";
                    progressPercent.innerText = "0%";
                    progressBar.style.transition = "0.1s linear";
                    document.getElementById("updown_filename").innerText = file.name;
                    document.getElementById("updown_file_count").innerText = `(${fileInfo.fileNo}/${fileInfo.filesCount})`;
                    document.getElementById("file_updown").style.visibility = "initial";
                }

                xhr.upload.onprogress = event => {
                    if (event.lengthComputable) {
                        let progress = (event.loaded / event.total) * 100;
                        progressPercent.innerText = `${Math.round(progress)}%`;
                        progressBar.style.width = `${progress}%`;
                    }
                }

                xhr.upload.onloadend = () => {
                    progressBar.style.transition = "none";
                    if (fileInfo.fileNo == fileInfo.filesCount) {
                        document.getElementById("file_updown").style.visibility = "hidden";
                        document.getElementById("updown_filename").innerText = "";
                        document.getElementById("updown_file_count").innerText = "";
                    }
                }
            }
            xhr.send(JSON.stringify({ message: `${utils.getDateTime()} --> Upload ${file.name}`, content: content, branch: "main" }))
        })
    }
}

async function downloadFileFromRepo(fileName: string, url: string, chunksData?: TreeData) {
    let progressBar = document.getElementById("updown_progress");
    let progressPercent = document.getElementById("updown_progress_percent");
    if (!chunksData) {
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
    } else {
        var chunks = []; var downloadSize = 0; var tempDownloadSize = 0
        const totalSize = chunksData.tree.reduce((acc, chunk) => acc + chunk.size, 0);
        console.log(utils.formatSize(totalSize))
        chunksData.tree.sort((a, b) => parseInt(a.path, 10) - parseInt(b.path, 10));
        document.getElementById("updown_filename")!.innerHTML = fileName;
        document.getElementById("updown_file_count")!.innerHTML = ``;
        document.getElementById("file_updown")!.style.visibility = "initial";
        for (const chunk of chunksData.tree) {
            let chunkContent = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', `https://api.github.com/repos/${username}/${repo}/contents/${url}/${chunk.path}?ref=main`, true);
                xhr.setRequestHeader("Authorization", `Bearer ${githubToken}`)
                xhr.setRequestHeader("Accept", "application/vnd.github.raw+json")
                xhr.responseType = "blob";
                var tempDownloadSize = 0;
                downloadSize = downloadSize;

                xhr.onload = () => {
                    if (xhr.status === 200) {
                        let contentType = xhr.getResponseHeader("Content-Type");
                        downloadSize += tempDownloadSize;
                        console.log(utils.formatSize(downloadSize));
                        tempDownloadSize = 0;
                        if (contentType === "application/json") {
                            const response = JSON.parse(xhr.responseText);
                            resolve(atob(response.content));
                        } else if (contentType === "text/plain") resolve(xhr.responseText);
                        else resolve(xhr.response);
                    } else reject(new Error(`Failed to load chunk: ${xhr.status}`))
                };

                xhr.onprogress = (event) => {
                    if (event.lengthComputable) {
                        tempDownloadSize = event.loaded;
                        let progress = ((downloadSize + tempDownloadSize) / totalSize) * 100;
                        progressPercent!.innerHTML = `${Math.round(progress)}%`
                        progressBar!.style.width = `${progress}%`
                    }
                }

                xhr.send();
            });
            chunks.push(chunkContent);
        }
        document.getElementById("file_updown")!.style.visibility = "hidden";
        document.getElementById("updown_filename")!.innerHTML = "";
        document.getElementById("updown_file_count")!.innerHTML = "";
        progressBar!.style.width = "0%";
        progressPercent!.innerHTML = "0%";
        const fileBlob = new Blob(chunks, {type: chunks[0].type});
        const downloadUrl = URL.createObjectURL(fileBlob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(downloadUrl);
    }
}

async function popupPreview(items: DataItem[], itemIndex: number) {
    const item = items[itemIndex];
    document.getElementById("image_preview").style.display = "none";
    document.getElementById("text_preview").style.display = "none";
    document.getElementById("pdf_preview").style.display = "none";
    document.getElementById("audio_preview").style.display = "none";
    document.getElementById("video_preview").style.display = "none";
    fetch(item.url, {
        method: "GET",
        headers: { Authorization: `token ${githubToken}`, Accept: "application/vnd.github.raw+json" }
    }).then(async response => {
        document.getElementById("preview_popup").replaceChild(document.getElementById("preview_container").cloneNode(true), document.getElementById("preview_container"));

        if (utils.getPreviewType(item.name) == "image") {
            const data = btoa(new Uint8Array(await response.arrayBuffer()).reduce((data, byte) => data + String.fromCharCode(byte), ''));
            (document.getElementById("image_preview") as HTMLImageElement).src = `data:image/${item.name.split(".").pop()};base64,${data}`
            document.getElementById("image_preview").style.display = "initial";
        } else if (utils.getPreviewType(item.name) == "cod") {
            const responseText = await response.text();
            const previewElem = (document.getElementById("code_preview") as HTMLElement);
            previewElem.className = "language-" + item.name.split(".").pop();
            document.getElementById("text_preview").className = `line-numbers language-${item.name.split(".").pop()}`
            previewElem.textContent = responseText;
            Prism.highlightElement(previewElem);
            document.getElementById("text_preview").style.display = "block";
        } else if (utils.getPreviewType(item.name) == "pdf") {
            const data = btoa(new Uint8Array(await response.arrayBuffer()).reduce((data, byte) => data + String.fromCharCode(byte), ''));
            const iframe = document.getElementById('pdf_preview') as HTMLIFrameElement;
            iframe.src = `data:application/pdf;base64,${data}`;
            document.getElementById("pdf_preview").style.display = "block";
        } else if (utils.getPreviewType(item.name) == "audio") {
            const data = btoa(new Uint8Array(await response.arrayBuffer()).reduce((data, byte) => data + String.fromCharCode(byte), ''));
            (document.getElementById("audio_preview") as HTMLAudioElement).src = `data:audio/${item.name.split(".").pop()};base64,${data}`;
            (document.getElementById("audio_preview") as HTMLAudioElement).load()
            document.getElementById("audio_preview").style.display = "initial";
        } else if (utils.getPreviewType(item.name) == "video") {
            const data = btoa(new Uint8Array(await response.arrayBuffer()).reduce((data, byte) => data + String.fromCharCode(byte), ''));
            (document.getElementById("video_preview") as HTMLVideoElement).src = `data:video/${item.name.split(".").pop()};base64,${data}`;
            (document.getElementById("video_preview") as HTMLVideoElement).load()
            document.getElementById("video_preview").style.display = "initial";
        } else {
            alert("Preview currently not available for this file type")
        }
        document.getElementById("loading_icon").style.display = "none"

        var previewTouchStartX: number;
        var previewTouchEndX: number;

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

async function moveItem(item: DroppedItem, newParentPath: string) {
    const lastCommitRef = await utils.api("GET", "/git/ref/heads/main")
    const rootTree: TreeData = await utils.api("GET", `/git/trees/${lastCommitRef.object.sha}`)
    const currentDir = document.getElementById("path").dataset.path;
    const newTreeItems = currentContent.map(x =>  {
        if (x.type == "file") return {path: x.name, mode: "100644", type: "blob", sha: x.sha}
        else return {path: x.name, mode: "040000", type: "tree", sha: x.sha}
    }).filter(x => x.sha != item.sha)
    const newTree = await utils.api("POST", "/git/trees", {tree: newTreeItems})
    const newRootTree: TreeData = await utils.api("POST", "/git/trees", {
        base_tree: rootTree.sha,
        tree: [
            {path: currentDir, mode: "040000", type: "tree", sha: newTree.sha},
            {
                path: `${newParentPath}/${item.name}`, sha: item.sha,
                mode: (item.type == "file") ? "100644" : "040000",
                type: (item.type == "file") ? "blob" : "tree"
            }
        ]
    });
    const newCommit = await utils.api("POST", "/git/commits", {
        message: `${utils.getDateTime()} --> Moved ${item.name} to ${newParentPath}`,
        tree: newRootTree.sha, parents: [lastCommitRef.object.sha]
    });
    utils.api("PATCH", "/git/refs/heads/main", {sha: newCommit.sha}).then(() => {
        loadFolderContents(document.getElementById("path").dataset.path, false)
    });
}

async function displayFolderContents(data: DataItem[], home: boolean, showLoading?: boolean) {
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
    container.innerHTML = document.getElementById("main-template").innerHTML
    document.getElementById("reload_folder_contents").addEventListener("click", reloadFolderContents);
    document.getElementById("parent_folder").addEventListener("click", openParentFolder);
    document.getElementById("upload_files").addEventListener("drop", event => {
        event.preventDefault(); document.getElementById("upload_files").classList.remove("dragging");
        const files_input = document.getElementById("files_input") as HTMLInputElement;
        files_input.files = event.dataTransfer.files; files_input.dispatchEvent(new Event("input"));
    });
    const parentFolderElement = document.getElementById("parent_folder");
    const parentFolderName = document.getElementById("parent_folder_name");
    const parentFolderIcon = document.getElementById("parent_folder_icon");
    const currentPath = document.getElementById("path").dataset.path;
    const parentFolderPath = (currentPath.includes("/")) ? currentPath.slice(0, currentPath.lastIndexOf("/")) : "Home";
    parentFolderName.innerText = parentFolderPath.slice(parentFolderPath.lastIndexOf("/") + 1);
    const itemsCount = document.getElementById("items_count");
    if (home) {
        parentFolderElement.classList.add("hidden_item");
        parentFolderElement.classList.add("no-hover");
        parentFolderElement.removeAttribute("onclick");
        parentFolderName.innerHTML = "Home"
        if (!adminMode) {
            Array.from(document.getElementsByClassName("item-misc")).forEach((e: HTMLElement) => {if (e.closest("div#main")) e.style.display = "none"});
            (document.getElementById("new_folder_name") as HTMLInputElement).setAttribute("disabled", "");
        }
    } else {
        parentFolderElement.addEventListener("dragover", event => { if (event.dataTransfer && !event.dataTransfer.types.includes("Files")) {
            event.preventDefault();
            parentFolderElement.classList.add("dragging");
        }});
        parentFolderElement.addEventListener("dragleave", event => {
            if (!(parentFolderElement.contains(event.relatedTarget as HTMLElement) || event.relatedTarget == parentFolderElement)) {
                event.preventDefault();
                parentFolderElement.classList.remove("dragging")
            }
        });
        parentFolderElement.addEventListener("drop", async event => {
            event.preventDefault();
            parentFolderElement.classList.remove("dragging")
            const droppedItem: DroppedItem = JSON.parse(event.dataTransfer.getData("application/json"))
            await moveItem(droppedItem, parentFolderPath);
        });
    }
    document.getElementById("new_folder_name").addEventListener("keydown", event => {
        if (event.key == "Enter")
            uploadFileToRepo(
                { name: `${(event.target as HTMLInputElement).value}/.ghost` },
                btoa("{}")
            )
    })
    const itemIcon = utils.getIcon({
        name: parentFolderName.innerText,
        type: "dir"
    }, false, true);
    if (itemIcon.subparts) {
        for (let index = 1; index <= itemIcon.subparts; index++) {
            let pathElem = document.createElement("span");
            pathElem.className = `path${index}`;
            parentFolderIcon.appendChild(pathElem);
        }
    }
    parentFolderIcon.classList.add(`icon-${itemIcon.iconName}`);
    if (data.length == 1 && !adminMode) {
        document.getElementById("loading_icon").style.display = "none";
        document.getElementById("empty_folder").style.display = "flex";
        return;
    } else { document.getElementById("empty_folder").style.display = "none" }
    for (const item of data) {
        const element = document.createElement("div");
        const iconElem = document.createElement("i");
        const nameElem = document.createElement("span");
        const sizeElem = document.createElement("span");
        element.className = "item item-main";
        iconElem.className = "item_icon";
        if (
            ghostData.hidden?.indexOf(item.name) > -1
            || item.name.startsWith(".ghost")
            || item.name.startsWith(".github")
        ) {
            if (adminMode) element.classList.add("hidden_item");
            else continue;
        }
        nameElem.className = "item_name";
        sizeElem.className = "item_size";
        element.dataset.id = item.name.split(".")[0]
        element.id = item.name
        element.dataset.sha = item.sha;
        const itemIcon = utils.getIcon(item, (ghostData.lf?.indexOf(item.name) > -1));
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
            element.dataset.type = "file";
            if (!item.name.startsWith(".ghost")) itemsCount.dataset.filesCount = String(parseInt(itemsCount.dataset.filesCount)+1);
            sizeElem.innerText = utils.formatSize(item.size);
            if (!item.name.startsWith(".ghost")) {
                element.addEventListener("click", () => {
                    if (selectionMode) {
                        if (element.classList.contains("selected")) element.classList.remove("selected");
                        else element.classList.add("selected");
                        return;
                    }
                    if (utils.isOpenable(item.name)) {
                        popupPreview(previewItems, previewItems.indexOf(item));
                    }
                    else downloadFileFromRepo(item.name, item.url)
                })
            }
        } else if (item.type == "dir") {
            element.dataset.type = "dir";
            if (ghostData.lf?.indexOf(item.name) > -1) {
                itemsCount.dataset.filesCount = String(parseInt(itemsCount.dataset.filesCount)+1);
                const chunksData: TreeData = await (await fetch(`https://api.github.com/repos/${username}/${repo}/git/trees/${item.sha}`, {
                    method: "GET", headers: {Authorization: `Bearer ${githubToken}`}
                })).json()
                const size = Number(chunksData.tree.reduce((acc: number, chunk: TreeItem) => acc + chunk.size, 0))
                sizeElem.innerText = utils.formatSize(size);
                element.addEventListener("click", () => {
                    if (selectionMode) {
                        element.classList.toggle("selected");
                        return;
                    }
                    downloadFileFromRepo(item.name, item.path, chunksData)
                })
            } else {
                itemsCount.dataset.foldersCount = String(parseInt(itemsCount.dataset.foldersCount) + 1);
                if (!item.name.startsWith(".ghost") && !item.name.startsWith(".github")) {
                    element.addEventListener("click", () => {
                        if (selectionMode) {
                            element.classList.toggle("selected");
                            return;
                        }
                        document.getElementById("path").dataset.sha = item.sha;
                        loadFolderContents(item.path); 
                    })
                }
            }
        }
        if (adminMode && !(item.name.startsWith(".ghost") || item.name.startsWith(".github"))) {
            element.draggable = true;
            if (item.type == "dir") {
                element.addEventListener("dragover", event => {
                    if (event.dataTransfer && !event.dataTransfer.types.includes("Files")) {
                        event.preventDefault();
                        element.classList.add("dragging");
                    }
                });
                element.addEventListener("dragleave", event => {
                    if (!(element.contains(event.relatedTarget as HTMLElement) || event.relatedTarget == element)) {
                        event.preventDefault();
                        element.classList.remove("dragging")
                    }
                });
                element.addEventListener("drop", async event => {
                    event.preventDefault();
                    element.classList.remove("dragging")
                    const droppedItem: DroppedItem = JSON.parse(event.dataTransfer.getData("application/json"));
                    if (droppedItem.sha != item.sha)
                        await moveItem(droppedItem, item.path);
                });
            }
            element.addEventListener("dragstart", (event) => {
                const target = event.target as HTMLElement;
                event.dataTransfer.setData("application/json", JSON.stringify({
                    name: target.id,
                    sha: target.dataset.sha,
                    type: target.dataset.type
                }));
                event.dataTransfer.effectAllowed = "move";
            });
            element.addEventListener("contextmenu", event => {
                if (selectionMode) return;
                document.getElementById("screen-context-menu")!.style.display = "none";
                let contextDownloadElement = document.getElementById("context-download");
                const contextHr = document.getElementById("item-context-hr");
                let contextHideElement = document.getElementById("context-hide");
                let contextUnhideElement = document.getElementById("context-unhide");
                const contextMenu = document.getElementById("item-context-menu")
                contextMenu.removeAttribute("style")
                for (const elem of (Array.from(contextMenu.children) as HTMLElement[])) elem.style.display = "list-item";
                if (item.type == "file" || (ghostData.lf?.indexOf(item.name) > -1)) {
                    contextDownloadElement.style.display = "list-item";
                    contextHr.style.display = "block";
                } else {
                    contextMenu.dataset.large_file = "true"
                    contextDownloadElement.style.display = "none";
                    contextHr.style.display = "none";
                }
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
                contextMenu.dataset.git_url = item.git_url
                contextMenu.dataset.elementId = element.id
                contextMenu.style.display = "initial";
                
                if (event.clientY < window.innerHeight - parseInt(window.getComputedStyle(contextMenu).height.replace(/px/g, '')) - 20) { contextMenu.style.top = `${event.clientY}px`; }
                else { contextMenu.style.bottom = `${window.innerHeight - event.clientY}px`; }
                if (event.clientX < window.innerWidth - 160) { contextMenu.style.left = `${event.clientX}px`; }
                else { contextMenu.style.right = `${window.innerWidth - event.clientX}px`; }
            });
        } else if (document.getElementById("path").dataset.path != "") {
            element.addEventListener("contextmenu", event => {
                if (selectionMode) return;
                document.getElementById("screen-context-menu")!.style.display = "none";
                const contextMenu = document.getElementById("item-context-menu")
                for (const elem of (Array.from(contextMenu.children) as HTMLElement[])) {
                    if (item.type == "file" || (ghostData.lf?.indexOf(item.name) > -1)) {
                        if (elem.id != "context-download" && elem.id != "context-compress") elem.style.display = "none";
                        else elem.style.display = "list-item";
                    } else {
                        if (elem.id == "context-compress") elem.style.display = "list-item";
                        else elem.style.display = "none";
                    }
                }
                contextMenu.dataset.url = item.url
                contextMenu.dataset.path = item.path
                contextMenu.dataset.type = item.type
                contextMenu.dataset.sha = item.sha
                contextMenu.dataset.git_url = item.git_url
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
        if (showLoading) document.getElementById("loading_icon").style.display = "none"
    }
    itemsCount.innerHTML = `${itemsCount.dataset.filesCount} File${(itemsCount.dataset.filesCount != '1') ? 's' : ''}  |  ${itemsCount.dataset.foldersCount} Folder${(itemsCount.dataset.foldersCount != '1') ? 's' : ''}`
}

async function loadFolderContents(folderPath: string, showLoading?: boolean) {
    if (showLoading === undefined || showLoading === null) showLoading = true;
    if (showLoading) {
        document.getElementById("main").innerHTML = ""
        document.getElementById("loading_icon").style.display = "flex";
    }
    document.getElementById("empty_folder").style.display = "none";
    const pathElem = document.getElementById("path")
    pathElem.innerText = (folderPath != "") ? `/ ${folderPath.replace(/\//g, " / ")}` : ""
    pathElem.dataset.path = folderPath
    const url = `https://api.github.com/repos/${username}/${repo}/contents/${folderPath}`;
    let headers = { "Authorization": `token ${githubToken}`, "Accept": "application/json" }
    if (etagCache[url]) headers["If-None-Match"] = etagCache[url]
    const response = await fetch(url, { method: "GET", headers: headers });
    let data: DataItem[];
    if (response.status === 200) { etagCache[url] = response.headers.get("ETag"); data = await response.json(); etagCache[`${url}_data`] = data; }
    else if (response.status === 304) { data = etagCache[`${url}_data`]; }
    displayFolderContents(data, folderPath == "", showLoading);
}

async function addContextListeners() {

    document.getElementById("context-download").addEventListener("click", () => {
        const contextMenu = document.getElementById("item-context-menu");
        downloadFileFromRepo(contextMenu.dataset.path.slice(contextMenu.dataset.path.lastIndexOf("/")), contextMenu.dataset.url)
    });

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
        }).then(() => { loadFolderContents(document.getElementById("path").dataset.path, false) })
    });

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
        }).then(() => { loadFolderContents(document.getElementById("path").dataset.path, false) })
    });

    document.getElementById("context-rename").addEventListener("click", async () => {
        const contextMenu = document.getElementById("item-context-menu")
        const item_sha = contextMenu.dataset.sha
        const item_path = contextMenu.dataset.path
        const item_name = contextMenu.dataset.name
        const new_name = prompt("Enter new name", item_name)
        if (new_name) {
            const currentDir = document.getElementById("path").dataset.path
            const lastCommitRef = await utils.api("GET", "/git/ref/heads/main")
            const rootTree: TreeData = await utils.api("GET", `/git/trees/${lastCommitRef.object.sha}`)
            let newRootTree: TreeData;
            if (currentDir == "") {
                const newRootTreeItems = rootTree.tree.map(item => {
                    if (item.sha == item_sha) return {path: new_name, mode: item.mode, type: item.type, sha: item.sha}
                    else return item
                })
                newRootTree = await utils.api("POST", "/git/trees", {tree: newRootTreeItems});
            } else {
                const newTreeItems = currentContent.map(item => {
                    if (item.type == "file") return {path: item.name, mode: "100644", type: "blob", sha: item.sha}
                    else return {path: item.name, mode: "040000", type: "tree", sha: item.sha}
                }).map(item => {
                        if (item.sha == item_sha) return {path: new_name, mode: item.mode, type: item.type, sha: item.sha}
                        else return item
                });
                const newTree = await utils.api("POST", "/git/trees", {tree: newTreeItems});
                newRootTree = await utils.api("POST", "/git/trees", {
                    base_tree: rootTree.sha,
                    tree: [{path: currentDir, mode: "040000", type: "tree", sha: newTree.sha}]
                });
            }
            const newCommit = await utils.api("POST", "/git/commits", {
                message: `${utils.getDateTime()} --> Rename ${item_path} to ${new_name}`,
                tree: newRootTree.sha, parents: [lastCommitRef.object.sha]
            });
            utils.api("PATCH", "/git/refs/heads/main", {sha: newCommit.sha}).then(() => {
                loadFolderContents(document.getElementById("path").dataset.path, false);
            });
        }
    });

    document.getElementById("context-delete").addEventListener("click", async () => {
        const contextMenu = document.getElementById("item-context-menu")
        const item_path = contextMenu.dataset.path
        const item_sha = contextMenu.dataset.sha;
        if (contextMenu.dataset.type == "dir") {
            const self_tree: TreeData = await utils.api("GET", `/git/trees/${item_sha}`);
            if (self_tree.tree.length == 1)
                utils.api("DELETE", `/contents/${item_path}/${self_tree.tree[0].path}`, {
                    message: `${utils.getDateTime()} --> Delete ${item_path}`,
                    sha: self_tree.tree[0].sha
                }).then(() => { loadFolderContents(document.getElementById("path").dataset.path, false) })
            else {
                if (contextMenu.dataset.large_file != "true")
                    if (!confirm("This folder is not empty, are you sure you want to delete it?")) return;
                const currentDir = document.getElementById("path").dataset.path
                const lastCommitRef = await utils.api("GET", "/git/ref/heads/main")
                const rootTree: TreeData = await utils.api("GET", `/git/trees/${lastCommitRef.object.sha}`)
                let newRootTree: TreeData;
                if (currentDir == "") {
                    const newRootTreeItems: TreeItem[] = rootTree.tree.filter(item => item.sha != item_sha)
                    newRootTree = await utils.api("POST", "/git/trees", {tree: newRootTreeItems});
                } else {
                    const newTreeItems = currentContent.map(item => {
                        if (item.type == "file") return {path: item.name, mode: "100644", type: "blob", sha: item.sha}
                        else return {path: item.name, mode: "040000", type: "tree", sha: item.sha}
                    }).filter(item => item.sha != item_sha);
                    const newTree = await utils.api("POST", "/git/trees", {tree: newTreeItems});
                    newRootTree = await utils.api("POST", "/git/trees", {
                        base_tree: rootTree.sha,
                        tree: [{path: currentDir, mode: "040000", type: "tree", sha: newTree.sha}]
                    });
                }
                const newCommit = await utils.api("POST", "/git/commits", {
                    message: `${utils.getDateTime()} --> Delete ${item_path}`,
                    tree: newRootTree.sha, parents: [lastCommitRef.object.sha]
                });
                utils.api("PATCH", "/git/refs/heads/main", {sha: newCommit.sha}).then(() => {
                    loadFolderContents(document.getElementById("path").dataset.path, false);
                });
            }
        } else if (contextMenu.dataset.type == "file")
            utils.api("DELETE", `/contents/${contextMenu.dataset.path}?ref=main`, {
                message: `${utils.getDateTime()} --> Delete ${contextMenu.dataset.path}`,
                sha: contextMenu.dataset.sha
            }).then(() => { loadFolderContents(document.getElementById("path").dataset.path, false) })
    });

    document.getElementById("context-compress").addEventListener("click", async () => {
        alert("This feature is not available yet, please try again later")
        // const contextMenu = document.getElementById("item-context-menu")
        // utils.api("POST", "/actions/workflows/GhostStorageManager.yml/dispatches", {
        //     ref: "main", inputs: {
        //         command: "Compress",
        //         path: "/"+contextMenu.dataset.path
        //     }
        // }).then(() => { alert("Your folder is being compressed, this process might take few minutes, please check after some time"); })
    });

    document.getElementById("context-select-items").addEventListener("click", () => {
        selectionMode = true;
    });

    document.getElementById("context-help").addEventListener("click", () => {
        document.getElementById("keyboard-shortcuts")!.style.display = "initial";
    });

    document.getElementById("context-disable-admin").addEventListener("click", () => {
        adminMode = false;
        loadFolderContents(document.getElementById("path").dataset.path)
    });

    document.getElementById("context-change-theme").addEventListener("click", () => {
        const themeElement = document.getElementById("theme") as HTMLLinkElement;
        themeElement.href = (themeElement.href.includes("dark.css")) ? "assets/css/themes/light.css" : "assets/css/themes/dark.css"
    });

    document.getElementById("context-selection-unselect").addEventListener("click", () => {
        Array.from(document.getElementsByClassName("selected")).forEach(item => item.classList.remove("selected"))
        selectionMode = false;
    });

    document.getElementById("context-selection-hide").addEventListener("click", async () => {
        const ghostFile = currentContent.filter(file => file.name == ".ghost")[0]
        const ghostData: GhostData = await fetchGhostConfig(currentContent)
        const items = Array.from(document.getElementsByClassName("selected")).map(item => item.id);
        if (ghostData.hidden) ghostData.hidden = ghostData.hidden.concat(items)
        else ghostData.hidden = items
        fetch(ghostFile.url, {
            method: "PUT",
            headers: { Authorization: `token ${githubToken}`, Accept: "application/json" },
            body: JSON.stringify({
                message: `${utils.getDateTime()} --> Hidden ${items.join(", ")}`,
                content: btoa(JSON.stringify(ghostData)),
                sha: ghostFile.sha
            })
        }).then(() => { loadFolderContents(document.getElementById("path").dataset.path, false) })
    });

    document.getElementById("context-selection-unhide").addEventListener("click", async () => {
        const ghostFile = currentContent.filter(file => file.name == ".ghost")[0]
        const ghostData: GhostData = await fetchGhostConfig(currentContent)
        const items = Array.from(document.getElementsByClassName("selected")).map(item => item.id);
        if (ghostData.hidden) ghostData.hidden = ghostData.hidden.filter((item: string) => items.indexOf(item) == -1)
        else ghostData.hidden = items
        fetch(ghostFile.url, {
            method: "PUT",
            headers: { Authorization: `token ${githubToken}`, Accept: "application/json" },
            body: JSON.stringify({
                message: `${utils.getDateTime()} --> Hidden ${items.join(", ")}`,
                content: btoa(JSON.stringify(ghostData)),
                sha: ghostFile.sha
            })
        }).then(() => { loadFolderContents(document.getElementById("path").dataset.path, false) })
    });

    document.getElementById("context-selection-delete").addEventListener("click", async () => {
        const items = Array.from(document.getElementsByClassName("selected")).map((item: HTMLElement) => item.dataset.sha);
        const currentDir = document.getElementById("path").dataset.path
        const lastCommitRef = await utils.api("GET", "/git/ref/heads/main")
        const rootTree: TreeData = await utils.api("GET", `/git/trees/${lastCommitRef.object.sha}`)
        let newRootTree: TreeData;
        if (currentDir == "") {
            const newRootTreeItems = rootTree.tree.filter(item => items.indexOf(item.sha) == -1)
            newRootTree = await utils.api("POST", "/git/trees", {tree: newRootTreeItems});
        } else {
            const newTreeItems = currentContent.map(item => {
                if (item.type == "file") return {path: item.name, mode: "100644", type: "blob", sha: item.sha}
                else return {path: item.name, mode: "040000", type: "tree", sha: item.sha}
            }).filter(item => items.indexOf(item.sha) == -1);
            const newTree = await utils.api("POST", "/git/trees", {tree: newTreeItems});
            newRootTree = await utils.api("POST", "/git/trees", {
                base_tree: rootTree.sha,
                tree: [{path: currentDir, mode: "040000", type: "tree", sha: newTree.sha}]
            });
        }
        const newCommit = await utils.api("POST", "/git/commits", {
            message: `${utils.getDateTime()} --> Delete ${items.join(", ")}`,
            tree: newRootTree.sha, parents: [lastCommitRef.object.sha]
        });
        utils.api("PATCH", "/git/refs/heads/main", {sha: newCommit.sha}).then(() => {
            loadFolderContents(document.getElementById("path").dataset.path, false);
        });
    });

    document.getElementById("context-selection-selectall").addEventListener("click", () => {
        Array.from(document.getElementsByClassName("item-main")).forEach(item => {
            if (!item.id.startsWith(".ghost")) item.classList.add("selected")
        });
    });

}

async function addListeners() {

    document.getElementById("search_bar_input").addEventListener("keyup", event => {
        const searchInput = (document.getElementById("search_bar_input") as HTMLInputElement).value;
        const items = document.getElementsByClassName("item") as unknown as Array<HTMLElement>;
        console.log(event.key)
        if (event.key == "Escape") {
            (document.getElementById("search_bar_input") as HTMLInputElement).value = "";
            document.getElementById("search_bar_input").blur();
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
            await new Promise<void>(async (resolve, reject) => {
                if (file.size > fileSizeLimit) {
                    const chunks = makeFileChunks(file);
                    for (const chunk of chunks) {
                        await new Promise<void>((resolve, reject) => {
                            reader.onload = async () => {
                                await uploadFileToRepo(file, (reader.result as String).split(",")[1], {fileNo: index, filesCount: files.length}, undefined, {chunked: true, chunkNumber: chunk.chunkNumber});
                                resolve();
                            }
                            reader.readAsDataURL(chunk.content as Blob);
                        });
                    }
                    const ghostFile = currentContent.filter(file => file.name == ".ghost")[0]
                    const ghostData: GhostData = await fetchGhostConfig(currentContent)
                    if (ghostData.lf) ghostData.lf.push(file.name)
                    else ghostData.lf = [file.name]
                    await fetch(`https://api.github.com/repos/${username}/${repo}/actions/workflows/GhostStorageManager.yml/dispatches`, {
                        method: "POST",
                        headers: { Authorization: `token ${githubToken}`, Accept: "application/json" },
                        body: JSON.stringify({ ref: "main", inputs: {
                            command: "Rechunk",
                            path: document.getElementById("path").dataset.path + "/" + file.name
                        }})
                    });
                    await fetch(ghostFile.url, {
                        method: "PUT",
                        headers: { Authorization: `token ${githubToken}`, Accept: "application/json" },
                        body: JSON.stringify({
                            message: `${utils.getDateTime()} --> Added ${file.name} to large files`,
                            content: btoa(JSON.stringify(ghostData)),
                            sha: ghostFile.sha
                        })
                    }).then(response => { alert("Your file was uploaded, it will take few minutes to process the file before you can access it"); reloadFolderContents(); })
                    resolve();
                } else {
                    reader.onload = async () => {
                        await uploadFileToRepo(file, (reader.result as String).split(",")[1], {fileNo: index, filesCount: files.length});
                        resolve();
                    }
                    reader.readAsDataURL(file);
                }
            })
        }
    });

    document.getElementById("reload_folder_contents").addEventListener("click", reloadFolderContents);
    document.getElementById("parent_folder").addEventListener("click", openParentFolder);

    document.getElementById("preview_download_file").addEventListener("click", () => {
        const fileName = document.getElementById("preview_name").innerText;
        let fileDataUrl;
        if (utils.getPreviewType(fileName) == "image")
            fileDataUrl = (document.getElementById("image_preview") as HTMLImageElement).src
        else if (utils.getPreviewType(fileName) == "pdf")
            fileDataUrl = (document.getElementById("pdf_preview") as HTMLIFrameElement).src;
        else if (utils.getPreviewType(fileName) == "cod") {
            const previewElem = (document.getElementById("code_preview") as HTMLElement);
            const fileData = previewElem.innerText;
            const byteArray = new Uint8Array(fileData.length);
            for (let i = 0; i < fileData.length; i++) byteArray[i] = fileData.charCodeAt(i);
            const blob = new Blob([byteArray], { type: "text/plain" });
            fileDataUrl = URL.createObjectURL(blob);
        } else if (utils.getPreviewType(fileName) == "audio")
            fileDataUrl = (document.getElementById("audio_preview") as HTMLAudioElement).src;
        else if (utils.getPreviewType(fileName) == "video")
            fileDataUrl = (document.getElementById("video_preview") as HTMLVideoElement).src;
        const element = document.createElement("a")
        element.href = fileDataUrl;
        element.download = document.getElementById("preview_name").innerText
        element.click()

    })

    document.getElementById("close_preview").addEventListener("click", () => {
        document.getElementById("preview_popup").style.visibility = "hidden";
        document.getElementById("preview_name").innerText = "";
        (document.getElementById("image_preview") as HTMLImageElement).src = "";
        (document.getElementById("code_preview") as HTMLElement).innerHTML = "";
        (document.getElementById("pdf_preview") as HTMLIFrameElement).src = "";
        (document.getElementById("audio_preview") as HTMLAudioElement).pause();
        (document.getElementById("audio_preview") as HTMLAudioElement).src = "";
        (document.getElementById("video_preview") as HTMLAudioElement).pause();
        (document.getElementById("video_preview") as HTMLAudioElement).src = "";
        document.getElementById("image_preview").style.display = "none"
        document.getElementById("text_preview").style.display = "none"
        document.getElementById("pdf_preview").style.display = "none"
        document.getElementById("audio_preview").style.display = "none"
        document.getElementById("preview_container").replaceChild(
            document.getElementById("image_preview").cloneNode(),
            document.getElementById("image_preview")
        );
        document.getElementById("preview_container").replaceChild(
            document.getElementById("audio_preview").cloneNode(),
            document.getElementById("audio_preview")
        );
        document.getElementById("preview_container").replaceChild(
            document.getElementById("text_preview").cloneNode(true),
            document.getElementById("text_preview")
        );
        document.getElementById("preview_container").replaceChild(
            document.getElementById("pdf_preview").cloneNode(),
            document.getElementById("pdf_preview")
        );
    })

    document.body.addEventListener("click", event => {
        document.getElementById("screen-context-menu").style.display = "none";
        document.getElementById("item-context-menu").style.display = "none";
        document.getElementById("selection-context-menu").style.display = "none";
        if (!(event.target as HTMLElement).closest("#keyboard-shortcuts") && !(event.target as HTMLElement).closest("#context-help")) document.getElementById("keyboard-shortcuts")!.style.display = "none";
        document.getElementById("item-context-menu").dataset.path = "";
        if (event.clientX > window.innerWidth - 30 && event.clientY > window.innerHeight - 30) { adminMode = adminMode ? false : true; loadFolderContents(document.getElementById("path").dataset.path) }
        if (!(event.target as HTMLElement).closest("div.item") && !(event.target as HTMLElement).closest(".context-menu")) {
            selectionMode = false;
            Array.from(document.getElementsByClassName("selected")).forEach((e: HTMLElement) => e.classList.remove("selected"));
        }
    });

    document.body.addEventListener("contextmenu", event => {
        event.preventDefault();
        if ((event.target == document.body || (event.target as HTMLElement).id == "main") && !selectionMode) {
            document.getElementById("item-context-menu")!.style.display = "none";
            document.getElementById("item-context-menu")!.dataset.path = "";

            const contextMenu = document.getElementById("screen-context-menu");

            const disableAdminButton = document.getElementById("context-disable-admin");
            const uploadFileButton = document.getElementById("context-upload-file");
            const createFolderButton = document.getElementById("context-create-folder");
            const selectItemsButton = document.getElementById("context-select-items");
            
            const contextLightThemeIcon = document.getElementById("context-light-theme-icon");
            const contextDarkThemeIcon = document.getElementById("context-dark-theme-icon");

            const themeElement = document.getElementById("theme") as HTMLLinkElement;

            if (adminMode) {
                disableAdminButton.style.display = "list-item";
                createFolderButton.style.display = "list-item";
                uploadFileButton.style.display = "list-item";
                selectItemsButton.style.display = "list-item";
                document.getElementById("screen-context-hr").style.display = "block"
            } else {
                disableAdminButton.style.display = "none";
                selectItemsButton.style.display = "none";
                if (document.getElementById("path").dataset.path == "") {
                    createFolderButton.style.display = "none";
                    uploadFileButton.style.display = "none";
                    document.getElementById("screen-context-hr").style.display = "none"
                } else {
                    createFolderButton.style.display = "list-item";
                    uploadFileButton.style.display = "list-item";
                    document.getElementById("screen-context-hr").style.display = "block"
                }
            }
            
            if (themeElement.href.includes("dark.css")) {
                contextLightThemeIcon.style.display = "initial";
                contextDarkThemeIcon.style.display = "none";
            } else {
                contextLightThemeIcon.style.display = "none";
                contextDarkThemeIcon.style.display = "initial";
            }
            
            contextMenu.removeAttribute("style")
            contextMenu.style.display = "initial"
            const menuHeight = parseInt(window.getComputedStyle(contextMenu).height.replace(/px/g, ''));
            const menuWidth = parseInt(window.getComputedStyle(contextMenu).width.replace(/px/g, ''));
            if (event.clientY < window.innerHeight - menuHeight - 10) { contextMenu.style.top = `${event.clientY}px`; }
            else { contextMenu.style.bottom = `${window.innerHeight - event.clientY}px`; }
            if (event.clientX < window.innerWidth - menuWidth - 10) { contextMenu.style.left = `${event.clientX}px`; }
            else { contextMenu.style.right = `${window.innerWidth - event.clientX}px`; }
        }
        if (selectionMode) {
            const contextMenu = document.getElementById("selection-context-menu");
            contextMenu.removeAttribute("style")
            contextMenu.style.display = "initial"
            const menuHeight = parseInt(window.getComputedStyle(contextMenu).height.replace(/px/g, ''));
            const menuWidth = parseInt(window.getComputedStyle(contextMenu).width.replace(/px/g, ''));
            if (event.clientY < window.innerHeight - menuHeight - 10) { contextMenu.style.top = `${event.clientY}px`; }
            else { contextMenu.style.bottom = `${window.innerHeight - event.clientY}px`; }
            if (event.clientX < window.innerWidth - menuWidth - 10) { contextMenu.style.left = `${event.clientX}px`; }
            else { contextMenu.style.right = `${window.innerWidth - event.clientX}px`; }
        }
    });

    document.body.addEventListener("keydown", event => {
        document.getElementById("screen-context-menu")!.style.display = "none";
        document.getElementById("item-context-menu")!.style.display = "none";
        document.getElementById("item-context-menu")!.dataset.path = "";
        document.getElementById("keyboard-shortcuts")!.style.display = "none";

        if (event.key == "Backspace" && (event.target as HTMLElement).tagName.toLowerCase() !== "input") {
            event.preventDefault();
            openParentFolder();
        }

        if (event.key === "Escape") {
            (document.getElementById("new_folder_name") as HTMLInputElement).value = "";
            document.getElementById("new_folder_name").blur();
            document.getElementById("close_preview").click();
            document.getElementById("selection-context-menu").style.display = "none";
            Array.from(document.getElementsByClassName("selected")).forEach((e: HTMLElement) => e.classList.remove("selected"));
            selectionMode = false;
        }

        if (event.key.toUpperCase() === "F" && event.ctrlKey) {
            event.preventDefault();
            document.getElementById("new_folder_name").focus();
        }

        if (event.key.toUpperCase() === "S" && event.ctrlKey) {
            event.preventDefault();
            reloadFolderContents();
        }

        if ((event.key === "/" || event.key === "?") && event.ctrlKey) {
            event.preventDefault();
            document.getElementById("search_bar_input").focus();
        }

        if (event.key.toUpperCase() === "K" && event.ctrlKey) {
            event.preventDefault();
            document.getElementById("keyboard-shortcuts")!.style.display = "initial";
        }

        if (selectionMode) {
            if (event.key.toUpperCase() === "A" && event.ctrlKey) {
                event.preventDefault();
                document.getElementById("context-selection-selectall").click();
            }
            if (event.key.toUpperCase() === "H" && event.ctrlKey) {
                event.preventDefault();
                document.getElementById("context-selection-hide").click();
            }
            if (event.key.toUpperCase() === "U" && event.ctrlKey) {
                event.preventDefault();
                document.getElementById("context-selection-unhide").click();
            }
            if (event.key == "Delete") {
                event.preventDefault();
                document.getElementById("context-selection-delete").click();
            }
        } else {
            if (event.key.toUpperCase() === "H" && event.ctrlKey) {
                event.preventDefault();
                loadFolderContents("")
            }

            if (event.key.toUpperCase() === "U" && event.ctrlKey) {
                event.preventDefault();
                if (document.getElementById("path").dataset.path != "") {
                    document.getElementById("files_input").click();
                } else {
                    if (adminMode) document.getElementById("files_input").click();
                }
            }
        }

    });

    document.body.addEventListener("keypress", event => {

        if (event.key == "\u03a9") {
            adminMode = adminMode ? false : true;
            loadFolderContents(document.getElementById("path").dataset.path)
        }

    });

    document.body.addEventListener("dragover", event => {
        if (event.dataTransfer && event.dataTransfer.types.includes("Files")) {
            event.preventDefault(); 
            document.getElementById("upload_files").classList.add("dragging")
        }
    })

    document.body.addEventListener("dragleave", event => {
        if (event.relatedTarget == null)
            document.getElementById("upload_files").classList.remove("dragging")
    });

    addContextListeners()
}

async function main() {
    let failed_password_tries = 0;
    document.getElementById("password_input").addEventListener("keydown", async event => {
        if (event.key == "Enter") {
            const user_input_pass = (document.getElementById("password_input") as HTMLInputElement).value;
            if (await verifyPassword(user_input_pass)) {
                addListeners()
                githubToken = await extractToken();
                utils.setup(
                    await (await fetch("assets/resources/icons.json", { method: "GET" })).json(),
                    { token: githubToken, username: username, repo: repo }
                );
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
    });
}

main()
