require('dotenv').config();

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  secure: true,
});

async function uploadToCloudinary(file) {
  const result = await cloudinary.uploader.upload(file, {
    folder: "trips"
  });

  return {
    url: result.secure_url,
    public_id: result.public_id
  };
}

async function deleteFromCloudinary(publicId) {
  return cloudinary.uploader.destroy(publicId, { invalidate: true });
}

module.exports = {
    uploadToCloudinary,
    deleteFromCloudinary,
};