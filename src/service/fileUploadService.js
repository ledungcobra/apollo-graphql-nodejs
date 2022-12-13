const cloudinary = require("cloudinary").v2;
const { finished } = require("stream/promises");
const { print } = require("../utils/utils");
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true,
});

const uploadToCloudinary = async (stream) => {
  const out = require("fs").createWriteStream("local-file-output");
  stream.pipe(out);
  await finished(out);
  const result = await cloudinary.uploader.upload("local-file-output");
  require("fs").unlink("local-file-output");
  print(result);
  return {
    filename: "",
    mimetype: "",
    encoding: "",
  };
};
module.exports = { uploadToCloudinary };
