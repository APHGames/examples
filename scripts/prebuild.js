const utils = require("./utils");
utils.deleteFolderRecursive("build", true);

// copy only assets
utils.copyFolderRecursiveSync("examples/assets/", "build/assets");