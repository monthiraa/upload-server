var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var videoSchema = new Schema({
  host: {
    type: Schema.Types.String,
  },
  path: {
    type: Schema.Types.String,
    required: true
  },
  type: {
    type: Schema.Types.String,
    required: true
  },
  fileName: {
    type: Schema.Types.String,
    required: true
  },
  serviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Service'
  },
  coverId: [{
    type: Schema.Types.ObjectId,
    ref: 'Cover'
  }],
  createAt: {
    type: Schema.Types.Date,
    default: Date.now
  },
  updateAt: {
    type: Schema.Types.Date
  },
  deleted: {
    type :Schema.Types.Boolean,
    default: false
  }
});

// Compile model from schema
var Video = mongoose.model('Video', videoSchema);
module.exports = Video;
