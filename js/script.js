/* 
    There is no way I am finishing this. This will act as a proof of concept.

    Game Title: Earthling
    Game Type: RPG
    Game Premise: Humans vs an Invading Alien AI
        A malicious Alien AI has made it's way to Earth to rid the planet of inteligent life and to gather all mineral resources to
        support their growth as a species... you know, the usual.

        Most humans are no match for these metalbound AI Humonoids, however there are a select few who can harness sacred earthly
        forces... I think you see where this is going. 
        
        You are one of a select few who have kept their power a secret to the majority of the population, except those who also 
        share these rare abilities. During the early ages of humanity there were civilizations who were more intune with the 
        connection between the spiritual, natural earthly forces and the human body, and these people passed on methods to help 
        develop and control that connection - some might call it magic. Of course, because of jealousy, fear and pure greed, 
        there developed a faction of humans who banded together to oppressed those with powers after a major natural disaster 
        wiped out a majority of those with powers. Throughout the ages, the oppression became so great that today there only 
        remain a small fraction of the population who have or know that they have powers, and even fewer who have access to the 
        ancient teachings of development and control over said powers.
*/

class Earthling {
    constructor(name, attacks, initialHealth, defense, agility, mainElement){
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

    set agility(num){
        this._agility = num;
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

    set agility(num){
        this._agility = num;
    }
}