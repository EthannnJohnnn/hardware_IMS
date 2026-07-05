const db = require('../config/database');

// Auto-create the table and insert a blank note if it doesn't exist
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS global_note (id INTEGER PRIMARY KEY, content TEXT)`);
    db.run(`INSERT OR IGNORE INTO global_note (id, content) VALUES (1, '')`);
});

const NoteModel = {
    getNote: (callback) => {
        db.get(`SELECT content FROM global_note WHERE id = 1`, [], (err, row) => {
            if (err) return callback(err, null);
            callback(null, row);
        });
    },
    saveNote: (content, callback) => {
        db.run(`UPDATE global_note SET content = ? WHERE id = 1`, [content], function(err) {
            if (err) return callback(err, null);
            callback(null, { message: "Note saved!" });
        });
    }
};

module.exports = NoteModel;