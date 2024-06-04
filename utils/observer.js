class Observer {
    constructor() {
        this.observers = [];
    }

    addObserver(observer) {
        this.observers.push(observer);
    }

    removeObserver(observer) {
        this.observers = this.observers.filter(obs => obs !== observer);
    }

    notifyObservers(action, object) {
        this.observers.forEach(observer => observer.update(action, object));
    }
}

class User {
    update(action, object) {
        console.log(`User notified: ${action} - ${object.name}`);
    }
}

module.exports = { Observer, User };