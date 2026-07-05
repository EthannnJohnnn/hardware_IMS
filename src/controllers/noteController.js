const NoteModel = require('../model/noteModel');

const noteController = {
    getNote: (req, res) => {
        NoteModel.getNote((err, data) => {
            if (err) return res.status(500).json({ error: "Failed to fetch note" });
            res.json(data);
        });
    },
    updateNote: (req, res) => {
        NoteModel.saveNote(req.body.content, (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to save note" });
            res.json(result);
        });
    }
};

module.exports = noteController;