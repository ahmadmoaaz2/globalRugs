const utils = require('./utils');
let date = new Date();

let logit = (method, url, status, username, ip, time = date.toString()) => {
    if(url.includes("/logs") || url.includes('/clear'))
        return;
    if (!username)
        username = "Anonymous";
    if (url === "/app.js")
        return;
    let log = {time:time, method:method, url:url, status:status, user:username, ip:ip};
    let db = utils.getDb();
    db.collection("logs").findOne({logtype: "serverVisit"}, (err, result) => {
        if (err)
            logerror(err, "Adding Server Visit Logs");
        else {
            let logs = result.logs;
            if (logs){
                if (logs.length === 1000)
                    logs.pop();
                logs.unshift(log)
            } else {
                logs = [log]
            }
            db.collection("logs").updateOne({
                logtype: "serverVisit"
            }, {
                $set:{
                    logs: logs
                }
            }, (err, check) => {
                if (err)
                    logerror(err, "Adding Server Visit Logs");
            })
        }
    });
};

let loguser = (action, status, username, time = date.toString()) => {
    let log = {time:time, user:username, action:action, status:status};
    let db = utils.getDb();
    db.collection("logs").findOne({logtype: "userLogins"}, (err, result) => {
        if (err)
            logerror(err, "Adding User Login Logs");
        else {
            let logs = result.logs;
            if (logs){
                if (logs.length === 1000)
                    logs.pop();
                logs.unshift(log)
            } else {
                logs = [log]
            }
            db.collection("logs").updateOne({
                logtype: "userLogins"
            }, {
                $set:{
                    logs: logs
                }
            }, (err, check) => {
                if (err)
                    logerror(err, "Adding User Login Logs");
            })
        }
    });
};

let logDB = (action, username, status = "Success", time = date.toString()) => {
    if(!username)
        username = "Anonymous";
    let log = {time:time, user:username, action:action, status:status};
    let db = utils.getDb();
    db.collection("logs").findOne({logtype: "dbUsage"}, (err, result) => {
        if (err)
            logerror(err, "Adding DB Usage Logs");
        else {
            let logs = result.logs;
            if (logs){
                if (logs.length === 1000)
                    logs.pop();
                logs.unshift(log)
            } else {
                logs = [log]
            }
            db.collection("logs").updateOne({
                logtype: "dbUsage"
            }, {
                $set:{
                    logs: logs
                }
            }, (err, check) => {
                if (err)
                    logerror(err, "Adding DB Usage Logs");
            })
        }
    });
};

let logerror = (error, method, time = date.toString()) => {
    let log = {time:time, error:error, action:method};
    let db = utils.getDb();
    db.collection("logs").findOne({logtype: "serverErrors"}, (err, result) => {
        if (err)
            console.log(err);
        else {
            let logs = result.logs;
            if (logs){
                if (logs.length === 500)
                    logs.pop();
                logs.unshift(log)
            } else {
                logs = [log]
            }
            db.collection("logs").updateOne({
                logtype: "serverErrors"
            }, {
                $set:{
                    logs: logs
                }
            }, (err, check) => {
                if (err)
                    console.log(err)
            })
        }
    });
};

let logMessage = (name, email, subject, message, accountName, time = date.toString()) => {
    if (!accountName)
        accountName = "Anonymous";
    let log = {time:time, name:name, subject:subject, email:email, message:message, accountName:accountName};
    let db = utils.getDb();
    db.collection("logs").findOne({logtype: "userMessages"}, (err, result) => {
        if (err)
            logerror(err, "Adding User Message Logs");
        else {
            let logs = result.logs;
            if (logs){
                if (logs.length === 100)
                    logs.pop();
                logs.unshift(log)
            } else {
                logs = [log]
            }
            db.collection("logs").updateOne({
                logtype: "userMessages"
            }, {
                $set:{
                    logs: logs
                }
            }, (err, check) => {
                if (err)
                    logerror(err, "Adding User Message Logs");
            })
        }
    });
};

module.exports = {
    logit,
    loguser,
    logDB,
    logMessage,
    logerror
};