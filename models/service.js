var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var serviceSchema = new Schema({
  serviceKey: {
    type: Schema.Types.String,
    required: true
  },
  path: {
    type: Schema.Types.String,
    required: true
  },
  secretKey: {
    type: Schema.Types.String,
    required: true
  },
  name: {
    type: Schema.Types.String,
    required: true
  }
});

// Compile model from schema
var Service = mongoose.model('Project', serviceSchema);
module.exports = Service;
