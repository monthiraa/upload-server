var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var projectSchema = new Schema({
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
var Project = mongoose.model('Project', projectSchema);
module.exports = Project;
