const utils = require('./utils');
const logger = require('./logger');

// Character list for valid characters in encryptors
let DECRYPTED = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t",
    "u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U",
    "V", "W", "X", "Y", "Z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "?", ">",
    "<", "`", "~", "-", "_", "+", "=", "]", "[", "{", "}", "/", "|"];
// Character Lists for encrypted versions of lists
let ENCRYPTED1 = ["YQzl9", "grnuv", "4POI6", "VvJcG", "bOMkp", "SqEi7", "ua8b3", "1TFcn", "wh9E9", "4qcs4", "ceKgO",
    "edlCG", "10eRZ", "3Y3gN", "DOLVr", "46Z7b", "rtr0W", "nKWjd", "rxq5i", "TCjao", "3o4ci", "N0c1k", "AR9hj", "7Yasn", "nLlzj", "AGabu",
    "l8ApV", "eeNXm", "o8BDl", "PK2za", "ECS9h", "uZjWI", "ecYTX", "LeCmb", "3yx76", "MB2vd", "yJ2zb", "vvIJB", "sbuoM", "JuCMK", "TpXq2",
    "aVBTp", "u9Jyl", "VpGwr", "r88Mp", "ih8fE", "whmmA", "U5fX0", "JfcWw", "NIDFP", "T5m3i", "bJY3o", "jpG2t", "nUDsJ", "ljUJ4", "PBN7g",
    "RrUOh", "uH73A", "j6CiF", "B9pqW", "XN4mC", "8XPNj", "z2Gfs", "D5Sy2", "nyvZD", "qxwNh", "ssCom", "rLC5O", "ZXz7r", "lxPAO", "bxznz",
    "Mx5fj", "N95ET", "XwAuA", "ntyDK", "jq1ba", "fO8vi", "myAt1", "yjoI5", "KA8nq", "5ePFF", "MOGew", "TABqf", "ltZme", "WjqHn", "hnvFW",
    "119QG"];
let ENCRYPTED2 = ["yyWA3", "RBRNK", "muwIC", "qFJ03", "Btkoi", "hbHIe", "XoxRT", "h5Vx4", "YO4Fg", "kMnKi", "JNeoC",
    "0AXly", "S3Anw", "6HbRg", "Spxvv", "gxX1m", "s0fJe", "Ba1Em", "PBnoq", "cVVnh", "fVDwU", "Xo63L", "CyMhH", "4PvbI", "QjtWu", "P5l6I",
    "EdO0D", "fWeUH", "63KwH", "uQgxV", "zLIzX", "Pj2HM", "tXuqy", "yDiT6", "DIF2u", "JgmAT", "vVFGL", "oi0r3", "Kn2FG", "Jqj0q", "hMmrv",
    "voeX9", "1emMo", "MroJf", "ThnAk", "kzyko", "L5MZw", "meJ6C", "4jcAQ", "oFhtt", "sTyy4", "I6IT1", "o6dmt", "6SEwb", "BXqco", "HZcrA",
    "BYxHq", "s7ciD", "L1KoD", "cAKiS", "lMLxK", "hOBwk", "m5WIb", "cDFZ7", "ULYu2", "tHKIZ", "4MPlv", "O9q11", "OOtqL", "SZR4A", "xHvsN",
    "wGcIw", "moTox", "jN4d6", "codnK", "hw3v9", "WAwJ7", "bY93j", "vhL5Y", "Sll0g", "Lhyi6", "byIrT", "NsiLL", "g4Rlp", "LcKhe", "wfQxz",
    "bKFaP"];
let ENCRYPTED3 = ["P8XyN", "w4bwo", "WjRwI", "oyDIX", "MCRR2", "IwBA4", "4kPGi", "twbbe", "dinUl", "QVOJ3", "qao0n",
    "Wb4Wz", "SGrQz", "LhFvq", "GUk3D", "zlUvk", "W3FjW", "wID3Q", "dUTnJ", "5m2Xh", "Me11B", "FPkLE", "f6NCU", "57X2h", "XmPHr", "W2H5Z",
    "eNGIU", "JeSH8", "zeBlv", "kwDCG", "30Tm7", "WbFZb", "z9dZb", "lUty1", "NJa4S", "SAejR", "SOuX4", "kdBwZ", "tMDiS", "JkNbI", "YLeU8",
    "VGDKf", "NO6Ik", "jTfGQ", "0m8Yv", "rbJBC", "xBXaO", "jWkTY", "F8SHH", "hDSKb", "2Wc6R", "gtQWA", "s4gkD", "LtYOg", "iDV6F", "mlgwW",
    "cjGv6", "j83o5", "M3o9D", "NhN4T", "6B03B", "MhSe5", "AIROE", "125zm", "IIExM", "gMtCA", "RgUad", "XnLVq", "eiQ7w", "mgOMI", "EeZb5",
    "4nfon", "ST4ve", "6Y52w", "0PQrr", "qEGvY", "eCiz6", "j2Rla", "ot2aa", "MSLWu", "znSzc", "uOf9p", "Iu32u", "ckCBb", "HMU32", "e6Ylj",
    "9FN3H"];
let ENCRYPTED4 = ["tZtgS", "JOrFl", "Rw1h5", "0vljv", "h6MD3", "sCFZn", "jHr3K", "0zPgk", "1rTQV", "CObTw", "UY4Zo",
    "hsE99", "fRx7d", "Or7Aq", "y3Z0L", "8FuaP", "lHayW", "WSlFG", "99s5c", "d0geP", "bZuXd", "z6B0O", "Ho8SB", "Jdu8x", "dHHdJ", "KKsib",
    "N6aLy", "18iHW", "shXGw", "BXktZ", "FmaR8", "9OhIY", "YF6Jm", "KTmap", "owl8J", "4Tbhb", "ZQnub", "Yhdso", "wzmoX", "MDtmu", "Od7u6",
    "49YVK", "Q0qcL", "vfFFX", "SEba6", "gLuT3", "NIu1S", "ARv4j", "mGquR", "KgoSp", "iggw3", "JiBlg", "dSkq6", "5kTSq", "LmWkj", "8n0ic",
    "hvG3V", "u0SlZ", "Ny8gN", "6FixV", "2Ifcb", "FuW6J", "LF08A", "xm9AX", "EVJOE", "nDJdy", "hDgIb", "owz1D", "vffRq", "d150D", "Jhryj",
    "CjWbQ", "ADTEx", "oxyDa", "U5v3n", "dd9yN", "hmMKq", "znIY2", "d5Y57", "nc2Xi", "SIhUb", "qjYnX", "Q7Kid", "tJkaK", "y6C2o", "mHcVD",
    "BpEqx"];
let ENCRYPTED5 = ["mHloS", "l51o4", "xxV81", "uVtXl", "zZ4hF", "A3Fhy", "bThHg", "MiuRW", "oA0PP", "GAHiO", "7NAQs",
    "EuCYz", "mfh4R", "a3FM9", "uqj1b", "ktSwL", "L8dgp", "yGFpM", "4jhAa", "YZdVM", "EwmG3", "2c5PI", "ai4Fr", "UQlCb", "jHPX2", "shoah",
    "z4FqW", "8nwC7", "BN5Av", "AcGzV", "HzoSX", "5nOXg", "rwl3p", "sLbgQ", "3eMMe", "AmPBe", "WUU4s", "7yXlD", "QpQN9", "fPPHU", "cTK9e",
    "1NJ6D", "a2NFR", "qjWzd", "JzYH3", "4QPT8", "W404G", "c6mDz", "krduP", "WX29B", "yuehc", "uHxTF", "K0iKl", "64IIy", "9xx6t", "7bHTV",
    "HkgyI", "V0cWH", "E7pOl", "kCSM8", "6XCo8", "FN19J", "HoZs8", "kgs2y", "z5Mv0", "1o1gU", "aKx3w", "4ciwz", "6smBP", "gVHW0", "BAUet",
    "Sr70Y", "PxS8M", "8clFW", "v5fsb", "Mu6tJ", "NhvPm", "qthaB", "InTNU", "440xz", "107ae", "qyqlu", "3rn80", "WOhQ5", "FfsBo", "YJzcg",
    "H3igz"];

// Encryption Algorithm
function encrypt(string) {
    let rotateAmount = Math.round((Math.random() * 86) + 1);
    let rotateDirection;
    if (Math.random() < 0.5)
        rotateDirection = Math.round((Math.random() * 999) + 1);
    else
        rotateDirection = Math.round((Math.random() * 999) + 1001);
    let decrypted;
    let  ENCRYPTED;
    let  EncryptedListName;
    switch (Math.round((Math.random() * 5) + 1)) {
        case 2:
            ENCRYPTED = ENCRYPTED2;
            EncryptedListName = Math.round((Math.random() * 99) + 101);
            break;
        case 3:
            ENCRYPTED = ENCRYPTED3;
            EncryptedListName = Math.round((Math.random() * 99) + 201);
            break;
        case 4:
            ENCRYPTED = ENCRYPTED4;
            EncryptedListName = Math.round((Math.random() * 99) + 301);
            break;
        case 5:
            ENCRYPTED = ENCRYPTED5;
            EncryptedListName = Math.round((Math.random() * 99) + 401);
            break;
        default:
            ENCRYPTED = ENCRYPTED1;
            EncryptedListName = Math.round((Math.random() * 99) + 1);
            break;
    }
    if (rotateDirection <= 1000) {
        decrypted = rotateRight(ENCRYPTED, rotateAmount);
    } else {
        decrypted = rotateLeft(ENCRYPTED, rotateAmount);
    }
    let encryptedString = "";
    for (let i = 0; i < string.length; i++) {
        let letter = string.charAt(i);
        let position = DECRYPTED.indexOf(letter);
        encryptedString = encryptedString + decrypted[position];
    }
    return ("%" + EncryptedListName.toString(16) + "$" + rotateAmount.toString(16) + "#" + rotateDirection.toString(16) + "_")+ encryptedString;
}

// Decryption Method
function decrypt(string) {
    let encryptedListName = parseInt(string.substring(string.indexOf("%")+1, string.indexOf("$")), 16);
    let rotateAmount = parseInt(string.substring(string.indexOf("$") + 1, string.indexOf("#")), 16);
    let rotateRightTrue = parseInt(string.substring(string.indexOf("#") + 1, string.indexOf("_")), 16) < 1001;
    string = string.substring(string.indexOf("_") + 1);
    let ENCRYPTED;
    if (encryptedListName < 100)
        ENCRYPTED = ENCRYPTED1;
    else if (encryptedListName < 200)
        ENCRYPTED = ENCRYPTED2;
    else if (encryptedListName < 300)
        ENCRYPTED = ENCRYPTED3;
    else if (encryptedListName < 400)
        ENCRYPTED = ENCRYPTED4;
    else
        ENCRYPTED = ENCRYPTED5;
    let decrypted = !rotateRightTrue ? rotateLeft(ENCRYPTED, rotateAmount) : rotateRight(ENCRYPTED, rotateAmount);
    let decryptedString = "";
    for (let i = 0; i < string.length; i += 5) {
        let encryptedString = string.substring(i, i + 1) + string.substring(i + 1, i + 1 + 1)
            + string.substring(i + 2, i + 2 + 1) + string.substring(i + 3, i + 3 + 1) + string.substring(i + 4, i + 4 + 1);
        let position = decrypted.indexOf(encryptedString);
        decryptedString = decryptedString + DECRYPTED[position];
    }
    return decryptedString;
}

// Helper for encryptors
function rotateRight(array, amount) {
    let copyOfArray = [];
    copyOfArray.push(...array);
    for (let i = 0; i < amount; i++) {
        for (let j = copyOfArray.length - 1; j > 0; j--) {
            let temp = copyOfArray[j];
            copyOfArray[j] = copyOfArray[j - 1];
            copyOfArray[j - 1] = temp;
        }
    }
    return copyOfArray;
}

// Helper for encryptors
function rotateLeft( array, amount) {
    let copyOfArray = [];
    copyOfArray.push(...array);
    for (let i = 0; i < amount; i++) {
        for (let j = 0; j < copyOfArray.length - 1; j++) {
            let temp = copyOfArray[j];
            copyOfArray[j] = copyOfArray[j + 1];
            copyOfArray[j + 1] = temp;
        }
    }
    return copyOfArray;
}

// Authenticates a User
let authenticate = (name, password, callback) => {
    let db = utils.getDb();
    let message = undefined;
    db.collection('users').findOne({name:name}, (err, result)=>{
        if (err)
            logger.logerror(err, "Authenticating User");
        else if (result === null) {
            logger.loguser("Log In", "Failed (No Matching Users)", name);
            message =  "No Matching Users";
            callback(message, false);
        }
        else {
            if (password === decrypt(result.password)) {
                logger.loguser("Log In", "Success", name);
                message = "Logged In";
                callback(message, result.admin);
            } else {
                logger.loguser("Log In", "Failed (No Matching Users)", name);
                message =  "No Matching Users";
                callback(message, false);
            }
        }
    });
};

// Adds a User to Database
let addUser = (name, password, email, callback) => {
    let db = utils.getDb();
    db.collection('users').findOne({name:name}, (err, result) =>{
        if (err)
            logger.logerror(err, "Registering new User");
        else if (result !== null) {
            logger.loguser("Sign Up", "Failed (Username Already Taken)", name);
            callback("Failed Username Already Exists")
        } else {
            db.collection('users').findOne({email:email}, (err, result1) => {
                if (err)
                    logger.logerror(err, "Registering new User");
                else if (result1 !== null) {
                    logger.loguser("Sign Up", "Failed (Email Already Taken)", name);
                    callback("Failed Email Already Exists")
                } else {
                    password = encrypt(password);
                    db.collection('users').insertOne({
                        name: name,
                        password: password,
                        email: email,
                        admin: false
                    }, (err, result) => {
                        if (err) {
                            logger.loguser("Sign Up", "Failed", name);
                            logger.logerror(err, "Adding User to DB");
                            callback("Failed")
                        }
                        logger.loguser("Sign Up", "Success", name);
                        logger.logDB("Adding user to DB", name)
                    });
                    callback('Created Successfully');
                }

            });
        }
    });
};

// Adds a User to Database
let addAdmin = (name, password, email, callback) => {
    let db = utils.getDb();
    db.collection('users').findOne({name:name}, (err, result) =>{
        if (err)
            logger.logerror(err, "Adding an Admin Account");
        else if (result !== null) {
            logger.loguser("Sign Up", "Failed (Already Exists)", name);
            callback("Failed Username Already Exists")
        } else {
            db.collection('users').findOne({email:email}, (err, result1) => {
                if (err)
                    logger.logerror(err, "Registering new User");
                else if (result1 !== null) {
                    logger.loguser("Sign Up", "Failed (Email Already Taken)", name);
                    callback("Failed Email Already Exists")
                } else {
                    password = encrypt(password);
                    db.collection('users').insertOne({
                        name: name,
                        password: password,
                        email: email,
                        admin: true
                    }, (err, result) => {
                        if (err) {
                            logger.loguser("Sign Up", "Failed", name);
                            logger.logerror(err, "Adding User to DB");
                            callback("Failed")
                        }
                        logger.loguser("Sign Up", "Success", name);
                        logger.logDB("Adding user to DB", name)
                    });
                    callback('Created Successfully');
                }

            });
        }
    });
};

// Checks for admin on an account
let checkAdmin = (name, callback) => {
    let db = utils.getDb();
    db.collection('users').findOne({name:name}, (err, result) => {
        if (err)
            logger.logerror(err, "users.checkAdmin");
        else if (result === null){
            logger.loguser("Check Admin", "Failed (Cannot find user)", name);
            callback(false)
        }
        else
            callback(result.admin)
    })
};

// Python like helper function
let range = (start, end, count = 1) => {
    let ans = [];
    for (let i = start; i <= end; i+=count) {
        ans.push(i);
    }
    return ans;
};

module.exports = {
    authenticate,
    addUser,
    addAdmin,
    checkAdmin,
    encrypt,
    decrypt,
    range,
};

// Used To Generate the Encrypted List and check for duplicates
// let generateEncrpyted = () => {
//     encrypted = []
//     for (i in decrypted){
//         let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
//         let x = 4;
//         let string = ''
//         for (j in range(0,x)){
//             string = `${string}${possible.charAt(Math.floor(Math.random() * possible.length))}`
//         }
//         encrypted.push(string)
//     }
//     console.log(encrypted)
// }
// generateEncrpyted()
// let checkUnique = (list) => {
//     let unique = Array.from(new Set(list))
//     return unique.length === list.length
// }
// console.log(checkUnique(encrypted))
// console.log(encrypted.length == decrypted.length)
