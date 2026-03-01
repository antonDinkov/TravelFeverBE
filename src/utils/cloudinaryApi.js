require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
    secure: true,
});

function uploadUserToCloudinary(buffer) {
    return uploadWithFolder(buffer, 'users');
}

function uploadToCloudinary(buffer) {
    return uploadWithFolder(buffer, 'trips');
}

function uploadWithFolder(buffer, folder) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
                if (error) return reject(error);

                resolve({
                    url: result.secure_url,
                    public_id: result.public_id
                });
            }
        );

        streamifier.createReadStream(buffer).pipe(stream);
    });
}

async function deleteFromCloudinary(publicId) {
    return cloudinary.uploader.destroy(publicId, { invalidate: true });
}

module.exports = {
    uploadUserToCloudinary,
    uploadToCloudinary,
    deleteFromCloudinary
};

/* async function uploadToCloudinary(file) {
  const result = await cloudinary.uploader.upload(file, {
    folder: "trips"
  });

  return {
    url: result.secure_url,
    public_id: result.public_id
  };
} */



/* async function uploadUserToCloudinary(file) {
  const result = await cloudinary.uploader.upload(file, {
    folder: "users"
  });

  return {
    url: result.secure_url,
    public_id: result.public_id
  };
} */
