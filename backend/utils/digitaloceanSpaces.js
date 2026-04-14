const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

/**
 * Configure DigitalOcean Spaces (S3-compatible)
 * DigitalOcean Spaces uses AWS SDK v2
 */
const spacesEndpoint = new AWS.Endpoint(process.env.DIGITALOCEAN_SPACES_ENDPOINT);

const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DIGITALOCEAN_SPACES_KEY,
  secretAccessKey: process.env.DIGITALOCEAN_SPACES_SECRET,
  region: process.env.DIGITALOCEAN_SPACES_REGION,
});

/**
 * Upload file to DigitalOcean Spaces
 * @param {Object} file - Express file object from multer
 * @param {String} folder - Folder path (e.g., 'crops', 'users', 'docs')
 * @returns {String} - Public URL of uploaded file
 */
const uploadToSpaces = async (file, folder = 'uploads') => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const filename = `${timestamp}-${random}-${file.originalname}`;
    const key = `${folder}/${filename}`;

    // Prepare file
    const fileStream = fs.createReadStream(file.path);

    const params = {
      Bucket: process.env.DIGITALOCEAN_SPACES_NAME,
      Key: key,
      Body: fileStream,
      ContentType: file.mimetype,
      ACL: 'public-read', // Make file publicly accessible
    };

    // Upload to Spaces
    const result = await s3.upload(params).promise();

    // Optional: Use CDN URL if configured
    const imageUrl = process.env.DIGITALOCEAN_SPACES_CDN_URL
      ? `${process.env.DIGITALOCEAN_SPACES_CDN_URL}/${key}`
      : result.Location;

    // Delete local file after upload
    fs.unlinkSync(file.path);

    return {
      success: true,
      url: imageUrl,
      key: key,
      size: file.size,
      mimetype: file.mimetype,
    };
  } catch (error) {
    console.error('Error uploading to DigitalOcean Spaces:', error);
    // Delete local file if upload fails
    if (file && file.path) {
      fs.unlinkSync(file.path);
    }
    throw new Error(`Upload failed: ${error.message}`);
  }
};

/**
 * Delete file from DigitalOcean Spaces
 * @param {String} fileKey - Full file path in Spaces (e.g., 'crops/filename.jpg')
 */
const deleteFromSpaces = async (fileKey) => {
  try {
    const params = {
      Bucket: process.env.DIGITALOCEAN_SPACES_NAME,
      Key: fileKey,
    };

    await s3.deleteObject(params).promise();

    return {
      success: true,
      message: `File deleted: ${fileKey}`,
    };
  } catch (error) {
    console.error('Error deleting from DigitalOcean Spaces:', error);
    throw new Error(`Delete failed: ${error.message}`);
  }
};

/**
 * List all files in a folder
 * @param {String} folder - Folder path (e.g., 'crops')
 */
const listSpacesFiles = async (folder) => {
  try {
    const params = {
      Bucket: process.env.DIGITALOCEAN_SPACES_NAME,
      Prefix: `${folder}/`,
    };

    const result = await s3.listObjects(params).promise();

    return {
      success: true,
      files: result.Contents || [],
      count: result.Contents ? result.Contents.length : 0,
    };
  } catch (error) {
    console.error('Error listing Spaces files:', error);
    throw new Error(`List failed: ${error.message}`);
  }
};

module.exports = {
  uploadToSpaces,
  deleteFromSpaces,
  listSpacesFiles,
  s3,
};
