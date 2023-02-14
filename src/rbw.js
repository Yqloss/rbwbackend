const fs = require('fs');

const rbwRank = [
    { name: 'Coal', score: 0, color: '#000000', win: 35, lose: 10, mvp: 15 },
    { name: 'Iron', score: 100, color: '#ffffff', win: 30, lose: 10, mvp: 15 },
    { name: 'Gold', score: 200, color: '#fff334', win: 30, lose: 15, mvp: 15 },
    { name: 'Diamond', score: 300, color: '#64bade', win: 25, lose: 15, mvp: 10 },
    { name: 'Emerald', score: 400, color: '#4cbf7c', win: 25, lose: 20, mvp: 10 },
    { name: 'Sapphire', score: 500, color: '#0f6ab6', win: 20, lose: 20, mvp: 10 },
    { name: 'Ruby', score: 600, color: '#f0210f', win: 20, lose: 25, mvp: 5 },
    { name: 'Crystal', score: 700, color: '#c3337d', win: 15, lose: 25, mvp: 5 },
    { name: 'Opal', score: 800, color: '#0e0b80', win: 15, lose: 30, mvp: 5 },
    { name: 'Amethyst', score: 900, color: '#691e81', win: 15, lose: 30, mvp: 5 },
    { name: 'Obsidian', score: 1000, color: '#000000', win: 15, lose: 30, mvp: 5 },
    { name: 'Aventurine', score: 1200, color: '#43b979', win: 10, lose: 30, mvp: 5 },
    { name: 'Quartz', score: 1400, color: '#edcacf', win: 10, lose: 40, mvp: 5 },
    { name: 'Air', score: 1500, color: '#2db8e9', win: 10, lose: 45, mvp: 5 },
    { name: 'S Tier Ranked', score: 1700, color: '#377ca6', win: 5, lose: 50, mvp: 5 },
    { name: 'S+ Tier Ranked', score: 1800, color: '#377ca6', win: 5, lose: 55, mvp: 5 },
];

class RbwManager {
    constructor(dataFilePath) {
        this.dataFilePath = dataFilePath;
        if (fs.existsSync(dataFilePath))
            this.data = JSON.parse(fs.readFileSync(dataFilePath));
        else
            this.data = { player: [], party: [] };
        this.player_cnt = this.data.player[this.data.player.length - 1]?.id ?? -1 + 1;
    }
    save = () => fs.writeFileSync(this.dataFilePath, JSON.stringify(this.data));
    has = (ign) => this.data.player.find(x => x.ign == ign) != null;
    getUuid = async (ign) => {
        return await fetch(`https://api.mojang.com/users/profiles/minecraft/${ign}`).then(res =>
            res.status == 200 ? res.json() : { id: null }
        ).then(json => json.id);
    }
    create = async (ign, qq, kook) => {
        let uuid = await this.getUuid(ign);
        if (uuid == null) return false;
        let json = { id: this.player_cnt, ign: ign, qq: qq ?? null, kook: kook ?? null, score: 0, win: 0, lose: 0, mvp: 0, party: -1, uuid: uuid };
        this.data.player.push(json);
        this.player_cnt++;
        this.save();
        return json;
    }
    findByIgn = (ign) => this.data.player.find(x => x.ign == ign);
    findByQq = (qq) => this.data.player.find(x => x.qq == qq);
    findByKook = (kook) => this.data.player.find(x => x.kook == kook);
    findById = (id) => this.data.player.find(x => x.id == id);
}

module.exports = { RbwManager, rbwRank };