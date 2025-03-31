const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true,
    maxlength: [100, 'Event name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  venue: {
    type: String,
    required: [true, 'Event venue is required'],
    trim: true,
    maxlength: [200, 'Venue cannot exceed 200 characters']
  },
  registrationStart: {
    type: Date,
    required: [true, 'Registration start date is required']
  },
  registrationEnd: {
    type: Date,
    required: [true, 'Registration end date is required'],
    validate: {
      validator: function(value) {
        return value > this.registrationStart;
      },
      message: 'Registration end date must be after start date'
    }
  },
  fileName: {
    type: String,
    required: [true, 'File name is required']
  },
  filePath: {
    type: String,
    required: [true, 'File path is required']
  },
  fileType: {
    type: String,
    required: [true, 'File type is required'],
    enum: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', EventSchema);