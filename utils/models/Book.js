class Book {
    constructor(id, title, author, description, qty_available, image, release_date) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.description = description;
        this.qty_available = qty_available;
        this.image = image;
        this.release_date = release_date;
    }

    getDescription() {
        return `${this.title} by ${this.author}`;
    }
}

module.exports = Book;