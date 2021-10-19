const express = require("express");
const router = express.Router();
const Book = require("../models/book");
const Author = require("../models/author");
const fs = require("fs");
const path = require("path");
const uploadPath = path.join("public", Book.coverImageBasePath);
const imageMimeTypes = ["image/jpeg", "image/png", "image/gif"];
const multer = require("multer");
const upload = multer({
  dest: uploadPath,
  filefilter: (req, file, callback) => {
    callback(null, imageMimeTypes.includes(file.mimetype));
  },
});

// all books route
router.get("/", async (req, res) => {
  let query = Book.find();

  if (req.query.title != null && req.query.title != "") {
    query = query.regex("title", new RegExp(req.query.title));
  }

  if (req.query.publishBefore != null && req.query.publishBefore != "") {
    query = query.lte("publishDate", req.query.publishBefore);
  }

  if (req.query.publishAfter != null && req.query.publishAfter != "") {
    query = query.gte("publishDate", req.query.publishAfter);
  }

  try {
    const books = await query.exec();
    res.render("books/index", {
      books: books,
      searchOptions: req.query,
    });
  } catch {
    res.redirect("/");
  }
});

// new books route
router.get("/new", async (req, res) => {
  renderNewPage(res, new Book());
});

//creating books route
router.post("/", upload.single("cover"), async (req, res) => {
  const fileName = req.file != null ? req.file.filename : null;
  const book = new Book({
    title: req.body.title,
    author: req.body.author,
    publishDate: new Date(req.body.publishDate),
    pageCount: parseInt(req.body.pageCount),
    coverImageName: fileName,
    description: req.body.description,
  });

  try {
    const newBook = await book.save();
    //res.redirect(`books/${newBook.id}`)
    res.redirect(`books`);
  } catch {
    if (book.coverImageName != null) {
      removeBookCover(book.coverImageName);
    }

    renderNewPage(res, book, true);
  }
  //res.send("Create books");
});

function removeBookCover(fileName) {
  fs.unlink(path.join(uploadPath, fileMame), (err) => {
    if (err) console.error(err);
  });
}

async function renderNewPage(res, book, hasError = false) {
  try {
    const authors = await Author.find({});
    const params = {
      authors: authors,
      book: book,
    };

    if (hasError) params.errorMessage = "Error while creating book";
    res.render("books/new", params);
    //console.log(hasError);
  } catch {
    res.redirect("/books");
  }
}
module.exports = router;
