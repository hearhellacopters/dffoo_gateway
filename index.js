const http = require('http');
const make_sig = require('./make_sig.js');
const server = process.env.npm_config_server;

if (server == undefined) {
    console.log("\x1b[31mMust start process with --server=[ip address]. Exiting now.\x1b[0m");
    setTimeout(() => {
        process.exit(0);
    }, 2000)
} else {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', (key) => {
        if (key[0] == 0x78) {
            console.log("\x1b[36mExiting Process.\x1b[0m");
            setTimeout(() => {
                process.exit(0);
            }, 2000)
        }
    });
    //JP server
    const server1 = http.createServer((req, res) => {
        var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        if (ip.substr(0, 7) == "::ffff:") {
            ip = ip.substr(7)
        }
        const clientIP = `http://${ip}:${8000}${req.url}`;
        if (req.url == "/api/util/get_init_params.api") {
            console.log(`\x1b[36m[${clientIP}]\x1b[0m: Sending reply.`)
            const get_init_params = {
                "behavior_code": 0,
                "end_service_code": 0,
                "in_review": false,
                "nonce": "Bda6BffBaSAsi2fa",
                "server_addr": `${server_addr}:8071`,
                "cache_server_addr": `${server_addr}:8072`,
                "photon_server_addr": `${server_addr}:8073`,
                "status_code": 0,
                "system_dl_battle_threshold": 2,
                "system_dl_conv_threshold": 0,
                "system_dl_progress_bar_show": false,
                "system_dl_title_threshold": 0,
                "verup_code": 0
            }
            res.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8',
                "X-SQEX-Signature": make_sig(JSON.stringify(get_init_params), "JP"),
            });
            res.end(JSON.stringify(get_init_params));
        } else
        if (req.url == "/native/session") {
            console.log(`\x1b[36m[${clientIP}]\x1b[0m: Sending reply`)
            const json_data = {
                "sharedSecurityKey": "Mb63Qw18DZ1b21K0eI52kwf8tOPgT9vi",
                "nativeSessionId": "1415e9cd8e2373d674fbfb29d5850158"
            }
            res.writeHead(200, {
                "Content-Type": 'application/json; charset=utf-8',
                //"X-SQEX-Signature": make_sig(JSON.stringify(get_init_params),"GL"),
            });
            res.end(JSON.stringify(json_data));
        } else 
        if (req.url == "/test") {
            res.end("JP server is running!");
        }
    });

    //GL server
    const server2 = http.createServer((req, res) => {
        var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        if (ip.substr(0, 7) == "::ffff:") {
            ip = ip.substr(7)
        }
        const clientIP = `http://${ip}:${8001}${req.url}`;
        if (req.url == "/api/util/get_init_params.api") {
            console.log(`\x1b[36m[${clientIP}]\x1b[0m: Sending reply.`)
            const get_init_params = {
                "behavior_code": 0,
                "end_service_code": 0,
                "in_review": false,
                "nonce": "Bda6BffBaSAsi2fa",
                "server_addr": `${server_addr}:8081`,
                "cache_server_addr": `${server_addr}:8082`,
                "photon_server_addr": `${server_addr}:8083`,
                "status_code": 0,
                "system_dl_battle_threshold": 2,
                "system_dl_conv_threshold": 0,
                "system_dl_progress_bar_show": false,
                "system_dl_title_threshold": 0,
                "verup_code": 0
            }
            res.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8',
                "X-SQEX-Signature": make_sig(JSON.stringify(get_init_params), "GL"),
            });
            res.end(JSON.stringify(get_init_params));
        } else
        if (req.url == "/native/session") {
            console.log(`\x1b[36m[${clientIP}]: Sending reply.`)
            const json_data = {
                "sharedSecurityKey": "Mb63Qw18DZ1b21K0eI52kwf8tOPgT9vi",
                "nativeSessionId": "1415e9cd8e2373d674fbfb29d5850158"
            }
            res.writeHead(200, {
                "Content-Type": 'application/json; charset=utf-8',
                //"X-SQEX-Signature": make_sig(JSON.stringify(get_init_params),"GL"),
            });
            res.end(JSON.stringify(json_data));
        } else 
        if (req.url == "/test") {
            res.end("GL server is running!");
        }
    });

    console.log("\x1b[36mStarting local Server.\x1b[0m");

    server1.listen(8000, () => {
        console.log(`\x1b[36m[JP Server]\x1b[0m running at http://127.0.0.1:${8000}/`);
    });

    server2.listen(8001, () => {
        console.log(`\x1b[36m[GL Server]\x1b[0m running at http://127.0.0.1:${8001}/`);
    });

    console.log(`\x1b[36mCheck http://127.0.0.1:${8000}/test to see if your server is working.\x1b[0m`);

    console.log(`\x1b[33m-- Press '\x1b[32mx\x1b[33m' at anytime to exit.\x1b[0m`);
}