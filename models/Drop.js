const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define collection and schema for Product
let Drop = new Schema({
  oilName: {
    type: String
  },
  filepath: {
    type: String
  },
  supplierName: {
    type: String
  },
  oilType: {
    type: String
  },
  functionalSub: {
    type: String
  },
  aromaticSub: {
    type: String
  },
  blendsWellWith: {
    type: String
  },
  aromaticDescription: {
    type: String
  },
  aromaType: {
    type: String
  },
  classifications: {
    type: String
  },
  note: {
    type: String
  }
},{
    collection: 'Drop'
});

module.exports = mongoose.model('Drop', Drop);