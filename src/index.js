const http = require('http');
const url = require('url');
const { RbwManager } = require('./rbw');

const port = 13820;
const rbw = new RbwManager('./config/rbw.db');

const log = (text) => console.log(`[${new Date().toLocaleString()}] ${text}`);

const doResponse = (response, code, jsonOrError) => {
    response.writeHead(code, { 'Content-Type': 'application/json' });
    let res = JSON.stringify(code >= 200 && code < 300 ? { success: true, data: jsonOrError } : { success: false, reason: jsonOrError });
    response.end(res);
    log(`${response.socket.remoteAddress}:${response.socket.remotePort}<- ${code} ${res}`)
}

const server = http.createServer(async (request, response) => {
    if (request.url == '/favicon.ico') return;
    log(`${request.socket.remoteAddress}:${request.socket.remotePort}-> GET ${request.url}`);
    let data = url.parse(request.url, true);
    let path = data.pathname;
    let params = data.query;
    //Get static data
    if (path == '/info/score') doResponse(response, 200, rbw.getRankInfo());
    //Get dynamic data
    else if (path == '/create') {
        let ign = params.ign, qq = params.qq, kook = params.kook;
        if (ign == null) doResponse(response, 400, 'Missing [ign] field');
        else if (await rbw.has(ign)) doResponse(response, 409, `此玩家已被注册`);
        else if (qq == null && kook == null) doResponse(response, 400, 'Missing [kook/ign] field');
        else {
            let data = await rbw.create(ign, qq, kook);
            if (data == false) doResponse(response, 406, `未找到玩家${ign}的正版账号`);
            else doResponse(response, 201, data);
        }
    } else if (path == '/player') {
        let ign = params.ign, qq = params.qq, kook = params.kook, id = params.id;
        let cnt = (ign == null ? 0 : 1) + (qq == null ? 0 : 1) + (kook == null ? 0 : 1) + (id == null ? 0 : 1);
        if (cnt > 1) doResponse(response, 406, `Too many search key`);
        else if (ign == null && qq == null && kook == null && id == null) doResponse(response, 400, 'Missing [ign/qq/kook/id] field');
        else if (ign != null) {
            let data = await rbw.findByIgn(ign);
            if (data == null) doResponse(response, 404, `未找到此玩家，请先注册`);
            else doResponse(response, 200, data);
        } else if (qq != null) {
            let data = await rbw.findByQq(qq);
            if (data == null) doResponse(response, 404, `未找到此玩家，请先注册`);
            else doResponse(response, 200, data);
        } else if (kook != null) {
            let data = await rbw.findByKook(kook);
            if (data == null) doResponse(response, 404, `未找到此玩家，请先注册`);
            else doResponse(response, 200, data);
        } else if (id != null) {
            let data = await rbw.findById(id);
            if (data == null) doResponse(response, 404, `未找到此玩家，请先注册`);
            else doResponse(response, 200, data);
        } else doResponse(response, 500, `Unexpected error`);
    } else if (path == '/party/create') {
        let ign = params.ign, party_name = params.name;
        if (ign == null) doResponse(response, 400, 'Missing [ign] field');
        else if (party_name == null) doResponse(response, 400, 'Missing [name] field');
        else if (!await rbw.has(ign)) doResponse(response, 404, `未找到玩家${ign}，请先注册`);
        else if (await rbw.hasParty(ign)) doResponse(response, 409, `玩家${ign}已有队伍`);
        else doResponse(response, 201, await rbw.createParty(ign, party_name));
    } else if (path == '/party/join') {
        let ign = params.ign, leader_name = params.leader;
        if (ign == null) doResponse(response, 400, 'Missing [ign] field');
        else if (leader_name == null) doResponse(response, 400, 'Missing [leader] field');
        else if (!await rbw.has(ign)) doResponse(response, 404, `未找到玩家${ign}，请先注册`);
        else if (!await rbw.has(leader_name)) doResponse(response, 404, `未找到玩家${leader_name}，请先注册`);
        else if (await rbw.hasParty(ign)) doResponse(response, 409, `玩家${ign}已有队伍`);
        else if (!await rbw.hasParty(leader_name)) doResponse(response, 409, `未找到玩家${leader_name}的队伍`);
        else {
            let res = await rbw.joinParty(ign, leader_name);
            if (res == false) doResponse(response, 406, '这个组队已满');
            else doResponse(response, 200, res);
        }
    } else if (path == '/party/leave') {
        let ign = params.ign;
        if (ign == null) doResponse(response, 400, 'Missing [ign] field');
        else if (!await rbw.has(ign)) doResponse(response, 404, `未找到玩家${ign}，请先注册`);
        else if (!await rbw.hasParty(ign)) doResponse(response, 409, `玩家${ign}当前没有队伍`);
        else {
            let res = await rbw.leaveParty(ign);
            if (res == false) doResponse(response, 406, '此玩家为队长，请使用transfer或disband取消队长身份');
            else doResponse(response, 200, res);
        }
    } else if (path == '/party/find') {
        let ign = params.ign, name = params.name;
        if (ign == null && name == null) doResponse(response, 400, 'Missing [ign/name] field');
        if (ign != null) {
            if (!await rbw.has(ign)) doResponse(response, 404, `未找到玩家${ign}，请先注册`);
            else if (!await rbw.hasParty(ign)) doResponse(response, 409, `玩家${ign}当前没有队伍`);
            else doResponse(response, 200, await rbw.findPartyById(await rbw.findByIgn(ign).party));
        } else {
            let res = await rbw.findPartyByName(name);
            if (res == null) doResponse(response, 404, `未找到此队伍`);
            else doResponse(response, 200, res);
        }
    } else if (path == '/party/disband') {
        let ign = params.ign;
        if (ign == null) doResponse(response, 400, 'Missing [ign] field');
        if (!await rbw.has(ign)) doResponse(response, 404, `未找到玩家${ign}，请先注册`);
        else if (!await rbw.hasParty(ign)) doResponse(response, 409, `玩家${ign}当前没有队伍`);
        else {
            let res = await rbw.disbandParty(ign);
            if (res == false) doResponse(response, 406, `此玩家不是队长，无法解散组队`);
            else doResponse(response, 200, res);
        }
    } else if (path == '/game/queue') {
        let ign = params.ign;
        if (ign == null) doResponse(response, 400, 'Missing [ign] field');
        if (!await rbw.has(ign)) doResponse(response, 404, `未找到玩家${ign}，请先注册`);
        else if (!await rbw.hasParty(ign)) doResponse(response, 409, `玩家${ign}当前没有队伍`);
        else if (!await rbw.partyIsFull(ign)) doResponse(response, 406, `组队未满员，无法排队`);
        else {
            let res = await rbw.queueGame(ign);
            if (res == null) doResponse(response, 406, `必须由队长进行排队`);
            else if (res == false) doResponse(response, 201, `已排队，如5分钟之内未匹配到队伍将自动取消`);
            else doResponse(response, 200, res);
        }
    }
});

server.on('listening', () => log(`Server running on 127.0.0.1:${port}`));
server.listen(port);

log(`Starting Ranked Bedwars backend server`);