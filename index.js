// Modules
const express = require("express");
const expressFileUpload = require("express-fileupload");
const path = require("path");
const http = require("http");
const zip = require("adm-zip");
const fs = require("fs");

// Middleware
const app = express();
const server = http.createServer(app);

app.set("view engine", "ejs")
app.use(express.static(path.join(__dirname, "./public",)));
app.use(expressFileUpload());
app.use(express.urlencoded({ extended: true }));

// DIRS
const PUBLICDIR = path.join(__dirname, "./public",)
const UPLOADDIR = path.join(__dirname, "./public/uploads",)
const BACKUPSDIR = path.join(__dirname, "./public/backups",)

// Archiving
const makeZip = async (name) =>  {
    try{
        const temZip = new zip();
        const output = `${BACKUPSDIR}/${name}.zip`;
        temZip.addLocalFolder(`${UPLOADDIR}/${name}`);
        temZip.writeZip(output);
    } catch(e) {res.render("pages/error",{err:e});}
}

// Views
app.get("/",(req,res) => {
    res.render("pages/index");
});
app.get("/error",(req,res) => {
    res.render("pages/error");
})
app.get("/success",(req,res) => {
    res.render("pages/done");
})
app.get("/archives",(req,res) => {
    // Get list of all archives
    let fileArray = [];
    fs.readdirSync(BACKUPSDIR).forEach(file => { fileArray.push([file,`file:/${BACKUPSDIR}/${file}`])})
    res.render("pages/archives",{archives: fileArray});
})



// Uploading images
app.post("/upload", (req,res) => {
    if (req.body.name == "" || !req.files || Object.keys(req.files).length === 0) return res.status(500).render("pages/error",{err:"Not enough input was given!"});
    if (!fs.existsSync(`${BACKUPSDIR}/${req.body.name}.zip`)){
        fs.mkdirSync(`${UPLOADDIR}/${req.body.name}`);
        
        if (req.files.img.length > 0) req.files.img.forEach(img => { img.mv(`${UPLOADDIR}/${req.body.name}/${img.name}`); });
        else req.files.img.mv(`${UPLOADDIR}/${req.body.name}/${req.files.img.name}`);
        
        res.redirect(`/archive?name=${req.body.name}`);
    }else res.render("pages/error",{err:"Album already exists"});
});

// Archive files sent over
app.get("/archive",(req,res) => {
    makeZip(req.query.name);
    fs.rmdirSync(`${UPLOADDIR}/${req.query.name}`,{ recursive: true, force: true });
    res.redirect("/success");
})



// For local deployment
server.listen(8080, "0.0.0.0");
// For vercel
module.exports = app