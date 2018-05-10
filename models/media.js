var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var mediaSchema = new Schema({
  host: {
    type: Schema.Types.String,
  },
  path: {
    type: Schema.Types.String
  },
  serviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Service'
  }
});

// Compile model from schema
var Media = mongoose.model('Media', mediaSchema);
module.exports = Media;
