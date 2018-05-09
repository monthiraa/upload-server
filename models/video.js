var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var videoSchema = new Schema({
  host: {
    type: Schema.Types.String,
    required: true
  },
  name: {
    type: Schema.Types.String,
    required: true
  },
  type: {
    type: Schema.Types.String,
    required: true
  },
  mediaId: {
    type: Schema.Types.ObjectId,
    ref: 'Media'
  }
});

// Compile model from schema
var Video = mongoose.model('Project', videoSchema);
module.exports = Video;
