class Earthling {
    constructor(name, mainElement, attacks, initialHealth, defense, agility){
        this._name = name;
        this._attacks = attacks;
        this._health = initialHealth;
        this._defense = defense;
        this._agility = agility;
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

    set agility(num){
        this._agility = num;
    }

    isAttackedBy(dmg){
        this.health -= dmg;
    }

    useAttack(attack){
        console.log(this.attacks[attack], "<--- attack")
        return this.attacks[attack];
    }
}

class Alien {
    constructor(name, type, attacks, health, defense, agility){
        this._name = name;
        this._type = type;
        this._attacks = attacks;
        this._health = health;
        this._defense = defense;
        this._agility = agility;
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

    set agility(num){
        this._agility = num;
    }

    isAttackedBy(dmg){
        this.health -= dmg;
    }
}

// Lets build a fighting interaction between an Earthling and Alien
const player1 = new Earthling("Ragnarock", "Electric", { windPush: 10, brushFire: 20, staticCharge: 40 }, 100, 50, 45);
const puddy = new Alien("CopperTop", "Soft Body", { rocketPunch: 15, plasmaShot: 35, speedAttack: 25 }, 100, 50, 35);
const playGameBtn = document.querySelector("#startGame");
const attack = document.querySelector("#attack");

console.log(player1);
player1.useAttack("windPush");

playGameBtn.addEventListener("click", () => fightSession(player1, puddy));

function fightSession(player, alien){
    alien.isAttackedBy(player.useAttack("brushFire"));
    console.log(alien, "<--- alien attacked!")
}