-- Bookstore schema - MySQL 8.4 (InnoDB is required for foreign keys).
CREATE TABLE categories (
    category_id   INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(60) NOT NULL UNIQUE,
    description   VARCHAR(200)
) ENGINE=InnoDB;

CREATE TABLE customers (
    customer_id       INT AUTO_INCREMENT PRIMARY KEY,
    first_name        VARCHAR(50)  NOT NULL,
    last_name         VARCHAR(50)  NOT NULL,
    email             VARCHAR(120) NOT NULL UNIQUE,
    phone             VARCHAR(20),
    city              VARCHAR(60)  NOT NULL,
    country           VARCHAR(60)  NOT NULL DEFAULT 'France',
    created_at        DATE         NOT NULL,
    newsletter_opt_in BOOLEAN      NOT NULL DEFAULT FALSE
) ENGINE=InnoDB;

CREATE TABLE books (
    book_id          INT AUTO_INCREMENT PRIMARY KEY,
    isbn             VARCHAR(17)   NOT NULL UNIQUE,
    title            VARCHAR(150)  NOT NULL,
    author           VARCHAR(100)  NOT NULL,
    category_id      INT           NOT NULL,
    unit_price       DECIMAL(8,2)  NOT NULL CHECK (unit_price >= 0),
    stock_quantity   INT           NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    publication_year INT,
    publisher        VARCHAR(80),
    FOREIGN KEY (category_id) REFERENCES categories (category_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE orders (
    order_id     INT AUTO_INCREMENT PRIMARY KEY,
    customer_id  INT         NOT NULL,
    order_date   DATE        NOT NULL,
    status       VARCHAR(10) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','paid','shipped','cancelled')),
    shipped_date DATE,
    CHECK (shipped_date IS NULL OR shipped_date >= order_date),
    FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id      INT          NOT NULL,
    book_id       INT          NOT NULL,
    quantity      INT          NOT NULL CHECK (quantity > 0),
    unit_price    DECIMAL(8,2) NOT NULL CHECK (unit_price >= 0),
    UNIQUE (order_id, book_id),
    FOREIGN KEY (order_id) REFERENCES orders (order_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books (book_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Cardinality: an order has 0 or 1 payment (UNIQUE on order_id).
CREATE TABLE payments (
    payment_id   INT AUTO_INCREMENT PRIMARY KEY,
    order_id     INT           NOT NULL UNIQUE,
    amount       DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_date DATE          NOT NULL,
    method       VARCHAR(10)   NOT NULL CHECK (method IN ('card','paypal','transfer')),
    FOREIGN KEY (order_id) REFERENCES orders (order_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;
