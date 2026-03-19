import mongoose from 'mongoose';

const heroBannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  subtitle: {
    type: String,
    trim: true
  },
  badge: {
    type: String,
    trim: true
  },
  highlight: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  buttonText: {
    type: String,
    default: 'Shop Now',
    trim: true
  },
  buttonLink: {
    type: String,
    default: '/shop',
    trim: true
  },
  image: {
    type: String,
    required: [true, 'Image URL is required']
  },
  active: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

heroBannerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

heroBannerSchema.pre('save', async function(next) {
  if (this.isNew && this.order === 0) {
    const lastBanner = await this.constructor.findOne().sort('-order');
    this.order = lastBanner ? lastBanner.order + 1 : 1;
  }
  next();
});

const HeroBanner = mongoose.model('HeroBanner', heroBannerSchema);

export default HeroBanner;