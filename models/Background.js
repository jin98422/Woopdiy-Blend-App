const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define collection and schema for Product
let Background = new Schema({
  filename: {
    type: String
  },
  filepath: {
    type: String
  },
  category: {
    type: String
  }
},{
    collection: 'Background'
});

module.exports = mongoose.model('Background', Background);