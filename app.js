const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs'); // For file system operations

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('./public')); // Serve static files
app.set('view engine', 'ejs');

// Connect to MySQL (XAMPP)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',  // No password for default XAMPP setup
    database: 'musicko'
});

db.connect((err) => {
    if (err) throw err;
    console.log('MySQL Connected...');
});

// File upload configuration
const storage = multer.diskStorage({
    destination: './public/uploads',
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage }).single('song');

// ROUTES

// Render home page and list songs
app.get('/', (req, res) => {
    let sql = 'SELECT * FROM songs';
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.render('index', { songs: results });
    });
});

// Render upload form
app.get('/upload', (req, res) => {
    res.render('upload');
});

// Upload song
app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            res.render('upload', { msg: 'Error uploading file: ' + err });
        } else {
            const songData = {
                title: req.body.title,
                artist: req.body.artist,
                path: `/uploads/${req.file.filename}`,
                image: req.body.image
            };
            let sql = 'INSERT INTO songs SET ?';
            db.query(sql, songData, (err, result) => {
                if (err) throw err;
                res.redirect('/');
            });
        }
    });
});

// Mark song as favorite
app.get('/favorite/:id', (req, res) => {
    let sql = `UPDATE songs SET is_favorite = 1 WHERE id = ${req.params.id}`;
    db.query(sql, (err, result) => {
        if (err) throw err;
        res.redirect('/');
    });
});

// View favorite songs
app.get('/favorites', (req, res) => {
    let sql = 'SELECT * FROM songs WHERE is_favorite = 1';
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.render('favorites', { songs: results });
    });
});

// Delete a song
app.get('/delete/:id', (req, res) => {
    let sql = `SELECT path FROM songs WHERE id = ${req.params.id}`;
    db.query(sql, (err, result) => {
        if (err) throw err;

        if (result.length > 0) {
            const filePath = path.join(__dirname, 'public', result[0].path);
            
            // Delete file from the file system
            fs.unlink(filePath, (err) => {
                if (err) throw err;
                
                // Delete song from the database
                let deleteSql = `DELETE FROM songs WHERE id = ${req.params.id}`;
                db.query(deleteSql, (err, deleteResult) => {
                    if (err) throw err;
                    res.redirect('/');
                });
            });
        } else {
            res.redirect('/');
        }
    });
});

// Start server
app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
