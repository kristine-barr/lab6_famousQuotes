// Loads the environment variables from the .env file
import "dotenv/config";

// Imports the Express framework
import express from "express";

// Imports MySQL with Promise support
import mysql from "mysql2/promise";

const app = express();

// Set EJS as the view engine
app.set("view engine", "ejs");

// Serve static files from the public folder
app.use(express.static("public"));

// Allows Express to read form data submitted using POST
app.use(express.urlencoded({ extended: true }));

// Create a connection pool to the MySQL database
const conn = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectionLimit: 10,
    waitForConnections: true
});


// ======================
// Home Route
// ======================

// Display the home page
app.get("/", (req, res) => {
    res.render("index");
});


// ======================
// Author Routes
// ======================

// Display the Add Author form
app.get("/author/new", (req, res) => {
    res.render("newAuthor");
});

// Process the Add Author form
app.post("/author/new", async function (req, res) {

    // Get the values submitted from the form
    let fName = req.body.fName;
    let lName = req.body.lName;
    let birthDate = req.body.birthDate;
    let deathDate = req.body.deathDate;
    let sex = req.body.sex;
    let profession = req.body.profession;
    let country = req.body.country;
    let portrait = req.body.portrait;
    let biography = req.body.biography;

    // SQL statement to insert a new author
    let sql = `
        INSERT INTO q_authors
        (firstName, lastName, dob, dod, sex, profession, country, portrait, biography)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Values that replace the SQL placeholders
    let params = [
        fName,
        lName,
        birthDate,
        deathDate,
        sex,
        profession,
        country,
        portrait,
        biography
    ];

    // Execute the SQL query
    const [rows] = await conn.query(sql, params);

    // Redisplay the form with a success message
    res.render("newAuthor", {
        "message": "Author added!"
    });
});

// Display a list of all authors
app.get("/authors", async function (req, res) {

    // Retrieve all authors sorted by last name
    let sql = `
        SELECT *
        FROM q_authors
        ORDER BY lastName;
    `;

    // Execute the SQL query
    const [rows] = await conn.query(sql);

    // Send the authors to authorList.ejs
    res.render("authorList", {
        "authors": rows
    });
});

// Display the Edit Author form 
app.get("/author/edit", async function (req, res) {

    // Get the authorId from the UPDATE link 
    let authorId = req.query.authorId; 

    // Retrieve the selected author's information 
    // DATE_FORMAT changes the date to YYYY-MM-DD for the right date input 
    let sql = `
        SELECT *,
        DATE_FORMAT(dob, '%Y-%m-%d') dobISO,
        DATE_FORMAT(dod, '%Y-%m-%d') dodISO
        FROM q_authors
        WHERE authorId = ${authorId}
    `; 

    // Execute the SQL qury
    const [rows] = await conn.query(sql); 

    // Send the selected author's information to editAuthor.ejs
    res.render("editAuthor", { "authorInfo": rows }); 
});

// Process the Edit Author form 
app.post("/author/edit", async function(req, res) {

    // Update the selected author's information 
    let sql = `
        UPDATE q_authors
        SET firstName = ?, 
            lastName = ?, 
            dob = ?,
            dod = ?, 
            sex = ?,
            profession = ?, 
            country = ?,
            portrait = ?, 
            biography = ?
        WHERE authorId = ?
    `;

    // Values that replace the SQL placeholders 
    let params = [
        req.body.fName,
        req.body.lName, 
        req.body.birthDate,
        req.body.deathDate,
        req.body.sex,
        req.body.profession,
        req.body.country,
        req.body.portrait, 
        req.body.biography,
        req.body.authorId
    ];

    // Execute the UPDATE query 
    const [rows] = await conn.query(sql, params);

    // Return to the list of authors 
    res.redirect("/authors"); 
});


// Delete the selected author 
app.get("/author/delete", async function(req, res) {

    // Get the authorId from the DELETE link 
    let authorId = req.query.authorId; 

    // SQL statement to delete the selected author 
    let sql = `
        DELETE FROM q_authors
        WHERE authorId = ?
    `;

    // Execute the SQL query
    await conn.query(sql, [authorId]);

    // Return to the list of authors 
    res.redirect("/authors");
});


// ======================
// Quote Routes
// ======================

// Display the Add Quote form 
app.get("/quote/new", async function(req, res){

    // Retrieve all authors from the database 
    let authorSql = `
        SELECT authorId, firstName, lastName
        FROM q_authors
        ORDER BY lastName
    `;

    // Execute the SQL query
    const [authorRows] = await conn.query(authorSql);

    // Retrieve all categories from the database 
    let categorySql = `
        SELECT DISTINCT category
        FROM q_quotes
        WHERE category IS NOT NULL 
        AND category != ''
        ORDER BY category 
    `;

    // Execute the SQL query 
    const [categoryRows] = await conn.query(categorySql);
    
    // Send authors and categories to newQuote.ejs
    res.render("newQuote", {
        authors: authorRows,
        categories: categoryRows
    }); 
});

// Process the Add Quote form 
app.post("/quote/new", async function(req, res) {

    // Get the values submitted from the form 
    let authorId = req.body.authorId;
    let quote = req.body.quote;
    let category = req.body.category;
    let likes = req.body.likes;

    // SQL statement to insert a new quote 
    let sql=`
        INSERT INTO q_quotes
        (authorId, quote, category, likes)
        VALUES(?, ?, ?, ?)
    `;

    // Values that replace the SQL placeholders (?)
    let params = [authorId, quote, category, likes];

    // Execute the SQL query
    const [rows] = await conn.query(sql, params);

    // Retrieve all authors from the database 
    let authorSql = `
        SELECT authorId, firstName, lastName
        FROM q_authors
        ORDER BY lastName
    `;

    // Execute the SQL query
    const [authorRows] = await conn.query(authorSql);

    // Retrieve all categories from the database 
    let categorySql = `
        SELECT DISTINCT category
        FROM q_quotes
        WHERE category IS NOT NULL
        AND category != '' 
        ORDER BY category
    `;

    // Execute the SQL query 
    const [categoryRows] = await conn.query(categorySql); 

    // Redisplay the form with a success message 
    res.render("newQuote", {
        message: "Quote added!",
        authors: authorRows,
        categories: categoryRows
    });
});

// Display a list of all quotes 
app.get("/quotes", async function (req, res) {

    // SQL statement to retrieve all quotes sorted by quote ID 
    let sql = `
        SELECT *
        FROM q_quotes
        ORDER BY quoteId; 
    `;

    // Execute the SQL query 
    let [rows] = await conn.query(sql); 

    // Send the list of quotes to quoteList.ejs 
    res.render("quoteList", { "quotes": rows }); 
});

// Display the Edit Quote Form 
app.get("/quote/edit", async function(req, res) {

    // Get the quoteId from the UPDATE link 
    let quoteId = req.query.quoteId;

    // Retrieve the selected quote 
    let quoteSql = `
        SELECT * 
        FROM q_quotes
        WHERE quoteId = ?
    `;

    // Execute the quote SQL query
    const [quoteRows] = await conn.query(quoteSql, [quoteId]);

    // Retrieve all authors from the database 
    let authorSql = `
        SELECT authorId, firstName, lastName
        FROM q_authors 
        ORDER BY lastName
    `;

    // Execute the author SQL query 
    const [authorRows] = await conn.query(authorSql); 

    // Retrieve all existing categories from the database 
    let categorySql = `
        SELECT DISTINCT category 
        FROM q_quotes 
        WHERE category IS NOT NULL 
        AND category != ''
        ORDER BY category 
    `;

    // Execute the category SQL query 
    const [categoryRows] = await conn.query(categorySql); 

    // Send the quote, author, and categories to editQuote.ejs
    res.render("editQuote", { 
        quoteInfo: quoteRows,
        authors: authorRows,
        categories: categoryRows
    }); 
});

// Process the Edit Quote form 
app.post("/quote/edit", async function (req,res){

    // SQL statement to update the selected quote 
    let sql = `
        UPDATE q_quotes 
        SET authorId = ?,
            category = ?, 
            quote = ?,
            likes = ? 
        WHERE quoteId = ?
    `;

    // Values that replace the SQL placeholders 
    let params = [
        req.body.authorId, 
        req.body.category,
        req.body.quote,
        req.body.likes,
        req.body.quoteId
    ];

    // Execute the UPDATE query 
    const [rows] = await conn.query(sql, params); 

    // Return to the list of quotes 
    res.redirect("/quotes");
});

// Delete Selected Quote 
app.get("/quote/delete", async function(req,res){

    // Get the quote ID from the DELETE link 
    let quoteId = req.query.quoteId

    // SQL Statement to delete the selected quote 
    let sql = `
        DELETE FROM q_quotes
        WHERE quoteId = ? 
    `;

    // Execute the SQL query 
    await conn.query(sql, [quoteId]);

    // Return to the list of quotes 
    res.redirect("/quotes"); 
});


// ======================
// Utility Route
// ======================

// Test the database connection
app.get("/dbTest", async (req, res) => {
    try {
        const [rows] = await conn.query("SELECT CURDATE()");
        res.send(rows);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error");
    }
});


// ======================
// Start Server
// ======================

app.listen(3000, () => {
    console.log("Express server running");
});