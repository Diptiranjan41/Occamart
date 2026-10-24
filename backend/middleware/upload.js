import multer from 'multer';
import path from 'path';
import cloudinary from '../config/cloudinary.js';

// Memory mein rakho, disk par nahi (Render ka disk temporary hai)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) return cb(null, true);
  cb(new Error('Only image files are allowed'));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

const uploadBufferToCloud = (buffer, folder) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: 'image' }, (err, result) =>
        err ? reject(err) : resolve(result)
      )
      .end(buffer);
  });

// multer ke baad har file Cloudinary par bhejta hai
const sendFilesToCloud = async (req, folder) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary is not configured on the server');
  }

  const files = req.files
    ? Array.isArray(req.files) ? req.files : Object.values(req.files).flat()
    : req.file ? [req.file] : [];

  for (const file of files) {
    const result = await uploadBufferToCloud(file.buffer, folder);
    file.path = result.secure_url;      // permanent https URL
    file.url = result.secure_url;
    file.filename = result.secure_url;  // purane code mein file.filename ka matlab ab full URL hai
    file.public_id = result.public_id;
    delete file.buffer;                 // memory free karo
  }
};

const withCloud = (multerFn, folder = 'occamart') => (req, res, next) => {
  multerFn(req, res, async (err) => {
    if (err) return next(err);
    try {
      await sendFilesToCloud(req, folder);
      next();
    } catch (e) {
      console.error('❌ Cloudinary upload error:', e.message);
      next(e);
    }
  });
};

// Pehle jaise hi use hote hain: router.post('/', uploadMultiple, controller)
export const uploadMultiple = withCloud(upload.array('images', 5), 'occamart/products');
export const uploadSingle = withCloud(upload.single('image'), 'occamart/images');

export default upload;
