import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { IndexeddbPersistence } from 'y-indexeddb'
/**
* @Class: The filesystem class to instantiate
*/
export class YjsFilesystem {

  public room: string
  private ydoc: Y.Doc
  /**
   * pass in any Providers that are of AbstractConnector type
   */
  private providers: Array<Y.AbstractConnector>
  /**
   * if true, yjs will use indexeddb to store the document locally and make it available immediately
   */
  private useIndexeddb: boolean
  private indexeddb
  /** 
   * Contains all file meta data
   */
  private fileMeta: Y.Map<Y.Map<string>>
  /**
   * Contains all file content. For now only text
   */
  private files: Y.Map<Y.Text> //Y.Map<any>

  /** 
   * contains all paths if a folder structure is used
  */
  private folders: Array<string>
  //private onlyTextFiles: boolean

  /**
   * 
   * @param params you can pass all or any parameter or just create it empty.
   * If you want to pass additional Providers, you have to:
   *   * first create a room name and a ydoc
   *   * then the providers
   *   * and then pass all of those as parameters
   */
  constructor(params: YjsFilesystem = {} as YjsFilesystem){
    let {
        room = (Math.floor(Math.random() * 100) + 1).toString(),
        ydoc = new Y.Doc(),
        providers = [new WebrtcProvider(room, ydoc)],
        useIndexeddb = true,
        folders = ["/"]
        //onlyTextFiles = true
    } = params
    this.room = room
    this.ydoc = ydoc
    this.providers = providers
    this.useIndexeddb = useIndexeddb
    this.folders = folders
    //this.onlyTextFiles = onlyTextFiles
    if(useIndexeddb) {
      this.indexeddb = new IndexeddbPersistence(room, ydoc)
    }
    
    this.fileMeta = ydoc.getMap('fileNames')
    this.files = ydoc.getMap('files')
  }
  /**
   * Returns the file id as string
   * @param name : name of the file
   */
  getFileId(name: string): string {
    for(let id in this.fileMeta){
      if(this.fileMeta[id].name == name) return id
    }
    throw new Error("File name not found");    
  }

  /**
   * Returns an array of metadata objects
   * @param folder : optional string for a folder. Only matches exact same string! use with caution
   */
  getFileList(folder?: string): Array<IFileMetaData> {
    let fileList = []
    for(let id in this.fileMeta){
      const file = JSON.parse(this.fileMeta.get(id).toJSON())      
      if(folder && file.folder && file.folder.equals(folder)){
        fileList.push(file)
      }
    }
    return fileList
  }

  observeFileList(callback: () => void): void {
    this.fileMeta.observe(callback)
  }
  /**
   * Returns the content of a file as Y.Text
   * @param name : name of the file
   */
  getFileContent(name: string): Y.Text {
    return this.files.get(this.getFileId(name))
  }
  /**
   * Returns the content of a file as Y.Text
   * @param id : file id as string
   */
  getFileContentById(id: string): Y.Text {
    return this.files.get(id)
  }
  /**
   * Creates a new file
   * Returns the id of the created file
   * ToDo: the folder creation should be a separate step
   * @param metadata all the metadata you want to put to create the file
   */
  createFile(metadata:IFileMetaData): string{
    const id = Date.now().toString()
    const fileMeta = this.fileMeta.set(id, new Y.Map())
    fileMeta.set("name", metadata.name)
    for(let param in metadata){
      fileMeta.set(param, metadata[param])
    }
    // create folder if new.
    // TODO: this should be separated in a createFolder function
    if(metadata.folder && !this.folders.includes(metadata.folder)){
      this.folders.push(metadata.folder)
    }
    // create the file content
    this.files.set(metadata.name, new Y.Text(metadata.content))

    return id
  }
  /**
   * Returns the id of the renamed file
   * @param oldName 
   * @param newName 
   */
  renameFileById(id:string, newName: string):string {
    this.fileMeta.get(id).set('name', newName)
    return id
  }
  /**
   * Returns the id of the renamed file
   * @param oldName 
   * @param newName 
   */
  renameFile(oldName: string, newName: string):string {
    const id = this.getFileId(oldName)
    this.renameFileById(id, newName)
    return id
  }
}

/**
 * Definition of all the metadata that can be saved for a file
 */
interface IFileMetaData {
    folder?: string
    content?: string
    created?: Date
    name: string
}