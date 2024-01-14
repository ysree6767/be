// Import Mongoose
const mongoose = require('mongoose');
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
// Create a schema
const Schema = mongoose.Schema;

// Define a new schema
const videoSchema = new Schema({
 videoFile: {
  type: String, //cloudianry url
  required: true
 },
 thumbnail: {
  type: String,
  default: ''
 },
 owner: {
  type: Schema.Types.ObjectId,
  ref: 'User',
  required: true
 },
 title: {
  type: String,
  required: true
 },
 description: {
  type: String,
  default: ''
 },
 duration: {
  type: Number,
  required: true
 },
 views: {
  type: Number,
  default: 0
 },
 isPublished: {
  type: Boolean,
  default: false
 }
}, {
 timestamps: true
});

videoSchema.plugin(mongooseAggregatePaginate)
// Create a model from the schema
const Video = mongoose.model('Video', videoSchema);

module.exports = Video