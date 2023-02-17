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
        this.player_cnt = this.data.player.length;
        this.party_cnt = this.data.party.length;
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
    createParty = (ign, name) => {
        let leader = this.findByIgn(ign);
        leader.party = this.party_cnt;
        let json = { id: this.party_cnt, name: name, leader: leader.id, member: [] };
        this.data.party.push(json);
        this.party_cnt++;
        this.save();
        return json;
    }
    hasParty = (ign) => this.data.player.find(x => x.ign == ign).party != -1;
    joinParty = (ign, leader) => {
        let join = this.findByIgn(ign);
        let leader_p = this.findByIgn(leader).party;
        let party = this.findPartyById(leader_p);
        if (party.member.length == 3) return false;
        join.party = party.id;
        party.member.push(join.id);
        this.save();
        return party;
    }
    leaveParty = (ign) => {
        let leave = this.findByIgn(ign);
        let party = this.findPartyById(leave.party);
        if (party.leader == leave.ign) return false;
        leave.party = -1;
        party.member.remove(leave.id);
        return party;
    }
    findPartyByName = (name) => this.data.party.find(x => x.name == name);
    findPartyById = (id) => this.data.party.find(x => x.id == id);
}

module.exports = { RbwManager, rbwRank };


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