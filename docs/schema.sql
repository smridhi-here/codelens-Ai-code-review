-- Tables Hibernate creates automatically from the entities (MySQL flavour).
-- Kept here so you can show/explain the database design in your viva.

CREATE TABLE users (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(60)  NOT NULL,
    email          VARCHAR(120) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,     -- BCrypt hash, never the real password
    created_at     DATETIME     NOT NULL
);

CREATE TABLE reviews (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT,                       -- owner of the review
    language    VARCHAR(20)  NOT NULL,
    code        LONGTEXT     NOT NULL,
    score       INT          NOT NULL,
    summary     VARCHAR(255),
    created_at  DATETIME     NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE issues (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    review_id   BIGINT       NOT NULL,
    severity    VARCHAR(20)  NOT NULL,        -- error | warning | info
    rule_name   VARCHAR(60)  NOT NULL,
    line_no     INT,
    message     VARCHAR(500) NOT NULL,
    suggestion  VARCHAR(500),
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
);

-- Relationships: one user -> many reviews -> many issues.

-- Useful queries to demo:
-- SELECT id, name, email FROM users;
-- SELECT u.name, COUNT(r.id) AS reviews, AVG(r.score) AS avg_score
--   FROM users u LEFT JOIN reviews r ON r.user_id = u.id GROUP BY u.id;
-- SELECT rule_name, COUNT(*) AS times FROM issues GROUP BY rule_name ORDER BY times DESC;
