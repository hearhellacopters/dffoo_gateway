const readline = require('readline');
const keypress = require('keypress');
const path = require("path");
const fs = require('fs');
const os = require('os');
const yauzl = require('yauzl');
const { biwriter } = require('bireader');
const crypto = require('crypto').createHash;
const archiver = require('archiver');

var __dirname = (process.pkg) ? path.dirname(process.execPath) : __dirname;

function get_local_IPv4_address() {
    const interfaces = os.networkInterfaces();
  
    for (const interfaceName in interfaces) {
      const networkInterface = interfaces[interfaceName];
  
      for (const entry of networkInterface) {
        if (!entry.internal && entry.family === 'IPv4') {
          return entry.address;
        }
      }
    }
  
    return '127.0.0.1'; // Default to localhost if no external IPv4 address is found
};

const IPAddress = get_local_IPv4_address();

function MD5(msg) {
    return crypto("md5").update(msg).digest("hex");
}

function unzipWithProgressBar(sourceZip, outputLocation, unzipDirectory) {
    try {
        // Check if the file exists
        fs.accessSync(sourceZip, fs.constants.F_OK);
    } catch (error) {
        // File does not exist or there's an error accessing it
        console.log(`\x1b[31m[Error]\x1b[0m: Could not read file ${sourceZip}`)
        return make_exit();
    }
    //remove tmp if it's there
    if (fs.existsSync(outputLocation)) {
        fs.rm(outputLocation, { recursive: true }, () => { });
    }
    return new Promise((resolve, reject) => {
        // Open the source zip file
        yauzl.open(sourceZip, { lazyEntries: true }, (err, zipfile) => {
            if (err) reject(err);

            // Create output directory if it doesn't exist
            if (!fs.existsSync(outputLocation)) {
                fs.mkdirSync(outputLocation, { recursive: true });
            }

            // Initialize progress bar
            const totalEntries = zipfile.entryCount;
            var i = 1;

            zipfile.readEntry();
            zipfile.on('entry', (entry) => {
                if (entry.fileName.startsWith(unzipDirectory)) {
                    const relativePath = entry.fileName.substring(unzipDirectory.length);
                    if (/\/$/.test(relativePath)) {
                        // Directory entry, create if doesn't exist
                        const dirPath = outputLocation + relativePath;
                        if (!fs.existsSync(dirPath)) {
                            fs.mkdirSync(dirPath, { recursive: true });
                        }
                        zipfile.readEntry();
                    } else {
                        // File entry, extract and update progress
                        zipfile.openReadStream(entry, (err, readStream) => {
                            if (err) reject(err);

                            const filePath = outputLocation + relativePath;
                            const writeStream = fs.createWriteStream(filePath);

                            readStream.pipe(writeStream);
                            readStream.on('end', () => {
                                writeStream.end();
                                zipfile.readEntry();
                                //progressBar.tick(); // Update progress bar
                            });
                        });
                    }
                } else {
                    zipfile.readEntry();
                }
                consoleLoadingBar(totalEntries, i++, "Unzipping");
            });

            zipfile.on('end', () => {
                resolve('\x1b[32m[Completed]\x1b[0m: Unzipping successfully');
            });

            zipfile.on('error', (err) => {
                reject(err);
            });
        });
    });
}

async function readFileIfExists(filePath, w_error) {
    try {
        // Check if the file exists
        fs.accessSync(filePath, fs.constants.F_OK);

        // Read the contents of the file
        const content = fs.readFileSync(filePath);
        return content;
    } catch (error) {
        // File does not exist or there's an error accessing it
        if(w_error){
            console.log(`\x1b[31m[Error]\x1b[0m: Could not read file ${filePath}`);
        };
        return null;
    }
}

function armStrbInstr(num) {
    // Ensure that num is a non-negative integer within the valid range
    if (!Number.isInteger(num) || num < 0 || num > 0xFFF) {
        throw new Error('Immediate offset must be a non-negative integer within the range 0 to 4095 (0xFFF).');
    }

    // Convert the number to binary and pad to 12 bits
    const binaryString = num.toString(2).padStart(14, '0');
    const OneF = "00011111";
    const ThreeNine = "00111001";
    // Construct the binary representation of the ARM64 instruction
    const binaryInstruction = `${OneF}${binaryString.slice(8, 14)}00${binaryString.slice(0, 8)}${ThreeNine}`;

    // Convert the binary representation to hexadecimal
    const hexInstruction = parseInt(binaryInstruction, 2).toString(16).toUpperCase();

    return hexInstruction;
}

function parseIntLE(hexString) {
    // Reverse the order of bytes in the hex string
    const reversedHexString = hexString.match(/.{2}/g).reverse().join('');

    // Parse the reversed hex string as an integer
    const result = parseInt(reversedHexString, 16);

    return result;
}

function consoleLoadingBar(totalSteps, currentStep, action) {
    var barLength = 40
    // Calculate the percentage completed
    const percentage = (currentStep / totalSteps) * 100;

    // Calculate the number of bars to display
    const bars = Math.floor((barLength * currentStep) / totalSteps);

    // Create the loading bar string
    const loadingBar = '[' + '='.repeat(bars) + '>'.repeat(bars < barLength ? 1 : 0) + ' '.repeat(barLength - bars) + ']';

    // Print the loading bar to the console
    process.stdout.clearLine(); // Clear the previous line
    process.stdout.cursorTo(0); // Move the cursor to the beginning of the line
    process.stdout.write(`\x1b[32m[${action}]: ${loadingBar}\x1b[0m ${percentage.toFixed(2)}% `); // Display the loading bar
}

async function ask(message) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });
    return new Promise((resolve) => {
        rl.question(message, (answer) => {
            resolve(answer)
        })
    });
}

async function promptWithMultipleChoice(question, choices) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });
    // Display the question and choices
    console.log(question);
    choices.forEach((choice, index) => {
        console.log(`${index + 1}. ${choice}`);
    });

    try {
        // Wait for user input
        const userChoiceIndex = await new Promise((resolve, reject) => {
            rl.question('Enter the number of your choice: ', (answer) => {
                if (answer == "1" || answer == "2") {
                    resolve(answer);
                } else {
                    console.log('\x1b[33m[Warning]\x1b[0m: Must be GL or JP.')
                    reject();
                }
            });
        });

        // Close the readline interface
        rl.close();

        // Parse the user's choice
        const choiceIndex = parseInt(userChoiceIndex, 10);

        // Validate the choice
        if (isNaN(choiceIndex) || choiceIndex < 1 || choiceIndex > choices.length) {
            throw new Error('Invalid choice. Please enter a valid number.');
        }

        // Return the selected choice
        return choices[choiceIndex - 1];
    } catch (error) {
        //console.error(error.message);
    }
}

async function make_exit() {
    // Enable keypress events on stdin
    keypress(process.stdin);

    console.log('Press any key to exit...');

    // Create a promise to handle key press
    const getKeyPress = () => new Promise(resolve => {
        process.stdin.on('keypress', (_, key) => {
            if (key) {
                resolve();
            }
        });

        // Set raw mode to capture all key events
        process.stdin.setRawMode(true);
        process.stdin.resume();
    });

    // Wait for key press
    await getKeyPress();

    // Clean up keypress events
    process.stdin.setRawMode(false);
    process.stdin.pause();
}

async function promptUser(msg) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });
    return new Promise((resolve, reject) => {
        rl.question(msg, input => {
            if (input.toLowerCase() !== "y") {
                reject();
            } else {
                resolve(input);
            }
        });
    });
}

async function createIPA(sourceFolder, outputZip) {
    return new Promise((resolve, reject) => {
        // Create output stream for the zip file
        const output = fs.createWriteStream(outputZip);

        // Create a new archiver instance
        const archive = archiver('zip', {
            zlib: { level: 9 } // Set compression level
        });

        // Pipe the output stream to the archive
        archive.pipe(output);

        // Add the entire folder to the archive
        archive.directory(sourceFolder, false);

        // Finalize the archive and handle events
        archive.finalize();

        // Listen for completion or error events
        output.on('close', () => {
            resolve('Folder successfully zipped');
        });

        archive.on('error', (err) => {
            reject(err);
        });
    });
}

//start
console.log("")
console.log("\x1b[35m                        ██████╗ ██╗███████╗███████╗██╗██████╗  █████╗                                \x1b[0m")
console.log("\x1b[35m                        ██╔══██╗██║██╔════╝██╔════╝██║██╔══██╗██╔══██╗                               \x1b[0m")
console.log("\x1b[35m                        ██║  ██║██║███████╗███████╗██║██║  ██║███████║                               \x1b[0m")
console.log("\x1b[35m                        ██║  ██║██║╚════██║╚════██║██║██║  ██║██╔══██║                               \x1b[0m")
console.log("\x1b[35m                        ██████╔╝██║███████║███████║██║██████╔╝██║  ██║                               \x1b[0m")
console.log("\x1b[35m                        ╚═════╝ ╚═╝╚══════╝╚══════╝╚═╝╚═════╝ ╚═╝  ╚═╝                               \x1b[0m")
console.log("\x1b[35m███████╗██╗███╗   ██╗ █████╗ ██╗         ███████╗ █████╗ ███╗   ██╗████████╗ █████╗ ███████╗██╗   ██╗\x1b[0m")
console.log("\x1b[35m██╔════╝██║████╗  ██║██╔══██╗██║         ██╔════╝██╔══██╗████╗  ██║╚══██╔══╝██╔══██╗██╔════╝╚██╗ ██╔╝\x1b[0m")
console.log("\x1b[35m█████╗  ██║██╔██╗ ██║███████║██║         █████╗  ███████║██╔██╗ ██║   ██║   ███████║███████╗ ╚████╔╝ \x1b[0m")
console.log("\x1b[35m██╔══╝  ██║██║╚██╗██║██╔══██║██║         ██╔══╝  ██╔══██║██║╚██╗██║   ██║   ██╔══██║╚════██║  ╚██╔╝  \x1b[0m")
console.log("\x1b[35m██║     ██║██║ ╚████║██║  ██║███████╗    ██║     ██║  ██║██║ ╚████║   ██║   ██║  ██║███████║   ██║   \x1b[0m")
console.log("\x1b[35m╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝    ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝╚══════╝   ╚═╝   \x1b[0m")
console.log("\x1b[35m        ██████╗ ██████╗ ███████╗██████╗  █████╗      ██████╗ ███╗   ███╗███╗   ██╗██╗ █████╗         \x1b[0m")
console.log("\x1b[35m       ██╔═══██╗██╔══██╗██╔════╝██╔══██╗██╔══██╗    ██╔═══██╗████╗ ████║████╗  ██║██║██╔══██╗        \x1b[0m")
console.log("\x1b[35m       ██║   ██║██████╔╝█████╗  ██████╔╝███████║    ██║   ██║██╔████╔██║██╔██╗ ██║██║███████║        \x1b[0m")
console.log("\x1b[35m       ██║   ██║██╔═══╝ ██╔══╝  ██╔══██╗██╔══██║    ██║   ██║██║╚██╔╝██║██║╚██╗██║██║██╔══██║        \x1b[0m")
console.log("\x1b[35m       ╚██████╔╝██║     ███████╗██║  ██║██║  ██║    ╚██████╔╝██║ ╚═╝ ██║██║ ╚████║██║██║  ██║        \x1b[0m")
console.log("\x1b[35m        ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝     ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝╚═╝  ╚═╝        \x1b[0m")
console.log("")
console.log("\x1b[35m                                                                                         ┏      •┏┓┏┓\x1b[0m")
console.log("\x1b[35m                                                                                         ╋┏┓┏┓  ┓┃┃┗┓\x1b[0m")
console.log("\x1b[35m                                                                                         ┛┗┛┛   ┗┗┛┗┛\x1b[0m")
console.log("")


const JP_hash = "f05969ff39f60d8de4c4b3e453d88822";
const JP_Base = 0xD012B0
const JP_Assets = 0xD012F0
const JP_Photon = 0xD01330

const JP_Base_Op = 0x265730
const JP_Base_Len = 0xCC4960

const JP_Bridge_Op = 0x84BADC
const JP_Bridge_Len = 0xCF13F0

const JP_Assets_Op = 0x7a7438
const JP_Assets_Len = 0xCF0200

const GL_hash = "f90eff3d629173803d32b1809ef5d630";
const GL_Base = 0xD7D1E0
const GL_Assets = 0xD7D220
const GL_Photon = 0xD7D260

const GL_Base_Op = 0x92AADC
const GL_Base_Len = 0xD5BAB0

const GL_Bridge_Op = 0x9AF9E4
const GL_Bridge_Len = 0xD71340

const GL_Assets_Op = 0x685CFC
const GL_Assets_Len = 0xD656E0

const CONSTS = {
    "JP": {
        hash: JP_hash,
        base: JP_Base,
        assets: JP_Assets,
        photon: JP_Photon,
        base_op: JP_Base_Op,
        base_len: JP_Base_Len,
        bridge_op: JP_Bridge_Op,
        bridge_len: JP_Bridge_Len,
        assets_op: JP_Assets_Op,
        assets_len: JP_Assets_Len,
    },
    "GL": {
        hash: GL_hash,
        base: GL_Base,
        assets: GL_Assets,
        photon: GL_Photon,
        base_op: GL_Base_Op,
        base_len: GL_Base_Len,
        bridge_op: GL_Bridge_Op,
        bridge_len: GL_Bridge_Len,
        assets_op: GL_Assets_Op,
        assets_len: GL_Assets_Len,
    }
}

/**
 * Function for merging all part zip files.
 * 
 * @param {String} directory - Zip location directory
 * @param {Array<String>} files - Files that should be in the directory
 * @param {String} output_path - Ouput directory
 * @returns {Promise<boolean|String>}
 */
function concat_files(directory, files, output_path) {
    return new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(output_path);

        // Increase the limit on error listeners for the writeStream
        writeStream.setMaxListeners(files.length + 1);

        function processFile(index) {
            if (index >= files.length) {
                // All files processed, close the write stream
                writeStream.end(() => {
                    resolve(true);
                });
                return;
            }

            const filePath = directory + files[index];

            const readStream = fs.createReadStream(filePath);

            readStream.on('error', (err) => {
                reject(`\x1b[31m[Error]\x1b[0m: reading file ${filePath}: ${err.message}`);
                make_exit();
            });

            writeStream.on('error', (err) => {
                reject(`\x1b[31m[Error]\x1b[0m: writing to output file: ${err.message}`);
                make_exit();
            });

            // Pipe the content of the current file to the write stream
            readStream.pipe(writeStream, { end: false });

            // When the current file is fully processed, move to the next one
            readStream.on('end', () => {
                processFile(index + 1);
            });
        }

        // Start processing the first file
        processFile(0);
    });
};

async function main() {
    //pick verison
    let ver;

    do {
        try {
            ver = await promptWithMultipleChoice("\x1b[36mWhat verison would you like to create?\x1b[0m", ["GL", "JP"])
        } catch (error) {
            console.log("\x1b[31m[Error]\x1b[0m: Invalid input.");
        }
    } while (!ver);

    console.log(`\x1b[32m[Accepted]\x1b[0m: ${ver}`);
    if(!(await readFileIfExists(__dirname + "/data.zip"))){
        console.log(`\x1b[36m[Merging]\x1b[0m: data.zip...`);
        const parts = ["/data.zip.001","/data.zip.002"];
        await concat_files(__dirname, parts, __dirname + "/data.zip");
        console.log(`\x1b[32m[Finished]\x1b[0m: data.zip merge complete!`);
        fs.rmSync(__dirname + "/data.zip", __dirname + "/_tmp/", { recursive: true, force: true });
        //console.log(`Cleaning up data.zip parts...`);
        //parts.forEach(file => {
        //    //delete file parts to save space.
        //    const filePath = __dirname + file;
        //    fs.unlinkSync(filePath);
        //});
        //console.log(`Clean up complete!`);
    };
    await unzipWithProgressBar(__dirname + "/data.zip", __dirname + "/_tmp/", ver);
    console.log("");
    console.log("\x1b[36m[Checking]\x1b[0m: File hash. Please wait...");
    const database = await readFileIfExists(__dirname + "/_tmp/Payload/OperaOmnia.app/OperaOmnia", true);
    const hash = MD5(database);
    if (hash != CONSTS[ver].hash) {
        console.log(`\x1b[31m[Error]\x1b[0m: Hash mismatch.\n${CONSTS[ver].hash} expected.\n${hash} received.\n`);
        make_exit()
    } else {
        console.log(`\x1b[32m[Accepted]\x1b[0m: Hash matched.`);
        //console.log(hash)
    }

    var url;
    do {
        try {
            console.log(`\x1b[36mEnter the new IP address / URL to the offline server (this device is using \x1b[33m${IPAddress}\x1b[0m\x1b[36m).\x1b[0m`);
            console.log(`\x1b[36mFor local IP addresses, it MUST include http, port and end with a forward slash.\x1b[0m`);
            console.log(`\x1b[36mExample: \x1b[33mhttp://${IPAddress}:8000/\x1b[0m\x1b[36m. Max length of 56 characters\x1b[0m`);
            const answer = await ask(`\x1b[33m[URL]\x1b[0m: `);
            if (answer.length >= 56 || answer.length <= 0) {
                console.log(`\x1b[31m[Error]\x1b[0m: Invalid URL length. Must be less than 56 characters.`);
            } else
            if(!answer.startsWith("http")){
                console.log(`\x1b[31m[Error]\x1b[0m: MUST start with http or https.`);
            } else
            if(!(answer.startsWith("http://") || answer.startsWith("https://"))){
                console.log(`\x1b[31m[Error]\x1b[0m: MUST start with https:// or http://.`);
            } else
            if(answer.endsWith("//")){
                console.log(`\x1b[31m[Error]\x1b[0m: MUST end with a forward slash '/'.`);
            } else 
            if(!answer.endsWith("/")){
                console.log(`\x1b[31m[Error]\x1b[0m: MUST end with a forward slash '/'.`);
            }
            else {
                const confrim = await promptUser(`\x1b[33m${answer}\x1b[0m\nIs this correct (Y/N)? `);
                if (confrim == "y") {
                    url = answer;
                }
            }
        } catch (error) {
            console.log("\x1b[31m[Error]\x1b[0m: Invalid input.");
        }
    } while (!url);
    console.log(`\x1b[32m[Accepted]\x1b[0m: ${url}`);

    const lib = new biwriter(database);

    const patch_total = 13;
    var i = 1;
    consoleLoadingBar(patch_total, i++, "Patching");
    lib.goto(CONSTS[ver].base);
    lib.string(url);
    consoleLoadingBar(patch_total, i++, "Patching");
    lib.goto(CONSTS[ver].base_len);
    lib.writeUInt32LE(url.length);
    consoleLoadingBar(patch_total, i++, "Patching");
    lib.goto(CONSTS[ver].base_op);
    const ops1 = armStrbInstr(url.length);
    lib.writeUInt32LE(parseIntLE(ops1));
    consoleLoadingBar(patch_total, i++, "Patching");
    lib.goto(CONSTS[ver].bridge_len);
    lib.writeUInt32LE(url.length);
    consoleLoadingBar(patch_total, i++, "Patching");
    lib.goto(CONSTS[ver].bridge_op);
    const ops2 = armStrbInstr(url.length);
    lib.writeUInt32LE(parseIntLE(ops2));
    consoleLoadingBar(patch_total, i++, "Patching");
    lib.goto(CONSTS[ver].assets);
    lib.string(url + "assets/");
    consoleLoadingBar(patch_total, i++, "Patching");
    lib.goto(CONSTS[ver].assets_len);
    lib.writeUInt32LE((url + "assets/").length);
    consoleLoadingBar(patch_total, i++, "Patching");
    lib.goto(CONSTS[ver].assets_op);
    const ops3 = armStrbInstr((url + "assets/").length);
    lib.writeUInt32LE(parseIntLE(ops3));
    consoleLoadingBar(patch_total, i++, "Patching");
    lib.goto(CONSTS[ver].photon);
    lib.string(url + "photon/");
    consoleLoadingBar(patch_total, i++, "Patching");
    fs.writeFileSync(__dirname + "/_tmp/Payload/OperaOmnia.app/OperaOmnia", lib.get());
    consoleLoadingBar(patch_total, i++, "Patching");
    const json_edit = await readFileIfExists(__dirname + "/_tmp/Payload/OperaOmnia.app/0000/mst_web_url_data.json", true);
    const json_edit2 = json_edit.toString().replace(/http:\/\/127\.0\.0\.1:8000\//gm, url);
    //const edit_hash = SHA1(json_edit2);
    //const edit_hash2 = SHA256(json_edit2);
    //const codesig = await readFileIfExists(__dirname + "/_tmp/Payload/OperaOmnia.app/_CodeSignature/CodeResources", true);
    //const codesig_file = codesig.toString().replace(/\*\*\*/gm, edit_hash);
    fs.writeFileSync(__dirname + "/_tmp/Payload/OperaOmnia.app/0000/mst_web_url_data.json", json_edit2);
    //fs.writeFileSync(__dirname + "/_tmp/Payload/OperaOmnia.app/_CodeSignature/CodeResources", codesig_file);
    consoleLoadingBar(patch_total, i++, "Patching");
    //const root_edit = await readFileIfExists(__dirname + "/_tmp/Payload/OperaOmnia.app/Settings.bundle/Root.plist", true);
    //const root_edit2 = root_edit.toString().replace(/\*\*\*/gm, url);
    //fs.writeFileSync(__dirname + "/_tmp/Payload/OperaOmnia.app/Settings.bundle/Root.plist", root_edit2);
    //const plist = await readFileIfExists(__dirname + "/_tmp/Payload/OperaOmnia.app/Info.plist", true);
    //const clean_url = url.match(/^[a-zA-Z]+:\/\/([^:/]+)/)[1];
    //const plist4 = plist.replace(/<key>cache-game.g.dissidiaff-oo.com<\/key>/, "<key>" + clean_url +"</key>");
    //const plist5 = plist4.replace(/<key>cache-game.dissidiaff-oo.com<\/key>/, "<key>" + clean_url +"</key>");
    //fs.writeFileSync(__dirname + "/_tmp/Payload/OperaOmnia.app/Info.plist", plist5);
    consoleLoadingBar(patch_total, i++, "Patching");
    console.log(`\n\x1b[32m[Completed]\x1b[0m: Finished Patching.`);
    console.log(`\x1b[36m[Creating]\x1b[0m: new .ipa file. Please wait...`);
    await createIPA(__dirname + "/_tmp",__dirname+`/OperaOmnia_${ver}.ipa`);
    console.log(`\x1b[32m[Success]\x1b[0m: IPA file created!`);
    console.log(`\x1b[36m[[Cleaning up]\x1b[0m: Please wait...`);
    if (fs.existsSync(__dirname + "/_tmp")) {
        fs.rm(__dirname + "/_tmp", { recursive: true }, () => { });
    }
    console.log(`\x1b[36m[Process Completed]\x1b[0m`);
    console.log("\x1b[33m"+__dirname+`\\OperaOmnia_${ver}.ipa\x1b[0m ready to be sideloaded!`)
    make_exit();
}

main();