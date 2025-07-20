const asyncHandler = require("express-async-handler");
const Feedback = require("../models/Feedback");
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

/**
 * @desc    Export feedback data to Excel
 * @route   GET /api/export/excel
 * @access  Private
 */
const exportToExcel = asyncHandler(async (req, res) => {
  const { hotel, startDate, endDate, feedbackType, status } = req.query;
  
  // Build query object
  const query = {};
  
  // Apply hotel filter - if HOTEL_ADMIN, force their hotel
  if (req.user.role === "HOTEL_ADMIN") {
    query.hotel = req.user.hotel;
  } else if (hotel) {
    query.hotel = hotel;
  }
  
  // Apply other filters
  if (feedbackType) query.feedbackType = feedbackType;
  if (status) query.status = status;
  
  // Date range filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      query.createdAt.$lte = endDateObj;
    }
  }

  // Fetch feedback data with populated fields
  const feedbackData = await Feedback.find(query)
    .populate('hotel', 'name location')
    .populate('assignedTo', 'firstName lastName')
    .populate('categories', 'name')
    .sort({ createdAt: -1 });

  // Create a new Excel workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Presken GFT';
  workbook.created = new Date();
  
  // Add a worksheet
  const worksheet = workbook.addWorksheet('Feedback Data');
  
  // Define columns
  worksheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Guest Name', key: 'guestName', width: 20 },
    { header: 'Room Number', key: 'roomNumber', width: 15 },
    { header: 'Hotel', key: 'hotel', width: 25 },
    { header: 'Type', key: 'feedbackType', width: 15 },
    { header: 'Message', key: 'message', width: 50 },
    { header: 'Rating', key: 'rating', width: 10 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Assigned To', key: 'assignedTo', width: 20 },
    { header: 'Categories', key: 'categories', width: 30 }
  ];
  
  // Style header row
  worksheet.getRow(1).font = { bold: true };
  
  // Add rows
  feedbackData.forEach(feedback => {
    worksheet.addRow({
      date: feedback.createdAt.toLocaleDateString(),
      guestName: feedback.guestName || 'Anonymous',
      roomNumber: feedback.roomNumber,
      hotel: feedback.hotel ? feedback.hotel.name : '',
      feedbackType: feedback.feedbackType,
      message: feedback.message,
      rating: feedback.rating,
      status: feedback.status,
      assignedTo: feedback.assignedTo ? `${feedback.assignedTo.firstName} ${feedback.assignedTo.lastName}` : '',
      categories: feedback.categories.map(cat => cat.name).join(', ')
    });
  });
  
  // Set response headers
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=feedback_export.xlsx');
  
  // Write to response
  await workbook.xlsx.write(res);
});

/**
 * @desc    Export feedback data to PDF
 * @route   GET /api/export/pdf
 * @access  Private
 */
const exportToPDF = asyncHandler(async (req, res) => {
  const { hotel, startDate, endDate, feedbackType, status } = req.query;
  
  // Build query object
  const query = {};
  
  // Apply hotel filter - if HOTEL_ADMIN, force their hotel
  if (req.user.role === "HOTEL_ADMIN") {
    query.hotel = req.user.hotel;
  } else if (hotel) {
    query.hotel = hotel;
  }
  
  // Apply other filters
  if (feedbackType) query.feedbackType = feedbackType;
  if (status) query.status = status;
  
  // Date range filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      query.createdAt.$lte = endDateObj;
    }
  }

  // Fetch feedback data with populated fields
  const feedbackData = await Feedback.find(query)
    .populate('hotel', 'name location')
    .populate('assignedTo', 'firstName lastName')
    .populate('categories', 'name')
    .sort({ createdAt: -1 });

  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=feedback_export.pdf');
  
  // Create a new PDF document
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);
  
  // Add title
  doc.fontSize(20).text('Feedback Report', { align: 'center' });
  doc.moveDown();
  
  // Add date range if provided
  if (startDate || endDate) {
    let dateText = 'Date Range: ';
    if (startDate) dateText += new Date(startDate).toLocaleDateString();
    dateText += ' to ';
    if (endDate) dateText += new Date(endDate).toLocaleDateString();
    else dateText += 'Present';
    
    doc.fontSize(12).text(dateText);
    doc.moveDown();
  }
  
  // Add hotel filter if provided
  if (hotel && req.user.role === 'SUPER_ADMIN') {
    const hotelInfo = await Hotel.findById(hotel);
    if (hotelInfo) {
      doc.fontSize(12).text(`Hotel: ${hotelInfo.name}`);
      doc.moveDown();
    }
  }
  
  // Add filters if provided
  let filterText = 'Filters: ';
  const filters = [];
  if (feedbackType) filters.push(`Type: ${feedbackType}`);
  if (status) filters.push(`Status: ${status}`);
  
  if (filters.length > 0) {
    doc.fontSize(12).text(filterText + filters.join(', '));
    doc.moveDown();
  }

  // Add total count
  doc.fontSize(12).text(`Total Feedback: ${feedbackData.length}`);
  doc.moveDown();
  
  // Add feedback data
  feedbackData.forEach((feedback, index) => {
    // Add separator except for first item
    if (index > 0) {
      doc.moveTo(50, doc.y)
         .lineTo(doc.page.width - 50, doc.y)
         .stroke();
      doc.moveDown();
    }
    
    doc.fontSize(14).text(`Feedback #${index + 1}`, { underline: true });
    doc.fontSize(12).text(`Date: ${feedback.createdAt.toLocaleDateString()}`);
    doc.fontSize(12).text(`Guest: ${feedback.guestName || 'Anonymous'}`);
    doc.fontSize(12).text(`Room: ${feedback.roomNumber}`);
    doc.fontSize(12).text(`Hotel: ${feedback.hotel ? feedback.hotel.name : ''}`);
    doc.fontSize(12).text(`Type: ${feedback.feedbackType}`);
    doc.fontSize(12).text(`Rating: ${feedback.rating} / 5`);
    doc.fontSize(12).text(`Status: ${feedback.status}`);
    
    if (feedback.assignedTo) {
      doc.fontSize(12).text(`Assigned To: ${feedback.assignedTo.firstName} ${feedback.assignedTo.lastName}`);
    }
    
    if (feedback.categories.length > 0) {
      doc.fontSize(12).text(`Categories: ${feedback.categories.map(cat => cat.name).join(', ')}`);
    }
    
    doc.fontSize(12).text(`Message:`, { underline: true });
    doc.fontSize(10).text(feedback.message, {
      width: doc.page.width - 100,
      align: 'left'
    });
    
    doc.moveDown(2);
    
    // Add page break if near bottom of page, except for last item
    if (doc.y > doc.page.height - 150 && index < feedbackData.length - 1) {
      doc.addPage();
    }
  });
  
  // Finalize PDF
  doc.end();
});

module.exports = {
  exportToExcel,
  exportToPDF
}; 