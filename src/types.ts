export enum DataItemType {
    file = "file",
    dir = "dir"
}

export interface DataItem {
    name: string,
    path: string,
    sha: string,
    size: number,
    url: string,
    html_url: string,
    git_url: string,
    download_url: string,
    type: DataItemType,
    content: string,
    encoding: string,
    _links: {
        self: string,
        git: string,
        html: string
    }
}

export enum TreeItemType {
    file = "blob",
    dir = "tree"
}

export interface TreeItem {
    path: string,
    mode: string,
    type: TreeItemType,
    sha: string,
    size?: number,
    url: string
}

export interface TreeData {
    sha: string,
    url: string,
    tree: TreeItem[],
    truncated: boolean
}

export interface GhostData {
    hidden?: Array<String>,
    lf?: Array<String>
}

export interface IconsData {
    defined: { [key: string]: string },
    folderNames: { [key: string]: string }
    fileNames: { [key: string]: string }
    fileExtensions: { [key: string]: string },
    iconSubparts: { [key: string]: number }
}

export interface DroppedItem {
    name: string,
    sha: string,
    type: string
}