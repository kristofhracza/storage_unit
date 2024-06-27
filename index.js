// Modules
const express = require("express");
const expressFileUpload = require("express-fileupload");
const http = require("http");
const zip = require("adm-zip");
const fs = require("fs");

// Middleware
const app = express();
const server = http.createServer(app);

app.set("view engine", "ejs")
app.use(express.static("./public",));
app.use(expressFileUpload());
app.use(express.urlencoded({ extended: true }));

// DIRS
const UPLOADDIR = "./public/uploads"
const BACKUPSDIR = "./public/backups"

// Archiving
const makeZip = (name,res) =>  {
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
    fs.readdirSync(BACKUPSDIR).forEach(file => { if (file != ".gitkeep") fileArray.push([file,`${BACKUPSDIR}/${file}`])})
    res.render("pages/archives",{archives: fileArray});
})


// Uploading images
app.post("/upload", async (req,res) => {
    if (req.body.name == "" || !req.files || Object.keys(req.files).length === 0) return res.render("pages/error",{err:"Not enough input was given!"});
    if (!fs.existsSync(`${BACKUPSDIR}/${req.body.name}.zip`)){
        fs.mkdirSync(`${UPLOADDIR}/${req.body.name}`);
        
        if (req.files.img.length > 0) {
            for (const img of req.files.img) {
                await img.mv(`${UPLOADDIR}/${req.body.name}/${img.name}`);
            }
        }
        else await req.files.img.mv(`${UPLOADDIR}/${req.body.name}/${req.files.img.name}`);
        
        await archiveFile(req.body.name,res);
    }else res.render("pages/error",{err:"Album already exists"});
});

// Archive files sent over
const archiveFile = async (fileName,res) => {
    makeZip(fileName,res);
    fs.rmdirSync(`${UPLOADDIR}/${fileName}`,{ recursive: true, force: true });
    res.redirect("/success");
}

// For local deployment
server.listen(8080, "0.0.0.0");
// For vercel
module.exports = app