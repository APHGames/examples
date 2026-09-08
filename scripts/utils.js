var fs = require("fs");
var path = require("path");

module.exports = {
	deleteFolderRecursive: function (dirPath, keepDir) {
		if (fs.existsSync(dirPath)) {
			// fs.rmSync handles Windows ENOTEMPTY / locked-temp cases better than manual rmdir
			fs.rmSync(dirPath, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
		}

		if (keepDir) {
			fs.mkdirSync(dirPath, { recursive: true });
		}
	},

	deleteFile: function (...paths) {
		paths.forEach(filePath => {
			if (fs.existsSync(filePath) && !fs.lstatSync(filePath).isDirectory()) {
				fs.unlinkSync(filePath);
			}
		});
	},

	copyFileSync: function (source, target) {
		let targetFile = target;
		//if target is a directory a new file with the same name will be created
		if (fs.existsSync(target)) {
			if (fs.lstatSync(target).isDirectory()) {
				targetFile = path.join(target, path.basename(source));
			}
		} else {
			module.exports.createDirAlongThePath(target);
		}
		fs.writeFileSync(targetFile, fs.readFileSync(source));
	},

	copyFolderRecursiveSync: function (source, target) {
		let targetFolder;

		if(!source.endsWith('/')) {
			//check if folder needs to be created or integrated
			targetFolder = path.join(target, path.basename(source));
			module.exports.createDirAlongThePath(targetFolder);
		} else {
			// copy content directly
			module.exports.createDirAlongThePath(target);
			targetFolder = target;
		} 
	
		//copy
		if (fs.existsSync(source) && fs.lstatSync(source).isDirectory()) {
			const files = fs.readdirSync(source);

			// skip folders that contain '.dontcopy' file
			if (!files.find(file => file === '.dontcopy')) {
				if (!fs.existsSync(targetFolder)) {
					fs.mkdirSync(targetFolder);
				}

				files.forEach(function (file) {
					var curSource = path.join(source, file);
					if (fs.lstatSync(curSource).isDirectory()) {
						module.exports.copyFolderRecursiveSync(curSource, targetFolder);
					} else {
						module.exports.copyFileSync(curSource, targetFolder);
					}
				});
			}
		}
	},

	searchFiles: function (startPath, filter, pathMask) {
		let output = [];

		if(Array.isArray(startPath)) {
			startPath.forEach(pathItem => {
				output = output.concat(module.exports.searchFiles(pathItem, filter, pathMask));
			})			
			return output;
		}

		if (!fs.existsSync(startPath)) {
			return output;
		}

		const files = fs.readdirSync(startPath);
		for (let i = 0; i < files.length; i++) {
			const filename = path.join(startPath, files[i]);
			const stat = fs.lstatSync(filename);
			if (stat.isDirectory() && !filename.includes('node_modules')) {
				output = output.concat(module.exports.searchFiles(filename, filter, pathMask));
			}
			else if ((!pathMask || startPath.indexOf('/' + pathMask + '/') >= 0 || startPath.endsWith(pathMask)) 
			&& (!filter || (Array.isArray(filter) && filter.filter(f => filename.indexOf(f) >= 0).length)  || filename.indexOf(filter) >= 0)) {
				output.push(filename);
			};
		};
		return output;
	},

	fileToStr: function (filePath) {
		const file = fs.readFileSync(filePath, "utf8");
		return file;
	},

	strToFile: function (filePath, content) {
		module.exports.createDirAlongThePath(filePath);
		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
		}
		fs.writeFileSync(filePath, content);
	},

	createDirAlongThePath: function (filePath) {
		const dirname = path.dirname(filePath);
		if (fs.existsSync(dirname)) {
			return true;
		}
		module.exports.createDirAlongThePath(dirname);
		fs.mkdirSync(dirname);
	}
}
