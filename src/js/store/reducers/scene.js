import {
    OPEN_SCENE,
    CLOSE_SCENE,
    SET_ACTIVE_FILE,
    ADD_FILE,
    REMOVE_FILE,
    MARK_FILE_CLEAN,
    MARK_FILE_DIRTY,
    STASH_DOCUMENT,
} from '../actions';

const initialState = {
    // The counter increments each time a scene is open or closed
    counter: 0,
    // Indicates which of the files are currently active
    activeFileIndex: null,
    // Indicates which of the files is the main scene file (usually the
    // first one)
    rootFileIndex: null,
    // An array of object that describe the files that are "opened"
    files: [],
};

/*
What is a file object? A file object can contain the following properties:

    File metadata properties

    - filename (string)
        e.g. "scene.yaml". Taken from the original file name (either from disk)
        or parsed from URL, if present. Includes the extension, if any. Can
        be renamed. Not required. A `null` or `undefined` value will be
        displayed as `untitled` in an editor tab, and when saved, a useful
        default should be provided (e.g. `scene.yaml` for root scene files).
        NOTE: only main scene files can be renamed; imported scene files
        are currently "read-only".
    - root (boolean)
        is `true` for the "main" or root scene file. Not required; non-root
        scene files do not require this property. Only one scene file should
        be `root`, typically the first one (index zero) in the `files` array.
        This should match the `rootFileIndex` property (NOTE: re-consider this
        if it's too easy to make this go out of sync). (another NOTE: re-consider
        this if it's also too easy to have more than one root file accidentally.)
    - original_base_path (string)
        used by Tangram to know where to load resources from.
    - original_url (string)
        when contents are edited, a new Blob URL is formed from the contents
        so that it can be loaded into Tangram. This property remembers where
        the original URL is loaded from, if any.
    - is_clean (boolean)
        whether the file is "dirty" (not saved) or "clean" (has been saved).
        Unlike other editor state properties (see below), this is always updated
        so that UI can reflect this condition at all times. This should sync
        with CodeMirror state; however, when recovering application state this
        property sets CodeMirror's state via `doc.markClean()`.

    Editor state properties
    These properties are NOT guaranteed to sync with editor state, as that
    could get expensive. Instead, they are meant to be written to only when
    the document needs to be stashed in memory (e.g. to swap in another
    document, or when the user closes Tangram Play) by reading values from
    CodeMirror. If the file is later re-displayed (either by swapping it in,
    or when application state is recovered by opening Tangram Play in another
    session) these properties are read from memory and written to CodeMirror.

    - contents (string)
        text content of the body of the file. May be read directly from the disk
        or from URL prior to injecting in editor or may be retrieved from the
        editor itself.
    - cursor (object)
        an Object containing properties `ch` and `line` (CodeMirror syntax)
        defining the current position of the cursor in the file.
    - scrollInfo (object)
        an Object of signature `{left, top, width, height, clientWidth,
        clientHeight}` returned from `CodeMirror.getScrollInfo()`. This is
        obtained when a file is stashed and used to restore the original view.
*/

const scene = (state = initialState, action) => {
    switch (action.type) {
        case OPEN_SCENE:
            return {
                ...state,
                counter: state.counter + 1,
                files: [...action.files],
                // Set the active file to the first one in the index
                activeFileIndex: 0,
                rootFileIndex: 0,
            };
        case CLOSE_SCENE:
            return {
                ...state,
                counter: state.counter + 1,
                files: [],
                activeFileIndex: null,
                mainSceneFile: null,
            };
        case SET_ACTIVE_FILE:
            return {
                ...state,
                activeFileIndex: action.index,
            };
        case ADD_FILE: {
            // Append the added file to the current list of files.
            const fileList = [...state.files, action.file];

            // If the added file should become the new active file, set the
            // active file index to the the newly added file.
            const activeFileIndex = action.activate ? fileList.length - 1 : state.activeFileIndex;

            return {
                ...state,
                files: fileList,
                activeFileIndex,
            };
        }
        case REMOVE_FILE: {
            // Remove a file at fileIndex.
            // Creates a new array of files without mutating the original state
            const fileList = [
                ...state.files.slice(0, action.index),
                ...state.files.slice(action.index + 1),
            ];

            // If the active file index is now out of bounds, it must be set
            // to one that is in bounds. If the file removed is the last one,
            // activeFileIndex is set to -1. This should generally not be
            // allowed, as there should always be a "main scene file" present
            // to represent the scene, and removing the "main scene file"
            // should call CLOSE_SCENE instead to clean up properly.
            let activeFileIndex = state.activeFileIndex;
            if (activeFileIndex >= fileList.length - 1) {
                activeFileIndex = fileList.length - 1;
            }

            return {
                ...state,
                files: fileList,
                activeFileIndex,
            };
        }
        case MARK_FILE_CLEAN:
            // TODO: return new array of files with file object at fileIndex
            // toggled dirty property
            return {
                ...state,
                files: [
                    ...state.files.slice(0, action.fileIndex),
                    {
                        ...state.files[action.fileIndex],
                        is_clean: true,
                    },
                    ...state.files.slice(action.fileIndex + 1),
                ],
            };
        case MARK_FILE_DIRTY:
            return {
                ...state,
                files: [
                    ...state.files.slice(0, action.fileIndex),
                    {
                        ...state.files[action.fileIndex],
                        is_clean: false,
                    },
                    ...state.files.slice(action.fileIndex + 1),
                ],
            };
        case STASH_DOCUMENT:
            return {
                ...state,
                files: [
                    ...state.files.slice(0, action.index),
                    {
                        ...state.files[action.index],
                        buffer: action.buffer,
                    },
                    ...state.files.slice(action.index + 1),
                ],
            };
        default:
            return state;
    }
};

export default scene;
