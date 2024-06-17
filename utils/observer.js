const FileLogger = require('./FileLogger');

class Observer {
    constructor() {
        this.observers = [];
    }

    addObserver(observer) {
        if(observer instanceof User) {
            this.observers.push(observer);
        } else {
            throw new Error('Observer must be of type User');
        }
    }

    removeObserver(observer) {
        this.observers = this.observers.filter(obs => obs !== observer);
    }

    notifyObservers(action, object) {
        this.observers.forEach(observer => observer.update(action, object));
        FileLogger.log(`${action} - ${object.name}`);
    }
}

class User {
    update(action, object) {
        console.log(`User notified: ${action} - ${object.name}`);
    }
}

module.exports = { Observer, User };