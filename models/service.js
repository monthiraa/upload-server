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
  },
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
var Service = mongoose.model('Service', serviceSchema);
module.exports = Service;
