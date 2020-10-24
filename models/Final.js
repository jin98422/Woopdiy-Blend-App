const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// Define collection and schema for Product
let Final = new Schema({
  email: {
    type: String
  },
  first_name: {
    type: String
  },
  last_name: {
    type: String
  },
  blendName: {
    type: String
  }, 
  filepath: {
    type: String
  },
  draft: {
    type: Boolean
  },
  background: {
    type: String
  },
  top_oil: {
    type: String
  },
  middle_oil: {
    type: String
  },
  bottom_oil: {
    type: String
  },
  font: {
    type: String
  },
  color: {
    type: String
  },
  category: {
    type: String
  },
  pick: {
    type: Boolean
  },
  rate: {
    type: String
  }
}, {
  timestamps: true
},
{
    collection: 'Final'
});

module.exports = mongoose.model('Final', Final);