const express = require('express');

const {Storage} = require('@google-cloud/storage');
const dotenv = require('dotenv');
const crypto = require('crypto');
const app = express();
const path = require('path');
dotenv.config();
const imageId = crypto.randomBytes(6).toString('hex');
const projectID = process.env.GOOGLE_PROJECT_ID;
const BucketName = process.env.BUCKET_NAME;
const fileStorage = Multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/images');
  },
  filename: (req, file, cb) => {
    if (
      file.mimetype == 'image/png' ||
      file.mimetype == 'image/jpg' ||
      file.mimetype == 'image/jpeg'
    ) {
      cb(null, file.originalname);
    } else {
      return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  },
});
const upload = Multer({
  storage: fileStorage,
  limits: {fileSize: 10 * 1024 * 1024},
});
const serviceKey = path.join(__dirname, 'google json file');

const storage = new Storage({
  keyFilename: serviceKey,
  projectId: `${projectID}`,
});
const deleteFiles = () => {
  fs.readdir('./public/images', (err, files) => {
    if (err) throw err;

    files.map((file) => {
      fs.unlink(`./public/images/${file}`, (err) => {
        if (err) throw err;
      });
    });
  });
};

app.post('/multipleupload', upload.array('file', 5), async (req, res, next) => {
  fs.readdir('./public/images', async (err, files) => {
    if (err) {
      console.log(err);
      return;
    }

    const urls = await Promise.all(
      files.map(async (file) => {
        await storage
          .bucket(`${BucketName}`)
          .upload(`./public/images/${file}`, {
            destination: `images/original/${imageId}${file}`,
          });
        const publicUrl = format(
          `https://storage.googleapis.com/${BucketName}/images/original/${imageId}${file}`
        );
        return publicUrl;
      })
    );
    res.send(urls);

    if (urls !== null) {
      deleteFiles();
    }
  });

  return res.send('Token Expired or Wrong Token!Token Undefined');
});
app.listen(5000, () => {
  console.log(`App listening on port 5000`);
});
