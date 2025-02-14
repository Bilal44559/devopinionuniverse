import multer, { diskStorage } from "multer";
import { sync } from "mkdirp";
import { devConfig } from '../config/config.js';

//path where images gonna save
var upload_dir = 'uploads';
// console.log(upload_dir);

var storage = diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname == "signature_image") {
      upload_dir = `${devConfig.imagesPath.userImage}`
    }
    if (file.fieldname == "profilePic") {
      upload_dir = `${devConfig.imagesPath.userImage}`
    }
    if (file.fieldname == "agreement") {
      upload_dir = `${devConfig.agreementPath.userAgreement}`
    }
    if (file.fieldname == "image") {
      upload_dir = `${devConfig.campaignImagesPath.campaignImage}`
    }
    if (file.fieldname == "logo") {
      upload_dir = `${devConfig.designSettingLogoPath.designSettingLogo}`
    }
    if (file.fieldname == "offerwall_logo") {
      upload_dir = `${devConfig.offerWallLogoPath.offerWallLogo}`
    }
    if (file.fieldname == "news_img") {
      upload_dir = `${devConfig.newsImagePath.newsImage}`
    }
    if (file.fieldname == "file") {
      upload_dir = `${devConfig.overallBlockedIpFilePath.ipFile}`
    }
    sync(upload_dir); //create directories if not exist
    cb(null, upload_dir);
  },
  filename: (req, file, cb) => {
    var originalname = file.originalname;
    var extension = originalname.split(".");
    let filename =
      file.fieldname + "-" + Date.now() + "." + extension[extension.length - 1]; // file save with original extension
    cb(null, filename);
  }
});

var upload = multer({
  storage: storage
});
// export default upload;
export default upload;
