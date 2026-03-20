const fs = require("fs");
const { replaceTscAliasPaths } = require("tsc-alias");

const writeFile = (path, data) => {
    fs.writeFile(path, JSON.stringify(data), (err) => {
        if (err) throw err;
    });
};

function postBuild(dirpath) {
    writeFile(`${dirpath}/dist/esm/package.json`, {
        "type": "module",
    });
    writeFile(`${dirpath}/dist/cjs/package.json`, {
        "type": "commonjs",
    });

    replaceTscAliasPaths({
        tsconfigPath: `${dirpath}/tsconfig.json`,
        outDir: `${dirpath}/dist/types`,
    });
}

postBuild(__dirname);
