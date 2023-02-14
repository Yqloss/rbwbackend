const fs = require('fs');

const rbwRank = [{ name: 'Coal', color: '#000000', win: 35, lose: 10, mvp: 15 }];

class RbwManager {
    constructor(dataFilePath) {
        this.dataFilePath = dataFilePath;
        if (fs.existsSync(dataFilePath))
            this.data = JSON.parse(fs.readFileSync(dataFilePath));
        else
            this.data = [];
        this.player_cnt = this.data[this.data.length - 1]?.id ?? -1 + 1;
    }
    save = () => fs.writeFileSync(this.dataFilePath, JSON.stringify(this.data));
    has = (ign) => this.data.find(x => x.ign == ign) != null;
    create = (ign, qq, kook) => {
        let json = { id: this.player_cnt, ign: ign, qq: qq ?? null, kook: kook ?? null };
        this.data.push(json);
        this.player_cnt++;
        this.save();
        return json;
    }
    findByIgn = (ign) => this.data.find(x => x.ign == ign);
    findByQq = (qq) => this.data.find(x => x.qq == qq);
    findByKook = (kook) => this.data.find(x => x.kook == kook);
    findById = (id) => this.data.find(x => x.id == id);
}

module.exports = { RbwManager };