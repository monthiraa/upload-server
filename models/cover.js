var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var coverSchema = new Schema({
  host: {
    type: Schema.Types.String
  },
  path: {
    type: Schema.Types.String,
    required: true
  },
  fileName: {
    type: Schema.Types.String,
    required: true
  },
  type: {
    type: Schema.Types.String,
    required: true
  },
  size: {
    type: Schema.Types.String
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
var Cover = mongoose.model('Cover', coverSchema);
module.exports = Cover;
