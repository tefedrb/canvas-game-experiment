class Earthling {
    constructor(name, mainElement, attacks, initialHealth, defense, speed){
        this._name = name;
        this._attacks = attacks;
        this._health = initialHealth;
        this._defense = defense;
        this._speed = speed;
        this._mainElement = mainElement;
    }

    get name(){
        return this._name;
    }

    get attacks(){
        return this._attacks;
    }

    get health(){
        return this._health;
    }

    get defense(){
        return this._defense;
    }

    get mainElement(){
        return this._mainElement;
    }

    set health(health){
        this._health = health;
    }

    set speed(num){
        this._speed = num;
    }

    isAttackedBy(dmg){
        this.health -= dmg;
    }

    useAttack(attack){
        console.log(this.attacks[attack], "<--- attack")
        return this.attacks[attack];
    }
}

class AI {
    constructor(name, type, attacks, health, defense, speed){
        this._name = name;
        this._type = type;
        this._attacks = attacks;
        this._health = health;
        this._defense = defense;
        this._speed = speed;
    }

    get name(){
        return this._name;
    }

    get attacks(){
        return this._attacks;
    }

    get health(){
        return this._health;
    }

    get defense(){
        return this._defense;
    }

    get mainElement(){
        return this._mainElement;
    }

    set health(health){
        this._health = health;
    }

    set speed(num){
        this._speed = num;
    }

    isAttackedBy(dmg){
        this.health -= dmg;
    }

    useRandomAttack(){
        const attacks = [];
        for(let attack in this.attacks){
            attacks.push([attack, this.attacks[attack]]);
        }
        const random = Math.floor(Math.random() * attacks.length);
        console.log(random);
        return attacks[random];
    }
}

class Interaction {
    constructor(player, comp){
        this._player = player;
        this._comp = comp;
        this._turn = player.speed > comp.speed ? player : comp;
    }

    get player(){
        return this._player;
    }

    get comp(){
        return this._comp;
    }

    get turn(){
        return this._turn;
    }

    fight(playerAttk, compAttk){
        if(this.turn === this.player){
            this.comp.isAttackedBy(playerAttk);
        } else {
            this.player.isAttackedBy(compAttk);
        }
    }

    switchTurns(){
        this.turn = this.turn === this.player ? this.comp : this.player;
    }
}

// Lets build a fighting interaction between an Earthling and AI
const player1 = new Earthling("Ragnarock", "Electric", { windPush: 10, brushFire: 20, staticCharge: 40 }, 100, 50, 45);
const puddy = new AI("CopperTop", "Soft Body", { rocketPunch: 15, plasmaShot: 35, speedAttack: 25 }, 100, 50, 35);
const playGameBtn = document.querySelector("#startGame");
const attack = document.querySelector("#attack");

console.log(player1);
player1.useAttack("windPush");

playGameBtn.addEventListener("click", () => fightSession(player1, puddy));

function round(player, ai){
    const interaction = new Interaction(player, ai);
    interaction.fight(player.useAttack("windPush"), ai.useRandomAttack());
    interaction.switchTurns();
    interaction.fight(player.useAttack("windPush"), ai.useRandomAttack());
}