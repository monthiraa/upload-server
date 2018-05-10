var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var profileSchema = new Schema({
  mediaType: {
    type: Schema.Types.String,
  },
  name: Schema.Types.String,
  saveDist: {
    type: Schema.Types.Boolean,
    default : false
  },
  config: {
       width: {type: Schema.Types.Number},
       height: {type: Schema.Types.Number},
       quality: {type: Schema.Types.Number},
       outputType: {type: Schema.Types.String}
    },
  deletetd: {
    type :Schema.Types.Boolean,
    default : false
  },
  path: {
    type: Schema.Types.String,
  },
  createAt: {
    type: Schema.Types.Date,
    default: Date.now
  },
  updateAt: {
    type: Schema.Types.Date
  },  
  serviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Service'
  },    
  

});

// Compile model from schema
var Profile = mongoose.model('Profile', profileSchema);
module.exports = Profile;
