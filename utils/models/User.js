class User {
    constructor(id, username, email, password, type, image, description, favoriteBook) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.type = type;
        this.image = image;
        this.description = description;
        this.favoriteBook = favoriteBook;
    }
}

class UserBuilder {
    constructor() {
        this.id = null;
        this.username = null;
        this.email = null;
        this.password = null;
        this.type = 'user';
        this.image = 'https://res.cloudinary.com/dsv8lpacy/image/upload/v1710962002/library/Kw9sLx3vPq.png';
        this.description = null;
        this.favoriteBook = null;
    }

    setId(id) {
        this.id = id;
        return this;
    }

    setUsername(username) {
        this.username = username;
        return this;
    }

    setEmail(email) {
        this.email = email;
        return this;
    }

    setPassword(password) {
        this.password = password;
        return this;
    }

    setType(type) {
        this.type = type;
        return this;
    }

    setImage(image) {
        this.image = image;
        return this;
    }

    setDescription(description) {
        this.description = description;
        return this;
    }

    setFavoriteBook(favoriteBook) {
        this.favoriteBook = favoriteBook;
        return this;
    }

    build() {
        return new User(
            this.id,
            this.username,
            this.email,
            this.password,
            this.type,
            this.image,
            this.description,
            this.favoriteBook
        );
    }
}

module.exports = { User, UserBuilder };