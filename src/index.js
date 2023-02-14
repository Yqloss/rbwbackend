const http = require('http');
const url = require('url');
const { RbwManager } = require('./rbw');

const port = 8888;
const rbw = new RbwManager('./config/data.json');

const doResponse = (response, code, jsonOrError) => {
    response.writeHead(code, { 'Content-Type': 'application/json' });
    let res = JSON.stringify(code == 200 ? { success: true, data: jsonOrError } : { success: false, reason: jsonOrError });
    response.end(res);
    console.log(`[${new Date().toLocaleString()}] ${response.socket.remoteAddress}:${response.socket.remotePort}<- ${res}`)
}

http.createServer((request, response) => {
    if (request.url == '/favicon.ico') return;
    console.log(`[${new Date().toLocaleString()}] ${request.socket.remoteAddress}:${request.socket.remotePort}-> GET ${request.url}`);
    let data = url.parse(request.url, true);
    let path = data.pathname;
    let params = data.query;
    if (path == '/create') {
        let ign = params.ign, qq = params.qq, kook = params.kook;
        if (ign == null) doResponse(response, 400, 'Missing [ign] field');
        else if (rbw.has(ign)) doResponse(response, 409, `The player with ign ${ign} is existed`);
        else if (qq == null && kook == null) doResponse(response, 400, 'Missing [kook/ign] field');
        else doResponse(response, 200, rbw.create(ign, qq, kook));
    }
    if (path == '/player') {
        let ign = params.ign, qq = params.qq, kook = params.kook, id = params.id;
        let cnt = (ign == null ? 0 : 1) + (qq == null ? 0 : 1) + (kook == null ? 0 : 1) + (id == null ? 0 : 1);
        if (cnt > 1) doResponse(response, 406, `Too many search key`);
        else if (ign == null && qq == null && kook == null && id == null) doResponse(response, 400, 'Missing [ign/qq/kook/id] field');
        else if (ign != null) {
            let data = rbw.findByIgn(ign);
            if (data == null) doResponse(response, 404, `Doesn't find player with ign ${ign}`);
            else doResponse(response, 200, data);
        }
        else if (qq != null) {
            let data = rbw.findByQq(qq);
            if (data == null) doResponse(response, 404, `Doesn't find player with qq ${qq}`);
            else doResponse(response, 200, data);
        }
        else if (kook != null) {
            let data = rbw.findByKook(kook);
            if (data == null) doResponse(response, 404, `Doesn't find player with kook ${kook}`);
            else doResponse(response, 200, data);
        }
        else if (id != null) {
            let data = rbw.findById(id);
            if (data == null) doResponse(response, 404, `Doesn't find player with id ${id}`);
            else doResponse(response, 200, data);
        } else doResponse(response, 500, `Unexpected error`);
    }
}).listen(port);

console.log(`Server running on 127.0.0.1:${port}`);