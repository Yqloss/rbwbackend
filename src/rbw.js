const sqlite = require('sqlite3');

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
        this.database = new sqlite.Database(this.dataFilePath, (err) => console.log(err == null ? 'Sqlite startup complete.' : err));
        this.database.each('select max(id) from player', (_, row) => this.player_cnt = row['max(id)'] ?? -1 + 1);
        this.database.each('select max(id) from party', (_, row) => this.party_cnt = row['max(id)'] ?? -1 + 1);
        this.database.each('select max(id) from game', (_, row) => this.game_cnt = row['max(id)'] ?? -1 + 1);
        this.inQueue = null;
    }
    has = (ign) => new Promise(resolve => this.database.each(`select 1 from player where ign='${ign}' limit 1`, () => { }, (err, cnt) => resolve(cnt > 0)));
    getUuid = async (ign) => {
        return await fetch(`https://api.mojang.com/users/profiles/minecraft/${ign}`).then(res =>
            res.status == 200 ? res.json() : { id: null }
        ).then(json => json.id);
    }
    getRankInfo = () => rbwRank;
    create = async (ign, qq, kook) => {
        let uuid = await this.getUuid(ign);
        if (uuid == null) return false;
        this.database.run(`insert into player values(${this.player_cnt},'${ign}','${uuid}',${qq == null ? -1 : qq},${kook == null ? -1 : kook},0,0,0,0,-1)`);
        this.player_cnt++;
        return new Promise(resolve => this.database.each(`select * from player where ign='${ign}' limit 1`, (_, row) => resolve(row)));
    }
    findByIgn = (ign) => new Promise(resolve => this.database.each(`select * from player where ign='${ign}' limit 1`, (_, row) => resolve(row), () => resolve(null)));
    findByQq = (qq) => new Promise(resolve => this.database.each(`select * from player where qq='${qq}' limit 1`, (_, row) => resolve(row), () => resolve(null)));
    findByKook = (kook) => new Promise(resolve => this.database.each(`select * from player where kook='${kook}' limit 1`, (_, row) => resolve(row), () => resolve(null)));
    findById = (id) => new Promise(resolve => this.database.each(`select * from player where id='${id}' limit 1`, (_, row) => resolve(row), () => resolve(null)));
    createParty = async (ign, name) => {
        let leader = await this.findByIgn(ign);
        this.database.run(`insert into party values(${this.party_cnt},'${name}',${leader.id},0,-1,-1,-1)`);
        this.database.run(`update player set party=${this.party_cnt} where ign='${ign}'`);
        this.party_cnt++;
        return new Promise(resolve => this.database.each(`select * from party where name='${name}' limit 1`, (_, row) => resolve(row)));
    }
    hasParty = async (ign) => (await this.findByIgn(ign)).party >= 0;
    joinParty = async (ign, leader) => {
        let join = await this.findByIgn(ign);
        let leader_p = (await this.findByIgn(leader)).party;
        let party = await this.findPartyById(leader_p);
        if (party.member_count == 3) return false;//Full
        this.database.run(`update player set party=${party.id} where ign='${ign}'`);
        this.database.run(`update party set member_count=${party.member_count + 1},member_${party.member_count + 1}=${join.id} where id=${party.id}`);
        return new Promise(resolve => this.database.each(`select * from party where id=${party.id} limit 1`, (_, row) => resolve(row)));
    }
    leaveParty = async (ign) => {
        let leave = await this.findByIgn(ign);
        let party = await this.findPartyById(leave.party);
        if (party.leader == leave.ign) return false;//Only member can leave
        this.database.run(`update player set party=-1 where ign=${ign}`);
        this.database.run(`update party set member_count=${party.member_count - 1},member_${party.member_count}=-1 where id=${party.id}`);
        return new Promise(resolve => this.database.each(`select * from party where id=${party.id} limit 1`, (_, row) => resolve(row)));
    }
    disbandParty = async (ign) => {
        let disband = await this.findByIgn(ign);
        let party = await this.findPartyById(disband.party);
        if (party.leader != disband.id) return false;//Only leader can disband
        this.database.run(`update player set party=-1 where ign=${ign}`);
        if (party.member_count >= 1)
            this.database.run(`update player set party=-1 where id=${party.member_1}`);
        if (party.member_count >= 2)
            this.database.run(`update player set party=-1 where id=${party.member_2}`);
        if (party.member_count >= 3)
            this.database.run(`update player set party=-1 where id=${party.member_3}`);
        this.database.run(`update party set leader=-1,member_cnt=0 where id=${disband.party}`);
        return party;
    }
    partyIsFull = async (ign) => await this.findPartyById((await this.findByIgn(ign)).party).member_count == 3;
    findPartyByName = async (name) => new Promise(resolve => this.database.each(`select * from party where name='${name}' limit 1`, (_, row) => resolve(row), () => resolve(null)));
    findPartyById = async (id) => new Promise(resolve => this.database.each(`select * from party where id='${id}' limit 1`, (_, row) => resolve(row), () => resolve(null)));
    queueGame = async(ign) => {
        if (new Date().getTime() - this.inQueue.time > 1000 * 60 * 5) this.inQueue = null;//5 minutes time out
        let player = await this.findByIgn(ign);
        let party = await this.findPartyById(player.party);
        if (party.leader != player.id) return null;//Only leader can start game
        if (this.inQueue == null) {//No other party is in queue
            this.inQueue = { party: party.id, time: new Date().getTime() };
            return false;
        } else {//Someone is waiting
            this.database.run(`insert into game values(${this.game_cnt},${party.id},${this.inQueue.party},0,0,-1)`);
            this.game_cnt++;
            this.inQueue = null;
            return new Promise(resolve => this.database.each(`select * from game where id='${this.game_cnt-1}' limit 1`, (_, row) => resolve(row), () => resolve(null)));
        }
    }
}

module.exports = { RbwManager };


// Array.equals()
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length != array.length)
        return false;

    for (var i = 0, l = this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;
        }
        else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
}
//Array.remove
Array.prototype.remove = function (val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] === val) {
            this.splice(i, 1);
            i--;
        }
    }
    return this;
}
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", { enumerable: false });
// Object.equals()
Object.prototype.equals = function (object2) {
    //For the first loop, we only check for types
    for (propName in this) {
        //Check for inherited methods and properties - like .equals itself
        //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwnProperty
        //Return false if the return value is different
        if (this.hasOwnProperty(propName) != object2.hasOwnProperty(propName)) {
            return false;
        }
        //Check instance type
        else if (typeof this[propName] != typeof object2[propName]) {
            //Different types => not equal
            return false;
        }
    }
    //Now a deeper check using other objects property names
    for (propName in object2) {
        //We must check instances anyway, there may be a property that only exists in object2
        //I wonder, if remembering the checked values from the first loop would be faster or not 
        if (this.hasOwnProperty(propName) != object2.hasOwnProperty(propName)) {
            return false;
        }
        else if (typeof this[propName] != typeof object2[propName]) {
            return false;
        }
        //If the property is inherited, do not check any more (it must be equa if both objects inherit it)
        if (!this.hasOwnProperty(propName))
            continue;

        //Now the detail check and recursion

        //This returns the script back to the array comparing
        /**REQUIRES Array.equals**/
        if (this[propName] instanceof Array && object2[propName] instanceof Array) {
            // recurse into the nested arrays
            if (!this[propName].equals(object2[propName]))
                return false;
        }
        else if (this[propName] instanceof Object && object2[propName] instanceof Object) {
            // recurse into another objects
            //console.log("Recursing to compare ", this[propName],"with",object2[propName], " both named \""+propName+"\"");
            if (!this[propName].equals(object2[propName]))
                return false;
        }
        //Normal value comparison for strings and numbers
        else if (this[propName] != object2[propName]) {
            return false;
        }
    }
    //If everything passed, let's say YES
    return true;
}