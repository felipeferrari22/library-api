class BookDecorator {
    constructor(book) {
        this.book = book;
    }

    getDescription() {
        return this.book.getDescription();
    }
}

class FavoriteBook extends BookDecorator {
    constructor(book, favoriteCounter) {
        super(book);
        this.favoriteCounter = favoriteCounter;
    }

    getDescription() {
        return `${super.getDescription()} is the favorite of ${this.favoriteCounter} user(s)`;
    }
}

class RatedBook extends BookDecorator {
    constructor(book, rating) {
        super(book);
        this.rating = rating;
    }

    getDescription() {
        return `${super.getDescription()}, has an average rating of ${this.rating}`;
    }
}

module.exports = { FavoriteBook, RatedBook };